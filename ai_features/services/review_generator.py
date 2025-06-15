import logging
from typing import Dict, Any, Optional, List
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from ai_features.models import AIGenerationRequest, AISettings
from ai_features.services.openai_service import OpenAIService

User = get_user_model()
logger = logging.getLogger(__name__)


class ReviewGenerator:
    """
    Service for generating AI-powered review drafts.
    Handles self-assessments, peer reviews, and manager reviews.
    """
    
    def __init__(self):
        self.openai_service = OpenAIService()
    
    def generate_self_assessment_draft(
        self, 
        user: User,
        cycle_id: Optional[str] = None,
        context_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate a self-assessment draft for a user.
        
        Args:
            user: User requesting the generation
            cycle_id: Optional review cycle ID
            context_data: Optional additional context data
            
        Returns:
            Dictionary with generation results
        """
        settings = AISettings.get_settings()
        
        if not settings.review_generation_enabled:
            raise ValueError("AI review generation is currently disabled")
        
        # Create generation request
        generation_request = AIGenerationRequest.objects.create(
            user=user,
            generation_type='self_assessment',
            status='processing',
            related_cycle_id=cycle_id,
            input_data=context_data or {}
        )
        
        try:
            # Gather user data for generation
            user_data = self._gather_user_data_for_self_assessment(user, cycle_id, context_data)
            
            # Generate content using OpenAI
            result = self.openai_service.generate_self_assessment_draft(
                user_data=user_data,
                user_id=str(user.id)
            )
            
            # Update generation request
            generation_request.mark_completed(
                content=result['generated_content'],
                structured_output=result['structured_output']
            )
            generation_request.model_used = 'gpt-4'
            generation_request.tokens_used = result['tokens_used']
            generation_request.processing_time = result['processing_time']
            generation_request.save()
            
            return {
                'success': True,
                'request_id': str(generation_request.id),
                'generated_content': result['generated_content'],
                'structured_output': result['structured_output'],
                'tokens_used': result['tokens_used'],
                'processing_time': result['processing_time']
            }
            
        except Exception as e:
            logger.error(f"Self-assessment generation failed for user {user.id}: {e}")
            generation_request.mark_failed(str(e))
            return {
                'success': False,
                'error': str(e),
                'request_id': str(generation_request.id)
            }
    
    def generate_peer_review_draft(
        self,
        reviewer: User,
        reviewee: User,
        cycle_id: Optional[str] = None,
        context_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate a peer review draft.
        
        Args:
            reviewer: User writing the review
            reviewee: User being reviewed
            cycle_id: Optional review cycle ID
            context_data: Optional additional context data
            
        Returns:
            Dictionary with generation results
        """
        settings = AISettings.get_settings()
        
        if not settings.review_generation_enabled:
            raise ValueError("AI review generation is currently disabled")
        
        # Create generation request
        generation_request = AIGenerationRequest.objects.create(
            user=reviewer,
            generation_type='peer_review',
            status='processing',
            related_cycle_id=cycle_id,
            related_user_id=reviewee.id,
            input_data=context_data or {}
        )
        
        try:
            # Gather data for peer review generation
            review_data = self._gather_data_for_peer_review(reviewer, reviewee, cycle_id, context_data)
            
            # Generate content using OpenAI
            result = self.openai_service.generate_peer_review_draft(
                review_data=review_data,
                user_id=str(reviewer.id)
            )
            
            # Update generation request
            generation_request.mark_completed(
                content=result['generated_content'],
                structured_output=result['structured_output']
            )
            generation_request.model_used = 'gpt-4'
            generation_request.tokens_used = result['tokens_used']
            generation_request.processing_time = result['processing_time']
            generation_request.save()
            
            return {
                'success': True,
                'request_id': str(generation_request.id),
                'generated_content': result['generated_content'],
                'structured_output': result['structured_output'],
                'tokens_used': result['tokens_used'],
                'processing_time': result['processing_time']
            }
            
        except Exception as e:
            logger.error(f"Peer review generation failed for reviewer {reviewer.id}, reviewee {reviewee.id}: {e}")
            generation_request.mark_failed(str(e))
            return {
                'success': False,
                'error': str(e),
                'request_id': str(generation_request.id)
            }
    
    def generate_manager_review_draft(
        self,
        manager: User,
        employee: User,
        cycle_id: Optional[str] = None,
        context_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate a manager review draft.
        
        Args:
            manager: Manager writing the review
            employee: Employee being reviewed
            cycle_id: Optional review cycle ID
            context_data: Optional additional context data
            
        Returns:
            Dictionary with generation results
        """
        settings = AISettings.get_settings()
        
        if not settings.review_generation_enabled:
            raise ValueError("AI review generation is currently disabled")
        
        # Validate manager-employee relationship
        if employee.manager != manager:
            raise ValueError("Manager can only generate reviews for direct reports")
        
        # Create generation request
        generation_request = AIGenerationRequest.objects.create(
            user=manager,
            generation_type='manager_review',
            status='processing',
            related_cycle_id=cycle_id,
            related_user_id=employee.id,
            input_data=context_data or {}
        )
        
        try:
            # Gather data for manager review generation
            review_data = self._gather_data_for_manager_review(manager, employee, cycle_id, context_data)
            
            # Generate content using OpenAI
            result = self.openai_service.generate_manager_review_draft(
                review_data=review_data,
                user_id=str(manager.id)
            )
            
            # Update generation request
            generation_request.mark_completed(
                content=result['generated_content'],
                structured_output=result['structured_output']
            )
            generation_request.model_used = 'gpt-4'
            generation_request.tokens_used = result['tokens_used']
            generation_request.processing_time = result['processing_time']
            generation_request.save()
            
            return {
                'success': True,
                'request_id': str(generation_request.id),
                'generated_content': result['generated_content'],
                'structured_output': result['structured_output'],
                'tokens_used': result['tokens_used'],
                'processing_time': result['processing_time']
            }
            
        except Exception as e:
            logger.error(f"Manager review generation failed for manager {manager.id}, employee {employee.id}: {e}")
            generation_request.mark_failed(str(e))
            return {
                'success': False,
                'error': str(e),
                'request_id': str(generation_request.id)
            }
    
    def _gather_user_data_for_self_assessment(
        self, 
        user: User, 
        cycle_id: Optional[str] = None,
        context_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Gather user data for self-assessment generation"""
        from okr.models import Goal, IndividualTask
        from feedback.models import Feedback
        from reviews.models import ReviewCycle
        
        data = {
            'name': user.get_full_name(),
            'role': user.role_title or user.role,
            'department': user.department.name if user.department else 'Unknown',
            'review_period': 'Current Period'
        }
        
        # Add cycle information if provided
        if cycle_id:
            try:
                from reviews.models import ReviewCycle
                cycle = ReviewCycle.objects.get(id=cycle_id)
                data['review_period'] = f"{cycle.name} ({cycle.review_period_start} to {cycle.review_period_end})"
            except:
                pass
        
        # Get user's goals and achievements
        goals = Goal.objects.filter(assigned_to=user).select_related('objective')
        goal_data = []
        for goal in goals:
            tasks = IndividualTask.objects.filter(goal=goal, assigned_to=user)
            goal_data.append({
                'title': goal.title,
                'description': goal.description,
                'status': goal.status,
                'progress': float(goal.progress_percentage),
                'due_date': goal.due_date.strftime('%Y-%m-%d') if goal.due_date else None,
                'objective': goal.objective.title if goal.objective else None,
                'completed_tasks': tasks.filter(status='completed').count(),
                'total_tasks': tasks.count(),
                'task_examples': [
                    {
                        'title': task.title,
                        'status': task.status,
                        'progress': float(task.progress_percentage)
                    }
                    for task in tasks.order_by('-updated_at')[:3]
                ]
            })
        
        data['goals'] = goal_data
        
        # Get recent feedback received
        recent_feedback = Feedback.objects.filter(
            to_user=user,
            created_at__gte=timezone.now() - timezone.timedelta(days=90)
        ).order_by('-created_at')[:5]
        
        feedback_data = []
        for feedback in recent_feedback:
            feedback_data.append({
                'type': feedback.feedback_type,
                'content': feedback.content[:200] + '...' if len(feedback.content) > 200 else feedback.content,
                'created_at': feedback.created_at.strftime('%Y-%m-%d'),
                'from_anonymous': feedback.is_anonymous
            })
        
        data['recent_feedback'] = feedback_data
        
        # Add context data if provided
        if context_data:
            data.update(context_data)
        
        return data
    
    def _gather_data_for_peer_review(
        self,
        reviewer: User,
        reviewee: User,
        cycle_id: Optional[str] = None,
        context_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Gather data for peer review generation"""
        from okr.models import Goal, IndividualTask
        from feedback.models import Feedback
        
        data = {
            'reviewee_name': reviewee.get_full_name(),
            'reviewee_role': reviewee.role_title or reviewee.role,
            'reviewer_role': reviewer.role_title or reviewer.role,
            'relationship': 'Peer' if reviewer.department == reviewee.department else 'Cross-team',
            'collaboration_context': f"Working together in {reviewee.department.name if reviewee.department else 'the organization'}"
        }
        
        # Get collaboration examples from shared goals/projects
        shared_goals = Goal.objects.filter(
            objective__owner__department=reviewer.department,
            assigned_to=reviewee
        ) if reviewer.department else Goal.objects.none()
        
        collaborations = []
        for goal in shared_goals[:3]:
            collaborations.append({
                'goal_title': goal.title,
                'objective': goal.objective.title if goal.objective else None,
                'status': goal.status,
                'progress': float(goal.progress_percentage)
            })
        
        # Get any feedback history between these users
        feedback_history = Feedback.objects.filter(
            from_user=reviewer,
            to_user=reviewee
        ).order_by('-created_at')[:3]
        
        for feedback in feedback_history:
            collaborations.append({
                'feedback_type': feedback.feedback_type,
                'content_preview': feedback.content[:100] + '...' if len(feedback.content) > 100 else feedback.content,
                'date': feedback.created_at.strftime('%Y-%m-%d')
            })
        
        data['collaborations'] = collaborations
        
        # Add context data if provided
        if context_data:
            data.update(context_data)
        
        return data
    
    def _gather_data_for_manager_review(
        self,
        manager: User,
        employee: User,
        cycle_id: Optional[str] = None,
        context_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Gather data for manager review generation"""
        from okr.models import Goal, IndividualTask
        from feedback.models import Feedback
        from reviews.models import SelfAssessment, PeerReview
        
        data = {
            'employee_name': employee.get_full_name(),
            'employee_role': employee.role_title or employee.role,
            'manager_name': manager.get_full_name(),
            'review_period': 'Current Period'
        }
        
        # Add cycle information if provided
        if cycle_id:
            try:
                from reviews.models import ReviewCycle
                cycle = ReviewCycle.objects.get(id=cycle_id)
                data['review_period'] = f"{cycle.name} ({cycle.review_period_start} to {cycle.review_period_end})"
                
                # Get self-assessment for this cycle
                try:
                    self_assessment = SelfAssessment.objects.get(cycle_id=cycle_id, user=employee)
                    data['self_assessment'] = {
                        'technical_excellence': self_assessment.technical_excellence,
                        'collaboration': self_assessment.collaboration,
                        'problem_solving': self_assessment.problem_solving,
                        'initiative': self_assessment.initiative,
                        'development_goals': self_assessment.development_goals,
                        'manager_support_needed': self_assessment.manager_support_needed
                    }
                except SelfAssessment.DoesNotExist:
                    data['self_assessment'] = {}
                
                # Get peer feedback for this cycle
                peer_reviews = PeerReview.objects.filter(cycle_id=cycle_id, reviewee=employee)
                peer_feedback = []
                for review in peer_reviews[:3]:
                    peer_feedback.append({
                        'collaboration_rating': review.collaboration_rating,
                        'impact_rating': review.impact_rating,
                        'strengths': review.strengths_to_continue,
                        'development_suggestions': review.development_suggestions
                    })
                data['peer_feedback'] = peer_feedback
                
            except Exception as e:
                logger.warning(f"Could not gather cycle data: {e}")
        
        # Get employee's goals and performance
        goals = Goal.objects.filter(assigned_to=employee).select_related('objective')
        goals_performance = []
        for goal in goals:
            tasks = IndividualTask.objects.filter(goal=goal, assigned_to=employee)
            goals_performance.append({
                'title': goal.title,
                'description': goal.description,
                'status': goal.status,
                'progress': float(goal.progress_percentage),
                'due_date': goal.due_date.strftime('%Y-%m-%d') if goal.due_date else None,
                'completed_tasks': tasks.filter(status='completed').count(),
                'total_tasks': tasks.count(),
                'objective': goal.objective.title if goal.objective else None
            })
        
        data['goals_performance'] = goals_performance
        
        # Add context data if provided
        if context_data:
            data.update(context_data)
        
        return data
    
    def get_generation_history(self, user: User, limit: int = 20) -> List[Dict[str, Any]]:
        """Get AI generation history for a user"""
        
        requests = AIGenerationRequest.objects.filter(
            user=user
        ).order_by('-created_at')[:limit]
        
        history = []
        for request in requests:
            history.append({
                'id': str(request.id),
                'generation_type': request.generation_type,
                'status': request.status,
                'created_at': request.created_at.isoformat(),
                'completed_at': request.completed_at.isoformat() if request.completed_at else None,
                'tokens_used': request.tokens_used,
                'processing_time': request.processing_time,
                'has_content': bool(request.generated_content),
                'error_message': request.error_message
            })
        
        return history 