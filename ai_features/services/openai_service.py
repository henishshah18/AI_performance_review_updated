import openai
import time
import logging
from typing import Dict, List, Optional, Any
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from datetime import datetime, timedelta
import json

logger = logging.getLogger(__name__)


class OpenAIService:
    """
    Service class for OpenAI API integration with error handling,
    rate limiting, and retry logic.
    """
    
    def __init__(self):
        # Set the API key for the older openai library
        openai.api_key = getattr(settings, 'OPENAI_API_KEY', '')
        self.default_model = getattr(settings, 'OPENAI_MODEL', 'gpt-3.5-turbo')
        self.max_retries = 3
        self.retry_delay = 1  # seconds
        
    def _check_rate_limit(self, user_id: str, generation_type: str) -> bool:
        """Check if user has exceeded rate limits"""
        from ai_features.models import AISettings
        
        settings_obj = AISettings.get_settings()
        
        # Check hourly limit
        hourly_key = f"ai_generation_hourly_{user_id}"
        hourly_count = cache.get(hourly_key, 0)
        if hourly_count >= settings_obj.max_generations_per_user_per_hour:
            logger.warning(f"User {user_id} exceeded hourly AI generation limit")
            return False
            
        # Check daily limit
        daily_key = f"ai_generation_daily_{user_id}"
        daily_count = cache.get(daily_key, 0)
        if daily_count >= settings_obj.max_generations_per_user_per_day:
            logger.warning(f"User {user_id} exceeded daily AI generation limit")
            return False
            
        return True
    
    def _increment_rate_limit(self, user_id: str):
        """Increment rate limit counters"""
        hourly_key = f"ai_generation_hourly_{user_id}"
        daily_key = f"ai_generation_daily_{user_id}"
        
        # Increment hourly counter (expires in 1 hour)
        try:
            cache.add(hourly_key, 0, timeout=3600)
            cache.incr(hourly_key)
        except ValueError:
            cache.set(hourly_key, 1, timeout=3600)
            
        # Increment daily counter (expires in 24 hours)
        try:
            cache.add(daily_key, 0, timeout=86400)
            cache.incr(daily_key)
        except ValueError:
            cache.set(daily_key, 1, timeout=86400)
    
    def _get_completion(
        self, 
        prompt: str, 
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get completion from OpenAI with retry logic and error handling
        """
        from ai_features.models import AISettings
        
        settings_obj = AISettings.get_settings()
        
        # Check if AI features are enabled
        if not settings_obj.ai_features_enabled:
            raise ValueError("AI features are currently disabled")
            
        # Check rate limits if user_id provided
        if user_id and not self._check_rate_limit(user_id, 'completion'):
            raise ValueError("Rate limit exceeded. Please try again later.")
        
        # Use settings or defaults
        model = model or settings_obj.openai_model
        max_tokens = max_tokens or settings_obj.max_tokens
        temperature = temperature or settings_obj.temperature
        
        for attempt in range(self.max_retries):
            try:
                start_time = time.time()
                
                # Use the older API structure
                response = openai.ChatCompletion.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": "You are an AI assistant helping with performance reviews and workplace feedback. Provide professional, constructive, and helpful responses."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=max_tokens,
                    temperature=temperature,
                    top_p=1,
                    frequency_penalty=0,
                    presence_penalty=0
                )
                
                processing_time = time.time() - start_time
                
                # Increment rate limit counter
                if user_id:
                    self._increment_rate_limit(user_id)
                
                return {
                    'content': response.choices[0].message.content,
                    'model': model,
                    'tokens_used': response.usage.total_tokens,
                    'processing_time': processing_time,
                    'finish_reason': response.choices[0].finish_reason
                }
                
            except openai.error.RateLimitError as e:
                logger.warning(f"OpenAI rate limit hit (attempt {attempt + 1}): {e}")
                if attempt < self.max_retries - 1:
                    time.sleep(self.retry_delay * (2 ** attempt))  # Exponential backoff
                    continue
                raise ValueError("OpenAI service is currently overloaded. Please try again later.")
                
            except openai.error.AuthenticationError as e:
                logger.error(f"OpenAI authentication error: {e}")
                raise ValueError("AI service authentication failed. Please contact support.")
                
            except openai.error.APIConnectionError as e:
                logger.warning(f"OpenAI connection error (attempt {attempt + 1}): {e}")
                if attempt < self.max_retries - 1:
                    time.sleep(self.retry_delay * (2 ** attempt))
                    continue
                raise ValueError("Unable to connect to AI service. Please try again later.")
                
            except openai.error.APIError as e:
                logger.error(f"OpenAI API error: {e}")
                raise ValueError(f"AI service error: {str(e)}")
                
            except Exception as e:
                logger.error(f"Unexpected error in OpenAI service: {e}")
                raise ValueError("An unexpected error occurred. Please try again later.")
        
        raise ValueError("AI service is currently unavailable after multiple retry attempts.")
    
    def analyze_sentiment(self, content: str, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze sentiment of text content using OpenAI
        """
        prompt = f"""
        Analyze the sentiment of the following text and provide a detailed analysis:

        Text: "{content}"

        Please provide:
        1. Sentiment label (positive, neutral, or negative)
        2. Sentiment score (-1.0 to 1.0, where -1 is very negative and 1 is very positive)
        3. Confidence score (0.0 to 1.0)
        4. Key words or phrases that influenced the sentiment
        5. Any potential issues detected (vague language, bias, unprofessional tone, etc.)

        Format your response as JSON:
        {{
            "sentiment_label": "positive|neutral|negative",
            "sentiment_score": 0.0,
            "confidence_score": 0.0,
            "keywords": ["word1", "word2"],
            "detected_issues": ["issue1", "issue2"],
            "explanation": "Brief explanation of the analysis"
        }}
        """
        
        try:
            result = self._get_completion(prompt, user_id=user_id)
            
            # Parse JSON response
            analysis = json.loads(result['content'])
            
            # Validate and normalize the response
            sentiment_label = analysis.get('sentiment_label', 'neutral')
            if sentiment_label not in ['positive', 'neutral', 'negative']:
                sentiment_label = 'neutral'
                
            sentiment_score = float(analysis.get('sentiment_score', 0.0))
            sentiment_score = max(-1.0, min(1.0, sentiment_score))  # Clamp to [-1, 1]
            
            confidence_score = float(analysis.get('confidence_score', 0.5))
            confidence_score = max(0.0, min(1.0, confidence_score))  # Clamp to [0, 1]
            
            return {
                'sentiment_label': sentiment_label,
                'sentiment_score': sentiment_score,
                'confidence_score': confidence_score,
                'keywords': analysis.get('keywords', []),
                'detected_issues': analysis.get('detected_issues', []),
                'explanation': analysis.get('explanation', ''),
                'usage_info': {
                    'tokens_used': result['tokens_used'],
                    'processing_time': result['processing_time']
                }
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse OpenAI sentiment analysis response: {e}")
            # Return a fallback neutral sentiment
            return {
                'sentiment_label': 'neutral',
                'sentiment_score': 0.0,
                'confidence_score': 0.3,
                'keywords': [],
                'detected_issues': ['parsing_error'],
                'explanation': 'Unable to parse AI response',
                'usage_info': {
                    'tokens_used': 0,
                    'processing_time': 0
                }
            }
        except Exception as e:
            logger.error(f"Error in sentiment analysis: {e}")
            raise
    
    def generate_self_assessment_draft(self, user_data: Dict[str, Any], user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate self-assessment draft based on user's goals and performance data
        """
        prompt = f"""
        Generate a professional self-assessment draft for a performance review based on the following information:

        Employee: {user_data.get('name', 'Employee')}
        Role: {user_data.get('role', 'Team Member')}
        Department: {user_data.get('department', 'Department')}
        Review Period: {user_data.get('review_period', 'Current Period')}

        Goals and Achievements:
        {json.dumps(user_data.get('goals', []), indent=2)}

        Recent Feedback Received:
        {json.dumps(user_data.get('recent_feedback', []), indent=2)}

        Please generate a structured self-assessment covering:
        1. Technical Excellence (rating and examples)
        2. Collaboration (rating and examples)
        3. Problem Solving (rating and examples)
        4. Initiative (rating and examples)
        5. Goal Achievement Summary
        6. Development Goals for next period
        7. Support needed from manager
        8. Career interests and aspirations

        Format as JSON with the structure:
        {{
            "technical_excellence": {{"rating": 1-5, "examples": "text"}},
            "collaboration": {{"rating": 1-5, "examples": "text"}},
            "problem_solving": {{"rating": 1-5, "examples": "text"}},
            "initiative": {{"rating": 1-5, "examples": "text"}},
            "goal_achievements": "text",
            "development_goals": "text",
            "manager_support_needed": "text",
            "career_interests": "text"
        }}

        Make the content professional, specific, and based on the provided data.
        """
        
        result = self._get_completion(prompt, user_id=user_id)
        
        try:
            assessment = json.loads(result['content'])
            return {
                'structured_output': assessment,
                'generated_content': result['content'],
                'tokens_used': result['tokens_used'],
                'processing_time': result['processing_time']
            }
        except json.JSONDecodeError:
            # Return as plain text if JSON parsing fails
            return {
                'structured_output': {},
                'generated_content': result['content'],
                'tokens_used': result['tokens_used'],
                'processing_time': result['processing_time']
            }
    
    def generate_peer_review_draft(self, review_data: Dict[str, Any], user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate peer review draft
        """
        prompt = f"""
        Generate a professional peer review for:

        Reviewee: {review_data.get('reviewee_name', 'Colleague')}
        Reviewer Role: {review_data.get('reviewer_role', 'Team Member')}
        Relationship: {review_data.get('relationship', 'Peer')}
        Collaboration Context: {review_data.get('collaboration_context', 'Team projects')}

        Recent Collaborations:
        {json.dumps(review_data.get('collaborations', []), indent=2)}

        Please generate a peer review covering:
        1. Collaboration Rating (1-5) and specific examples
        2. Impact Rating (1-5) and examples of contributions
        3. Development suggestions (constructive)
        4. Strengths to continue

        Format as JSON:
        {{
            "collaboration_rating": 1-5,
            "collaboration_examples": "specific examples",
            "impact_rating": 1-5,
            "impact_examples": "specific examples",
            "development_suggestions": "constructive suggestions",
            "strengths_to_continue": "positive strengths"
        }}

        Be specific, professional, and constructive.
        """
        
        result = self._get_completion(prompt, user_id=user_id)
        
        try:
            review = json.loads(result['content'])
            return {
                'structured_output': review,
                'generated_content': result['content'],
                'tokens_used': result['tokens_used'],
                'processing_time': result['processing_time']
            }
        except json.JSONDecodeError:
            return {
                'structured_output': {},
                'generated_content': result['content'],
                'tokens_used': result['tokens_used'],
                'processing_time': result['processing_time']
            }
    
    def generate_manager_review_draft(self, review_data: Dict[str, Any], user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate manager review draft
        """
        prompt = f"""
        Generate a comprehensive manager review for:

        Employee: {review_data.get('employee_name', 'Employee')}
        Role: {review_data.get('employee_role', 'Team Member')}
        Manager: {review_data.get('manager_name', 'Manager')}
        Review Period: {review_data.get('review_period', 'Current Period')}

        Employee's Goals and Performance:
        {json.dumps(review_data.get('goals_performance', []), indent=2)}

        Self-Assessment Summary:
        {json.dumps(review_data.get('self_assessment', {}), indent=2)}

        Peer Feedback Summary:
        {json.dumps(review_data.get('peer_feedback', []), indent=2)}

        Generate a manager review covering:
        1. Overall Rating (exceeds_expectations, meets_expectations, below_expectations)
        2. Technical Excellence (1-5 rating and justification)
        3. Collaboration (1-5 rating and justification)
        4. Problem Solving (1-5 rating and justification)
        5. Initiative (1-5 rating and justification)
        6. Goal Assessments for each goal
        7. Development Plan
        8. Manager Support commitments
        9. Business Impact assessment

        Format as JSON:
        {{
            "overall_rating": "exceeds_expectations|meets_expectations|below_expectations",
            "technical_excellence": {{"rating": 1-5, "justification": "text"}},
            "collaboration": {{"rating": 1-5, "justification": "text"}},
            "problem_solving": {{"rating": 1-5, "justification": "text"}},
            "initiative": {{"rating": 1-5, "justification": "text"}},
            "goal_assessments": [{{"goal": "title", "rating": "exceeded|met|partially_met|not_met", "feedback": "text"}}],
            "development_plan": "text",
            "manager_support": "text",
            "business_impact": "text"
        }}

        Be thorough, fair, and provide specific examples.
        """
        
        result = self._get_completion(prompt, user_id=user_id)
        
        try:
            review = json.loads(result['content'])
            return {
                'structured_output': review,
                'generated_content': result['content'],
                'tokens_used': result['tokens_used'],
                'processing_time': result['processing_time']
            }
        except json.JSONDecodeError:
            return {
                'structured_output': {},
                'generated_content': result['content'],
                'tokens_used': result['tokens_used'],
                'processing_time': result['processing_time']
            } 