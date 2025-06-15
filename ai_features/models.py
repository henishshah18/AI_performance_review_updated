import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

User = get_user_model()


class AISentimentAnalysis(models.Model):
    """
    Model to store AI sentiment analysis results for various content types.
    Uses generic foreign key to analyze feedback, reviews, assessments, etc.
    """
    SENTIMENT_CHOICES = [
        ('positive', 'Positive'),
        ('neutral', 'Neutral'),  
        ('negative', 'Negative'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Generic foreign key to any content type
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()
    content_object = GenericForeignKey('content_type', 'object_id')
    
    sentiment_score = models.DecimalField(
        max_digits=4, 
        decimal_places=3,
        validators=[MinValueValidator(-1.000), MaxValueValidator(1.000)],
        help_text="Sentiment score from -1.0 (negative) to 1.0 (positive)"
    )
    sentiment_label = models.CharField(
        max_length=10, 
        choices=SENTIMENT_CHOICES,
        help_text="Categorical sentiment label"
    )
    confidence_score = models.DecimalField(
        max_digits=4, 
        decimal_places=3,
        validators=[MinValueValidator(0.000), MaxValueValidator(1.000)],
        help_text="Confidence of the sentiment analysis from 0.0 to 1.0"
    )
    detected_keywords = models.JSONField(
        default=list, 
        blank=True,
        help_text="Keywords detected that influenced the sentiment"
    )
    detected_issues = models.JSONField(
        default=list, 
        blank=True,
        help_text="Potential issues detected, e.g., 'vague_language', 'bias_risk'"
    )
    analysis_metadata = models.JSONField(
        default=dict, 
        blank=True,
        help_text="Other metadata from the analysis"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "AI Sentiment Analysis"
        verbose_name_plural = "AI Sentiment Analyses"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['sentiment_label']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Sentiment Analysis - {self.sentiment_label} ({self.confidence_score:.2f}) for {self.content_object}"


class AIGenerationRequest(models.Model):
    """
    Model to track AI generation requests for reviews and assessments.
    Helps with monitoring usage, costs, and performance.
    """
    GENERATION_TYPES = [
        ('self_assessment', 'Self Assessment'),
        ('peer_review', 'Peer Review'),
        ('manager_review', 'Manager Review'),
        ('goal_suggestions', 'Goal Suggestions'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),  
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='ai_generation_requests',
        help_text="User who requested the AI generation"
    )
    generation_type = models.CharField(
        max_length=20, 
        choices=GENERATION_TYPES,
        help_text="Type of content being generated"
    )
    status = models.CharField(
        max_length=15, 
        choices=STATUS_CHOICES, 
        default='pending',
        help_text="Current status of the generation request"
    )
    
    # Input data for generation
    input_data = models.JSONField(
        default=dict,
        help_text="Input parameters used for generation"
    )
    
    # Generated content
    generated_content = models.TextField(
        blank=True, 
        null=True,
        help_text="The AI-generated content"
    )
    structured_output = models.JSONField(
        default=dict, 
        blank=True,
        help_text="Structured output data for forms"
    )
    
    # Generation metadata
    model_used = models.CharField(
        max_length=50, 
        blank=True,
        help_text="AI model used for generation (e.g., gpt-4)"
    )
    tokens_used = models.IntegerField(
        null=True, 
        blank=True,
        help_text="Number of tokens consumed"
    )
    processing_time = models.FloatField(
        null=True, 
        blank=True,
        help_text="Processing time in seconds"
    )
    error_message = models.TextField(
        blank=True, 
        null=True,
        help_text="Error message if generation failed"
    )
    
    # Related objects (optional)
    related_cycle_id = models.UUIDField(
        null=True, 
        blank=True,
        help_text="Related review cycle if applicable"
    )
    related_user_id = models.UUIDField(
        null=True, 
        blank=True,
        help_text="Related user being reviewed if applicable"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="When the generation was completed"
    )
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'generation_type']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['generation_type', 'created_at']),
        ]
    
    def __str__(self):
        return f"AI Generation - {self.generation_type} for {self.user.get_full_name()} ({self.status})"
    
    def mark_completed(self, content, structured_output=None):
        """Mark the generation as completed with content"""
        self.status = 'completed'
        self.generated_content = content
        if structured_output:
            self.structured_output = structured_output
        self.completed_at = timezone.now()
        self.save()
    
    def mark_failed(self, error_message):
        """Mark the generation as failed with error message"""
        self.status = 'failed'
        self.error_message = error_message
        self.save()


class AISettings(models.Model):
    """
    Model to store AI configuration settings managed by HR Admin.
    Allows enabling/disabling features and configuring parameters.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Feature toggles
    ai_features_enabled = models.BooleanField(
        default=True,
        help_text="Master toggle for all AI features"
    )
    sentiment_analysis_enabled = models.BooleanField(
        default=True,
        help_text="Enable automatic sentiment analysis"
    )
    review_generation_enabled = models.BooleanField(
        default=True,
        help_text="Enable AI review generation"
    )
    goal_suggestions_enabled = models.BooleanField(
        default=True,
        help_text="Enable AI goal suggestions"
    )
    
    # Rate limiting settings
    max_generations_per_user_per_day = models.IntegerField(
        default=10,
        help_text="Maximum AI generations per user per day"
    )
    max_generations_per_user_per_hour = models.IntegerField(
        default=3,
        help_text="Maximum AI generations per user per hour"
    )
    
    # Model configuration
    openai_model = models.CharField(
        max_length=50,
        default='gpt-4',
        help_text="OpenAI model to use for generation"
    )
    max_tokens = models.IntegerField(
        default=1000,
        help_text="Maximum tokens for AI responses"
    )
    temperature = models.FloatField(
        default=0.7,
        validators=[MinValueValidator(0.0), MaxValueValidator(2.0)],
        help_text="Creativity temperature (0.0 to 2.0)"
    )
    
    # Auto-analysis settings
    auto_analyze_feedback = models.BooleanField(
        default=True,
        help_text="Automatically analyze feedback sentiment"
    )
    auto_analyze_reviews = models.BooleanField(
        default=True,
        help_text="Automatically analyze review sentiment"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True,
        help_text="User who last updated these settings"
    )
    
    class Meta:
        verbose_name = "AI Settings"
        verbose_name_plural = "AI Settings"
    
    def __str__(self):
        return f"AI Settings (Updated: {self.updated_at.strftime('%Y-%m-%d %H:%M')})"
    
    @classmethod
    def get_settings(cls):
        """Get the current AI settings (singleton pattern)"""
        settings, created = cls.objects.get_or_create(
            id='00000000-0000-0000-0000-000000000001'  # Fixed UUID for singleton
        )
        return settings
