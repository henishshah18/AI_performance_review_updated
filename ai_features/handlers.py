from django.dispatch import receiver
from .signals import new_content_for_analysis
from .services.sentiment_analyzer import analyze_and_save_sentiment
import logging

logger = logging.getLogger(__name__)

@receiver(new_content_for_analysis)
def handle_new_content_analysis(sender, **kwargs):
    """
    Receives the signal and triggers the sentiment analysis for the given instance.
    """
    instance = kwargs.get('instance')
    if not instance:
        logger.warning("Received new_content_for_analysis signal without an instance.")
        return

    logger.info(f"Signal received: Starting sentiment analysis for {type(instance).__name__} {instance.id}")
    
    # Here you could potentially run this in a background task (e.g., with Celery)
    # For now, we run it synchronously for simplicity.
    analyze_and_save_sentiment(instance) 