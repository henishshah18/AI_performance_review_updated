from django.contrib import admin
from .models import (
    CompanyMetrics, DepartmentStats, ActivityLog, 
    UserDashboardMetrics, TeamMetrics, Notification
)


@admin.register(CompanyMetrics)
class CompanyMetricsAdmin(admin.ModelAdmin):
    list_display = ['date', 'total_employees', 'active_objectives', 'completion_rate', 'pending_reviews']
    list_filter = ['date', 'created_at']
    ordering = ['-date']


@admin.register(DepartmentStats)
class DepartmentStatsAdmin(admin.ModelAdmin):
    list_display = ['department', 'date', 'employee_count', 'completion_rate', 'average_performance']
    list_filter = ['department', 'date', 'created_at']
    ordering = ['-date', 'department']


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'activity_type', 'description', 'created_at']
    list_filter = ['activity_type', 'created_at']
    search_fields = ['user__username', 'user__email', 'description']
    ordering = ['-created_at']


@admin.register(UserDashboardMetrics)
class UserDashboardMetricsAdmin(admin.ModelAdmin):
    list_display = ['user', 'total_goals', 'completed_goals', 'overdue_goals', 'performance_score']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['user__username', 'user__email']
    ordering = ['-updated_at']


@admin.register(TeamMetrics)
class TeamMetricsAdmin(admin.ModelAdmin):
    list_display = ['manager', 'team_size', 'active_goals', 'completed_goals', 'team_performance_avg']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['manager__username', 'manager__email']
    ordering = ['-updated_at']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'notification_type', 'priority', 'is_read', 'created_at']
    list_filter = ['notification_type', 'priority', 'is_read', 'created_at']
    search_fields = ['user__username', 'user__email', 'title', 'message']
    ordering = ['-created_at']
    actions = ['mark_as_read', 'mark_as_unread']
    
    def mark_as_read(self, request, queryset):
        queryset.update(is_read=True)
        self.message_user(request, f'{queryset.count()} notifications marked as read.')
    mark_as_read.short_description = "Mark selected notifications as read"
    
    def mark_as_unread(self, request, queryset):
        queryset.update(is_read=False)
        self.message_user(request, f'{queryset.count()} notifications marked as unread.')
    mark_as_unread.short_description = "Mark selected notifications as unread"
