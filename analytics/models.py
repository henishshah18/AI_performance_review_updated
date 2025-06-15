from django.db import models
from django.utils import timezone
from core.models import User
import uuid


class CompanyMetrics(models.Model):
    """Company-wide metrics for HR Admin dashboard"""
    date = models.DateField(default=timezone.now)
    total_employees = models.IntegerField(default=0)
    active_objectives = models.IntegerField(default=0)
    completion_rate = models.FloatField(default=0.0)  # Percentage
    pending_reviews = models.IntegerField(default=0)
    total_departments = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']
        verbose_name_plural = "Company Metrics"

    def __str__(self):
        return f"Company Metrics - {self.date}"


class DepartmentStats(models.Model):
    """Department-specific statistics"""
    DEPARTMENT_CHOICES = [
        ('engineering', 'Engineering'),
        ('product', 'Product'),
        ('design', 'Design'),
        ('marketing', 'Marketing'),
        ('sales', 'Sales'),
        ('hr', 'HR'),
        ('finance', 'Finance'),
        ('operations', 'Operations'),
    ]
    
    department = models.CharField(max_length=50, choices=DEPARTMENT_CHOICES)
    date = models.DateField(default=timezone.now)
    employee_count = models.IntegerField(default=0)
    active_objectives = models.IntegerField(default=0)
    completed_objectives = models.IntegerField(default=0)
    completion_rate = models.FloatField(default=0.0)  # Percentage
    average_performance = models.FloatField(default=0.0)  # 1-5 scale
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', 'department']
        unique_together = ['department', 'date']
        verbose_name_plural = "Department Statistics"

    def __str__(self):
        return f"{self.get_department_display()} - {self.date}"


class ActivityLog(models.Model):
    """Activity log for recent activities across the platform"""
    ACTIVITY_TYPES = [
        ('objective_created', 'Objective Created'),
        ('objective_completed', 'Objective Completed'),
        ('review_started', 'Review Started'),
        ('review_completed', 'Review Completed'),
        ('feedback_given', 'Feedback Given'),
        ('goal_updated', 'Goal Updated'),
        ('user_registered', 'User Registered'),
        ('team_updated', 'Team Updated'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=50, choices=ACTIVITY_TYPES)
    description = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)  # Additional data
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Activity Logs"

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.get_activity_type_display()}"


