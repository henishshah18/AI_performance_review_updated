from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .serializers import AnalyzeTextSerializer, AISentimentAnalysisResultSerializer
from .services.openai_service import openai_service
from .services.review_generator import review_generator
from .models import AISentimentAnalysis
from django.contrib.contenttypes.models import ContentType
from feedback.models import Feedback
from core.models import User
import logging

logger = logging.getLogger(__name__)

# Create your views here.

class AnalyzeTextView(APIView):
    """
    An endpoint to perform sentiment analysis on a provided piece of text.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = AnalyzeTextSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        text_to_analyze = serializer.validated_data['text']

        try:
            analysis_result = openai_service.analyze_sentiment(text_to_analyze)
            
            # Here we assume the result from the service matches the format
            # expected by AISentimentAnalysisResultSerializer.
            # A more robust implementation might re-serialize the data.
            response_serializer = AISentimentAnalysisResultSerializer(data=analysis_result)
            if response_serializer.is_valid():
                return Response(response_serializer.data, status=status.HTTP_200_OK)
            else:
                # This case handles if the AI service returns an unexpected format
                logger.error(f"Invalid data format from AI service: {response_serializer.errors}")
                return Response(
                    {"error": "Failed to process AI analysis result.", "details": response_serializer.errors},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except Exception as e:
            logger.exception("An error occurred during sentiment analysis.")
            return Response(
                {"error": "An internal error occurred while analyzing sentiment."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class FeedbackSentimentView(APIView):
    """
    Retrieves the sentiment analysis for a specific feedback entry.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, feedback_id, *args, **kwargs):
        try:
            feedback_content_type = ContentType.objects.get_for_model(Feedback)
            analysis = AISentimentAnalysis.objects.get(
                content_type=feedback_content_type,
                object_id=feedback_id
            )
            
            # Re-using the result serializer for consistency
            serializer = AISentimentAnalysisResultSerializer({
                'sentiment_label': analysis.sentiment_label,
                'sentiment_score': analysis.sentiment_score,
                'confidence_score': analysis.confidence_score,
                'keywords': analysis.detected_keywords
            })
            return Response(serializer.data, status=status.HTTP_200_OK)

        except AISentimentAnalysis.DoesNotExist:
            return Response(
                {"error": "Sentiment analysis not found for this feedback."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.exception(f"Error retrieving sentiment for feedback ID {feedback_id}.")
            return Response(
                {"error": "An internal error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class GenerateSelfAssessmentView(APIView):
    """
    Generates a self-assessment draft for the currently authenticated user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        try:
            draft = review_generator.generate_self_assessment_draft(user)
            return Response({"draft": draft}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f"Error generating self-assessment for user {user.email}")
            return Response({"error": "Failed to generate self-assessment draft."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GeneratePeerReviewView(APIView):
    """
    Generates a peer review draft. Requires the ID of the user being reviewed
    and a description of the relationship.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        from_user = request.user
        to_user_id = request.data.get('to_user_id')
        relationship = request.data.get('relationship')

        if not to_user_id or not relationship:
            return Response({"error": "to_user_id and relationship are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            to_user = User.objects.get(id=to_user_id)
            draft = review_generator.generate_peer_review_draft(from_user, to_user, relationship)
            return Response({"draft": draft}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User to be reviewed not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.exception(f"Error generating peer review from {from_user.email} to {to_user_id}")
            return Response({"error": "Failed to generate peer review draft."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
