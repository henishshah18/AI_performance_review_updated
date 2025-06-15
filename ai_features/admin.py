from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import AISentimentAnalysis, AIGenerationRequest, AISettings


@admin.register(AISentimentAnalysis)
class AISentimentAnalysisAdmin(admin.ModelAdmin):
    """Admin interface for AI Sentiment Analysis"""
    
    list_display = [
        'id', 'content_type', 'sentiment_badge', 'sentiment_score_display',
        'confidence_display', 'detected_issues_count', 'created_at'
    ]
    list_filter = [
        'sentiment_label', 'content_type', 'created_at',
        'confidence_score'
    ]
    search_fields = [
        'detected_keywords', 'detected_issues', 'analysis_metadata'
    ]
    readonly_fields = [
        'id', 'content_type', 'object_id', 'sentiment_score',
        'sentiment_label', 'confidence_score', 'detected_keywords',
        'detected_issues', 'analysis_metadata', 'created_at'
    ]
    ordering = ['-created_at']
    date_hierarchy = 'created_at'
    
    def sentiment_badge(self, obj):
        """Display sentiment as colored badge"""
        colors = {
            'positive': '#10B981',  # Green
            'neutral': '#F59E0B',   # Yellow
            'negative': '#EF4444'   # Red
        }
        color = colors.get(obj.sentiment_label, '#6B7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; '
            'border-radius: 4px; font-size: 12px;">{}</span>',
            color,
            obj.sentiment_label.title()
        )
    sentiment_badge.short_description = 'Sentiment'
    
    def sentiment_score_display(self, obj):
        """Display sentiment score with color coding"""
        score = float(obj.sentiment_score)
        if score > 0.3:
            color = '#10B981'  # Green
        elif score > -0.3:
            color = '#F59E0B'  # Yellow
        else:
            color = '#EF4444'  # Red
        
        return format_html(
            '<span style="color: {}; font-weight: bold;">{:.3f}</span>',
            color,
            score
        )
    sentiment_score_display.short_description = 'Score'
    
    def confidence_display(self, obj):
        """Display confidence with progress bar"""
        confidence = float(obj.confidence_score) * 100
        return format_html(
            '<div style="width: 100px; background-color: #E5E7EB; border-radius: 4px;">'
            '<div style="width: {}%; height: 20px; background-color: #3B82F6; '
            'border-radius: 4px; text-align: center; color: white; font-size: 12px; line-height: 20px;">'
            '{:.0f}%</div></div>',
            confidence,
            confidence
        )
    confidence_display.short_description = 'Confidence'
    
    def detected_issues_count(self, obj):
        """Display count of detected issues"""
        count = len(obj.detected_issues) if obj.detected_issues else 0
        if count > 0:
            return format_html(
                '<span style="background-color: #EF4444; color: white; padding: 2px 6px; '
                'border-radius: 50%; font-size: 12px;">{}</span>',
                count
            )
        return '0'
    detected_issues_count.short_description = 'Issues'
    
    def has_add_permission(self, request):
        """Prevent manual creation of sentiment analyses"""
        return False


