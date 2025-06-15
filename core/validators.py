"""
Business rule validators for the Performance Management platform.
These validators enforce data integrity and business logic constraints.
"""

from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import datetime, date


def validate_department_assignment(user, target_user):
    """
    Validates that managers can only manage users from their own department.
    
    Args:
        user: The manager attempting the assignment
        target_user: The user being assigned/managed
        
    Raises:
        ValidationError: If department assignment rules are violated
    """
    if user.role == 'hr_admin':
        return  # HR Admin can manage all departments
    
    if user.role == 'manager':
        if user.department != target_user.department:
            raise ValidationError(
                f"Managers can only manage users from their own department. "
                f"Manager department: {user.department}, Target user department: {target_user.department}"
            )
    else:
        raise ValidationError("Only managers and HR admins can manage other users")


def validate_timeline_hierarchy(parent_start_date, parent_end_date, child_start_date, child_end_date, 
                               parent_type="parent", child_type="child"):
    """
    Validates that child timeline dates are within parent timeline dates.
    Used for Objective → Goal → Task hierarchy.
    
    Args:
        parent_start_date: Start date of parent entity
        parent_end_date: End date of parent entity  
        child_start_date: Start date of child entity
        child_end_date: End date of child entity
        parent_type: Type of parent entity (for error messages)
        child_type: Type of child entity (for error messages)
        
    Raises:
        ValidationError: If timeline hierarchy rules are violated
    """
    # Convert dates to date objects if they're datetime objects
    if isinstance(parent_start_date, datetime):
        parent_start_date = parent_start_date.date()
    if isinstance(parent_end_date, datetime):
        parent_end_date = parent_end_date.date()
    if isinstance(child_start_date, datetime):
        child_start_date = child_start_date.date()
    if isinstance(child_end_date, datetime):
        child_end_date = child_end_date.date()
    
    # Child start date must be >= parent start date
    if child_start_date < parent_start_date:
        raise ValidationError(
            f"{child_type} start date ({child_start_date}) cannot be before "
            f"{parent_type} start date ({parent_start_date})"
        )
    
    # Child end date must be <= parent end date
    if child_end_date > parent_end_date:
        raise ValidationError(
            f"{child_type} end date ({child_end_date}) cannot be after "
            f"{parent_type} end date ({parent_end_date})"
        )
    
    # Child start date must be <= child end date
    if child_start_date > child_end_date:
        raise ValidationError(
            f"{child_type} start date ({child_start_date}) cannot be after "
            f"{child_type} end date ({child_end_date})"
        )


def validate_status_transition(current_status, new_status, allowed_transitions):
    """
    Validates that status transitions follow business rules.
    
    Args:
        current_status: Current status of the entity
        new_status: Proposed new status
        allowed_transitions: Dict mapping current status to allowed next statuses
        
    Raises:
        ValidationError: If status transition is not allowed
    """
    if current_status not in allowed_transitions:
        raise ValidationError(f"Unknown current status: {current_status}")
    
    if new_status not in allowed_transitions[current_status]:
        raise ValidationError(
            f"Cannot transition from '{current_status}' to '{new_status}'. "
            f"Allowed transitions: {allowed_transitions[current_status]}"
        )


def validate_edit_permissions(entity_status, user_role, entity_owner=None, user=None):
    """
    Validates that users can only edit entities based on status and ownership rules.
    
    Args:
        entity_status: Current status of the entity
        user_role: Role of the user attempting to edit
        entity_owner: Owner of the entity (optional)
        user: User attempting to edit (optional)
        
    Raises:
        ValidationError: If edit permissions are violated
    """
    # Define statuses that prevent editing
    locked_statuses = ['completed', 'cancelled', 'overdue']
    
    if entity_status in locked_statuses:
        if user_role != 'hr_admin':  # HR Admin can edit anything
            raise ValidationError(
                f"Cannot edit entity with status '{entity_status}'. "
                f"Only HR Admin can edit {locked_statuses} entities."
            )
    
    # Check ownership for non-admin users
    if user_role != 'hr_admin' and entity_owner and user:
        if entity_owner != user:
            raise ValidationError(
                "You can only edit entities you own or manage."
            )