class UserDashboardMetrics(models.Model):
    """Individual user dashboard metrics"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='dashboard_metrics')
    total_goals = models.IntegerField(default=0)
    completed_goals = models.IntegerField(default=0)
    in_progress_goals = models.IntegerField(default=0)
    overdue_goals = models.IntegerField(default=0)
    goals_due_soon = models.IntegerField(default=0)  # Due within 7 days
    last_feedback_date = models.DateTimeField(null=True, blank=True)
    performance_score = models.FloatField(default=0.0)  # 1-5 scale
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "User Dashboard Metrics"

    def __str__(self):
        return f"{self.user.get_full_name()} - Dashboard Metrics"


class TeamMetrics(models.Model):
    """Team-level metrics for managers"""
    manager = models.ForeignKey(User, on_delete=models.CASCADE, related_name='team_metrics')
    team_size = models.IntegerField(default=0)
    active_goals = models.IntegerField(default=0)
    completed_goals = models.IntegerField(default=0)
    overdue_goals = models.IntegerField(default=0)
    team_performance_avg = models.FloatField(default=0.0)  # Average team performance
    last_review_cycle = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Team Metrics"

    def __str__(self):
        return f"{self.manager.get_full_name()} - Team Metrics"


class Notification(models.Model):
    """Notifications for users"""
    NOTIFICATION_TYPES = [
        ('goal_deadline', 'Goal Deadline'),
        ('review_reminder', 'Review Reminder'),
        ('feedback_received', 'Feedback Received'),
        ('objective_assigned', 'Objective Assigned'),
        ('team_update', 'Team Update'),
        ('system_announcement', 'System Announcement'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    is_read = models.BooleanField(default=False)
    action_url = models.URLField(blank=True, null=True)  # Optional link for action
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.title}"

    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()


# Phase 7 Advanced Analytics Models

class AnalyticsSnapshot(models.Model):
    """Periodic snapshots of analytics data for historical tracking"""
    SNAPSHOT_TYPE_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    snapshot_type = models.CharField(max_length=20, choices=SNAPSHOT_TYPE_CHOICES)
    snapshot_date = models.DateField()
    department = models.CharField(max_length=50, null=True, blank=True)  # Null for company-wide
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)  # Null for aggregated data
    metrics_data = models.JSONField(default=dict)  # Flexible storage for various metrics
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-snapshot_date', 'snapshot_type']
        unique_together = ['snapshot_type', 'snapshot_date', 'department', 'user']
        indexes = [
            models.Index(fields=['snapshot_type', 'snapshot_date']),
            models.Index(fields=['department', 'snapshot_date']),
            models.Index(fields=['user', 'snapshot_date']),
        ]

    def __str__(self):
        scope = self.department or (self.user.get_full_name() if self.user else 'Company-wide')
        return f"{self.get_snapshot_type_display()} - {scope} - {self.snapshot_date}"


class UserActivityLog(models.Model):
    """Detailed activity logging for analytics and insights"""
    ACTIVITY_TYPE_CHOICES = [
        ('login', 'User Login'),
        ('logout', 'User Logout'),
        ('objective_created', 'Objective Created'),
        ('objective_updated', 'Objective Updated'),
        ('objective_completed', 'Objective Completed'),
        ('goal_created', 'Goal Created'),
        ('goal_updated', 'Goal Updated'),
        ('goal_completed', 'Goal Completed'),
        ('task_created', 'Task Created'),
        ('task_updated', 'Task Updated'),
        ('task_completed', 'Task Completed'),
        ('feedback_given', 'Feedback Given'),
        ('feedback_received', 'Feedback Received'),
        ('review_started', 'Review Started'),
        ('review_submitted', 'Review Submitted'),
        ('review_completed', 'Review Completed'),
        ('profile_updated', 'Profile Updated'),
        ('team_joined', 'Team Joined'),
        ('team_left', 'Team Left'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_logs')
    activity_type = models.CharField(max_length=50, choices=ACTIVITY_TYPE_CHOICES)
    activity_details = models.JSONField(default=dict)  # Detailed information about the activity
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    session_id = models.CharField(max_length=255, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['activity_type', 'timestamp']),
            models.Index(fields=['timestamp']),
        ]

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.get_activity_type_display()} - {self.timestamp}"


class PerformanceMetrics(models.Model):
    """Performance metrics for individuals and teams"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='performance_metrics')
    period_start = models.DateField()
    period_end = models.DateField()
    
    # OKR Metrics
    objectives_assigned = models.IntegerField(default=0)
    objectives_completed = models.IntegerField(default=0)
    goals_assigned = models.IntegerField(default=0)
    goals_completed = models.IntegerField(default=0)
    tasks_assigned = models.IntegerField(default=0)
    tasks_completed = models.IntegerField(default=0)
    
    # Feedback Metrics
    feedback_given = models.IntegerField(default=0)
    feedback_received = models.IntegerField(default=0)
    feedback_quality_score = models.FloatField(default=0.0)  # 1-5 scale
    
    # Review Metrics
    reviews_completed = models.IntegerField(default=0)
    average_review_score = models.FloatField(default=0.0)  # 1-5 scale
    
    # Engagement Metrics
    login_frequency = models.IntegerField(default=0)  # Number of logins in period
    platform_usage_hours = models.FloatField(default=0.0)  # Estimated usage time
    
    # Performance Scores
    overall_performance_score = models.FloatField(default=0.0)  # 1-5 scale
    goal_completion_rate = models.FloatField(default=0.0)  # Percentage
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-period_end', 'user']
        unique_together = ['user', 'period_start', 'period_end']
        indexes = [
            models.Index(fields=['user', 'period_end']),
            models.Index(fields=['period_start', 'period_end']),
        ]

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.period_start} to {self.period_end}"


class ReportTemplate(models.Model):
    """Templates for automated report generation"""
    REPORT_TYPE_CHOICES = [
        ('okr_summary', 'OKR Summary'),
        ('feedback_analysis', 'Feedback Analysis'),
        ('review_insights', 'Review Insights'),
        ('performance_overview', 'Performance Overview'),
        ('engagement_metrics', 'Engagement Metrics'),
        ('executive_summary', 'Executive Summary'),
    ]
    
    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField()
    report_type = models.CharField(max_length=50, choices=REPORT_TYPE_CHOICES)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    recipients = models.ManyToManyField(User, related_name='report_subscriptions')
    template_config = models.JSONField(default=dict)  # Configuration for report generation
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_report_templates')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.get_frequency_display()})"


class GeneratedReport(models.Model):
    """Generated reports for tracking and access"""
    template = models.ForeignKey(ReportTemplate, on_delete=models.CASCADE, related_name='generated_reports')
    report_date = models.DateField()
    file_path = models.CharField(max_length=500)  # Path to generated file
    file_size = models.BigIntegerField(default=0)  # File size in bytes
    generation_time = models.FloatField(default=0.0)  # Time taken to generate in seconds
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('generating', 'Generating'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ], default='pending')
    error_message = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-report_date']
        unique_together = ['template', 'report_date']

    def __str__(self):
        return f"{self.template.name} - {self.report_date}" 