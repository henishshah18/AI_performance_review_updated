from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import (
    ReviewCycle, ReviewParticipant, SelfAssessment, GoalAssessment,
    PeerReview, PeerReviewAssignment, ManagerReview, GoalManagerAssessment,
    UpwardReview, ReviewMeeting
)


@admin.register(ReviewCycle)
class ReviewCycleAdmin(admin.ModelAdmin):
    """
    Admin interface for ReviewCycle model.
    """
    list_display = [
        'name', 'review_type', 'status_badge', 'current_phase_display',
        'participant_count', 'created_by', 'created_at'
    ]
    list_filter = ['status', 'review_type', 'created_at']
    search_fields = ['name', 'created_by__first_name', 'created_by__last_name']
    readonly_fields = ['created_at', 'updated_at', 'current_phase', 'is_active']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'review_type', 'status', 'created_by')
        }),
        ('Review Period', {
            'fields': ('review_period_start', 'review_period_end')
        }),
        ('Phase Timeline', {
            'fields': (
                ('self_assessment_start', 'self_assessment_end'),
                ('peer_review_start', 'peer_review_end'),
                ('manager_review_start', 'manager_review_end')
            )
        }),
        ('Status Information', {
            'fields': ('current_phase', 'is_active', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def status_badge(self, obj):
        """Display status with color coding"""
        colors = {
            'draft': '#6c757d',
            'active': '#28a745',
            'completed': '#007bff',
            'cancelled': '#dc3545'
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def current_phase_display(self, obj):
        """Display current phase with styling"""
        phase = obj.current_phase
        colors = {
            'Not Started': '#6c757d',
            'Self Assessment': '#ffc107',
            'Peer Review': '#17a2b8',
            'Manager Review': '#fd7e14',
            'Completed': '#28a745'
        }
        color = colors.get(phase, '#6c757d')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, phase
        )
    current_phase_display.short_description = 'Current Phase'
    
    def participant_count(self, obj):
        """Display number of active participants"""
        count = obj.participants.filter(is_active=True).count()
        return f"{count} participants"
    participant_count.short_description = 'Participants'


class GoalAssessmentInline(admin.TabularInline):
    """Inline for goal assessments in self-assessment"""
    model = GoalAssessment
    extra = 0
    readonly_fields = ['created_at', 'updated_at']


@admin.register(SelfAssessment)
class SelfAssessmentAdmin(admin.ModelAdmin):
    """
    Admin interface for SelfAssessment model.
    """
    list_display = [
        'user_name', 'cycle_name', 'status_badge', 'completion_progress',
        'submitted_at', 'created_at'
    ]
    list_filter = ['status', 'cycle__name', 'submitted_at', 'created_at']
    search_fields = ['user__first_name', 'user__last_name', 'cycle__name']
    readonly_fields = ['completion_percentage', 'created_at', 'updated_at']
    inlines = [GoalAssessmentInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('cycle', 'user', 'status', 'completion_percentage')
        }),
        ('Performance Ratings', {
            'fields': (
                ('technical_excellence', 'technical_examples'),
                ('collaboration', 'collaboration_examples'),
                ('problem_solving', 'problem_solving_examples'),
                ('initiative', 'initiative_examples')
            )
        }),
        ('Development Planning', {
            'fields': ('development_goals', 'manager_support_needed', 'career_interests')
        }),
        ('Metadata', {
            'fields': ('sentiment_analyzed', 'submitted_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def user_name(self, obj):
        return obj.user.get_full_name()
    user_name.short_description = 'User'
    
    def cycle_name(self, obj):
        return obj.cycle.name
    cycle_name.short_description = 'Review Cycle'
    
    def status_badge(self, obj):
        colors = {
            'not_started': '#6c757d',
            'in_progress': '#ffc107',
            'completed': '#28a745'
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def completion_progress(self, obj):
        percentage = obj.completion_percentage
        color = '#28a745' if percentage >= 80 else '#ffc107' if percentage >= 50 else '#dc3545'
        return format_html(
            '<div style="width: 100px; background-color: #e9ecef; border-radius: 3px;">'
            '<div style="width: {}%; background-color: {}; height: 20px; border-radius: 3px; '
            'text-align: center; color: white; font-size: 11px; line-height: 20px;">{}</div></div>',
            percentage, color, f"{percentage}%"
        )
    completion_progress.short_description = 'Progress'


@admin.register(PeerReview)
class PeerReviewAdmin(admin.ModelAdmin):
    """
    Admin interface for PeerReview model.
    """
    list_display = [
        'reviewer_name', 'reviewee_name', 'cycle_name', 'status_badge',
        'is_anonymous', 'submitted_at', 'created_at'
    ]
    list_filter = ['status', 'is_anonymous', 'cycle__name', 'submitted_at']
    search_fields = [
        'reviewer__first_name', 'reviewer__last_name',
        'reviewee__first_name', 'reviewee__last_name',
        'cycle__name'
    ]
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('cycle', 'reviewer', 'reviewee', 'is_anonymous', 'status')
        }),
        ('Review Content', {
            'fields': (
                ('collaboration_rating', 'collaboration_examples'),
                ('impact_rating', 'impact_examples'),
                'development_suggestions',
                'strengths_to_continue'
            )
        }),
        ('Metadata', {
            'fields': ('sentiment_analyzed', 'submitted_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def reviewer_name(self, obj):
        return obj.reviewer.get_full_name()
    reviewer_name.short_description = 'Reviewer'
    
    def reviewee_name(self, obj):
        return obj.reviewee.get_full_name()
    reviewee_name.short_description = 'Reviewee'
    
    def cycle_name(self, obj):
        return obj.cycle.name
    cycle_name.short_description = 'Review Cycle'
    
    def status_badge(self, obj):
        colors = {
            'not_started': '#6c757d',
            'in_progress': '#ffc107',
            'completed': '#28a745'
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'


class GoalManagerAssessmentInline(admin.TabularInline):
    """Inline for goal manager assessments"""
    model = GoalManagerAssessment
    extra = 0
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ManagerReview)
class ManagerReviewAdmin(admin.ModelAdmin):
    """
    Admin interface for ManagerReview model.
    """
    list_display = [
        'manager_name', 'employee_name', 'cycle_name', 'status_badge',
        'overall_rating_display', 'submitted_at', 'created_at'
    ]
    list_filter = ['status', 'overall_rating', 'cycle__name', 'submitted_at']
    search_fields = [
        'manager__first_name', 'manager__last_name',
        'employee__first_name', 'employee__last_name',
        'cycle__name'
    ]
    readonly_fields = ['created_at', 'updated_at']
    inlines = [GoalManagerAssessmentInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('cycle', 'manager', 'employee', 'status', 'overall_rating')
        }),
        ('Performance Ratings', {
            'fields': (
                ('technical_excellence', 'technical_justification'),
                ('collaboration', 'collaboration_justification'),
                ('problem_solving', 'problem_solving_justification'),
                ('initiative', 'initiative_justification')
            )
        }),
        ('Development Planning', {
            'fields': ('development_plan', 'manager_support', 'business_impact')
        }),
        ('Metadata', {
            'fields': ('sentiment_analyzed', 'submitted_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def manager_name(self, obj):
        return obj.manager.get_full_name()
    manager_name.short_description = 'Manager'
    
    def employee_name(self, obj):
        return obj.employee.get_full_name()
    employee_name.short_description = 'Employee'
    
    def cycle_name(self, obj):
        return obj.cycle.name
    cycle_name.short_description = 'Review Cycle'
    
    def status_badge(self, obj):
        colors = {
            'not_started': '#6c757d',
            'in_progress': '#ffc107',
            'completed': '#28a745'
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def overall_rating_display(self, obj):
        if not obj.overall_rating:
            return '-'
        colors = {
            'exceeds_expectations': '#28a745',
            'meets_expectations': '#007bff',
            'below_expectations': '#dc3545'
        }
        color = colors.get(obj.overall_rating, '#6c757d')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_overall_rating_display()
        )
    overall_rating_display.short_description = 'Overall Rating'


@admin.register(UpwardReview)
class UpwardReviewAdmin(admin.ModelAdmin):
    """
    Admin interface for UpwardReview model.
    """
    list_display = [
        'reviewer_name', 'manager_name', 'cycle_name', 'status_badge',
        'is_anonymous', 'submitted_at', 'created_at'
    ]
    list_filter = ['status', 'is_anonymous', 'cycle__name', 'submitted_at']
    search_fields = [
        'reviewer__first_name', 'reviewer__last_name',
        'manager__first_name', 'manager__last_name',
        'cycle__name'
    ]
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('cycle', 'reviewer', 'manager', 'is_anonymous', 'status')
        }),
        ('Leadership Assessment', {
            'fields': (
                ('leadership_effectiveness', 'leadership_examples'),
                ('communication_clarity', 'communication_examples'),
                ('support_provided', 'support_examples'),
                'areas_for_improvement',
                'additional_comments'
            )
        }),
        ('Metadata', {
            'fields': ('sentiment_analyzed', 'submitted_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def reviewer_name(self, obj):
        return obj.reviewer.get_full_name()
    reviewer_name.short_description = 'Reviewer'
    
    def manager_name(self, obj):
        return obj.manager.get_full_name()
    manager_name.short_description = 'Manager'
    
    def cycle_name(self, obj):
        return obj.cycle.name
    cycle_name.short_description = 'Review Cycle'
    
    def status_badge(self, obj):
        colors = {
            'not_started': '#6c757d',
            'in_progress': '#ffc107',
            'completed': '#28a745'
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'


@admin.register(ReviewParticipant)
class ReviewParticipantAdmin(admin.ModelAdmin):
    """
    Admin interface for ReviewParticipant model.
    """
    list_display = ['user_name', 'cycle_name', 'is_active', 'created_at']
    list_filter = ['is_active', 'cycle__name', 'created_at']
    search_fields = ['user__first_name', 'user__last_name', 'cycle__name']
    
    def user_name(self, obj):
        return obj.user.get_full_name()
    user_name.short_description = 'User'
    
    def cycle_name(self, obj):
        return obj.cycle.name
    cycle_name.short_description = 'Review Cycle'


@admin.register(PeerReviewAssignment)
class PeerReviewAssignmentAdmin(admin.ModelAdmin):
    """
    Admin interface for PeerReviewAssignment model.
    """
    list_display = [
        'reviewer_name', 'reviewee_name', 'review_cycle', 'status_badge',
        'due_date', 'created_by_name', 'created_at'
    ]
    list_filter = ['status', 'due_date', 'review_cycle', 'created_at']
    search_fields = [
        'reviewer__first_name', 'reviewer__last_name',
        'reviewee__first_name', 'reviewee__last_name',
        'review_cycle'
    ]
    
    def reviewer_name(self, obj):
        return obj.reviewer.get_full_name()
    reviewer_name.short_description = 'Reviewer'
    
    def reviewee_name(self, obj):
        return obj.reviewee.get_full_name()
    reviewee_name.short_description = 'Reviewee'
    
    def created_by_name(self, obj):
        return obj.created_by.get_full_name()
    created_by_name.short_description = 'Created By'
    
    def status_badge(self, obj):
        colors = {
            'pending': '#6c757d',
            'in_progress': '#ffc107',
            'completed': '#28a745',
            'declined': '#dc3545'
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'


@admin.register(ReviewMeeting)
class ReviewMeetingAdmin(admin.ModelAdmin):
    """
    Admin interface for ReviewMeeting model.
    """
    list_display = [
        'manager_name', 'employee_name', 'cycle_name', 'status_badge',
        'scheduled_at', 'created_at'
    ]
    list_filter = ['status', 'scheduled_at', 'cycle__name', 'created_at']
    search_fields = [
        'manager__first_name', 'manager__last_name',
        'employee__first_name', 'employee__last_name',
        'cycle__name'
    ]
    
    def manager_name(self, obj):
        return obj.manager.get_full_name()
    manager_name.short_description = 'Manager'
    
    def employee_name(self, obj):
        return obj.employee.get_full_name()
    employee_name.short_description = 'Employee'
    
    def cycle_name(self, obj):
        return obj.cycle.name
    cycle_name.short_description = 'Review Cycle'
    
    def status_badge(self, obj):
        colors = {
            'scheduled': '#ffc107',
            'completed': '#28a745',
            'cancelled': '#dc3545'
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