def validate_cascade_deletion(entity, child_entities_count, entity_type="entity", child_type="children"):
    """
    Validates that entities with active children cannot be deleted.
    
    Args:
        entity: The entity being deleted
        child_entities_count: Number of active child entities
        entity_type: Type of entity being deleted (for error messages)
        child_type: Type of child entities (for error messages)
        
    Raises:
        ValidationError: If cascade deletion rules are violated
    """
    if child_entities_count > 0:
        raise ValidationError(
            f"Cannot delete {entity_type} with active {child_type}. "
            f"Please delete or reassign {child_entities_count} {child_type} first."
        )


def validate_overdue_restrictions(due_date, current_date=None):
    """
    Validates that overdue items cannot be modified.
    
    Args:
        due_date: Due date of the entity
        current_date: Current date (defaults to today)
        
    Raises:
        ValidationError: If entity is overdue
    """
    if current_date is None:
        current_date = timezone.now().date()
    
    # Convert datetime to date if necessary
    if isinstance(due_date, datetime):
        due_date = due_date.date()
    if isinstance(current_date, datetime):
        current_date = current_date.date()
    
    if due_date < current_date:
        raise ValidationError(
            f"Cannot modify overdue entity. Due date was {due_date}, current date is {current_date}."
        )


def validate_progress_value(progress):
    """
    Validates that progress values are within acceptable range (0-100).
    
    Args:
        progress: Progress value to validate
        
    Raises:
        ValidationError: If progress value is invalid
    """
    if progress < 0:
        raise ValidationError("Progress cannot be negative")
    
    if progress > 100:
        raise ValidationError("Progress cannot exceed 100%")


def validate_user_role_constraints(user_data):
    """
    Validates user role-specific constraints.
    
    Args:
        user_data: Dictionary containing user data
        
    Raises:
        ValidationError: If role constraints are violated
    """
    role = user_data.get('role')
    manager_id = user_data.get('manager_id')
    department = user_data.get('department')
    
    if role == 'individual_contributor':
        if not manager_id:
            raise ValidationError("Individual Contributors must have a manager assigned")
    
    elif role == 'manager':
        # Managers in the same department cannot have manager_id pointing to each other
        if manager_id:
            # This would need to be checked against the database
            # Implementation depends on the User model structure
            pass
    
    elif role == 'hr_admin':
        # HR Admin can have null manager_id
        pass
    
    else:
        raise ValidationError(f"Invalid role: {role}")


def validate_date_range(start_date, end_date, field_name="date range"):
    """
    Validates that start date is before or equal to end date.
    
    Args:
        start_date: Start date
        end_date: End date
        field_name: Name of the field for error messages
        
    Raises:
        ValidationError: If date range is invalid
    """
    if start_date > end_date:
        raise ValidationError(
            f"Invalid {field_name}: start date ({start_date}) cannot be after end date ({end_date})"
        )


def validate_unique_title_in_scope(title, scope_field, scope_value, model_class, exclude_id=None):
    """
    Validates that titles are unique within a specific scope (e.g., goals within an objective).
    
    Args:
        title: Title to validate
        scope_field: Field name that defines the scope
        scope_value: Value of the scope field
        model_class: Model class to check against
        exclude_id: ID to exclude from uniqueness check (for updates)
        
    Raises:
        ValidationError: If title is not unique within scope
    """
    queryset = model_class.objects.filter(**{scope_field: scope_value, 'title': title})
    
    if exclude_id:
        queryset = queryset.exclude(id=exclude_id)
    
    if queryset.exists():
        raise ValidationError(
            f"Title '{title}' already exists in this scope. Please choose a different title."
        ) 