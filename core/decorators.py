"""
Role-based permission decorators for the Performance Management platform.
These decorators enforce business rules and access control across the application.
"""

from functools import wraps
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view


def hr_admin_required(view_func):
    """
    Decorator that restricts access to HR Admin users only.
    Used for company-wide operations like creating objectives, managing review cycles.
    """
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if request.user.role != 'hr_admin':
            return Response(
                {'error': 'HR Admin access required'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        return view_func(request, *args, **kwargs)
    return _wrapped_view


def manager_required(view_func):
    """
    Decorator that restricts access to Manager users only.
    Used for team management operations like creating goals, managing team members.
    """
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if request.user.role not in ['manager', 'hr_admin']:
            return Response(
                {'error': 'Manager access required'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        return view_func(request, *args, **kwargs)
    return _wrapped_view


def team_member_access(view_func):
    """
    Decorator that ensures managers can only access data for their direct reports.
    Validates that the target user is in the manager's department and reports to them.
    """
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # HR Admin can access all data
        if request.user.role == 'hr_admin':
            return view_func(request, *args, **kwargs)
        
        # Manager can only access their team members
        if request.user.role == 'manager':
            # Get target user ID from URL parameters or request data
            target_user_id = kwargs.get('user_id') or request.data.get('user_id')
            
            if target_user_id:
                try:
                    from django.contrib.auth import get_user_model
                    User = get_user_model()
                    target_user = User.objects.get(id=target_user_id)
                    
                    # Check if target user is in manager's department and reports to them
                    if (target_user.department != request.user.department or 
                        target_user.manager_id != request.user.id):
                        return Response(
                            {'error': 'Access denied: User not in your team'}, 
                            status=status.HTTP_403_FORBIDDEN
                        )
                except User.DoesNotExist:
                    return Response(
                        {'error': 'User not found'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
        
        return view_func(request, *args, **kwargs)
    return _wrapped_view


def own_data_only(view_func):
    """
    Decorator that ensures individual contributors can only access their own data.
    Validates that the target user ID matches the authenticated user's ID.
    """
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # HR Admin and Managers can access data based on other rules
        if request.user.role in ['hr_admin', 'manager']:
            return view_func(request, *args, **kwargs)
        
        # Individual contributors can only access their own data
        target_user_id = kwargs.get('user_id') or request.data.get('user_id')
        
        if target_user_id and str(target_user_id) != str(request.user.id):
            return Response(
                {'error': 'Access denied: Can only access your own data'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        return view_func(request, *args, **kwargs)
    return _wrapped_view


def department_access_required(view_func):
    """
    Decorator that ensures users can only access data from their own department.
    HR Admin can access all departments.
    """
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # HR Admin can access all departments
        if request.user.role == 'hr_admin':
            return view_func(request, *args, **kwargs)
        
        # Check department access for other roles
        target_department_id = kwargs.get('department_id') or request.data.get('department_id')
        
        if target_department_id and str(target_department_id) != str(request.user.department_id):
            return Response(
                {'error': 'Access denied: Can only access your department data'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        return view_func(request, *args, **kwargs)
    return _wrapped_view


def role_required(*allowed_roles):
    """
    Generic decorator that allows access only to users with specified roles.
    
    Usage:
        @role_required('hr_admin', 'manager')
        def some_view(request):
            pass
    """
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return Response(
                    {'error': 'Authentication required'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            if request.user.role not in allowed_roles:
                return Response(
                    {'error': f'Access denied: Requires one of {allowed_roles}'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator 