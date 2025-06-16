"""
Authentication views for the Performance Management platform.
Handles user registration, login, logout, and profile management.
"""

from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from django.contrib.auth import get_user_model
from core.models import Department
from core.audit import log_login, log_logout
from .serializers import (
    UserRegistrationSerializer, 
    UserProfileSerializer, 
    CustomTokenObtainPairSerializer,
    PasswordChangeSerializer
)
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


class SignupView(generics.CreateAPIView):
    """
    User registration endpoint with role-based validation.
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        """Handle user registration with business rule validation."""
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            # Create user
            user = serializer.save()
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            # Log successful registration
            log_login(user, request, success=True)
            
            return Response({
                'access': str(access_token),
                'refresh': str(refresh),
                'user': UserProfileSerializer(user).data,
                'message': 'User registered successfully'
            }, status=status.HTTP_201_CREATED)
            
        except ValidationError as e:
            return Response({
                'error': 'Validation failed',
                'details': e.message_dict if hasattr(e, 'message_dict') else str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Registration error: {e}")
            return Response({
                'error': 'Registration failed',
                'details': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom login view with role-based redirects and audit logging.
    """
    serializer_class = CustomTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        """Handle user login with audit logging."""
        try:
            response = super().post(request, *args, **kwargs)
            
            if response.status_code == 200:
                # Get user from email
                email = request.data.get('email')
                user = User.objects.get(email=email)
                
                # Log successful login
                log_login(user, request, success=True)
                
                # Add user data to response
                response.data['user'] = UserProfileSerializer(user).data
                response.data['message'] = 'Login successful'
                
                # Add role-based redirect URL
                redirect_urls = {
                    'hr_admin': '/admin/dashboard',
                    'manager': '/manager/dashboard',
                    'individual_contributor': '/dashboard'
                }
                response.data['redirect_url'] = redirect_urls.get(user.role, '/dashboard')
                
            return response
            
        except User.DoesNotExist:
            # Log failed login attempt
            log_login(None, request, success=False)
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            logger.error(f"Login error: {e}")
            return Response({
                'error': 'Login failed',
                'details': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """
    User logout endpoint with token blacklisting.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Handle user logout with token blacklisting."""
        try:
            refresh_token = request.data.get('refresh_token')
            
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            # Log logout
            log_logout(request.user, request)
            
            return Response({
                'message': 'Logout successful'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Logout error: {e}")
            return Response({
                'error': 'Logout failed',
                'details': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    User profile endpoint for viewing and updating profile data.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        """Return the current user."""
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        """Handle profile updates with validation."""
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            
            # Save updated user
            user = serializer.save()
            
            return Response({
                'message': 'Profile updated successfully',
                'user': UserProfileSerializer(user).data
            }, status=status.HTTP_200_OK)
            
        except ValidationError as e:
            return Response({
                'error': 'Validation failed',
                'details': e.message_dict if hasattr(e, 'message_dict') else str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Profile update error: {e}")
            return Response({
                'error': 'Profile update failed',
                'details': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class PasswordChangeView(APIView):
    """
    Password change endpoint for authenticated users.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Handle password change with validation."""
        try:
            serializer = PasswordChangeSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            user = request.user
            old_password = serializer.validated_data['old_password']
            new_password = serializer.validated_data['new_password']
            
            # Verify old password
            if not user.check_password(old_password):
                return Response({
                    'error': 'Invalid old password'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate new password
            validate_password(new_password, user)
            
            # Set new password
            user.set_password(new_password)
            user.save()
            
            return Response({
                'message': 'Password changed successfully'
            }, status=status.HTTP_200_OK)
            
        except ValidationError as e:
            return Response({
                'error': 'Password validation failed',
                'details': list(e.messages) if hasattr(e, 'messages') else str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Password change error: {e}")
            return Response({
                'error': 'Password change failed',
                'details': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_permissions(request):
    """
    Get user permissions based on role.
    """
    try:
        from core.constants import ROLE_PERMISSIONS
        
        user = request.user
        permissions_data = ROLE_PERMISSIONS.get(user.role, {})
        
        return Response({
            'user_id': user.id,
            'role': user.role,
            'permissions': permissions_data,
            'department': user.department.name if user.department else None,
            'is_manager': user.is_manager,
            'is_hr_admin': user.is_hr_admin,
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"User permissions error: {e}")
        return Response({
            'error': 'Failed to get user permissions',
            'details': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_team(request):
    """
    Get user's team members based on role and hierarchy.
    """
    try:
        from core.utils import get_user_team
        
        user = request.user
        team_members = get_user_team(user)
        
        team_data = []
        for member in team_members:
            team_data.append({
                'id': member.id,
                'email': member.email,
                'full_name': member.full_name,
                'role': member.role,
                'role_title': member.role_title,
                'department': member.department.name if member.department else None,
                'is_active': member.is_active,
            })
        
        return Response({
            'team_members': team_data,
            'total_count': len(team_data),
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"User team error: {e}")
        return Response({
            'error': 'Failed to get user team',
            'details': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def departments_list(request):
    """
    Get list of all active departments for registration form.
    """
    try:
        departments = Department.objects.filter(is_active=True).order_by('name')
        
        departments_data = []
        for dept in departments:
            departments_data.append({
                'id': dept.id,
                'name': dept.name,
                'display_name': dept.get_name_display(),
                'description': dept.description,
            })
        
        return Response({
            'departments': departments_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Departments list error: {e}")
        return Response({
            'error': 'Failed to get departments',
            'details': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
