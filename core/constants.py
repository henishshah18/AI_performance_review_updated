"""
Business rules constants for the Performance Management platform.
These constants define allowed values, status transitions, and business logic rules.
"""

# User Roles
USER_ROLES = [
    ('hr_admin', 'HR Admin'),
    ('manager', 'Manager'),
    ('individual_contributor', 'Individual Contributor'),
]

# Status choices for various entities
OBJECTIVE_STATUS_CHOICES = [
    ('draft', 'Draft'),
    ('active', 'Active'),
    ('completed', 'Completed'),
    ('cancelled', 'Cancelled'),
    ('overdue', 'Overdue'),
]

GOAL_STATUS_CHOICES = [
    ('not_started', 'Not Started'),
    ('in_progress', 'In Progress'),
    ('completed', 'Completed'),
    ('blocked', 'Blocked'),
    ('cancelled', 'Cancelled'),
    ('overdue', 'Overdue'),
]

TASK_STATUS_CHOICES = [
    ('not_started', 'Not Started'),
    ('in_progress', 'In Progress'),
    ('completed', 'Completed'),
    ('blocked', 'Blocked'),
    ('cancelled', 'Cancelled'),
    ('overdue', 'Overdue'),
]

FEEDBACK_STATUS_CHOICES = [
    ('draft', 'Draft'),
    ('submitted', 'Submitted'),
    ('reviewed', 'Reviewed'),
    ('archived', 'Archived'),
]

REVIEW_CYCLE_STATUS_CHOICES = [
    ('planning', 'Planning'),
    ('active', 'Active'),
    ('review_period', 'Review Period'),
    ('completed', 'Completed'),
    ('cancelled', 'Cancelled'),
]

NOTIFICATION_STATUS_CHOICES = [
    ('unread', 'Unread'),
    ('read', 'Read'),
    ('archived', 'Archived'),
]

# Timeline Types
TIMELINE_TYPES = [
    ('quarterly', 'Quarterly'),
    ('yearly', 'Yearly'),
]

# Priority Levels
PRIORITY_CHOICES = [
    ('low', 'Low'),
    ('medium', 'Medium'),
    ('high', 'High'),
    ('critical', 'Critical'),
]

# Feedback Types
FEEDBACK_TYPES = [
    ('self_review', 'Self Review'),
    ('manager_review', 'Manager Review'),
    ('peer_review', 'Peer Review'),
    ('360_review', '360 Review'),
    ('continuous_feedback', 'Continuous Feedback'),
]

# Notification Types
NOTIFICATION_TYPES = [
    ('goal_assigned', 'Goal Assigned'),
    ('task_assigned', 'Task Assigned'),
    ('progress_update', 'Progress Update'),
    ('deadline_reminder', 'Deadline Reminder'),
    ('overdue_alert', 'Overdue Alert'),
    ('feedback_request', 'Feedback Request'),
    ('review_cycle_start', 'Review Cycle Start'),
    ('system_announcement', 'System Announcement'),
]

# Status Transition Rules
OBJECTIVE_STATUS_TRANSITIONS = {
    'draft': ['active', 'cancelled'],
    'active': ['completed', 'cancelled', 'overdue'],
    'completed': [],  # Terminal state
    'cancelled': [],  # Terminal state
    'overdue': ['completed', 'cancelled'],  # Can still be completed or cancelled when overdue
}

GOAL_STATUS_TRANSITIONS = {
    'not_started': ['in_progress', 'blocked', 'cancelled'],
    'in_progress': ['completed', 'blocked', 'cancelled', 'overdue'],
    'completed': [],  # Terminal state
    'blocked': ['in_progress', 'cancelled'],
    'cancelled': [],  # Terminal state
    'overdue': ['completed', 'cancelled'],  # Can still be completed or cancelled when overdue
}

TASK_STATUS_TRANSITIONS = {
    'not_started': ['in_progress', 'blocked', 'cancelled'],
    'in_progress': ['completed', 'blocked', 'cancelled', 'overdue'],
    'completed': [],  # Terminal state
    'blocked': ['in_progress', 'cancelled'],
    'cancelled': [],  # Terminal state
    'overdue': ['completed', 'cancelled'],  # Can still be completed or cancelled when overdue
}

FEEDBACK_STATUS_TRANSITIONS = {
    'draft': ['submitted', 'archived'],
    'submitted': ['reviewed', 'archived'],
    'reviewed': ['archived'],
    'archived': [],  # Terminal state
}

