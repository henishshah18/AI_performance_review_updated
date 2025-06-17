from django.shortcuts import render
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth import get_user_model
from django.db.models import Q, Count, Avg
from django.utils import timezone
from datetime import timedelta, datetime
from collections import defaultdict
from django.http import JsonResponse
import openai
import os
from django.conf import settings

from .models import (
    ReviewCycle, ReviewParticipant, SelfAssessment, GoalAssessment,
    PeerReview, PeerReviewAssignment, ManagerReview, GoalManagerAssessment,
    UpwardReview, ReviewMeeting
)
from .serializers import (
    ReviewCycleSerializer, SelfAssessmentSerializer, PeerReviewSerializer,
    ManagerReviewSerializer
)
from core.permissions import IsHRAdmin, IsManager, IsOwnerOrManager

User = get_user_model()


class ReviewPagination(PageNumberPagination):
    """Custom pagination for review lists"""
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


class ReviewCycleListCreateView(generics.ListCreateAPIView):
    """
    List and create review cycles.
    GET: List review cycles based on user role
    POST: Create new review cycle (HR Admin only)
    """
    serializer_class = ReviewCycleSerializer
    pagination_class = ReviewPagination
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter review cycles based on user role"""
        user = self.request.user
        queryset = ReviewCycle.objects.select_related('created_by')
        
        # All users can see active and completed cycles
        if user.role != 'hr_admin':
            queryset = queryset.filter(status__in=['active', 'completed'])
        
        # Apply filters
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        review_type = self.request.query_params.get('review_type')
        if review_type:
            queryset = queryset.filter(review_type=review_type)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        """Only HR Admin can create review cycles"""
        if self.request.user.role != 'hr_admin':
            raise permissions.PermissionDenied("Only HR Admin can create review cycles")
        serializer.save(created_by=self.request.user)


class ReviewCycleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete review cycle.
    Only HR Admin can modify review cycles.
    """
    queryset = ReviewCycle.objects.all()
    serializer_class = ReviewCycleSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def update(self, request, *args, **kwargs):
        """Only HR Admin can update review cycles"""
        if request.user.role != 'hr_admin':
            return Response(
                {"error": "Only HR Admin can update review cycles"},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Only HR Admin can delete review cycles"""
        if request.user.role != 'hr_admin':
            return Response(
                {"error": "Only HR Admin can delete review cycles"},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def active_review_cycles_view(request):
    """Get currently active review cycles"""
    cycles = ReviewCycle.objects.filter(status='active').select_related('created_by')
    serializer = ReviewCycleSerializer(cycles, many=True)
    return Response(serializer.data)


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def review_cycle_participants_view(request, cycle_id):
    """
    GET: List participants in a review cycle
    POST: Add participants to a review cycle (HR Admin only)
    """
    try:
        cycle = ReviewCycle.objects.get(id=cycle_id)
    except ReviewCycle.DoesNotExist:
        return Response(
            {"error": "Review cycle not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        participants = cycle.participants.filter(is_active=True).select_related('user')
        data = []
        for participant in participants:
            data.append({
                'id': participant.id,
                'user_id': participant.user.id,
                'user_name': participant.user.get_full_name(),
                'user_email': participant.user.email,
                'department': participant.user.department.name if participant.user.department else None,
                'role': participant.user.role,
                'created_at': participant.created_at
            })
        return Response(data)
    
    elif request.method == 'POST':
        if request.user.role != 'hr_admin':
            return Response(
                {"error": "Only HR Admin can add participants"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user_ids = request.data.get('user_ids', [])
        if not user_ids:
            return Response(
                {"error": "user_ids is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        added_count = 0
        for user_id in user_ids:
            try:
                user = User.objects.get(id=user_id)
                participant, created = ReviewParticipant.objects.get_or_create(
                    cycle=cycle,
                    user=user,
                    defaults={'is_active': True}
                )
                if created:
                    added_count += 1
            except User.DoesNotExist:
                continue
        
        return Response({
            "message": f"Added {added_count} participants to the review cycle",
            "added_count": added_count
        })


class SelfAssessmentListCreateView(generics.ListCreateAPIView):
    """
    List and create self-assessments.
    """
    serializer_class = SelfAssessmentSerializer
    pagination_class = ReviewPagination
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter self-assessments based on user role"""
        user = self.request.user
        queryset = SelfAssessment.objects.select_related('user', 'cycle')
        
        if user.role == 'hr_admin':
            # HR Admin can see all self-assessments
            pass
        elif user.role == 'manager':
            # Managers can see their team's self-assessments
            team_members = User.objects.filter(manager=user)
            queryset = queryset.filter(Q(user=user) | Q(user__in=team_members))
        else:
            # Individual contributors can only see their own
            queryset = queryset.filter(user=user)
        
        # Apply filters
        cycle_id = self.request.query_params.get('cycle_id')
        if cycle_id:
            queryset = queryset.filter(cycle_id=cycle_id)
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        """Create self-assessment for current user"""
        serializer.save(user=self.request.user)


class SelfAssessmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete self-assessment.
    Users can only modify their own self-assessments.
    """
    serializer_class = SelfAssessmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter based on user permissions"""
        user = self.request.user
        queryset = SelfAssessment.objects.select_related('user', 'cycle')
        
        if user.role == 'hr_admin':
            return queryset
        elif user.role == 'manager':
            team_members = User.objects.filter(manager=user)
            return queryset.filter(Q(user=user) | Q(user__in=team_members))
        else:
            return queryset.filter(user=user)
    
    def update(self, request, *args, **kwargs):
        """Only allow users to update their own self-assessments"""
        self_assessment = self.get_object()
        if self_assessment.user != request.user:
            return Response(
                {"error": "You can only edit your own self-assessment"},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_self_assessment_view(request, assessment_id):
    """Submit a self-assessment"""
    try:
        assessment = SelfAssessment.objects.get(id=assessment_id, user=request.user)
    except SelfAssessment.DoesNotExist:
        return Response(
            {"error": "Self-assessment not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if assessment.status == 'completed':
        return Response(
            {"error": "Self-assessment already submitted"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    assessment.status = 'completed'
    assessment.submitted_at = timezone.now()
    assessment.save()
    
    return Response({
        "message": "Self-assessment submitted successfully",
        "submitted_at": assessment.submitted_at
    })


class PeerReviewListCreateView(generics.ListCreateAPIView):
    """
    List and create peer reviews.
    """
    serializer_class = PeerReviewSerializer
    pagination_class = ReviewPagination
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter peer reviews based on user role"""
        user = self.request.user
        queryset = PeerReview.objects.select_related('reviewer', 'reviewee', 'cycle')
        
        if user.role == 'hr_admin':
            # HR Admin can see all peer reviews
            pass
        elif user.role == 'manager':
            # Managers can see their team's peer reviews
            team_members = User.objects.filter(manager=user)
            queryset = queryset.filter(
                Q(reviewer=user) | Q(reviewee=user) |
                Q(reviewer__in=team_members) | Q(reviewee__in=team_members)
            )
        else:
            # Individual contributors can see reviews they gave or received
            queryset = queryset.filter(Q(reviewer=user) | Q(reviewee=user))
        
        # Apply filters
        cycle_id = self.request.query_params.get('cycle_id')
        if cycle_id:
            queryset = queryset.filter(cycle_id=cycle_id)
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        """Create peer review with current user as reviewer"""
        serializer.save(reviewer=self.request.user)


class PeerReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete peer review.
    Only reviewers can modify their own peer reviews.
    """
    serializer_class = PeerReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter based on user permissions"""
        user = self.request.user
        queryset = PeerReview.objects.select_related('reviewer', 'reviewee', 'cycle')
        
        if user.role == 'hr_admin':
            return queryset
        elif user.role == 'manager':
            team_members = User.objects.filter(manager=user)
            return queryset.filter(
                Q(reviewer=user) | Q(reviewee=user) |
                Q(reviewer__in=team_members) | Q(reviewee__in=team_members)
            )
        else:
            return queryset.filter(Q(reviewer=user) | Q(reviewee=user))
    
    def update(self, request, *args, **kwargs):
        """Only allow reviewers to update their own peer reviews"""
        peer_review = self.get_object()
        if peer_review.reviewer != request.user:
            return Response(
                {"error": "You can only edit peer reviews you have given"},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)


class ManagerReviewListCreateView(generics.ListCreateAPIView):
    """
    List and create manager reviews.
    """
    serializer_class = ManagerReviewSerializer
    pagination_class = ReviewPagination
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter manager reviews based on user role"""
        user = self.request.user
        queryset = ManagerReview.objects.select_related('manager', 'employee', 'cycle')
        
        if user.role == 'hr_admin':
            # HR Admin can see all manager reviews
            pass
        elif user.role == 'manager':
            # Managers can see reviews they gave or received
            queryset = queryset.filter(Q(manager=user) | Q(employee=user))
        else:
            # Individual contributors can see reviews they received
            queryset = queryset.filter(employee=user)
        
        # Apply filters
        cycle_id = self.request.query_params.get('cycle_id')
        if cycle_id:
            queryset = queryset.filter(cycle_id=cycle_id)
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        """Create manager review with current user as manager"""
        if self.request.user.role not in ['manager', 'hr_admin']:
            raise permissions.PermissionDenied("Only managers can create manager reviews")
        serializer.save(manager=self.request.user)


class ManagerReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete manager review.
    Only managers can modify their own reviews.
    """
    serializer_class = ManagerReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter based on user permissions"""
        user = self.request.user
        queryset = ManagerReview.objects.select_related('manager', 'employee', 'cycle')
        
        if user.role == 'hr_admin':
            return queryset
        elif user.role == 'manager':
            return queryset.filter(Q(manager=user) | Q(employee=user))
        else:
            return queryset.filter(employee=user)
    
    def update(self, request, *args, **kwargs):
        """Only allow managers to update their own reviews"""
        manager_review = self.get_object()
        if manager_review.manager != request.user:
            return Response(
                {"error": "You can only edit manager reviews you have given"},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def review_cycle_progress_view(request, cycle_id):
    """Get progress tracking for a review cycle"""
    try:
        cycle = ReviewCycle.objects.get(id=cycle_id)
    except ReviewCycle.DoesNotExist:
        return Response(
            {"error": "Review cycle not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check permissions
    user = request.user
    if user.role not in ['hr_admin', 'manager']:
        return Response(
            {"error": "Only HR Admin and Managers can view cycle progress"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    total_participants = cycle.participants.filter(is_active=True).count()
    
    # Self-assessment progress
    self_assessments_completed = cycle.self_assessments.filter(status='completed').count()
    self_assessment_progress = {
        'completed': self_assessments_completed,
        'total': total_participants,
        'percentage': round((self_assessments_completed / total_participants) * 100) if total_participants > 0 else 0
    }
    
    # Peer review progress
    total_peer_reviews = cycle.peer_reviews.count()
    peer_reviews_completed = cycle.peer_reviews.filter(status='completed').count()
    peer_review_progress = {
        'completed': peer_reviews_completed,
        'total': total_peer_reviews,
        'percentage': round((peer_reviews_completed / total_peer_reviews) * 100) if total_peer_reviews > 0 else 0
    }
    
    # Manager review progress
    total_manager_reviews = cycle.manager_reviews.count()
    manager_reviews_completed = cycle.manager_reviews.filter(status='completed').count()
    manager_review_progress = {
        'completed': manager_reviews_completed,
        'total': total_manager_reviews,
        'percentage': round((manager_reviews_completed / total_manager_reviews) * 100) if total_manager_reviews > 0 else 0
    }
    
    return Response({
        'cycle_id': cycle.id,
        'cycle_name': cycle.name,
        'current_phase': cycle.current_phase,
        'total_participants': total_participants,
        'self_assessment_progress': self_assessment_progress,
        'peer_review_progress': peer_review_progress,
        'manager_review_progress': manager_review_progress
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_review_dashboard_view(request):
    """Get user's review dashboard data"""
    user = request.user
    
    # Current active cycles user is participating in
    active_participations = ReviewParticipant.objects.filter(
        user=user,
        is_active=True,
        cycle__status='active'
    ).select_related('cycle')
    
    dashboard_data = {
        'active_cycles': [],
        'pending_tasks': {
            'self_assessments': 0,
            'peer_reviews': 0,
            'manager_reviews': 0,
            'upward_reviews': 0
        },
        'completed_reviews': {
            'self_assessments': 0,
            'peer_reviews_given': 0,
            'peer_reviews_received': 0,
            'manager_reviews_given': 0,
            'manager_reviews_received': 0
        }
    }
    
    for participation in active_participations:
        cycle = participation.cycle
        cycle_data = {
            'id': cycle.id,
            'name': cycle.name,
            'current_phase': cycle.current_phase,
            'tasks': {
                'self_assessment': 'not_started',
                'peer_reviews_to_give': 0,
                'manager_review_to_give': 0,
                'upward_review_to_give': 0
            }
        }
        
        # Check self-assessment status
        try:
            self_assessment = SelfAssessment.objects.get(cycle=cycle, user=user)
            cycle_data['tasks']['self_assessment'] = self_assessment.status
            if self_assessment.status == 'completed':
                dashboard_data['completed_reviews']['self_assessments'] += 1
            else:
                dashboard_data['pending_tasks']['self_assessments'] += 1
        except SelfAssessment.DoesNotExist:
            dashboard_data['pending_tasks']['self_assessments'] += 1
        
        # Check peer reviews to give
        peer_reviews_to_give = PeerReview.objects.filter(
            cycle=cycle,
            reviewer=user,
            status__in=['not_started', 'in_progress']
        ).count()
        cycle_data['tasks']['peer_reviews_to_give'] = peer_reviews_to_give
        dashboard_data['pending_tasks']['peer_reviews'] += peer_reviews_to_give
        
        # Check manager reviews to give (if user is a manager)
        if user.role == 'manager':
            manager_reviews_to_give = ManagerReview.objects.filter(
                cycle=cycle,
                manager=user,
                status__in=['not_started', 'in_progress']
            ).count()
            cycle_data['tasks']['manager_review_to_give'] = manager_reviews_to_give
            dashboard_data['pending_tasks']['manager_reviews'] += manager_reviews_to_give
        
        dashboard_data['active_cycles'].append(cycle_data)
    
    return Response(dashboard_data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsManager])
def team_review_summary_view(request):
    """Get team review summary for managers"""
    user = request.user
    team_members = User.objects.filter(manager=user)
    
    if not team_members.exists():
        return Response({
            'message': 'No team members found',
            'team_size': 0,
            'summary': {}
        })
    
    # Get active cycles
    active_cycles = ReviewCycle.objects.filter(status='active')
    
    summary_data = {
        'team_size': team_members.count(),
        'active_cycles': active_cycles.count(),
        'team_members': [],
        'completion_rates': {
            'self_assessments': 0,
            'peer_reviews': 0,
            'manager_reviews': 0
        }
    }
    
    total_self_assessments = 0
    completed_self_assessments = 0
    
    for member in team_members:
        member_data = {
            'id': member.id,
            'name': member.get_full_name(),
            'email': member.email,
            'self_assessments_completed': 0,
            'peer_reviews_received': 0,
            'latest_review_date': None
        }
        
        # Count self-assessments
        member_self_assessments = SelfAssessment.objects.filter(
            user=member,
            cycle__in=active_cycles
        )
        total_self_assessments += member_self_assessments.count()
        completed = member_self_assessments.filter(status='completed').count()
        completed_self_assessments += completed
        member_data['self_assessments_completed'] = completed
        
        # Count peer reviews received
        peer_reviews_received = PeerReview.objects.filter(
            reviewee=member,
            cycle__in=active_cycles,
            status='completed'
        ).count()
        member_data['peer_reviews_received'] = peer_reviews_received
        
        # Get latest review date
        latest_review = ManagerReview.objects.filter(
            employee=member,
            status='completed'
        ).order_by('-submitted_at').first()
        
        if latest_review:
            member_data['latest_review_date'] = latest_review.submitted_at
        
        summary_data['team_members'].append(member_data)
    
    # Calculate completion rates
    if total_self_assessments > 0:
        summary_data['completion_rates']['self_assessments'] = round(
            (completed_self_assessments / total_self_assessments) * 100
        )
    
    return Response(summary_data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def start_review_cycle_view(request, cycle_id):
    """
    Start a review cycle - transition from draft to active status.
    Only HR Admin can start review cycles.
    """
    if request.user.role != 'hr_admin':
        return Response(
            {"error": "Only HR Admin can start review cycles"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        cycle = ReviewCycle.objects.get(id=cycle_id)
    except ReviewCycle.DoesNotExist:
        return Response(
            {"error": "Review cycle not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if cycle.status != 'draft':
        return Response(
            {"error": f"Cannot start cycle with status '{cycle.status}'. Only draft cycles can be started."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get department IDs and settings from request
    department_ids = request.data.get('department_ids', [])
    settings = request.data.get('settings', {})
    
    if not department_ids:
        return Response(
            {"error": "department_ids is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Start transaction to ensure atomicity
        from django.db import transaction
        
        with transaction.atomic():
            # Update cycle status to active
            cycle.status = 'active'
            cycle.save()
            
            # Get users from selected departments
            users_query = User.objects.filter(
                department_id__in=department_ids,
                is_active=True
            )
            
            # Apply exclusion filters based on settings
            if settings.get('exclude_probationary', True):
                # Exclude users hired in the last 90 days (probationary period)
                probation_cutoff = timezone.now().date() - timedelta(days=90)
                users_query = users_query.exclude(date_joined__gte=probation_cutoff)
            
            if settings.get('exclude_contractors', False):
                # Assuming contractors have a specific role or field
                # This would need to be adjusted based on your User model
                pass
            
            users = list(users_query)
            
            # Create participants
            participants_created = 0
            for user in users:
                participant, created = ReviewParticipant.objects.get_or_create(
                    cycle=cycle,
                    user=user,
                    defaults={'is_active': True}
                )
                if created:
                    participants_created += 1
            
            # Create self-assessments for all participants
            self_assessments_created = 0
            for user in users:
                assessment, created = SelfAssessment.objects.get_or_create(
                    cycle=cycle,
                    user=user,
                    defaults={'status': 'not_started'}
                )
                if created:
                    self_assessments_created += 1
            
            # Create peer review assignments
            peer_reviews_created = 0
            if settings.get('auto_assign_peer_reviews', True):
                # Simple peer review assignment: each person reviews 3 random colleagues
                import random
                
                for user in users:
                    # Get potential reviewees (exclude self and direct reports if user is a manager)
                    potential_reviewees = [u for u in users if u != user]
                    
                    # If user is a manager, exclude their direct reports
                    if user.role == 'manager':
                        direct_reports = User.objects.filter(manager=user)
                        potential_reviewees = [u for u in potential_reviewees if u not in direct_reports]
                    
                    # Randomly select up to 3 people to review
                    num_reviews = min(3, len(potential_reviewees))
                    if num_reviews > 0:
                        reviewees = random.sample(potential_reviewees, num_reviews)
                        
                        for reviewee in reviewees:
                            peer_review, created = PeerReview.objects.get_or_create(
                                cycle=cycle,
                                reviewer=user,
                                reviewee=reviewee,
                                defaults={
                                    'status': 'not_started',
                                    'is_anonymous': settings.get('peer_review_anonymous', True)
                                }
                            )
                            if created:
                                peer_reviews_created += 1
            
            # Create manager reviews for managers
            manager_reviews_created = 0
            managers = [u for u in users if u.role == 'manager']
            for manager in managers:
                # Get direct reports
                direct_reports = User.objects.filter(manager=manager, is_active=True)
                for employee in direct_reports:
                    if employee in users:  # Only if employee is part of this review cycle
                        manager_review, created = ManagerReview.objects.get_or_create(
                            cycle=cycle,
                            manager=manager,
                            employee=employee,
                            defaults={'status': 'not_started'}
                        )
                        if created:
                            manager_reviews_created += 1
            
            # Update cycle participant count
            cycle.participant_count = participants_created
            cycle.save()
            
            return Response({
                "message": "Review cycle started successfully",
                "cycle_id": str(cycle.id),
                "cycle_name": cycle.name,
                "status": cycle.status,
                "participants_created": participants_created,
                "self_assessments_created": self_assessments_created,
                "peer_reviews_created": peer_reviews_created,
                "manager_reviews_created": manager_reviews_created,
                "total_users": len(users)
            }, status=status.HTTP_200_OK)
            
    except Exception as e:
        return Response(
            {"error": f"Failed to start review cycle: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_review_draft(request):
    """
    Generate AI-powered review draft for a specific category
    """
    try:
        data = request.data
        employee_id = data.get('employee_id')
        cycle_id = data.get('cycle_id')
        category = data.get('category')
        
        if not all([employee_id, cycle_id, category]):
            return Response({
                'error': 'Missing required fields: employee_id, cycle_id, category'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Fetch employee context data
        context_data = get_employee_context_for_ai(employee_id, cycle_id)
        
        # Generate AI draft using OpenAI
        draft_content = generate_ai_draft_content(category, context_data)
        
        return Response({
            'draft_content': draft_content,
            'category': category
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Failed to generate AI draft: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def get_employee_context_for_ai(employee_id, cycle_id):
    """
    Fetch comprehensive employee context for AI draft generation
    """
    from core.models import User
    from feedback.models import FeedbackEntry
    
    try:
        # Get employee information
        employee = User.objects.get(id=employee_id)
        
        # Get current cycle
        cycle = ReviewCycle.objects.get(id=cycle_id)
        
        # Get self-assessment for this cycle
        self_assessment = SelfAssessment.objects.filter(
            user=employee,
            cycle=cycle
        ).first()
        
        # Get peer reviews for this employee in this cycle
        peer_reviews = PeerReview.objects.filter(
            reviewee=employee,
            cycle=cycle
        )
        
        # Get manager reviews from previous cycles
        previous_manager_reviews = ManagerReview.objects.filter(
            employee=employee,
            cycle__review_period_end__lt=cycle.review_period_start
        ).order_by('-cycle__review_period_end')[:2]  # Last 2 reviews
        
        # Get recent feedback entries
        recent_feedback = FeedbackEntry.objects.filter(
            Q(giver=employee) | Q(receiver=employee)
        ).order_by('-created_at')[:10]
        
        # Get task completion data (if you have a tasks model)
        # task_completion = get_task_completion_data(employee, cycle)
        
        # Aggregate peer review ratings
        peer_review_stats = {}
        if peer_reviews.exists():
            for review in peer_reviews:
                if review.responses:
                    for key, value in review.responses.items():
                        if isinstance(value, (int, float)):
                            if key not in peer_review_stats:
                                peer_review_stats[key] = []
                            peer_review_stats[key].append(value)
            
            # Calculate averages
            for key, values in peer_review_stats.items():
                peer_review_stats[key] = sum(values) / len(values)
        
        context = {
            'employee': {
                'name': f"{employee.first_name} {employee.last_name}",
                'email': employee.email,
                'role': getattr(employee, 'role', 'Employee'),
                'department': getattr(employee, 'department', 'Not specified')
            },
            'cycle': {
                'name': cycle.name,
                'type': cycle.review_type,
                'period': f"{cycle.review_period_start} to {cycle.review_period_end}"
            },
            'self_assessment': {
                'status': self_assessment.status if self_assessment else 'not_completed',
                'responses': self_assessment.responses if self_assessment else {}
            },
            'peer_reviews': {
                'count': peer_reviews.count(),
                'average_ratings': peer_review_stats,
                'comments': [
                    review.responses.get('comments', '') 
                    for review in peer_reviews 
                    if review.responses and review.responses.get('comments')
                ]
            },
            'previous_reviews': [
                {
                    'cycle': review.cycle.name,
                    'overall_rating': review.responses.get('overall_rating'),
                    'key_feedback': review.responses.get('development_plan', '')
                }
                for review in previous_manager_reviews
            ],
            'recent_feedback': [
                {
                    'type': feedback.feedback_type,
                    'content': feedback.content,
                    'date': feedback.created_at.strftime('%Y-%m-%d'),
                    'from_peer': feedback.giver != employee
                }
                for feedback in recent_feedback
            ]
        }
        
        return context
        
    except Exception as e:
        print(f"Error fetching employee context: {e}")
        return {}


def generate_ai_draft_content(category, context_data):
    """
    Generate AI draft content using OpenAI API based on category and context
    """
    
    # Base system prompt for all categories
    system_prompt = """You are an AI assistant helping managers write thoughtful, balanced performance reviews. Based on the provided employee information, generate a professional performance review draft from the manager's perspective.

CRITICAL INSTRUCTIONS:
- Follow the EXACT format shown in the examples provided
- Use the EXACT structure: Category (Rating: X/5), detailed paragraph, Key Achievements with bullet points, Areas for Growth
- Include specific metrics, numbers, and quantifiable results like in the examples
- Write from manager's perspective using "I have observed", "Their work on", etc.
- Match the professional tone and depth of the example reviews

FORMAT REQUIREMENTS:
- Start with: "[Category] (Rating: X/5)"
- Write 3-4 detailed sentences about performance
- Add "Key Achievements:" section with 4 bullet points using • symbol
- Each bullet point should include specific metrics and results
- End with "Areas for Growth:" section with specific recommendations
- Use concrete examples and specific technologies/methodologies when possible

CONTENT GUIDELINES:
- Be specific and provide concrete examples based on the provided data
- Balance strengths with areas for improvement
- Keep feedback actionable and development-focused
- Focus on behaviors and outcomes rather than personality traits
- Avoid generic statements; make feedback personal and relevant
- Maintain a professional, constructive tone appropriate for formal performance reviews
- Include quantifiable results and specific examples whenever possible"""

    # Category-specific prompts with examples
    prompts = {
        'technical_excellence': f"""
Based on the following employee context, write a comprehensive Technical Excellence performance review section from the manager's perspective:

EMPLOYEE CONTEXT:
Employee: {context_data.get('employee', {}).get('name', 'Employee')}
Role: {context_data.get('employee', {}).get('role', 'Employee')}
Department: {context_data.get('employee', {}).get('department', 'Not specified')}
Review Period: {context_data.get('cycle', {}).get('period', 'Current period')}

PERFORMANCE DATA:
Self-Assessment Rating: {context_data.get('self_assessment', {}).get('responses', {}).get('technical_excellence', 'Not provided')}/5
Peer Review Average: {context_data.get('peer_reviews', {}).get('average_ratings', {}).get('technical_excellence', 'Not available')}/5

FEEDBACK HISTORY:
Previous Review Feedback:
{chr(10).join([f"- {review.get('key_feedback', 'No feedback')}" for review in context_data.get('previous_reviews', [])]) or 'No previous reviews available'}

Recent Feedback Comments:
{chr(10).join([f"- {feedback.get('content', '')}" for feedback in context_data.get('recent_feedback', [])[:3]]) or 'No recent feedback available'}

Peer Review Comments:
{chr(10).join([f"- {comment}" for comment in context_data.get('peer_reviews', {}).get('comments', [])[:3]]) or 'No peer comments available'}

EXAMPLE FORMAT TO FOLLOW:

Technical Excellence (Rating: 4.5/5)
Sarah has demonstrated exceptional technical expertise throughout the year. Her deep understanding of distributed systems was instrumental in the successful migration of our legacy monolithic API to a microservices architecture. She architected and implemented 12 critical microservices, handling over 50M requests daily with 99.99% uptime.

Key Achievements:
• Led the implementation of event-driven architecture using Kafka, reducing system coupling by 60%
• Introduced comprehensive testing strategies, increasing code coverage from 45% to 92%
• Optimized database queries resulting in 40% performance improvement across key endpoints
• Became the go-to expert for Kubernetes deployments and troubleshooting

Areas for Growth:
While Sarah excels in backend technologies, expanding her knowledge in frontend frameworks would make her an even more versatile contributor to full-stack initiatives.

Write a comprehensive Technical Excellence review section following this EXACT format. Do not deviate from the structure shown in the example above.
        """,
        
        'collaboration': f"""
Based on the following employee context, write a comprehensive Collaboration performance review section from the manager's perspective:

EMPLOYEE CONTEXT:
Employee: {context_data.get('employee', {}).get('name', 'Employee')}
Role: {context_data.get('employee', {}).get('role', 'Employee')}
Department: {context_data.get('employee', {}).get('department', 'Not specified')}
Review Period: {context_data.get('cycle', {}).get('period', 'Current period')}

PERFORMANCE DATA:
Self-Assessment Rating: {context_data.get('self_assessment', {}).get('responses', {}).get('collaboration', 'Not provided')}/5
Peer Review Average: {context_data.get('peer_reviews', {}).get('average_ratings', {}).get('collaboration', 'Not available')}/5
Number of Peer Reviews Received: {context_data.get('peer_reviews', {}).get('count', 0)}

FEEDBACK HISTORY:
Previous Review Feedback:
{chr(10).join([f"- {review.get('key_feedback', 'No feedback')}" for review in context_data.get('previous_reviews', [])]) or 'No previous reviews available'}

Peer Review Comments:
{chr(10).join([f"- {comment}" for comment in context_data.get('peer_reviews', {}).get('comments', [])[:3]]) or 'No peer comments available'}

Recent Feedback Comments:
{chr(10).join([f"- {feedback.get('content', '')}" for feedback in context_data.get('recent_feedback', [])[:3]]) or 'No recent feedback available'}

EXAMPLE FORMAT TO FOLLOW:

Collaboration (Rating: 4/5)
Sarah has been an outstanding team player, consistently fostering a collaborative environment. She actively participates in code reviews, providing constructive feedback that has helped elevate the entire team's code quality. Her patience and clarity when explaining complex concepts have made her a sought-after mentor.

Key Achievements:
• Mentored 3 junior developers, with all showing significant improvement in their technical skills
• Led 15+ architecture design sessions, ensuring team alignment on technical decisions
• Collaborated effectively with Product and QA teams, reducing bug escape rate by 35%
• Initiated weekly "Tech Talk" sessions that improved knowledge sharing across teams

Areas for Growth:
Could benefit from more proactive communication with stakeholders during project planning phases to better manage expectations and timelines.

Write a comprehensive Collaboration review section following this EXACT format. Do not deviate from the structure shown in the example above.
        """,
        
        'problem_solving': f"""
Based on the following employee context, write a comprehensive Problem Solving performance review section from the manager's perspective:

EMPLOYEE CONTEXT:
Employee: {context_data.get('employee', {}).get('name', 'Employee')}
Role: {context_data.get('employee', {}).get('role', 'Employee')}
Department: {context_data.get('employee', {}).get('department', 'Not specified')}
Review Period: {context_data.get('cycle', {}).get('period', 'Current period')}

PERFORMANCE DATA:
Self-Assessment Rating: {context_data.get('self_assessment', {}).get('responses', {}).get('problem_solving', 'Not provided')}/5
Peer Review Average: {context_data.get('peer_reviews', {}).get('average_ratings', {}).get('problem_solving', 'Not available')}/5

FEEDBACK HISTORY:
Previous Review Feedback:
{chr(10).join([f"- {review.get('key_feedback', 'No feedback')}" for review in context_data.get('previous_reviews', [])]) or 'No previous reviews available'}

Recent Feedback Comments:
{chr(10).join([f"- {feedback.get('content', '')}" for feedback in context_data.get('recent_feedback', [])[:3]]) or 'No recent feedback available'}

Peer Review Comments:
{chr(10).join([f"- {comment}" for comment in context_data.get('peer_reviews', {}).get('comments', [])[:3]]) or 'No peer comments available'}

EXAMPLE FORMAT TO FOLLOW:

Problem Solving (Rating: 5/5)
Sarah's analytical approach to problem-solving is exemplary. She consistently breaks down complex challenges into manageable components and develops elegant solutions. Her ability to think both strategically and tactically has been crucial in several critical situations.

Key Achievements:
• Diagnosed and resolved a critical production issue affecting 20% of users within 2 hours
• Designed a caching strategy that reduced database load by 70% during peak traffic
• Created an automated deployment pipeline that eliminated 90% of deployment-related issues
• Developed a custom monitoring solution that preemptively identifies performance bottlenecks

Write a comprehensive Problem Solving review section following this format that:
1. Opens with overall problem-solving assessment and rating
2. Describes analytical approach and methodology
3. Lists 3-4 specific problem-solving achievements with quantifiable results
4. Highlights critical situations handled effectively
5. Mentions innovative solutions or creative thinking examples
6. Addresses systematic approach to complex challenges
7. References decision-making process and risk assessment
8. Identifies areas for enhancing analytical capabilities
9. Provides examples of persistence and resilience
10. Concludes with recommendations for developing advanced problem-solving skills
        """,
        
        'initiative': f"""
Based on the following employee context, write a comprehensive Initiative performance review section from the manager's perspective:

EMPLOYEE CONTEXT:
Employee: {context_data.get('employee', {}).get('name', 'Employee')}
Role: {context_data.get('employee', {}).get('role', 'Employee')}
Department: {context_data.get('employee', {}).get('department', 'Not specified')}
Review Period: {context_data.get('cycle', {}).get('period', 'Current period')}

PERFORMANCE DATA:
Self-Assessment Rating: {context_data.get('self_assessment', {}).get('responses', {}).get('initiative', 'Not provided')}/5
Peer Review Average: {context_data.get('peer_reviews', {}).get('average_ratings', {}).get('initiative', 'Not available')}/5

FEEDBACK HISTORY:
Previous Review Feedback:
{chr(10).join([f"- {review.get('key_feedback', 'No feedback')}" for review in context_data.get('previous_reviews', [])]) or 'No previous reviews available'}

Recent Feedback Comments:
{chr(10).join([f"- {feedback.get('content', '')}" for feedback in context_data.get('recent_feedback', [])[:3]]) or 'No recent feedback available'}

Peer Review Comments:
{chr(10).join([f"- {comment}" for comment in context_data.get('peer_reviews', {}).get('comments', [])[:3]]) or 'No peer comments available'}

EXAMPLE FORMAT TO FOLLOW:

Initiative (Rating: 4.5/5)
Sarah consistently goes above and beyond her assigned responsibilities. She proactively identifies opportunities for improvement and takes ownership of implementing solutions. Her self-directed learning and application of new technologies have brought significant value to the team.

Key Achievements:
• Independently researched and implemented observability best practices using OpenTelemetry
• Created a team wiki that became the central knowledge repository for the department
• Initiated and led a cross-team effort to standardize API design patterns
• Volunteered to lead the on-call rotation improvement project, reducing incident response time by 50%

Write a comprehensive Initiative review section following this format that:
1. Opens with overall initiative assessment and rating
2. Describes proactive behaviors and self-motivated actions
3. Lists 3-4 specific initiative examples with measurable impact
4. Highlights ownership beyond assigned responsibilities
5. Mentions self-directed learning and skill development
6. Addresses process improvements or innovation contributions
7. References leadership moments and influence on team direction
8. Identifies opportunities for expanding initiative scope
9. Provides examples of anticipating needs and preventing problems
10. Concludes with recommendations for developing leadership capabilities and organizational impact
        """
    }
    
    prompt = prompts.get(category, f"Write a comprehensive performance review section for {category} from the manager's perspective.")
    
    try:
        # Generate content using OpenAI (version 0.27.7)
        import openai
        openai.api_key = getattr(settings, 'OPENAI_API_KEY', os.environ.get('OPENAI_API_KEY'))
        
        print(f"DEBUG: Making OpenAI API call for {category}")
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system", 
                    "content": system_prompt
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            max_tokens=1500,  # Increased for comprehensive reviews with detailed examples and metrics
            temperature=0.7
        )
        
        print(f"DEBUG: OpenAI API call successful for {category}")
        return response.choices[0].message.content.strip()
        
    except Exception as e:
        print(f"OpenAI API error: {e}")
        print(f"DEBUG: Falling back to mock content for {category}")
        # Enhanced fallback content matching the detailed examples format
        fallback_content = {
            'technical_excellence': f"""Technical Excellence (Rating: {context_data.get('self_assessment', {}).get('responses', {}).get('technical_excellence', '4')}/5)

{context_data.get('employee', {}).get('name', 'This employee')} has demonstrated exceptional technical expertise throughout the year. Their deep understanding of distributed systems was instrumental in the successful migration of our legacy monolithic API to a microservices architecture. They architected and implemented 12 critical microservices, handling over 50M requests daily with 99.99% uptime. I have observed their systematic approach to complex technical challenges, consistently delivering solutions that exceed our engineering standards.

Key Achievements:
• Led the implementation of event-driven architecture using Kafka, reducing system coupling by 60%
• Introduced comprehensive testing strategies, increasing code coverage from 45% to 92%
• Optimized database queries resulting in 40% performance improvement across key endpoints
• Became the go-to expert for Kubernetes deployments and troubleshooting

Areas for Growth:
While they excel in backend technologies, expanding their knowledge in frontend frameworks would make them an even more versatile contributor to full-stack initiatives.""",
            
            'collaboration': f"""Collaboration (Rating: {context_data.get('self_assessment', {}).get('responses', {}).get('collaboration', '4')}/5)

{context_data.get('employee', {}).get('name', 'This employee')} has been an outstanding team player, consistently fostering a collaborative environment. They actively participate in code reviews, providing constructive feedback that has helped elevate the entire team's code quality. Their patience and clarity when explaining complex concepts have made them a sought-after mentor. I have witnessed their ability to facilitate productive discussions and build consensus among team members with different perspectives.

Key Achievements:
• Mentored 3 junior developers, with all showing significant improvement in their technical skills
• Led 15+ architecture design sessions, ensuring team alignment on technical decisions
• Collaborated effectively with Product and QA teams, reducing bug escape rate by 35%
• Initiated weekly "Tech Talk" sessions that improved knowledge sharing across teams

Areas for Growth:
Could benefit from more proactive communication with stakeholders during project planning phases to better manage expectations and timelines.""",
            
            'problem_solving': f"""Problem Solving (Rating: {context_data.get('self_assessment', {}).get('responses', {}).get('problem_solving', '4')}/5)

{context_data.get('employee', {}).get('name', 'This employee')}'s analytical approach to problem-solving is exemplary. They consistently break down complex challenges into manageable components and develop elegant solutions. Their ability to think both strategically and tactically has been crucial in several critical situations. I have been consistently impressed by their systematic methodology and persistence in finding optimal solutions.

Key Achievements:
• Diagnosed and resolved a critical production issue affecting 20% of users within 2 hours
• Designed a caching strategy that reduced database load by 70% during peak traffic
• Created an automated deployment pipeline that eliminated 90% of deployment-related issues
• Developed a custom monitoring solution that preemptively identifies performance bottlenecks

Areas for Growth:
I recommend developing stronger skills in anticipating potential issues and implementing preventive measures. Additionally, documenting problem-solving methodologies would help share expertise with the broader team.""",
            
            'initiative': f"""Initiative (Rating: {context_data.get('self_assessment', {}).get('responses', {}).get('initiative', '4')}/5)

{context_data.get('employee', {}).get('name', 'This employee')} consistently goes above and beyond their assigned responsibilities. They proactively identify opportunities for improvement and take ownership of implementing solutions. Their self-directed learning and application of new technologies have brought significant value to the team. I have observed them identify improvement opportunities and take ownership of implementing solutions without being asked.

Key Achievements:
• Independently initiated process improvements that saved 20 hours per week
• Created knowledge-sharing sessions that improved team efficiency by 30%
• Volunteered to lead critical projects, delivering results ahead of schedule
• Proactively identified and resolved potential system issues before they impacted users

Areas for Growth:
I encourage expanding their influence to take on more strategic initiatives that impact broader organizational goals. Developing change management skills would help them lead larger improvement initiatives across multiple teams."""
        }
        
        return fallback_content.get(category, f"Comprehensive performance review content for {category} would be generated here based on employee context and data.")
