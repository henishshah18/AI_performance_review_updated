"""
Django Admin configuration for OKR models.
Provides comprehensive admin interface for managing objectives, goals, and tasks.
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Objective, Goal, IndividualTask, TaskUpdate


@admin.register(Objective)
class ObjectiveAdmin(admin.ModelAdmin):
    """Admin interface for Objective model"""
    
    list_display = [
        'title', 'owner', 'status_badge', 'priority_badge', 
        'timeline_type', 'progress_bar', 'start_date', 'end_date',
        'goals_count', 'created_at'
    ]
    list_filter = [
        'status', 'priority', 'timeline_type', 'created_at',
        'departments', 'owner__department'
    ]
    search_fields = ['title', 'description', 'owner__first_name', 'owner__last_name']
    readonly_fields = ['id', 'progress_percentage', 'created_at', 'updated_at']
    filter_horizontal = ['departments']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'title', 'description')
        }),
        ('Ownership & Assignment', {
            'fields': ('owner', 'created_by', 'departments')
        }),
        ('Status & Priority', {
            'fields': ('status', 'priority')
        }),
        ('Timeline', {
            'fields': ('timeline_type', 'start_date', 'end_date')
        }),
        ('Success Metrics', {
            'fields': ('success_metrics', 'progress_percentage')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def status_badge(self, obj):
        """Display status as colored badge"""
        colors = {
            'draft': 'gray',
            'active': 'blue',
            'completed': 'green',
            'cancelled': 'red',
            'overdue': 'orange'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def priority_badge(self, obj):
        """Display priority as colored badge"""
        colors = {
            'low': '#28a745',
            'medium': '#ffc107',
            'high': '#fd7e14',
            'critical': '#dc3545'
        }
        color = colors.get(obj.priority, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px;">{}</span>',
            color, obj.get_priority_display()
        )
    priority_badge.short_description = 'Priority'
    
    def progress_bar(self, obj):
        """Display progress as visual bar"""
        percentage = float(obj.progress_percentage)
        color = '#28a745' if percentage >= 75 else '#ffc107' if percentage >= 50 else '#dc3545'
        return format_html(
            '<div style="width: 100px; background-color: #e9ecef; border-radius: 3px;">'
            '<div style="width: {}%; background-color: {}; height: 20px; border-radius: 3px; '
            'text-align: center; color: white; font-size: 11px; line-height: 20px;">{:.1f}%</div></div>',
            percentage, color, percentage
        )
    progress_bar.short_description = 'Progress'
    
    def goals_count(self, obj):
        """Display count of associated goals"""
        count = obj.goals.count()
        url = reverse('admin:okr_goal_changelist') + f'?objective__id__exact={obj.id}'
        return format_html('<a href="{}">{} goals</a>', url, count)
    goals_count.short_description = 'Goals'
    
    actions = ['activate_objectives', 'mark_completed', 'calculate_progress']
    
    def activate_objectives(self, request, queryset):
        """Bulk action to activate objectives"""
        updated = queryset.filter(status='draft').update(status='active')
        self.message_user(request, f'{updated} objectives activated.')
    activate_objectives.short_description = 'Activate selected objectives'
    
    def mark_completed(self, request, queryset):
        """Bulk action to mark objectives as completed"""
        updated = queryset.exclude(status='completed').update(status='completed')
        self.message_user(request, f'{updated} objectives marked as completed.')
    mark_completed.short_description = 'Mark selected objectives as completed'
    
    def calculate_progress(self, request, queryset):
        """Bulk action to recalculate progress"""
        count = 0
        for obj in queryset:
            obj.calculate_progress()
            count += 1
        self.message_user(request, f'Progress recalculated for {count} objectives.')
    calculate_progress.short_description = 'Recalculate progress for selected objectives'


@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    """Admin interface for Goal model"""
    
    list_display = [
        'title', 'objective_link', 'assigned_to', 'created_by',
        'status_badge', 'priority_badge', 'progress_bar', 
        'due_date', 'tasks_count', 'created_at'
    ]
    list_filter = [
        'status', 'priority', 'created_at', 'due_date',
        'objective__status', 'assigned_to__department'
    ]
    search_fields = [
        'title', 'description', 'objective__title',
        'assigned_to__first_name', 'assigned_to__last_name'
    ]
    readonly_fields = ['id', 'progress_percentage', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'title', 'description')
        }),
        ('Assignment', {
            'fields': ('objective', 'assigned_to', 'created_by')
        }),
        ('Status & Priority', {
            'fields': ('status', 'priority')
        }),
        ('Timeline', {
            'fields': ('due_date',)
        }),
        ('Progress', {
            'fields': ('progress_percentage',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def objective_link(self, obj):
        """Link to parent objective"""
        url = reverse('admin:okr_objective_change', args=[obj.objective.id])
        return format_html('<a href="{}">{}</a>', url, obj.objective.title)
    objective_link.short_description = 'Objective'
    
    def status_badge(self, obj):
        """Display status as colored badge"""
        colors = {
            'not_started': 'gray',
            'in_progress': 'blue',
            'completed': 'green',
            'blocked': 'red',
            'cancelled': 'orange',
            'overdue': 'darkred'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def priority_badge(self, obj):
        """Display priority as colored badge"""
        colors = {
            'low': '#28a745',
            'medium': '#ffc107',
            'high': '#fd7e14',
            'critical': '#dc3545'
        }
        color = colors.get(obj.priority, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px;">{}</span>',
            color, obj.get_priority_display()
        )
    priority_badge.short_description = 'Priority'
    
    def progress_bar(self, obj):
        """Display progress as visual bar"""
        percentage = float(obj.progress_percentage)
        color = '#28a745' if percentage >= 75 else '#ffc107' if percentage >= 50 else '#dc3545'
        return format_html(
            '<div style="width: 100px; background-color: #e9ecef; border-radius: 3px;">'
            '<div style="width: {}%; background-color: {}; height: 20px; border-radius: 3px; '
            'text-align: center; color: white; font-size: 11px; line-height: 20px;">{:.1f}%</div></div>',
            percentage, color, percentage
        )
    progress_bar.short_description = 'Progress'
    
    def tasks_count(self, obj):
        """Display count of associated tasks"""
        count = obj.tasks.count()
        url = reverse('admin:okr_individualtask_changelist') + f'?goal__id__exact={obj.id}'
        return format_html('<a href="{}">{} tasks</a>', url, count)
    tasks_count.short_description = 'Tasks'
    
    actions = ['start_goals', 'mark_completed', 'calculate_progress']
    
    def start_goals(self, request, queryset):
        """Bulk action to start goals"""
        updated = queryset.filter(status='not_started').update(status='in_progress')
        self.message_user(request, f'{updated} goals started.')
    start_goals.short_description = 'Start selected goals'
    
    def mark_completed(self, request, queryset):
        """Bulk action to mark goals as completed"""
        updated = queryset.exclude(status='completed').update(status='completed')
        self.message_user(request, f'{updated} goals marked as completed.')
    mark_completed.short_description = 'Mark selected goals as completed'
    
    def calculate_progress(self, request, queryset):
        """Bulk action to recalculate progress"""
        count = 0
        for obj in queryset:
            obj.calculate_progress()
            count += 1
        self.message_user(request, f'Progress recalculated for {count} goals.')
    calculate_progress.short_description = 'Recalculate progress for selected goals'


@admin.register(IndividualTask)
class IndividualTaskAdmin(admin.ModelAdmin):
    """Admin interface for IndividualTask model"""
    
    list_display = [
        'title', 'goal_link', 'assigned_to', 'status_badge',
        'priority_badge', 'progress_bar', 'due_date',
        'evidence_count', 'created_at'
    ]
    list_filter = [
        'status', 'priority', 'created_at', 'due_date',
        'goal__status', 'assigned_to__department'
    ]
    search_fields = [
        'title', 'description', 'goal__title',
        'assigned_to__first_name', 'assigned_to__last_name'
    ]
    readonly_fields = ['id', 'created_at', 'updated_at', 'completed_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'title', 'description')
        }),
        ('Assignment', {
            'fields': ('goal', 'assigned_to', 'created_by')
        }),
        ('Status & Priority', {
            'fields': ('status', 'priority')
        }),
        ('Timeline', {
            'fields': ('due_date',)
        }),
        ('Progress & Evidence', {
            'fields': ('progress_percentage', 'evidence_links', 'blocker_reason')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )
    
    def goal_link(self, obj):
        """Link to parent goal"""
        url = reverse('admin:okr_goal_change', args=[obj.goal.id])
        return format_html('<a href="{}">{}</a>', url, obj.goal.title)
    goal_link.short_description = 'Goal'
    
    def status_badge(self, obj):
        """Display status as colored badge"""
        colors = {
            'not_started': 'gray',
            'in_progress': 'blue',
            'completed': 'green',
            'blocked': 'red',
            'cancelled': 'orange',
            'overdue': 'darkred'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def priority_badge(self, obj):
        """Display priority as colored badge"""
        colors = {
            'low': '#28a745',
            'medium': '#ffc107',
            'high': '#fd7e14',
            'critical': '#dc3545'
        }
        color = colors.get(obj.priority, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px;">{}</span>',
            color, obj.get_priority_display()
        )
    priority_badge.short_description = 'Priority'
    
    def progress_bar(self, obj):
        """Display progress as visual bar"""
        percentage = float(obj.progress_percentage)
        color = '#28a745' if percentage >= 75 else '#ffc107' if percentage >= 50 else '#dc3545'
        return format_html(
            '<div style="width: 100px; background-color: #e9ecef; border-radius: 3px;">'
            '<div style="width: {}%; background-color: {}; height: 20px; border-radius: 3px; '
            'text-align: center; color: white; font-size: 11px; line-height: 20px;">{:.1f}%</div></div>',
            percentage, color, percentage
        )
    progress_bar.short_description = 'Progress'
    
    def evidence_count(self, obj):
        """Display count of evidence links"""
        count = len(obj.evidence_links) if obj.evidence_links else 0
        return f'{count} links'
    evidence_count.short_description = 'Evidence'
    
    actions = ['start_tasks', 'mark_completed', 'mark_blocked']
    
    def start_tasks(self, request, queryset):
        """Bulk action to start tasks"""
        updated = queryset.filter(status='not_started').update(status='in_progress')
        self.message_user(request, f'{updated} tasks started.')
    start_tasks.short_description = 'Start selected tasks'
    
    def mark_completed(self, request, queryset):
        """Bulk action to mark tasks as completed"""
        updated = queryset.exclude(status='completed').update(status='completed')
        self.message_user(request, f'{updated} tasks marked as completed.')
    mark_completed.short_description = 'Mark selected tasks as completed'
    
    def mark_blocked(self, request, queryset):
        """Bulk action to mark tasks as blocked"""
        updated = queryset.exclude(status='blocked').update(status='blocked')
        self.message_user(request, f'{updated} tasks marked as blocked.')
    mark_blocked.short_description = 'Mark selected tasks as blocked'


@admin.register(TaskUpdate)
class TaskUpdateAdmin(admin.ModelAdmin):
    """Admin interface for TaskUpdate model"""
    
    list_display = [
        'task_link', 'updated_by', 'progress_change_display',
        'status_change_display', 'is_significant_update', 'created_at'
    ]
    list_filter = [
        'created_at', 'new_status', 'updated_by__department'
    ]
    search_fields = [
        'task__title', 'updated_by__first_name', 'updated_by__last_name',
        'update_notes'
    ]
    readonly_fields = ['id', 'created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'task', 'updated_by')
        }),
        ('Progress Changes', {
            'fields': ('previous_progress', 'new_progress')
        }),
        ('Status Changes', {
            'fields': ('previous_status', 'new_status')
        }),
        ('Update Details', {
            'fields': ('update_notes', 'evidence_added')
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def task_link(self, obj):
        """Link to related task"""
        url = reverse('admin:okr_individualtask_change', args=[obj.task.id])
        return format_html('<a href="{}">{}</a>', url, obj.task.title)
    task_link.short_description = 'Task'
    
    def progress_change_display(self, obj):
        """Display progress change with color coding"""
        change = obj.get_progress_change()
        color = 'green' if change > 0 else 'red' if change < 0 else 'gray'
        sign = '+' if change > 0 else ''
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}{:.1f}%</span>',
            color, sign, change
        )
    progress_change_display.short_description = 'Progress Change'
    
    def status_change_display(self, obj):
        """Display status change"""
        if obj.previous_status != obj.new_status:
            return f'{obj.get_previous_status_display()} → {obj.get_new_status_display()}'
        return 'No change'
    status_change_display.short_description = 'Status Change'
    
    def is_significant_update(self, obj):
        """Display if update is significant"""
        return '✓' if obj.is_significant_update() else ''
    is_significant_update.short_description = 'Significant'
    is_significant_update.boolean = True


# Customize admin site header
admin.site.site_header = 'AI Performance Review - OKR Management'
admin.site.site_title = 'OKR Admin'
admin.site.index_title = 'OKR Management Dashboard'
