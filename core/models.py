"""
Core models for the Performance Management platform.
These models define the fundamental entities and business rules.
"""

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from .constants import (
    USER_ROLES, DEPARTMENT_CHOICES, PRIORITY_CHOICES,
    MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH, MIN_TITLE_LENGTH
)
from .validators import validate_user_role_constraints, validate_department_assignment


class Department(models.Model):
    """
    Department model to organize users and manage access control.
    """
    name = models.CharField(
        max_length=100,
        choices=DEPARTMENT_CHOICES,
        unique=True,
        help_text="Department name"
    )
    description = models.TextField(
        max_length=MAX_DESCRIPTION_LENGTH,
        blank=True,
        help_text="Department description"
    )
    head_of_department = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='headed_departments',
        help_text="Head of this department"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this department is active"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'departments'
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.get_name_display()}"

    def clean(self):
        """Validate department data."""
        super().clean()
        
        # Ensure head of department belongs to this department
        if self.head_of_department and self.head_of_department.department != self:
            raise ValidationError(
                "Head of department must belong to this department"
            )


class CustomUserManager(BaseUserManager):
    """
    Custom user manager for the User model.
    Handles user creation with role-based validation.
    """
    
    def create_user(self, email, password=None, **extra_fields):
        """
        Create and return a regular user with an email and password.
        """
        if not email:
            raise ValueError('The Email field must be set')
        
        email = self.normalize_email(email)
        
        # Set default role if not provided
        if 'role' not in extra_fields:
            extra_fields['role'] = 'individual_contributor'
        
        # Validate role
        valid_roles = [choice[0] for choice in USER_ROLES]
        if extra_fields['role'] not in valid_roles:
            raise ValueError(f'Invalid role. Must be one of: {valid_roles}')
        
        # Ensure department is provided for non-HR users
        if extra_fields['role'] != 'hr_admin' and 'department' not in extra_fields:
            raise ValueError('Department is required for non-HR users')
        
        # Create user instance
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        
        # Validate business rules before saving
        user.full_clean()
        user.save(using=self._db)
        
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """
        Create and return a superuser with admin privileges.
        """
        # Set superuser defaults
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'hr_admin')
        extra_fields.setdefault('is_active', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        # Superusers are HR admins and don't need a department initially
        # It will be set during the creation process
        
        return self.create_user(email, password, **extra_fields)
    
    def get_by_natural_key(self, email):
        """
        Get user by email (natural key).
        """
        return self.get(email__iexact=email)


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser with business-specific fields.
    Implements role-based access control and department management.
    """
    email = models.EmailField(
        unique=True,
        help_text="User's email address (used for login)"
    )
    role = models.CharField(
        max_length=50,
        choices=USER_ROLES,
        default='individual_contributor',
        help_text="User's role in the organization"
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name='users',
        help_text="User's department"
    )
    manager = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='direct_reports',
        help_text="User's direct manager"
    )
    
    # Additional profile fields
    phone = models.CharField(
        max_length=20,
        blank=True,
        help_text="User's phone number"
    )
    role_title = models.CharField(
        max_length=100,
        blank=True,
        help_text="User's job title"
    )
    bio = models.TextField(
        max_length=500,
        blank=True,
        help_text="User's bio/description"
    )
    skills = models.JSONField(
        default=list,
        blank=True,
        help_text="User's skills as a list"
    )
    
    # Status and metadata
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this user account is active"
    )
    hire_date = models.DateField(
        null=True,
        blank=True,
        help_text="User's hire date"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Use email as the username field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name', 'role']
    
    # Use custom user manager
    objects = CustomUserManager()

    class Meta:
        db_table = 'users'
        ordering = ['last_name', 'first_name']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
            models.Index(fields=['department']),
            models.Index(fields=['manager']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"

    def clean(self):
        """Validate user data according to business rules."""
        super().clean()
        
        # Validate role constraints
        user_data = {
            'role': self.role,
            'manager_id': self.manager_id,
            'department': self.department,
        }
        validate_user_role_constraints(user_data)
        
        # Validate manager assignment
        if self.manager:
            validate_department_assignment(self.manager, self)
            
            # Prevent self-management
            if self.manager == self:
                raise ValidationError("User cannot be their own manager")
            
            # Prevent circular management (A manages B, B manages A)
            if self.manager.manager == self:
                raise ValidationError("Circular management relationship detected")

    def save(self, *args, **kwargs):
        """Override save to enforce business rules."""
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def full_name(self):
        """Return user's full name."""
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def is_manager(self):
        """Check if user is a manager."""
        return self.role == 'manager'

    @property
    def is_hr_admin(self):
        """Check if user is HR admin."""
        return self.role == 'hr_admin'

    @property
    def is_individual_contributor(self):
        """Check if user is an individual contributor."""
        return self.role == 'individual_contributor'

    def get_team_members(self):
        """Get all direct reports for managers."""
        if self.is_manager or self.is_hr_admin:
            return self.direct_reports.filter(is_active=True)
        return User.objects.none()

    def get_all_subordinates(self):
        """Get all subordinates (direct and indirect) for managers."""
        if not (self.is_manager or self.is_hr_admin):
            return User.objects.none()
        
        subordinates = set()
        direct_reports = self.get_team_members()
        
        for report in direct_reports:
            subordinates.add(report)
            # Recursively get subordinates of subordinates
            subordinates.update(report.get_all_subordinates())
        
        return User.objects.filter(id__in=[user.id for user in subordinates])

    def can_manage_user(self, target_user):
        """Check if this user can manage the target user."""
        if self.is_hr_admin:
            return True
        
        if self.is_manager:
            # Can manage direct reports in same department
            return (target_user.manager == self and 
                   target_user.department == self.department)
        
        return False

    def can_view_user_data(self, target_user):
        """Check if this user can view target user's data."""
        # Users can always view their own data
        if self == target_user:
            return True
        
        # HR Admin can view all data
        if self.is_hr_admin:
            return True
        
        # Managers can view their team members' data
        if self.is_manager:
            return self.can_manage_user(target_user)
        
        return False


class SystemSettings(models.Model):
    """
    System-wide settings for the performance management platform.
    """
    key = models.CharField(
        max_length=100,
        unique=True,
        help_text="Setting key"
    )
    value = models.JSONField(
        help_text="Setting value (can be any JSON-serializable data)"
    )
    description = models.TextField(
        max_length=MAX_DESCRIPTION_LENGTH,
        blank=True,
        help_text="Description of this setting"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this setting is active"
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='created_settings',
        help_text="User who created this setting"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'system_settings'
        ordering = ['key']
        indexes = [
            models.Index(fields=['key']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.key}: {self.value}"

    @classmethod
    def get_setting(cls, key, default=None):
        """Get a system setting value."""
        try:
            setting = cls.objects.get(key=key, is_active=True)
            return setting.value
        except cls.DoesNotExist:
            return default

    @classmethod
    def set_setting(cls, key, value, description="", user=None):
        """Set a system setting value."""
        setting, created = cls.objects.get_or_create(
            key=key,
            defaults={
                'value': value,
                'description': description,
                'created_by': user,
            }
        )
        
        if not created:
            setting.value = value
            setting.description = description
            setting.save()
        
        return setting


class AuditLog(models.Model):
    """
    Model to track all changes to critical objects in the system.
    """
    ACTION_CHOICES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('view', 'View'),
        ('export', 'Export'),
        ('import', 'Import'),
    ]
    
    # User who performed the action
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        help_text="User who performed the action"
    )
    
    # Action performed
    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES,
        help_text="Type of action performed"
    )
    
    # Object that was modified (using generic foreign key)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Model name for easier querying
    model_name = models.CharField(
        max_length=100,
        help_text="Name of the model that was modified"
    )
    
    # Changes made (JSON field)
    changes = models.JSONField(
        default=dict,
        blank=True,
        help_text="JSON representation of changes made"
    )
    
    # Additional context
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="IP address of the user"
    )
    user_agent = models.TextField(
        blank=True,
        help_text="User agent string"
    )
    
    # Timestamp
    timestamp = models.DateTimeField(
        auto_now_add=True,
        help_text="When the action was performed"
    )
    
    # Additional metadata
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional metadata about the action"
    )
    
    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['model_name', 'timestamp']),
            models.Index(fields=['action', 'timestamp']),
            models.Index(fields=['content_type', 'object_id']),
        ]
    
    def __str__(self):
        user_str = self.user.email if self.user else 'Anonymous'
        return f"{user_str} {self.action} {self.model_name} at {self.timestamp}"
    
    @property
    def changes_summary(self):
        """Return a human-readable summary of changes."""
        if not self.changes:
            return "No changes recorded"
        
        if self.action == 'create':
            return f"Created with {len(self.changes)} fields"
        elif self.action == 'update':
            changed_fields = list(self.changes.keys())
            return f"Updated fields: {', '.join(changed_fields)}"
        elif self.action == 'delete':
            return "Object deleted"
        else:
            return f"Action: {self.action}"
