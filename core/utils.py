"""
Utility functions for the Performance Management platform.
These functions provide common functionality used across the application.
"""

from django.db.models import QuerySet, Q, Avg, Count
from django.contrib.auth import get_user_model
from typing import Optional, Union
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


# Department-Based Data Filtering Functions

def filter_by_department(queryset: QuerySet, user) -> QuerySet:
    """
    Filter queryset based on user's department and role.
    
    Args:
        queryset: The queryset to filter
        user: The user requesting the data
        
    Returns:
        Filtered queryset based on user's permissions
    """
    if not user.is_authenticated:
        return queryset.none()
    
    # HR Admin can see all data
    if user.role == 'hr_admin':
        return queryset
    
    # Filter by user's department for other roles
    if hasattr(queryset.model, 'department'):
        return queryset.filter(department=user.department)
    elif hasattr(queryset.model, 'user__department'):
        return queryset.filter(user__department=user.department)
    elif hasattr(queryset.model, 'assigned_to__department'):
        return queryset.filter(assigned_to__department=user.department)
    
    # If no department field found, return empty queryset for safety
    logger.warning(f"No department field found for model {queryset.model.__name__}")
    return queryset.none()


def get_user_team(user) -> QuerySet:
    """
    Get team members based on user's role and hierarchy.
    
    Args:
        user: The user requesting team data
        
    Returns:
        QuerySet of users that the given user can manage/view
    """
    if not user.is_authenticated:
        return User.objects.none()
    
    # HR Admin can see all users
    if user.role == 'hr_admin':
        return User.objects.filter(is_active=True)
    
    # Managers can see their direct reports
    if user.role == 'manager':
        return User.objects.filter(
            manager=user,
            is_active=True,
            department=user.department
        )
    
    # Individual contributors can only see themselves
    return User.objects.filter(id=user.id)


def can_access_user(current_user, target_user) -> bool:
    """
    Check if current user can access target user's data.
    
    Args:
        current_user: User attempting to access data
        target_user: User whose data is being accessed
        
    Returns:
        Boolean indicating if access is allowed
    """
    if not current_user.is_authenticated:
        return False
    
    # Users can always access their own data
    if current_user.id == target_user.id:
        return True
    
    # HR Admin can access all user data
    if current_user.role == 'hr_admin':
        return True
    
    # Managers can access their direct reports' data
    if current_user.role == 'manager':
        return (target_user.manager_id == current_user.id and 
                target_user.department == current_user.department)
    
    # Individual contributors cannot access other users' data
    return False


def get_accessible_users(user) -> QuerySet:
    """
    Get all users that the given user can access based on hierarchy.
    
    Args:
        user: The user requesting access
        
    Returns:
        QuerySet of accessible users
    """
    if not user.is_authenticated:
        return User.objects.none()
    
    # HR Admin can access all users
    if user.role == 'hr_admin':
        return User.objects.filter(is_active=True)
    
    # Managers can access themselves and their direct reports
    if user.role == 'manager':
        return User.objects.filter(
            Q(id=user.id) | Q(manager=user),
            is_active=True,
            department=user.department
        )
    
    # Individual contributors can only access themselves
    return User.objects.filter(id=user.id)


# Progress Auto-Calculation Engine

def calculate_goal_progress(goal) -> float:
    """
    Calculate progress percentage for a goal based on its tasks.
    
    Args:
        goal: Goal object to calculate progress for
        
    Returns:
        Progress percentage (0-100)
    """
    try:
        # Get all tasks for this goal
        tasks = goal.tasks.all()
        
        if not tasks.exists():
            return 0.0
        
        # Count completed tasks
        completed_tasks = tasks.filter(status='completed').count()
        total_tasks = tasks.count()
        
        # Calculate percentage
        progress = (completed_tasks / total_tasks) * 100
        return round(progress, 2)
        
    except Exception as e:
        logger.error(f"Error calculating goal progress for goal {goal.id}: {e}")
        return 0.0


def calculate_objective_progress(objective) -> float:
    """
    Calculate progress percentage for an objective based on its goals.
    
    Args:
        objective: Objective object to calculate progress for
        
    Returns:
        Progress percentage (0-100)
    """
    try:
        # Get all goals for this objective
        goals = objective.goals.all()
        
        if not goals.exists():
            return 0.0
        
        # Calculate average progress of all goals
        total_progress = 0
        goal_count = 0
        
        for goal in goals:
            goal_progress = calculate_goal_progress(goal)
            total_progress += goal_progress
            goal_count += 1
        
        # Calculate average
        if goal_count > 0:
            progress = total_progress / goal_count
            return round(progress, 2)
        
        return 0.0
        
    except Exception as e:
        logger.error(f"Error calculating objective progress for objective {objective.id}: {e}")
        return 0.0


