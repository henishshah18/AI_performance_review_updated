from rest_framework import permissions


class IsHRAdmin(permissions.BasePermission):
    """
    Permission class to check if user is HR Admin
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'profile') and
            request.user.profile.role == 'hr_admin'
        )


class IsManager(permissions.BasePermission):
    """
    Permission class to check if user is Manager
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'profile') and
            request.user.profile.role == 'manager'
        )


class IsOwnerOrManager(permissions.BasePermission):
    """
    Permission class to check if user is the owner of the object or a manager
    """
    def has_object_permission(self, request, view, obj):
        # Check if user is the owner
        if hasattr(obj, 'user') and obj.user == request.user:
            return True
        
        # Check if user is a manager
        if (hasattr(request.user, 'profile') and 
            request.user.profile.role == 'manager'):
            return True
            
        return False


class IsManagerOrHRAdmin(permissions.BasePermission):
    """
    Permission class to check if user is Manager or HR Admin
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'profile') and
            request.user.profile.role in ['manager', 'hr_admin']
        )


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permission class to allow read access to all, but write access only to owner
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions for any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions only to the owner
        return hasattr(obj, 'user') and obj.user == request.user 