import logging
from typing import Dict, Any, Optional, List
from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from ai_features.models import AISentimentAnalysis, AISettings
from ai_features.services.openai_service import OpenAIService

logger = logging.getLogger(__name__)


class SentimentAnalyzer:
    """
    Service for analyzing sentiment of content using AI.
    Handles automatic analysis, batch processing, and result storage.
    """
    
    def __init__(self):
        self.openai_service = OpenAIService()
    
    def analyze_content_sentiment(
        self, 
        content_object, 
        force_reanalysis: bool = False,
        user_id: Optional[str] = None
    ) -> Optional[AISentimentAnalysis]:
        """
        Analyze sentiment for a content object and store results.
        
        Args:
            content_object: The object to analyze (Feedback, SelfAssessment, etc.)
            force_reanalysis: Whether to reanalyze if already analyzed
            user_id: Optional user ID for rate limiting
            
        Returns:
            AISentimentAnalysis instance or None if analysis failed
        """
        settings = AISettings.get_settings()
        
        # Check if sentiment analysis is enabled
        if not settings.sentiment_analysis_enabled:
            logger.info("Sentiment analysis is disabled in settings")
            return None
        
        # Get content type
        content_type = ContentType.objects.get_for_model(content_object)
        
        # Check if already analyzed
        if not force_reanalysis:
            existing_analysis = AISentimentAnalysis.objects.filter(
                content_type=content_type,
                object_id=content_object.id
            ).first()
            
            if existing_analysis:
                logger.info(f"Sentiment already analyzed for {content_object}")
                return existing_analysis
        
        # Extract text content based on object type
        text_content = self._extract_text_content(content_object)
        
        if not text_content:
            logger.warning(f"No text content found for sentiment analysis: {content_object}")
            return None
        
        try:
            # Perform sentiment analysis
            analysis_result = self.openai_service.analyze_sentiment(
                content=text_content,
                user_id=user_id
            )
            
            # Store results
            with transaction.atomic():
                sentiment_analysis, created = AISentimentAnalysis.objects.update_or_create(
                    content_type=content_type,
                    object_id=content_object.id,
                    defaults={
                        'sentiment_score': analysis_result['sentiment_score'],
                        'sentiment_label': analysis_result['sentiment_label'],
                        'confidence_score': analysis_result['confidence_score'],
                        'detected_keywords': analysis_result['keywords'],
                        'detected_issues': analysis_result['detected_issues'],
                        'analysis_metadata': {
                            'tokens_used': analysis_result['tokens_used'],
                            'processing_time': analysis_result['processing_time'],
                            'explanation': analysis_result['explanation'],
                            'model_used': 'gpt-4',  # From settings
                            'content_length': len(text_content)
                        }
                    }
                )
                
                # Mark the original object as analyzed
                if hasattr(content_object, 'sentiment_analyzed'):
                    content_object.sentiment_analyzed = True
                    content_object.save(update_fields=['sentiment_analyzed'])
                
                logger.info(f"Sentiment analysis {'updated' if not created else 'created'} for {content_object}")
                return sentiment_analysis
                
        except Exception as e:
            logger.error(f"Sentiment analysis failed for {content_object}: {e}")
            return None
    
    def batch_analyze_sentiment(
        self, 
        content_objects: List[Any],
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze sentiment for multiple content objects in batch.
        
        Args:
            content_objects: List of objects to analyze
            user_id: Optional user ID for rate limiting
            
        Returns:
            Dictionary with batch analysis results
        """
        results = {
            'total_objects': len(content_objects),
            'analyzed': 0,
            'skipped': 0,
            'failed': 0,
            'analyses': []
        }
        
        for obj in content_objects:
            try:
                analysis = self.analyze_content_sentiment(obj, user_id=user_id)
                if analysis:
                    results['analyzed'] += 1
                    results['analyses'].append({
                        'object_id': str(obj.id),
                        'object_type': obj.__class__.__name__,
                        'sentiment_label': analysis.sentiment_label,
                        'sentiment_score': float(analysis.sentiment_score),
                        'confidence_score': float(analysis.confidence_score)
                    })
                else:
                    results['skipped'] += 1
                    
            except Exception as e:
                results['failed'] += 1
                logger.error(f"Batch sentiment analysis failed for {obj}: {e}")
        
        return results
    
    def get_sentiment_summary(
        self, 
        content_type: Optional[str] = None,
        user_id: Optional[str] = None,
        start_date=None,
        end_date=None
    ) -> Dict[str, Any]:
        """
        Get sentiment analysis summary for content.
        
        Args:
            content_type: Optional content type filter
            user_id: Optional user filter
            start_date: Optional start date filter
            end_date: Optional end date filter
            
        Returns:
            Dictionary with sentiment summary
        """
        from django.db.models import Avg, Count
        from django.utils import timezone
        from datetime import timedelta
        
        # Build queryset
        queryset = AISentimentAnalysis.objects.all()
        
        if content_type:
            ct = ContentType.objects.get(model=content_type.lower())
            queryset = queryset.filter(content_type=ct)
        
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)
        
        # Calculate aggregates
        aggregates = queryset.aggregate(
            total_analyzed=Count('id'),
            average_score=Avg('sentiment_score'),
            average_confidence=Avg('confidence_score')
        )
        
        # Get sentiment distribution
        sentiment_distribution = {}
        for choice in AISentimentAnalysis.SENTIMENT_CHOICES:
            label = choice[0]
            count = queryset.filter(sentiment_label=label).count()
            percentage = (count / aggregates['total_analyzed'] * 100) if aggregates['total_analyzed'] > 0 else 0
            sentiment_distribution[label] = {
                'count': count,
                'percentage': round(percentage, 1)
            }
        
        # Get recent trends (last 30 days by week)
        if not start_date:
            start_date = timezone.now() - timedelta(days=30)
        
        trends = []
        current_date = start_date
        while current_date <= (end_date or timezone.now()):
            week_end = min(current_date + timedelta(days=7), end_date or timezone.now())
            week_data = queryset.filter(
                created_at__gte=current_date,
                created_at__lt=week_end
            ).aggregate(
                count=Count('id'),
                avg_score=Avg('sentiment_score')
            )
            
            trends.append({
                'week_start': current_date.strftime('%Y-%m-%d'),
                'count': week_data['count'] or 0,
                'average_score': float(week_data['avg_score'] or 0.0)
            })
            
            current_date = week_end
        
        # Get issue summary
        issue_summary = {}
        all_issues = queryset.exclude(detected_issues=[]).values_list('detected_issues', flat=True)
        for issues_list in all_issues:
            for issue in issues_list:
                issue_summary[issue] = issue_summary.get(issue, 0) + 1
        
        return {
            'total_analyzed': aggregates['total_analyzed'] or 0,
            'average_sentiment_score': round(float(aggregates['average_score'] or 0.0), 3),
            'average_confidence': round(float(aggregates['average_confidence'] or 0.0), 3),
            'sentiment_distribution': sentiment_distribution,
            'sentiment_trends': trends,
            'detected_issues': dict(sorted(issue_summary.items(), key=lambda x: x[1], reverse=True)),
            'analysis_period': {
                'start_date': start_date.strftime('%Y-%m-%d') if start_date else None,
                'end_date': end_date.strftime('%Y-%m-%d') if end_date else timezone.now().strftime('%Y-%m-%d')
            }
        }
    
    def get_sentiment_alerts(self, user_role: str = 'hr_admin') -> List[Dict[str, Any]]:
        """
        Get sentiment-based alerts for concerning content.
        
        Args:
            user_role: Role of the requesting user for filtering
            
        Returns:
            List of alert dictionaries
        """
        from django.utils import timezone
        from datetime import timedelta
        
        alerts = []
        recent_cutoff = timezone.now() - timedelta(days=7)
        
        # Alert for very negative sentiment
        negative_analyses = AISentimentAnalysis.objects.filter(
            sentiment_label='negative',
            sentiment_score__lt=-0.5,
            confidence_score__gt=0.7,
            created_at__gte=recent_cutoff
        ).select_related('content_type')
        
        for analysis in negative_analyses:
            alerts.append({
                'type': 'negative_sentiment',
                'severity': 'high' if analysis.sentiment_score < -0.7 else 'medium',
                'title': 'Negative Sentiment Detected',
                'description': f'Content with very negative sentiment detected in {analysis.content_type.model}',
                'sentiment_score': float(analysis.sentiment_score),
                'confidence': float(analysis.confidence_score),
                'object_id': str(analysis.object_id),
                'content_type': analysis.content_type.model,
                'detected_at': analysis.created_at.isoformat(),
                'issues': analysis.detected_issues
            })
        
        # Alert for concerning issues
        issue_analyses = AISentimentAnalysis.objects.filter(
            detected_issues__icontains='bias',
            created_at__gte=recent_cutoff
        ).select_related('content_type')
        
        for analysis in issue_analyses:
            if 'bias' in analysis.detected_issues:
                alerts.append({
                    'type': 'bias_detected',
                    'severity': 'medium',
                    'title': 'Potential Bias Detected',
                    'description': f'Potential bias detected in {analysis.content_type.model}',
                    'sentiment_score': float(analysis.sentiment_score),
                    'confidence': float(analysis.confidence_score),
                    'object_id': str(analysis.object_id),
                    'content_type': analysis.content_type.model,
                    'detected_at': analysis.created_at.isoformat(),
                    'issues': analysis.detected_issues
                })
        
        # Sort by severity and recency
        severity_order = {'high': 3, 'medium': 2, 'low': 1}
        alerts.sort(key=lambda x: (severity_order.get(x['severity'], 0), x['detected_at']), reverse=True)
        
        return alerts[:20]  # Return top 20 alerts
    
    def _extract_text_content(self, content_object) -> Optional[str]:
        """
        Extract text content from various object types for analysis.
        
        Args:
            content_object: Object to extract text from
            
        Returns:
            Extracted text content or None
        """
        content_parts = []
        
        # Handle different object types
        obj_type = content_object.__class__.__name__
        
        if obj_type == 'Feedback':
            content_parts.append(content_object.content)
            
        elif obj_type == 'SelfAssessment':
            if content_object.technical_examples:
                content_parts.append(content_object.technical_examples)
            if content_object.collaboration_examples:
                content_parts.append(content_object.collaboration_examples)
            if content_object.problem_solving_examples:
                content_parts.append(content_object.problem_solving_examples)
            if content_object.initiative_examples:
                content_parts.append(content_object.initiative_examples)
            if content_object.development_goals:
                content_parts.append(content_object.development_goals)
            if content_object.manager_support_needed:
                content_parts.append(content_object.manager_support_needed)
            if content_object.career_interests:
                content_parts.append(content_object.career_interests)
                
        elif obj_type == 'PeerReview':
            if content_object.collaboration_examples:
                content_parts.append(content_object.collaboration_examples)
            if content_object.impact_examples:
                content_parts.append(content_object.impact_examples)
            if content_object.development_suggestions:
                content_parts.append(content_object.development_suggestions)
            if content_object.strengths_to_continue:
                content_parts.append(content_object.strengths_to_continue)
                
        elif obj_type == 'ManagerReview':
            if content_object.technical_justification:
                content_parts.append(content_object.technical_justification)
            if content_object.collaboration_justification:
                content_parts.append(content_object.collaboration_justification)
            if content_object.problem_solving_justification:
                content_parts.append(content_object.problem_solving_justification)
            if content_object.initiative_justification:
                content_parts.append(content_object.initiative_justification)
            if content_object.development_plan:
                content_parts.append(content_object.development_plan)
            if content_object.manager_support:
                content_parts.append(content_object.manager_support)
            if content_object.business_impact:
                content_parts.append(content_object.business_impact)
                
        elif obj_type == 'UpwardReview':
            if content_object.leadership_examples:
                content_parts.append(content_object.leadership_examples)
            if content_object.communication_examples:
                content_parts.append(content_object.communication_examples)
            if content_object.support_examples:
                content_parts.append(content_object.support_examples)
            if content_object.areas_for_improvement:
                content_parts.append(content_object.areas_for_improvement)
            if content_object.additional_comments:
                content_parts.append(content_object.additional_comments)
        
        # Join all content parts
        full_content = ' '.join(filter(None, content_parts)).strip()
        
        return full_content if full_content else None 