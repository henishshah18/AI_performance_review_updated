import logging
from django.db.models.signals import post_save
from django.dispatch import receiver, Signal
from django.contrib.auth import get_user_model
from celery import shared_task

User = get_user_model()
logger = logging.getLogger(__name__)

# Custom signal for new content that needs analysis
new_content_for_analysis = Signal()


@shared_task
def analyze_content_sentiment_task(content_type, object_id):
    """
    Celery task for asynchronous sentiment analysis.
    This prevents blocking the main request thread.
    """
    try:
        from django.contrib.contenttypes.models import ContentType
        from ai_features.services.sentiment_analyzer import SentimentAnalyzer
        from ai_features.models import AISettings
        
        settings = AISettings.get_settings()
        if not settings.sentiment_analysis_enabled:
            logger.info("Sentiment analysis is disabled, skipping task")
            return
        
        # Get the content object
        ct = ContentType.objects.get(id=content_type)
        content_object = ct.get_object_for_this_type(id=object_id)
        
        # Perform sentiment analysis
        analyzer = SentimentAnalyzer()
        result = analyzer.analyze_content_sentiment(content_object)
        
        if result:
            logger.info(f"Sentiment analysis completed for {content_object}")
        else:
            logger.warning(f"Sentiment analysis failed for {content_object}")
            
    except Exception as e:
        logger.error(f"Sentiment analysis task failed: {e}")


@receiver(new_content_for_analysis)
def handle_new_content_for_analysis(sender, instance, **kwargs):
    """
    Handle the custom signal for new content that needs sentiment analysis.
    This creates an asynchronous task to perform the analysis.
    """
    from django.contrib.contenttypes.models import ContentType
    from ai_features.models import AISettings
    
    try:
        settings = AISettings.get_settings()
        
        # Check if auto-analysis is enabled for this content type
        content_type_name = instance.__class__.__name__.lower()
        
        if content_type_name == 'feedback' and not settings.auto_analyze_feedback:
            logger.info(f"Auto-analysis disabled for feedback, skipping {instance}")
            return
            
        if content_type_name in ['selfassessment', 'peerreview', 'managerreview', 'upwardreview'] and not settings.auto_analyze_reviews:
            logger.info(f"Auto-analysis disabled for reviews, skipping {instance}")
            return
        
        # Get content type and schedule analysis
        content_type = ContentType.objects.get_for_model(instance)
        
        # Schedule asynchronous sentiment analysis
        analyze_content_sentiment_task.delay(content_type.id, instance.id)
        logger.info(f"Scheduled sentiment analysis for {instance}")
        
    except Exception as e:
        logger.error(f"Failed to schedule sentiment analysis for {instance}: {e}")


@receiver(post_save, sender='feedback.Feedback')
def feedback_saved_handler(sender, instance, created, **kwargs):
    """
    Handler for when feedback is saved.
    Triggers sentiment analysis for new feedback.
    """
    if created:
        logger.info(f"New feedback created: {instance}")
        new_content_for_analysis.send(sender=sender, instance=instance)


@receiver(post_save, sender='reviews.SelfAssessment')
def self_assessment_saved_handler(sender, instance, created, **kwargs):
    """
    Handler for when self-assessment is saved.
    Triggers sentiment analysis when status changes to submitted.
    """
    # Only analyze when submitted (not drafts)
    if instance.status == 'completed' and instance.submitted_at and not instance.sentiment_analyzed:
        logger.info(f"Self-assessment submitted: {instance}")
        new_content_for_analysis.send(sender=sender, instance=instance)


@receiver(post_save, sender='reviews.PeerReview')
def peer_review_saved_handler(sender, instance, created, **kwargs):
    """
    Handler for when peer review is saved.
    Triggers sentiment analysis when status changes to submitted.
    """
    # Only analyze when submitted (not drafts)
    if instance.status == 'completed' and instance.submitted_at and not instance.sentiment_analyzed:
        logger.info(f"Peer review submitted: {instance}")
        new_content_for_analysis.send(sender=sender, instance=instance)


