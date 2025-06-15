from django.db import models
import uuid
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

User = get_user_model()

class AISentimentAnalysis(models.Model):
    """
    Stores the results of AI sentiment analysis on various content types.
    """
    SENTIMENT_LABELS = [
        ('positive', 'Positive'),
        ('neutral', 'Neutral'),
        ('negative', 'Negative'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Polymorphic relationship to link to any model (e.g., Feedback, PeerReview)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()
    content_object = GenericForeignKey('content_type', 'object_id')

    # Analysis results
    sentiment_score = models.DecimalField(max_digits=4, decimal_places=3, help_text="Sentiment score from -1.0 (negative) to 1.0 (positive)")
    sentiment_label = models.CharField(max_length=10, choices=SENTIMENT_LABELS)
    confidence_score = models.DecimalField(max_digits=4, decimal_places=3, help_text="Confidence of the sentiment analysis from 0.0 to 1.0")
    
    # Additional insights
    detected_keywords = models.JSONField(default=list, blank=True, help_text="Keywords detected that influenced the sentiment")
    analysis_metadata = models.JSONField(default=dict, blank=True, help_text="Other metadata from the analysis")

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
        ]
        verbose_name = "AI Sentiment Analysis"
        verbose_name_plural = "AI Sentiment Analyses"

    def __str__(self):
        return f"Sentiment for {self.content_type.model} ({self.object_id}): {self.get_sentiment_label_display()}"