@admin.register(AIGenerationRequest)
class AIGenerationRequestAdmin(admin.ModelAdmin):
    """Admin interface for AI Generation Requests"""
    
    list_display = [
        'id', 'user', 'generation_type', 'status_badge',
        'tokens_used', 'processing_time_display', 'created_at'
    ]
    list_filter = [
        'generation_type', 'status', 'model_used', 'created_at'
    ]
    search_fields = [
        'user__email', 'user__first_name', 'user__last_name',
        'error_message'
    ]
    readonly_fields = [
        'id', 'user', 'generation_type', 'status', 'input_data',
        'generated_content', 'structured_output', 'model_used',
        'tokens_used', 'processing_time', 'error_message',
        'related_cycle_id', 'related_user_id', 'created_at',
        'updated_at', 'completed_at'
    ]
    ordering = ['-created_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Request Information', {
            'fields': (
                'id', 'user', 'generation_type', 'status',
                'created_at', 'updated_at', 'completed_at'
            )
        }),
        ('Generation Data', {
            'fields': (
                'input_data', 'generated_content', 'structured_output'
            ),
            'classes': ('collapse',)
        }),
        ('Performance Metrics', {
            'fields': (
                'model_used', 'tokens_used', 'processing_time'
            )
        }),
        ('Related Objects', {
            'fields': (
                'related_cycle_id', 'related_user_id'
            )
        }),
        ('Error Information', {
            'fields': ('error_message',),
            'classes': ('collapse',)
        })
    )
    
    def status_badge(self, obj):
        """Display status as colored badge"""
        colors = {
            'pending': '#6B7280',     # Gray
            'processing': '#3B82F6',  # Blue
            'completed': '#10B981',   # Green
            'failed': '#EF4444',      # Red
            'cancelled': '#F59E0B'    # Yellow
        }
        color = colors.get(obj.status, '#6B7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; '
            'border-radius: 4px; font-size: 12px;">{}</span>',
            color,
            obj.status.title()
        )
    status_badge.short_description = 'Status'
    
    def processing_time_display(self, obj):
        """Display processing time with formatting"""
        if obj.processing_time:
            return f"{obj.processing_time:.2f}s"
        return '-'
    processing_time_display.short_description = 'Time'
    
    def has_add_permission(self, request):
        """Prevent manual creation of generation requests"""
        return False


@admin.register(AISettings)
class AISettingsAdmin(admin.ModelAdmin):
    """Admin interface for AI Settings"""
    
    list_display = [
        'id', 'ai_features_status', 'sentiment_analysis_status',
        'review_generation_status', 'updated_by', 'updated_at'
    ]
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Feature Toggles', {
            'fields': (
                'ai_features_enabled', 'sentiment_analysis_enabled',
                'review_generation_enabled', 'goal_suggestions_enabled'
            )
        }),
        ('Rate Limiting', {
            'fields': (
                'max_generations_per_user_per_day',
                'max_generations_per_user_per_hour'
            )
        }),
        ('Model Configuration', {
            'fields': (
                'openai_model', 'max_tokens', 'temperature'
            )
        }),
        ('Auto-Analysis Settings', {
            'fields': (
                'auto_analyze_feedback', 'auto_analyze_reviews'
            )
        }),
        ('Metadata', {
            'fields': (
                'id', 'created_at', 'updated_at', 'updated_by'
            ),
            'classes': ('collapse',)
        })
    )
    
    def ai_features_status(self, obj):
        """Display AI features status"""
        return self._status_badge(obj.ai_features_enabled)
    ai_features_status.short_description = 'AI Features'
    
    def sentiment_analysis_status(self, obj):
        """Display sentiment analysis status"""
        return self._status_badge(obj.sentiment_analysis_enabled)
    sentiment_analysis_status.short_description = 'Sentiment Analysis'
    
    def review_generation_status(self, obj):
        """Display review generation status"""
        return self._status_badge(obj.review_generation_enabled)
    review_generation_status.short_description = 'Review Generation'
    
    def _status_badge(self, enabled):
        """Helper method to create status badges"""
        if enabled:
            return format_html(
                '<span style="background-color: #10B981; color: white; padding: 2px 8px; '
                'border-radius: 4px; font-size: 12px;">Enabled</span>'
            )
        else:
            return format_html(
                '<span style="background-color: #EF4444; color: white; padding: 2px 8px; '
                'border-radius: 4px; font-size: 12px;">Disabled</span>'
            )
    
    def has_delete_permission(self, request, obj=None):
        """Prevent deletion of AI settings"""
        return False
    
    def has_add_permission(self, request):
        """Prevent creation of multiple AI settings"""
        return not AISettings.objects.exists()


# Custom admin site header and title
admin.site.site_header = "AI Performance Review Admin"
admin.site.site_title = "AI Performance Review"
admin.site.index_title = "AI Features Administration"
