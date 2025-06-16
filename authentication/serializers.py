"""
Serializers for the authentication app.
Handles user registration, profile updates, and authentication data serialization.
"""

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from core.models import Department
from core.constants import USER_ROLES

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration with role-based validation.
    """
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )
    department_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = User
        fields = [
            'email', 'username', 'first_name', 'last_name',
            'password', 'password_confirm', 'role', 'department_id',
            'phone', 'role_title', 'bio', 'skills'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'username': {'required': False},
        }
    
    def validate_email(self, value):
        """Validate email uniqueness."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate_username(self, value):
        """Validate username uniqueness."""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value
    
    def validate_role(self, value):
        """Validate role choice."""
        valid_roles = [choice[0] for choice in USER_ROLES]
        if value not in valid_roles:
            raise serializers.ValidationError(f"Invalid role. Must be one of: {valid_roles}")
        return value
    
    def validate_department_id(self, value):
        """Validate department exists and is active."""
        if value is None:
            return value
        try:
            department = Department.objects.get(id=value, is_active=True)
            return value
        except Department.DoesNotExist:
            raise serializers.ValidationError("Invalid department selected.")
    
    def validate(self, attrs):
        """Validate password confirmation and business rules."""
        # Check password confirmation
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Password confirmation does not match.'
            })
        
        # Validate password strength
        try:
            validate_password(attrs['password'])
        except ValidationError as e:
            raise serializers.ValidationError({
                'password': list(e.messages)
            })
        
        # Business rule: Individual contributors must have a manager
        # This will be handled during user creation or later assignment
        
        return attrs
    
    def create(self, validated_data):
        """Create user with validated data."""
        # Remove password_confirm and department_id from validated_data
        validated_data.pop('password_confirm')
        department_id = validated_data.pop('department_id', None)
        
        # Auto-generate username from email if not provided
        if 'username' not in validated_data or not validated_data['username']:
            email = validated_data['email']
            base_username = email.split('@')[0]
            username = base_username
            counter = 1
            
            # Ensure username is unique
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            
            validated_data['username'] = username
        
        # Get department if provided
        if department_id:
            department = Department.objects.get(id=department_id)
            validated_data['department'] = department
        
        # Create user
        password = validated_data.pop('password')
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile data (read and update).
    """
    department_name = serializers.CharField(source='department.name', read_only=True)
    department_display = serializers.CharField(source='department.get_name_display', read_only=True)
    manager_name = serializers.CharField(source='manager.full_name', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'role', 'role_display', 'department_name', 'department_display',
            'manager_name', 'phone', 'role_title', 'bio', 'skills',
            'is_active', 'hire_date', 'date_joined', 'last_login'
        ]
        read_only_fields = [
            'id', 'email', 'role', 'department_name', 'department_display',
            'manager_name', 'role_display', 'is_active', 'date_joined', 'last_login'
        ]
    
    def validate_skills(self, value):
        """Validate skills is a list."""
        if not isinstance(value, list):
            raise serializers.ValidationError("Skills must be a list.")
        return value


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token serializer with additional user data.
    """
    username_field = 'email'
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['email'] = serializers.EmailField()
        if 'username' in self.fields:
            del self.fields['username']
    
    @classmethod
    def get_token(cls, user):
        """Add custom claims to token."""
        token = super().get_token(user)
        
        # Add custom claims
        token['email'] = user.email
        token['role'] = user.role
        token['department'] = user.department.name if user.department else None
        token['full_name'] = user.full_name
        
        return token
    
    def validate(self, attrs):
        """Validate login credentials using email."""
        email = attrs.get('email')
        password = attrs.get('password')
        
        if not email or not password:
            raise serializers.ValidationError('Email and password are required.')
        
        try:
            user = User.objects.get(email=email)
            if not user.check_password(password):
                raise serializers.ValidationError('Invalid credentials.')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled.')
            
            # Create the token data directly
            refresh = self.get_token(user)
            
            return {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': user,
            }
            
        except User.DoesNotExist:
            raise serializers.ValidationError('Invalid credentials.')


class PasswordChangeSerializer(serializers.Serializer):
    """
    Serializer for password change.
    """
    old_password = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True,
        min_length=8,
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        """Validate password change data."""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': 'Password confirmation does not match.'
            })
        
        # Validate new password strength
        try:
            validate_password(attrs['new_password'])
        except ValidationError as e:
            raise serializers.ValidationError({
                'new_password': list(e.messages)
            })
        
        return attrs


class DepartmentSerializer(serializers.ModelSerializer):
    """
    Serializer for department data.
    """
    display_name = serializers.CharField(source='get_name_display', read_only=True)
    user_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Department
        fields = [
            'id', 'name', 'display_name', 'description',
            'user_count', 'is_active'
        ]
    
    def get_user_count(self, obj):
        """Get count of active users in department."""
        return obj.users.filter(is_active=True).count()


class UserListSerializer(serializers.ModelSerializer):
    """
    Serializer for user list views (minimal data).
    """
    department_name = serializers.CharField(source='department.name', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'role_display', 'department_name', 'role_title',
            'is_active', 'date_joined'
        ] 