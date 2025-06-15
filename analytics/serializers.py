from rest_framework import serializers
from core.models import User
from .models import (
    CompanyMetrics, DepartmentStats, ActivityLog, 
    UserDashboardMetrics, TeamMetrics, Notification
)


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user info for activity logs"""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'email']


class CompanyMetricsSerializer(serializers.ModelSerializer):
    """Serializer for company-wide metrics"""
    
    class Meta:
        model = CompanyMetrics
        fields = [
            'id', 'date', 'total_employees', 'active_objectives',
            'completion_rate', 'pending_reviews', 'total_departments',
            'created_at', 'updated_at'
        ]


class DepartmentStatsSerializer(serializers.ModelSerializer):
    """Serializer for department statistics"""
    department_display = serializers.CharField(source='get_department_display', read_only=True)
    
    class Meta:
        model = DepartmentStats
        fields = [
            'id', 'department', 'department_display', 'date',
            'employee_count', 'active_objectives', 'completed_objectives',
            'completion_rate', 'average_performance', 'created_at', 'updated_at'
        ]


class ActivityLogSerializer(serializers.ModelSerializer):
    """Serializer for activity logs"""
    user = UserBasicSerializer(read_only=True)
    activity_type_display = serializers.CharField(source='get_activity_type_display', read_only=True)
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = ActivityLog
        fields = [
            'id', 'user', 'activity_type', 'activity_type_display',
            'description', 'metadata', 'created_at', 'time_ago'
        ]
    
    def get_time_ago(self, obj):
        """Calculate time ago for display"""
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        else:
            return "Just now"


class UserDashboardMetricsSerializer(serializers.ModelSerializer):
    """Serializer for individual user dashboard metrics"""
    user = UserBasicSerializer(read_only=True)
    completion_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = UserDashboardMetrics
        fields = [
            'id', 'user', 'total_goals', 'completed_goals',
            'in_progress_goals', 'overdue_goals', 'goals_due_soon',
            'last_feedback_date', 'performance_score', 'completion_percentage',
            'created_at', 'updated_at'
        ]
    
    def get_completion_percentage(self, obj):
        """Calculate completion percentage"""
        if obj.total_goals == 0:
            return 0
        return round((obj.completed_goals / obj.total_goals) * 100, 1)


class TeamMetricsSerializer(serializers.ModelSerializer):
    """Serializer for team metrics"""
    manager = UserBasicSerializer(read_only=True)
    completion_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = TeamMetrics
        fields = [
            'id', 'manager', 'team_size', 'active_goals',
            'completed_goals', 'overdue_goals', 'team_performance_avg',
            'last_review_cycle', 'completion_percentage', 'created_at', 'updated_at'
        ]
    
    def get_completion_percentage(self, obj):
        """Calculate team completion percentage"""
        total_goals = obj.active_goals + obj.completed_goals
        if total_goals == 0:
            return 0
        return round((obj.completed_goals / total_goals) * 100, 1)


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications"""
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'notification_type', 'notification_type_display',
            'priority', 'priority_display', 'is_read', 'action_url', 'metadata',
            'created_at', 'read_at', 'time_ago'
        ]
    
    def get_time_ago(self, obj):
        """Calculate time ago for display"""
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        else:
            return "Just now"


class DashboardSummarySerializer(serializers.Serializer):
    """Combined dashboard data serializer"""
    company_metrics = CompanyMetricsSerializer(read_only=True)
    department_stats = DepartmentStatsSerializer(many=True, read_only=True)
    recent_activities = ActivityLogSerializer(many=True, read_only=True)
    user_metrics = UserDashboardMetricsSerializer(read_only=True)
    team_metrics = TeamMetricsSerializer(read_only=True)
    notifications = NotificationSerializer(many=True, read_only=True)
    unread_count = serializers.IntegerField(read_only=True) 