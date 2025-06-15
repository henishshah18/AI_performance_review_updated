from django.shortcuts import render
import logging
from typing import Dict, Any
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveUpdateAPIView
from django.contrib.auth import get_user_model
from django.db.models import Q, Count, Avg
from django.utils import timezone
from datetime import timedelta
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError

from core.decorators import hr_admin_required
from .models import (
    AISentimentAnalysis, 
    AIGenerationRequest, 
    AISettings
)
from .serializers import (
    AISentimentAnalysisSerializer,
    AIGenerationRequestSerializer,
    AIGenerationRequestCreateSerializer,
    AISettingsSerializer,
    SentimentAnalysisRequestSerializer,
    ReviewGenerationRequestSerializer,
    SentimentDashboardSerializer,
    AIUsageAnalyticsSerializer,
    AIInsightsSerializer
)
from .services.openai_service import OpenAIService
from .services.sentiment_analyzer import SentimentAnalyzer
from .services.review_generator import ReviewGenerator
from .signals import check_user_generation_limits

User = get_user_model()
logger = logging.getLogger(__name__)


class AISettingsView(RetrieveUpdateAPIView):
    """
    API view for managing AI settings (HR Admin only).
    GET: Retrieve current AI settings
    PUT/PATCH: Update AI settings
    """
    serializer_class = AISettingsSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return AISettings.get_settings()
    
    def get(self, request, *args, **kwargs):
        if request.user.role != 'hr_admin':
            return Response(
                {'error': 'Only HR Admins can access AI settings'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().get(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        if request.user.role != 'hr_admin':
            return Response(
                {'error': 'Only HR Admins can modify AI settings'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Set the updated_by field
        settings = self.get_object()
        settings.updated_by = request.user
        settings.save()
        
        response = super().update(request, *args, **kwargs)
        
        if response.status_code == 200:
            logger.info(f"AI settings updated by {request.user}")
        
        return response


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_self_assessment_draft(request):
    """
    Generate AI draft for self-assessment.
    POST /api/ai/generate/self-assessment/
    """
    try:
        # Check rate limits
        can_generate, limit_message = check_user_generation_limits(request.user, 'self_assessment')
        if not can_generate:
            return Response(
                {'error': limit_message},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        serializer = ReviewGenerationRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        # Generate self-assessment draft
        generator = ReviewGenerator()
        result = generator.generate_self_assessment_draft(
            user=request.user,
            cycle_id=data.get('cycle_id'),
            context_data=data.get('context_data', {})
        )
        
        if result['success']:
            return Response({
                'success': True,
                'request_id': result['request_id'],
                'generated_content': result['generated_content'],
                'structured_output': result['structured_output'],
                'usage_info': {
                    'tokens_used': result['tokens_used'],
                    'processing_time': result['processing_time']
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'error': result['error'],
                'request_id': result['request_id']
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        logger.error(f"Self-assessment generation error: {e}")
        return Response(
            {'error': 'Failed to generate self-assessment draft'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_peer_review_draft(request):
    """
    Generate AI draft for peer review.
    POST /api/ai/generate/peer-review/
    """
    try:
        # Check rate limits
        can_generate, limit_message = check_user_generation_limits(request.user, 'peer_review')
        if not can_generate:
            return Response(
                {'error': limit_message},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        serializer = ReviewGenerationRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        reviewee_id = data.get('reviewee_id')
        
        if not reviewee_id:
            return Response(
                {'error': 'reviewee_id is required for peer review generation'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            reviewee = User.objects.get(id=reviewee_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'Reviewee not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Generate peer review draft
        generator = ReviewGenerator()
        result = generator.generate_peer_review_draft(
            reviewer=request.user,
            reviewee=reviewee,
            cycle_id=data.get('cycle_id'),
            context_data=data.get('context_data', {})
        )
        
        if result['success']:
            return Response({
                'success': True,
                'request_id': result['request_id'],
                'generated_content': result['generated_content'],
                'structured_output': result['structured_output'],
                'usage_info': {
                    'tokens_used': result['tokens_used'],
                    'processing_time': result['processing_time']
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'error': result['error'],
                'request_id': result['request_id']
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        logger.error(f"Peer review generation error: {e}")
        return Response(
            {'error': 'Failed to generate peer review draft'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_manager_review_draft(request):
    """
    Generate AI draft for manager review.
    POST /api/ai/generate/manager-review/
    """
    try:
        # Only managers can generate manager reviews
        if request.user.role != 'manager':
            return Response(
                {'error': 'Only managers can generate manager reviews'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check rate limits
        can_generate, limit_message = check_user_generation_limits(request.user, 'manager_review')
        if not can_generate:
            return Response(
                {'error': limit_message},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        serializer = ReviewGenerationRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        reviewee_id = data.get('reviewee_id')
        
        if not reviewee_id:
            return Response(
                {'error': 'reviewee_id is required for manager review generation'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            employee = User.objects.get(id=reviewee_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'Employee not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verify manager-employee relationship
        if employee.manager != request.user:
            return Response(
                {'error': 'You can only generate reviews for your direct reports'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Generate manager review draft
        generator = ReviewGenerator()
        result = generator.generate_manager_review_draft(
            manager=request.user,
            employee=employee,
            cycle_id=data.get('cycle_id'),
            context_data=data.get('context_data', {})
        )
        
        if result['success']:
            return Response({
                'success': True,
                'request_id': result['request_id'],
                'generated_content': result['generated_content'],
                'structured_output': result['structured_output'],
                'usage_info': {
                    'tokens_used': result['tokens_used'],
                    'processing_time': result['processing_time']
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'error': result['error'],
                'request_id': result['request_id']
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        logger.error(f"Manager review generation error: {e}")
        return Response(
            {'error': 'Failed to generate manager review draft'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def analyze_sentiment(request):
    """
    Analyze sentiment of provided content.
    POST /api/ai/sentiment/analyze/
    """
    try:
        serializer = SentimentAnalysisRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        content = serializer.validated_data['content']
        content_type = serializer.validated_data.get('content_type', 'manual')
        
        # Use OpenAI service directly for manual analysis
        openai_service = OpenAIService()
        result = openai_service.analyze_sentiment(
            content=content,
            user_id=str(request.user.id)
        )
        
        return Response({
            'sentiment_label': result['sentiment_label'],
            'sentiment_score': result['sentiment_score'],
            'confidence_score': result['confidence_score'],
            'keywords': result['keywords'],
            'detected_issues': result['detected_issues'],
            'explanation': result['explanation'],
            'usage_info': {
                'tokens_used': result['tokens_used'],
                'processing_time': result['processing_time']
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Sentiment analysis error: {e}")
        return Response(
            {'error': 'Failed to analyze sentiment'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def sentiment_dashboard(request):
    """
    Get sentiment analysis dashboard data.
    GET /api/ai/sentiment/dashboard/
    """
    try:
        analyzer = SentimentAnalyzer()
        
        # Get query parameters
        content_type = request.GET.get('content_type')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        # Parse dates if provided
        if start_date:
            start_date = timezone.datetime.strptime(start_date, '%Y-%m-%d').date()
        if end_date:
            end_date = timezone.datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Apply role-based filtering
        user_id = None
        if request.user.role == 'individual_contributor':
            user_id = str(request.user.id)
        elif request.user.role == 'manager':
            # Managers see their team's data
            pass  # Will be handled in the service
        # HR Admins see all data
        
        summary = analyzer.get_sentiment_summary(
            content_type=content_type,
            user_id=user_id,
            start_date=start_date,
            end_date=end_date
        )
        
        return Response(summary, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Sentiment dashboard error: {e}")
        return Response(
            {'error': 'Failed to load sentiment dashboard'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def sentiment_alerts(request):
    """
    Get sentiment-based alerts.
    GET /api/ai/sentiment/alerts/
    """
    try:
        analyzer = SentimentAnalyzer()
        alerts = analyzer.get_sentiment_alerts(user_role=request.user.role)
        
        return Response({
            'alerts': alerts,
            'total_alerts': len(alerts)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Sentiment alerts error: {e}")
        return Response(
            {'error': 'Failed to load sentiment alerts'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class AIGenerationHistoryView(ListAPIView):
    """
    Get AI generation history for the current user.
    GET /api/ai/generation-history/
    """
    serializer_class = AIGenerationRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = AIGenerationRequest.objects.filter(user=user)
        
        # Filter by generation type if specified
        generation_type = self.request.GET.get('generation_type')
        if generation_type:
            queryset = queryset.filter(generation_type=generation_type)
        
        # Filter by status if specified
        status_filter = self.request.GET.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-created_at')


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def ai_usage_analytics(request):
    """
    Get AI usage analytics (HR Admin only).
    GET /api/ai/analytics/usage/
    """
    try:
        if request.user.role != 'hr_admin':
            return Response(
                {'error': 'Only HR Admins can access AI usage analytics'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get date range
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        if start_date:
            start_date = timezone.datetime.strptime(start_date, '%Y-%m-%d').date()
        else:
            start_date = timezone.now().date() - timedelta(days=30)
            
        if end_date:
            end_date = timezone.datetime.strptime(end_date, '%Y-%m-%d').date()
        else:
            end_date = timezone.now().date()
        
        # Build queryset
        queryset = AIGenerationRequest.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        )
        
        # Calculate analytics
        total_generations = queryset.count()
        
        # Generations by type
        generations_by_type = {}
        for choice in AIGenerationRequest.GENERATION_TYPES:
            type_name = choice[0]
            count = queryset.filter(generation_type=type_name).count()
            generations_by_type[type_name] = count
        
        # Generations by user (top 10)
        generations_by_user = list(
            queryset.values('user__first_name', 'user__last_name', 'user__email')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )
        
        # Daily usage
        daily_usage = []
        current_date = start_date
        while current_date <= end_date:
            count = queryset.filter(created_at__date=current_date).count()
            daily_usage.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'count': count
            })
            current_date += timedelta(days=1)
        
        # Success rate
        completed_count = queryset.filter(status='completed').count()
        success_rate = (completed_count / total_generations * 100) if total_generations > 0 else 0
        
        # Average processing time
        avg_processing_time = queryset.filter(
            status='completed',
            processing_time__isnull=False
        ).aggregate(avg_time=Avg('processing_time'))['avg_time'] or 0
        
        # Total tokens used
        total_tokens = queryset.filter(
            tokens_used__isnull=False
        ).aggregate(total=models.Sum('tokens_used'))['total'] or 0
        
        analytics = {
            'total_generations': total_generations,
            'generations_by_type': generations_by_type,
            'generations_by_user': generations_by_user,
            'daily_usage': daily_usage,
            'success_rate': round(success_rate, 2),
            'average_processing_time': round(float(avg_processing_time), 2),
            'total_tokens_used': total_tokens,
            'analysis_period': {
                'start_date': start_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d')
            }
        }
        
        return Response(analytics, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"AI usage analytics error: {e}")
        return Response(
            {'error': 'Failed to load AI usage analytics'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def ai_insights(request):
    """
    Get AI insights and recommendations based on data analysis.
    GET /api/ai/insights/
    """
    try:
        insights = []
        recommendations = []
        sentiment_alerts = []
        quality_flags = []
        
        # Role-based insights
        if request.user.role == 'hr_admin':
            # Company-wide insights for HR Admin
            total_sentiment_analyses = AISentimentAnalysis.objects.count()
            recent_negative = AISentimentAnalysis.objects.filter(
                sentiment_label='negative',
                created_at__gte=timezone.now() - timedelta(days=7)
            ).count()
            
            if total_sentiment_analyses > 0:
                negative_percentage = (recent_negative / total_sentiment_analyses) * 100
                insights.append({
                    'type': 'sentiment_trend',
                    'title': 'Recent Sentiment Analysis',
                    'description': f'{negative_percentage:.1f}% of recent content shows negative sentiment',
                    'severity': 'high' if negative_percentage > 20 else 'medium' if negative_percentage > 10 else 'low',
                    'metric_value': negative_percentage,
                    'metric_unit': '%'
                })
            
            # Generation usage insights
            recent_generations = AIGenerationRequest.objects.filter(
                created_at__gte=timezone.now() - timedelta(days=30)
            ).count()
            
            insights.append({
                'type': 'usage_trend',
                'title': 'AI Generation Usage',
                'description': f'{recent_generations} AI generations in the last 30 days',
                'severity': 'low',
                'metric_value': recent_generations,
                'metric_unit': 'generations'
            })
            
        elif request.user.role == 'manager':
            # Team-specific insights for managers
            team_members = User.objects.filter(manager=request.user)
            team_feedback = AISentimentAnalysis.objects.filter(
                content_type=ContentType.objects.get(model='feedback'),
                created_at__gte=timezone.now() - timedelta(days=30)
            )
            
            if team_feedback.exists():
                avg_sentiment = team_feedback.aggregate(avg=Avg('sentiment_score'))['avg']
                insights.append({
                    'type': 'team_sentiment',
                    'title': 'Team Sentiment Trend',
                    'description': f'Average team sentiment score: {avg_sentiment:.2f}',
                    'severity': 'low' if avg_sentiment > 0.3 else 'medium' if avg_sentiment > 0 else 'high',
                    'metric_value': round(float(avg_sentiment), 2),
                    'metric_unit': 'score'
                })
        
        else:
            # Individual insights
            user_sentiment = AISentimentAnalysis.objects.filter(
                content_type=ContentType.objects.get(model='feedback'),
                created_at__gte=timezone.now() - timedelta(days=30)
            )
            
            if user_sentiment.exists():
                avg_sentiment = user_sentiment.aggregate(avg=Avg('sentiment_score'))['avg']
                insights.append({
                    'type': 'personal_sentiment',
                    'title': 'Your Feedback Sentiment',
                    'description': f'Average sentiment of feedback you received: {avg_sentiment:.2f}',
                    'severity': 'low',
                    'metric_value': round(float(avg_sentiment), 2),
                    'metric_unit': 'score'
                })
        
        # Get sentiment alerts
        analyzer = SentimentAnalyzer()
        sentiment_alerts = analyzer.get_sentiment_alerts(user_role=request.user.role)
        
        return Response({
            'insights': insights,
            'recommendations': recommendations,
            'sentiment_alerts': sentiment_alerts[:5],  # Limit to 5 most important
            'quality_flags': quality_flags
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"AI insights error: {e}")
        return Response(
            {'error': 'Failed to load AI insights'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