def update_parent_progress(child_object, parent_field: str = None):
    """
    Trigger progress recalculation up the hierarchy.
    
    Args:
        child_object: The child object that was updated
        parent_field: Name of the parent field (optional)
    """
    try:
        # Determine parent based on object type
        if hasattr(child_object, 'goal') and child_object.goal:
            # This is a task, update its goal
            goal = child_object.goal
            new_progress = calculate_goal_progress(goal)
            
            if hasattr(goal, 'progress'):
                goal.progress = new_progress
                goal.save(update_fields=['progress'])
            
            # Update the objective that contains this goal
            if hasattr(goal, 'objective') and goal.objective:
                objective = goal.objective
                new_objective_progress = calculate_objective_progress(objective)
                
                if hasattr(objective, 'progress'):
                    objective.progress = new_objective_progress
                    objective.save(update_fields=['progress'])
        
        elif hasattr(child_object, 'objective') and child_object.objective:
            # This is a goal, update its objective
            objective = child_object.objective
            new_progress = calculate_objective_progress(objective)
            
            if hasattr(objective, 'progress'):
                objective.progress = new_progress
                objective.save(update_fields=['progress'])
                
    except Exception as e:
        logger.error(f"Error updating parent progress: {e}")


def calculate_user_overall_progress(user) -> dict:
    """
    Calculate overall progress statistics for a user.
    
    Args:
        user: User object to calculate progress for
        
    Returns:
        Dictionary with progress statistics
    """
    try:
        stats = {
            'total_objectives': 0,
            'completed_objectives': 0,
            'total_goals': 0,
            'completed_goals': 0,
            'total_tasks': 0,
            'completed_tasks': 0,
            'overall_progress': 0.0
        }
        
        # This will be implemented when we have the OKR models
        # For now, return empty stats
        return stats
        
    except Exception as e:
        logger.error(f"Error calculating user progress for user {user.id}: {e}")
        return stats


def calculate_department_progress(department) -> dict:
    """
    Calculate progress statistics for a department.
    
    Args:
        department: Department object to calculate progress for
        
    Returns:
        Dictionary with department progress statistics
    """
    try:
        stats = {
            'total_users': 0,
            'active_objectives': 0,
            'completed_objectives': 0,
            'average_progress': 0.0,
            'top_performers': [],
            'needs_attention': []
        }
        
        # Get all users in the department
        users = User.objects.filter(department=department, is_active=True)
        stats['total_users'] = users.count()
        
        # This will be expanded when we have OKR models
        return stats
        
    except Exception as e:
        logger.error(f"Error calculating department progress for department {department.id}: {e}")
        return stats


# Helper Functions

def get_user_hierarchy_level(user) -> int:
    """
    Get the hierarchy level of a user (0 = top level).
    
    Args:
        user: User object
        
    Returns:
        Integer representing hierarchy level
    """
    level = 0
    current_user = user
    
    while current_user.manager and level < 10:  # Prevent infinite loops
        level += 1
        current_user = current_user.manager
    
    return level


def get_all_subordinates(user) -> QuerySet:
    """
    Get all subordinates (direct and indirect) for a user.
    
    Args:
        user: User object
        
    Returns:
        QuerySet of all subordinate users
    """
    if user.role == 'hr_admin':
        return User.objects.filter(is_active=True).exclude(id=user.id)
    
    subordinate_ids = set()
    
    def collect_subordinates(manager):
        direct_reports = User.objects.filter(manager=manager, is_active=True)
        for report in direct_reports:
            if report.id not in subordinate_ids:
                subordinate_ids.add(report.id)
                collect_subordinates(report)  # Recursive call
    
    collect_subordinates(user)
    return User.objects.filter(id__in=subordinate_ids)


def format_progress_display(progress: float) -> str:
    """
    Format progress value for display.
    
    Args:
        progress: Progress value (0-100)
        
    Returns:
        Formatted string for display
    """
    if progress == 0:
        return "0%"
    elif progress == 100:
        return "100%"
    else:
        return f"{progress:.1f}%"


def get_status_color(status: str) -> str:
    """
    Get the color code for a status.
    
    Args:
        status: Status string
        
    Returns:
        Hex color code
    """
    from .constants import STATUS_COLORS
    return STATUS_COLORS.get(status, '#6B7280')  # Default to gray 