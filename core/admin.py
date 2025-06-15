"""
Django admin configuration for core models.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User, Department, SystemSettings, AuditLog


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    """Admin configuration for Department model."""
    
    list_display = ['name', 'head_of_department', 'user_count', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'head_of_department', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def user_count(self, obj):
        """Display the number of users in this department."""
        return obj.users.count()
    user_count.short_description = 'Users'
    
    def get_queryset(self, request):
        """Optimize queryset with select_related."""
        return super().get_queryset(request).select_related('head_of_department')


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin configuration for custom User model."""
    
    list_display = [
        'email', 'full_name', 'role', 'department', 'manager', 
        'is_active', 'is_staff', 'date_joined'
    ]
    list_filter = [
        'role', 'department', 'is_active', 'is_staff', 'is_superuser', 'date_joined'
    ]
    search_fields = ['email', 'first_name', 'last_name', 'username']
    ordering = ['last_name', 'first_name']
    readonly_fields = ['date_joined', 'last_login', 'created_at', 'updated_at']
    
    fieldsets = (
        (None, {
            'fields': ('username', 'email', 'password')
        }),
        ('Personal info', {
            'fields': ('first_name', 'last_name', 'phone', 'role_title', 'bio', 'skills')
        }),
        ('Organization', {
            'fields': ('role', 'department', 'manager', 'hire_date')
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
        ('Important dates', {
            'fields': ('last_login', 'date_joined', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2'),
        }),
        ('Personal info', {
            'fields': ('first_name', 'last_name', 'role_title')
        }),
        ('Organization', {
            'fields': ('role', 'department', 'manager')
        }),
    )
    
    def full_name(self, obj):
        """Display user's full name."""
        return obj.full_name
    full_name.short_description = 'Full Name'
    
    def get_queryset(self, request):
        """Optimize queryset with select_related."""
        return super().get_queryset(request).select_related('department', 'manager')
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """Customize foreign key fields."""
        if db_field.name == "manager":
            # Only show managers and HR admins as potential managers
            kwargs["queryset"] = User.objects.filter(
                role__in=['manager', 'hr_admin'],
                is_active=True
            )
        elif db_field.name == "department":
            # Only show active departments
            kwargs["queryset"] = Department.objects.filter(is_active=True)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    """Admin configuration for SystemSettings model."""
    
    list_display = ['key', 'value_preview', 'is_active', 'created_by', 'created_at']
    list_filter = ['is_active', 'created_at', 'created_by']
    search_fields = ['key', 'description']
    ordering = ['key']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        (None, {
            'fields': ('key', 'value', 'description', 'is_active')
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def value_preview(self, obj):
        """Display a preview of the setting value."""
        value_str = str(obj.value)
        if len(value_str) > 50:
            return f"{value_str[:47]}..."
        return value_str
    value_preview.short_description = 'Value'
    
    def save_model(self, request, obj, form, change):
        """Set created_by when creating new settings."""
        if not change:  # Creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
    
    def get_queryset(self, request):
        """Optimize queryset with select_related."""
        return super().get_queryset(request).select_related('created_by')


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """Admin configuration for AuditLog model."""
    
    list_display = [
        'timestamp', 'user', 'action', 'model_name', 
        'changes_summary', 'ip_address'
    ]
    list_filter = [
        'action', 'model_name', 'timestamp', 'user'
    ]
    search_fields = ['user__email', 'model_name', 'ip_address']
    ordering = ['-timestamp']
    readonly_fields = [
        'user', 'action', 'content_type', 'object_id', 'model_name',
        'changes', 'ip_address', 'user_agent', 'timestamp', 'metadata'
    ]
    
    fieldsets = (
        (None, {
            'fields': ('user', 'action', 'model_name', 'timestamp')
        }),
        ('Object Information', {
            'fields': ('content_type', 'object_id'),
            'classes': ('collapse',)
        }),
        ('Changes', {
            'fields': ('changes',),
            'classes': ('collapse',)
        }),
        ('Request Information', {
            'fields': ('ip_address', 'user_agent'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        """Disable adding audit logs through admin."""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Disable editing audit logs through admin."""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Only allow superusers to delete audit logs."""
        return request.user.is_superuser
    
    def get_queryset(self, request):
        """Optimize queryset with select_related."""
        return super().get_queryset(request).select_related(
            'user', 'content_type'
        )


# Customize admin site headers
admin.site.site_header = "Performance Management Admin"
admin.site.site_title = "Performance Management"
admin.site.index_title = "Welcome to Performance Management Administration"
