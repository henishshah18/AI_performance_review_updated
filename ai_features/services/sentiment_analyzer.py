from django.contrib.contenttypes.models import ContentType
from .models import AISentimentAnalysis
from .services.openai_service import openai_service
import logging

logger = logging.getLogger(__name__)

def analyze_and_save_sentiment(content_object) -> AISentimentAnalysis:
    """
    Analyzes sentiment for a given content object (e.g., Feedback instance),
    and saves the analysis to the AISentimentAnalysis model.
    """
    # Ensure the content object has a 'text' or 'content' attribute to analyze
    text_to_analyze = getattr(content_object, 'content', getattr(content_object, 'text', None))
    if not text_to_analyze:
        logger.warning(f"Content object {content_object} has no 'content' or 'text' attribute to analyze.")
        return None

    try:
        # 1. Get sentiment analysis from OpenAI
        analysis_data = openai_service.analyze_sentiment(text_to_analyze)

        # 2. Get the ContentType for the object's model
        content_type = ContentType.objects.get_for_model(content_object)

        # 3. Create or update the sentiment analysis record
        sentiment_obj, created = AISentimentAnalysis.objects.update_or_create(
            content_type=content_type,
            object_id=content_object.id,
            defaults={
                'sentiment_label': analysis_data.get('sentiment_label', 'neutral'),
                'sentiment_score': analysis_data.get('sentiment_score', 0.0),
                'confidence_score': analysis_data.get('confidence_score', 0.0),
                'detected_keywords': analysis_data.get('keywords', []),
                'analysis_metadata': {'error': analysis_data.get('error')} if 'error' in analysis_data else {}
            }
        )
        
        logger.info(f"Sentiment analysis {'created' if created else 'updated'} for {content_type.model} {content_object.id}")
        return sentiment_obj

    except Exception as e:
        logger.error(f"Failed to analyze and save sentiment for {content_object}: {e}", exc_info=True)
        return None 