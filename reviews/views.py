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
