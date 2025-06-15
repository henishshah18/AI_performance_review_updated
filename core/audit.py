"""
Audit trail system for the Performance Management platform.
Tracks all changes to critical models for compliance and debugging.
"""

from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
import json
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


# Audit logging functions

def log_action(user, action, obj=None, changes=None, request=None, **metadata):
    """
    Log an action to the audit trail.
    
    Args:
        user: User who performed the action
        action: Type of action ('create', 'update', 'delete', etc.)
        obj: Object that was modified (optional)
        changes: Dictionary of changes made (optional)
        request: HTTP request object (optional)
        **metadata: Additional metadata to store
    """
    try:
        from .models import AuditLog
        
        # Get model name
        model_name = obj.__class__.__name__ if obj else metadata.get('model_name', 'Unknown')
        
        # Get IP address and user agent from request
        ip_address = None
        user_agent = ''
        if request:
            ip_address = get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # Create audit log entry
        audit_log = AuditLog.objects.create(
            user=user,
            action=action,
            content_object=obj,
            model_name=model_name,
            changes=changes or {},
            ip_address=ip_address,
            user_agent=user_agent,
            metadata=metadata
        )
        
        logger.info(f"Audit log created: {audit_log}")
        return audit_log
        
    except Exception as e:
        logger.error(f"Failed to create audit log: {e}")
        return None


def log_model_change(user, action, obj, old_values=None, new_values=None, request=None):
    """
    Log changes to a model instance.
    
    Args:
        user: User who made the change
        action: 'create', 'update', or 'delete'
        obj: Model instance that was changed
        old_values: Dictionary of old field values (for updates)
        new_values: Dictionary of new field values (for updates)
        request: HTTP request object (optional)
    """
    changes = {}
    
    if action == 'create':
        # For creates, log all field values
        changes = get_model_fields(obj)
    elif action == 'update' and old_values and new_values:
        # For updates, log only changed fields
        for field, new_value in new_values.items():
            old_value = old_values.get(field)
            if old_value != new_value:
                changes[field] = {
                    'old': serialize_value(old_value),
                    'new': serialize_value(new_value)
                }
    elif action == 'delete':
        # For deletes, log all field values before deletion
        changes = get_model_fields(obj)
    
    return log_action(
        user=user,
        action=action,
        obj=obj,
        changes=changes,
        request=request
    )


def log_login(user, request=None, success=True):
    """Log user login attempt."""
    return log_action(
        user=user if success else None,
        action='login',
        request=request,
        success=success,
        model_name='User'
    )


def log_logout(user, request=None):
    """Log user logout."""
    return log_action(
        user=user,
        action='logout',
        request=request,
        model_name='User'
    )


def log_data_export(user, model_name, record_count, request=None):
    """Log data export operations."""
    return log_action(
        user=user,
        action='export',
        request=request,
        model_name=model_name,
        record_count=record_count
    )


def log_data_import(user, model_name, record_count, request=None):
    """Log data import operations."""
    return log_action(
        user=user,
        action='import',
        request=request,
        model_name=model_name,
        record_count=record_count
    )


# Helper functions

def get_client_ip(request):
    """Get client IP address from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def get_model_fields(obj):
    """Get all field values from a model instance."""
    fields = {}
    for field in obj._meta.fields:
        try:
            value = getattr(obj, field.name)
            fields[field.name] = serialize_value(value)
        except Exception:
            fields[field.name] = None
    return fields


def serialize_value(value):
    """Serialize a value for JSON storage."""
    if value is None:
        return None
    elif isinstance(value, (str, int, float, bool)):
        return value
    elif hasattr(value, 'isoformat'):  # datetime objects
        return value.isoformat()
    elif hasattr(value, 'pk'):  # model instances
        return f"{value.__class__.__name__}(pk={value.pk})"
    else:
        return str(value)


def get_audit_trail(obj, limit=50):
    """
    Get audit trail for a specific object.
    
    Args:
        obj: Object to get audit trail for
        limit: Maximum number of entries to return
        
    Returns:
        QuerySet of AuditLog entries
    """
    from .models import AuditLog
    
    content_type = ContentType.objects.get_for_model(obj)
    return AuditLog.objects.filter(
        content_type=content_type,
        object_id=obj.pk
    ).order_by('-timestamp')[:limit]


def get_user_activity(user, days=30, limit=100):
    """
    Get recent activity for a user.
    
    Args:
        user: User to get activity for
        days: Number of days to look back
        limit: Maximum number of entries to return
        
    Returns:
        QuerySet of AuditLog entries
    """
    from .models import AuditLog
    
    since = timezone.now() - timezone.timedelta(days=days)
    return AuditLog.objects.filter(
        user=user,
        timestamp__gte=since
    ).order_by('-timestamp')[:limit]


def get_model_activity(model_class, days=7, limit=100):
    """
    Get recent activity for a model.
    
    Args:
        model_class: Model class to get activity for
        days: Number of days to look back
        limit: Maximum number of entries to return
        
    Returns:
        QuerySet of AuditLog entries
    """
    from .models import AuditLog
    
    since = timezone.now() - timezone.timedelta(days=days)
    content_type = ContentType.objects.get_for_model(model_class)
    return AuditLog.objects.filter(
        content_type=content_type,
        timestamp__gte=since
    ).order_by('-timestamp')[:limit] 