@receiver(post_save, sender='reviews.ManagerReview')
def manager_review_saved_handler(sender, instance, created, **kwargs):
    """
    Handler for when manager review is saved.
    Triggers sentiment analysis when status changes to submitted.
    """
    # Only analyze when submitted (not drafts)
    if instance.status == 'completed' and instance.submitted_at and not instance.sentiment_analyzed:
        logger.info(f"Manager review submitted: {instance}")
        new_content_for_analysis.send(sender=sender, instance=instance)


@receiver(post_save, sender='reviews.UpwardReview')
def upward_review_saved_handler(sender, instance, created, **kwargs):
    """
    Handler for when upward review is saved.
    Triggers sentiment analysis when status changes to submitted.
    """
    # Only analyze when submitted (not drafts)
    if instance.status == 'completed' and instance.submitted_at and not instance.sentiment_analyzed:
        logger.info(f"Upward review submitted: {instance}")
        new_content_for_analysis.send(sender=sender, instance=instance)


# AI Generation Request handlers for analytics and monitoring
@receiver(post_save, sender='ai_features.AIGenerationRequest')
def ai_generation_request_saved_handler(sender, instance, created, **kwargs):
    """
    Handler for AI generation request updates.
    Can be used for monitoring, analytics, or notifications.
    """
    if created:
        logger.info(f"New AI generation request: {instance.generation_type} by {instance.user}")
    elif instance.status == 'completed':
        logger.info(f"AI generation completed: {instance.generation_type} for {instance.user}")
    elif instance.status == 'failed':
        logger.warning(f"AI generation failed: {instance.generation_type} for {instance.user} - {instance.error_message}")


# Settings change handlers
@receiver(post_save, sender='ai_features.AISettings')
def ai_settings_saved_handler(sender, instance, created, **kwargs):
    """
    Handler for AI settings changes.
    Can be used for logging configuration changes.
    """
    if not created:
        logger.info(f"AI settings updated by {instance.updated_by}")
        
        # Log specific changes that might affect operations
        if not instance.ai_features_enabled:
            logger.warning("AI features have been disabled")
        elif not instance.sentiment_analysis_enabled:
            logger.info("Sentiment analysis has been disabled")
        elif not instance.review_generation_enabled:
            logger.info("Review generation has been disabled")


# Cleanup tasks for old data
@shared_task
def cleanup_old_ai_data():
    """
    Periodic cleanup task for old AI data.
    Should be scheduled to run daily or weekly.
    """
    from django.utils import timezone
    from datetime import timedelta
    from ai_features.models import AIGenerationRequest, AISentimentAnalysis
    
    # Delete old failed generation requests (older than 30 days)
    cutoff_date = timezone.now() - timedelta(days=30)
    old_failed_requests = AIGenerationRequest.objects.filter(
        status='failed',
        created_at__lt=cutoff_date
    )
    
    deleted_count = old_failed_requests.count()
    old_failed_requests.delete()
    
    logger.info(f"Cleaned up {deleted_count} old failed AI generation requests")
    
    # Archive old sentiment analyses (older than 1 year) - in a real system,
    # you might want to move these to a separate archive table instead of deleting
    archive_cutoff = timezone.now() - timedelta(days=365)
    old_analyses = AISentimentAnalysis.objects.filter(
        created_at__lt=archive_cutoff
    )
    
    archived_count = old_analyses.count()
    # For now, just log - in production you might archive to separate storage
    logger.info(f"Found {archived_count} sentiment analyses ready for archival")


# Rate limiting helpers
def check_user_generation_limits(user, generation_type):
    """
    Check if user has hit their generation limits.
    Used by views before creating generation requests.
    """
    from django.core.cache import cache
    from ai_features.models import AISettings
    
    settings = AISettings.get_settings()
    
    # Check hourly limit
    hourly_key = f"ai_generation_hourly_{user.id}"
    hourly_count = cache.get(hourly_key, 0)
    if hourly_count >= settings.max_generations_per_user_per_hour:
        return False, "Hourly generation limit exceeded"
    
    # Check daily limit
    daily_key = f"ai_generation_daily_{user.id}"
    daily_count = cache.get(daily_key, 0)
    if daily_count >= settings.max_generations_per_user_per_day:
        return False, "Daily generation limit exceeded"
    
    return True, "Within limits" 