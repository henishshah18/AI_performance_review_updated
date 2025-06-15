from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Feedback, FeedbackTag, FeedbackTagTemplate, FeedbackComment


class FeedbackTagInline(admin.TabularInline):
    """Inline admin for feedback tags"""
    model = FeedbackTag
    extra = 0
    readonly_fields = ['created_at']


class FeedbackCommentInline(admin.TabularInline):
    """Inline admin for feedback comments"""
    model = FeedbackComment
    extra = 0
    readonly_fields = ['created_at']
    fields = ['comment_by', 'content', 'created_at']


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    """Admin interface for Feedback model"""
    list_display = [
        'id', 'feedback_type_badge', 'display_sender', 'to_user_name',
        'content_preview', 'visibility_badge', 'tags_count', 'comments_count',
        'related_entity_display', 'created_at'
    ]
    list_filter = [
        'feedback_type', 'visibility', 'is_anonymous', 'sentiment_analyzed',
        'created_at', 'updated_at'
    ]
    search_fields = [
        'content', 'from_user__first_name', 'from_user__last_name',
        'to_user__first_name', 'to_user__last_name',
        'tags__tag_name'
    ]
    readonly_fields = [
        'id', 'display_sender', 'content_preview', 'related_entity_display',
        'tags_count', 'comments_count', 'created_at', 'updated_at'
    ]
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'from_user', 'to_user', 'feedback_type', 'visibility')
        }),
        ('Content', {
            'fields': ('content', 'content_preview')
        }),
        ('Related Entities', {
            'fields': ('related_objective', 'related_goal', 'related_task', 'related_entity_display'),
            'classes': ('collapse',)
        }),
        ('Settings', {
            'fields': ('is_anonymous', 'sentiment_analyzed')
        }),
        ('Statistics', {
            'fields': ('tags_count', 'comments_count'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    inlines = [FeedbackTagInline, FeedbackCommentInline]
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    actions = ['mark_as_analyzed', 'export_feedback_data']
    
    def feedback_type_badge(self, obj):
        """Display feedback type with color-coded badge"""
        colors = {
            'commendation': '#28a745',  # Green
            'guidance': '#ffc107',      # Yellow
            'constructive': '#dc3545'   # Red
        }
        color = colors.get(obj.feedback_type, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 12px; font-size: 11px; font-weight: bold;">{}</span>',
            color,
            obj.get_feedback_type_display()
        )
    feedback_type_badge.short_description = 'Type'
    feedback_type_badge.admin_order_field = 'feedback_type'
    
    def visibility_badge(self, obj):
        """Display visibility with badge"""
        color = '#007bff' if obj.visibility == 'public' else '#6c757d'
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; '
            'border-radius: 8px; font-size: 10px;">{}</span>',
            color,
            obj.get_visibility_display()
        )
    visibility_badge.short_description = 'Visibility'
    visibility_badge.admin_order_field = 'visibility'
    
    def to_user_name(self, obj):
        """Display recipient name with link"""
        return format_html(
            '<a href="{}" target="_blank">{}</a>',
            reverse('admin:core_user_change', args=[obj.to_user.id]),
            obj.to_user.get_full_name()
        )
    to_user_name.short_description = 'Recipient'
    to_user_name.admin_order_field = 'to_user__last_name'
    
    def tags_count(self, obj):
        """Display count of tags"""
        count = obj.tags.count()
        if count > 0:
            return format_html(
                '<span style="background-color: #17a2b8; color: white; padding: 2px 6px; '
                'border-radius: 8px; font-size: 10px;">{} tags</span>',
                count
            )
        return '-'
    tags_count.short_description = 'Tags'
    
    def comments_count(self, obj):
        """Display count of comments"""
        count = obj.comments.count()
        if count > 0:
            return format_html(
                '<span style="background-color: #6f42c1; color: white; padding: 2px 6px; '
                'border-radius: 8px; font-size: 10px;">{} comments</span>',
                count
            )
        return '-'
    comments_count.short_description = 'Comments'
    
    def mark_as_analyzed(self, request, queryset):
        """Bulk action to mark feedback as sentiment analyzed"""
        updated = queryset.update(sentiment_analyzed=True)
        self.message_user(
            request,
            f'{updated} feedback items marked as analyzed.'
        )
    mark_as_analyzed.short_description = 'Mark selected feedback as analyzed'
    
    def export_feedback_data(self, request, queryset):
        """Bulk action to export feedback data"""
        # This would typically generate a CSV or Excel file
        count = queryset.count()
        self.message_user(
            request,
            f'Export initiated for {count} feedback items. (Feature to be implemented)'
        )
    export_feedback_data.short_description = 'Export selected feedback data'
    
    def get_queryset(self, request):
        """Optimize queryset with select_related and prefetch_related"""
        return super().get_queryset(request).select_related(
            'from_user', 'to_user', 'related_objective', 'related_goal', 'related_task'
        ).prefetch_related('tags', 'comments')


@admin.register(FeedbackTag)
class FeedbackTagAdmin(admin.ModelAdmin):
    """Admin interface for FeedbackTag model"""
    list_display = ['tag_name', 'feedback_link', 'feedback_type', 'created_at']
    list_filter = ['tag_name', 'created_at', 'feedback__feedback_type']
    search_fields = ['tag_name', 'feedback__content']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    
    def feedback_link(self, obj):
        """Display link to related feedback"""
        return format_html(
            '<a href="{}" target="_blank">View Feedback</a>',
            reverse('admin:feedback_feedback_change', args=[obj.feedback.id])
        )
    feedback_link.short_description = 'Feedback'
    
    def feedback_type(self, obj):
        """Display feedback type"""
        return obj.feedback.get_feedback_type_display()
    feedback_type.short_description = 'Type'
    feedback_type.admin_order_field = 'feedback__feedback_type'


@admin.register(FeedbackTagTemplate)
class FeedbackTagTemplateAdmin(admin.ModelAdmin):
    """Admin interface for FeedbackTagTemplate model"""
    list_display = [
        'name', 'category_badge', 'description_preview', 'is_active_badge',
        'usage_count_display', 'created_by_name', 'created_at'
    ]
    list_filter = ['category', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['usage_count_display', 'created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'category', 'description')
        }),
        ('Settings', {
            'fields': ('is_active',)
        }),
        ('Statistics', {
            'fields': ('usage_count_display',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    date_hierarchy = 'created_at'
    ordering = ['category', 'name']
    actions = ['activate_templates', 'deactivate_templates']
    
    def category_badge(self, obj):
        """Display category with color-coded badge"""
        colors = {
            'skill': '#28a745',      # Green
            'behavior': '#007bff',   # Blue
            'value': '#ffc107',      # Yellow
            'competency': '#dc3545'  # Red
        }
        color = colors.get(obj.category, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 12px; font-size: 11px; font-weight: bold;">{}</span>',
            color,
            obj.get_category_display()
        )
    category_badge.short_description = 'Category'
    category_badge.admin_order_field = 'category'
    
    def description_preview(self, obj):
        """Display truncated description"""
        if obj.description:
            return obj.description[:50] + "..." if len(obj.description) > 50 else obj.description
        return '-'
    description_preview.short_description = 'Description'
    
    def is_active_badge(self, obj):
        """Display active status with badge"""
        if obj.is_active:
            return format_html(
                '<span style="background-color: #28a745; color: white; padding: 2px 6px; '
                'border-radius: 8px; font-size: 10px;">Active</span>'
            )
        return format_html(
            '<span style="background-color: #dc3545; color: white; padding: 2px 6px; '
            'border-radius: 8px; font-size: 10px;">Inactive</span>'
        )
    is_active_badge.short_description = 'Status'
    is_active_badge.admin_order_field = 'is_active'
    
    def usage_count_display(self, obj):
        """Display usage count with formatting"""
        count = obj.usage_count
        if count > 0:
            return format_html(
                '<span style="background-color: #17a2b8; color: white; padding: 2px 6px; '
                'border-radius: 8px; font-size: 10px;">{} uses</span>',
                count
            )
        return '0 uses'
    usage_count_display.short_description = 'Usage'
    
    def created_by_name(self, obj):
        """Display creator name with link"""
        return format_html(
            '<a href="{}" target="_blank">{}</a>',
            reverse('admin:core_user_change', args=[obj.created_by.id]),
            obj.created_by.get_full_name()
        )
    created_by_name.short_description = 'Created By'
    created_by_name.admin_order_field = 'created_by__last_name'
    
    def activate_templates(self, request, queryset):
        """Bulk action to activate tag templates"""
        updated = queryset.update(is_active=True)
        self.message_user(
            request,
            f'{updated} tag templates activated.'
        )
    activate_templates.short_description = 'Activate selected templates'
    
    def deactivate_templates(self, request, queryset):
        """Bulk action to deactivate tag templates"""
        updated = queryset.update(is_active=False)
        self.message_user(
            request,
            f'{updated} tag templates deactivated.'
        )
    deactivate_templates.short_description = 'Deactivate selected templates'


@admin.register(FeedbackComment)
class FeedbackCommentAdmin(admin.ModelAdmin):
    """Admin interface for FeedbackComment model"""
    list_display = [
        'id', 'feedback_link', 'comment_by_name', 'content_preview', 'created_at'
    ]
    list_filter = ['created_at', 'feedback__feedback_type']
    search_fields = ['content', 'comment_by__first_name', 'comment_by__last_name']
    readonly_fields = ['created_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('feedback', 'comment_by', 'content')
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        })
    )
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    
    def feedback_link(self, obj):
        """Display link to related feedback"""
        return format_html(
            '<a href="{}" target="_blank">View Feedback</a>',
            reverse('admin:feedback_feedback_change', args=[obj.feedback.id])
        )
    feedback_link.short_description = 'Feedback'
    
    def comment_by_name(self, obj):
        """Display commenter name with link"""
        return format_html(
            '<a href="{}" target="_blank">{}</a>',
            reverse('admin:core_user_change', args=[obj.comment_by.id]),
            obj.comment_by.get_full_name()
        )
    comment_by_name.short_description = 'Comment By'
    comment_by_name.admin_order_field = 'comment_by__last_name'
    
    def content_preview(self, obj):
        """Display truncated content"""
        return obj.content[:100] + "..." if len(obj.content) > 100 else obj.content
    content_preview.short_description = 'Content'
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related(
            'feedback', 'comment_by'
        )


# Customize admin site header and title
admin.site.site_header = 'Performance Management - Feedback Administration'
admin.site.site_title = 'Feedback Admin'
admin.site.index_title = 'Feedback Management Dashboard'