REVIEW_CYCLE_STATUS_TRANSITIONS = {
    'planning': ['active', 'cancelled'],
    'active': ['review_period', 'cancelled'],
    'review_period': ['completed', 'cancelled'],
    'completed': [],  # Terminal state
    'cancelled': [],  # Terminal state
}

# Business Rules Constants
MAX_PROGRESS_VALUE = 100
MIN_PROGRESS_VALUE = 0

# Timeline validation constants
QUARTERLY_MONTHS = 3
YEARLY_MONTHS = 12

# Pagination constants
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100

# File upload constants
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_FILE_TYPES = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png']

# Email notification constants
REMINDER_DAYS_BEFORE_DEADLINE = [7, 3, 1]  # Send reminders 7, 3, and 1 days before deadline
OVERDUE_NOTIFICATION_FREQUENCY = 'daily'  # How often to send overdue notifications

# Role-based permissions mapping
ROLE_PERMISSIONS = {
    'hr_admin': {
        'can_create_objectives': True,
        'can_manage_all_users': True,
        'can_create_review_cycles': True,
        'can_view_all_departments': True,
        'can_edit_completed_items': True,
        'can_delete_any_entity': True,
        'can_manage_system_settings': True,
    },
    'manager': {
        'can_create_objectives': False,
        'can_manage_all_users': False,
        'can_create_review_cycles': False,
        'can_view_all_departments': False,
        'can_edit_completed_items': False,
        'can_delete_any_entity': False,
        'can_manage_system_settings': False,
        'can_manage_team_members': True,
        'can_create_goals': True,
        'can_assign_tasks': True,
        'can_view_team_analytics': True,
    },
    'individual_contributor': {
        'can_create_objectives': False,
        'can_manage_all_users': False,
        'can_create_review_cycles': False,
        'can_view_all_departments': False,
        'can_edit_completed_items': False,
        'can_delete_any_entity': False,
        'can_manage_system_settings': False,
        'can_manage_team_members': False,
        'can_create_goals': False,
        'can_assign_tasks': False,
        'can_view_team_analytics': False,
        'can_update_own_progress': True,
        'can_create_tasks': True,
        'can_provide_feedback': True,
    }
}

# Department choices (can be extended)
DEPARTMENT_CHOICES = [
    ('engineering', 'Engineering'),
    ('product', 'Product'),
    ('design', 'Design'),
    ('marketing', 'Marketing'),
    ('sales', 'Sales'),
    ('hr', 'Human Resources'),
    ('finance', 'Finance'),
    ('operations', 'Operations'),
]

# AI Integration constants
AI_FEATURES = {
    'sentiment_analysis': True,
    'goal_suggestions': True,
    'performance_insights': True,
    'automated_summaries': True,
}

# Cache timeout constants (in seconds)
CACHE_TIMEOUTS = {
    'user_permissions': 300,  # 5 minutes
    'department_data': 600,   # 10 minutes
    'analytics_data': 1800,   # 30 minutes
    'system_settings': 3600,  # 1 hour
}

# API Rate limiting
RATE_LIMITS = {
    'default': '100/hour',
    'authenticated': '1000/hour',
    'hr_admin': '5000/hour',
}

# Validation constants
MIN_PASSWORD_LENGTH = 8
MAX_TITLE_LENGTH = 200
MAX_DESCRIPTION_LENGTH = 2000
MIN_TITLE_LENGTH = 3

# Status colors for frontend (hex codes)
STATUS_COLORS = {
    'draft': '#6B7280',      # Gray
    'not_started': '#6B7280', # Gray
    'active': '#3B82F6',     # Blue
    'in_progress': '#F59E0B', # Amber
    'completed': '#10B981',   # Green
    'blocked': '#EF4444',     # Red
    'cancelled': '#6B7280',   # Gray
    'overdue': '#DC2626',     # Dark Red
    'submitted': '#8B5CF6',   # Purple
    'reviewed': '#06B6D4',    # Cyan
    'archived': '#4B5563',    # Dark Gray
}

# Default system settings
DEFAULT_SYSTEM_SETTINGS = {
    'company_name': 'Performance Management Platform',
    'fiscal_year_start': '01-01',  # MM-DD format
    'default_objective_duration': 'quarterly',
    'enable_peer_reviews': True,
    'enable_self_reviews': True,
    'enable_360_reviews': False,
    'auto_overdue_detection': True,
    'email_notifications_enabled': True,
    'reminder_notifications_enabled': True,
} 