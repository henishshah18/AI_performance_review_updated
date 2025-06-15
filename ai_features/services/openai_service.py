import openai
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class OpenAIService:
    """
    A wrapper for the OpenAI API client to handle configuration,
    error handling, and making requests.
    """
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY is not configured in settings.")
        openai.api_key = self.api_key
        self.default_model = getattr(settings, 'OPENAI_DEFAULT_MODEL', 'gpt-3.5-turbo')

    def get_completion(self, prompt: str, model: str = None, max_tokens: int = 150, temperature: float = 0.7) -> str:
        """
        Generates a text completion using the specified model.
        """
        if model is None:
            model = self.default_model

        try:
            response = openai.ChatCompletion.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant for a performance review platform."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature,
                n=1,
                stop=None,
            )
            return response.choices[0].message['content'].strip()
        except openai.error.OpenAIError as e:
            logger.error(f"OpenAI API error: {e}")
            raise  # Re-raise the exception to be handled by the caller

    def analyze_sentiment(self, text: str) -> dict:
        """
        Analyzes the sentiment of a given text and returns a structured response.
        """
        prompt = f"""
        Analyze the sentiment of the following text and provide a JSON response
        with 'sentiment_label' (positive, neutral, negative), 'sentiment_score' (from -1.0 to 1.0),
        and 'confidence_score' (from 0.0 to 1.0).

        Text: "{text}"

        JSON Response:
        """
        try:
            response_text = self.get_completion(prompt, max_tokens=100, temperature=0.1)
            # Basic parsing and validation, should be made more robust
            import json
            analysis = json.loads(response_text)
            
            # Validate required keys
            required_keys = ['sentiment_label', 'sentiment_score', 'confidence_score']
            if not all(key in analysis for key in required_keys):
                raise ValueError("Invalid JSON response from OpenAI for sentiment analysis.")

            return analysis
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Error parsing sentiment analysis response: {e}")
            # Fallback or re-raise
            return {
                'sentiment_label': 'neutral',
                'sentiment_score': 0.0,
                'confidence_score': 0.5,
                'error': str(e)
            }
        except openai.error.OpenAIError as e:
            logger.error(f"OpenAI API error during sentiment analysis: {e}")
            raise

# A global instance of the service
openai_service = OpenAIService() 