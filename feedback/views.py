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
import calendar

from .models import Feedback, FeedbackTag, FeedbackTagTemplate, FeedbackComment
from .serializers import (
    FeedbackSerializer, FeedbackCreateSerializer, FeedbackListSerializer,
    FeedbackTagSerializer, FeedbackTagTemplateSerializer,
    FeedbackCommentSerializer, FeedbackCommentCreateSerializer,
    FeedbackAnalyticsSerializer, TeamFeedbackSummarySerializer
)
from core.permissions import IsHRAdmin, IsManager, IsOwnerOrManager

User = get_user_model()


class FeedbackPagination(PageNumberPagination):
    """Custom pagination for feedback lists"""
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


class FeedbackListCreateView(generics.ListCreateAPIView):
    """
    List and create feedback.
    GET: List feedback based on user role and filters
    POST: Create new feedback
    """
    pagination_class = FeedbackPagination
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return FeedbackCreateSerializer
        return FeedbackListSerializer
    
    def get_queryset(self):
        """Filter feedback based on user role and query parameters"""
        user = self.request.user
        queryset = Feedback.objects.select_related(
            'from_user', 'to_user', 'related_objective', 
            'related_goal', 'related_task'
        ).prefetch_related('tags', 'comments')
        
        # Role-based filtering
        if user.role == 'hr_admin':
            # HR Admin can see all feedback
            pass
        elif user.role == 'manager':
            # Managers can see their team's feedback and their own
            team_members = User.objects.filter(manager=user)
            queryset = queryset.filter(
                Q(from_user=user) | Q(to_user=user) |
                Q(from_user__in=team_members) | Q(to_user__in=team_members)
            )
        else:
            # Individual contributors can only see their own feedback
            queryset = queryset.filter(Q(from_user=user) | Q(to_user=user))
        
        # Apply filters
        feedback_type = self.request.query_params.get('feedback_type')
        if feedback_type:
            queryset = queryset.filter(feedback_type=feedback_type)
        
        visibility = self.request.query_params.get('visibility')
        if visibility:
            queryset = queryset.filter(visibility=visibility)
        
        # Date range filtering
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        
        # Team member filtering (for managers)
        team_member = self.request.query_params.get('team_member')
        if team_member and user.role == 'manager':
            queryset = queryset.filter(
                Q(from_user_id=team_member) | Q(to_user_id=team_member)
            )
        
        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(content__icontains=search) |
                Q(tags__tag_name__icontains=search) |
                Q(from_user__first_name__icontains=search) |
                Q(from_user__last_name__icontains=search) |
                Q(to_user__first_name__icontains=search) |
                Q(to_user__last_name__icontains=search)
            ).distinct()
        
        return queryset.order_by('-created_at')


class FeedbackDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete feedback.
    Only feedback participants and managers can access.
    """
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter feedback based on user permissions"""
        user = self.request.user
        queryset = Feedback.objects.select_related(
            'from_user', 'to_user', 'related_objective',
            'related_goal', 'related_task'
        ).prefetch_related('tags', 'comments__comment_by')
        
        if user.role == 'hr_admin':
            return queryset
        elif user.role == 'manager':
            team_members = User.objects.filter(manager=user)
            return queryset.filter(
                Q(from_user=user) | Q(to_user=user) |
                Q(from_user__in=team_members) | Q(to_user__in=team_members)
            )
        else:
            return queryset.filter(Q(from_user=user) | Q(to_user=user))
    
    def update(self, request, *args, **kwargs):
        """Only allow feedback giver to update their own feedback"""
        feedback = self.get_object()
        if feedback.from_user != request.user:
            return Response(
                {"error": "You can only edit feedback you have given"},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Only allow feedback giver or HR Admin to delete feedback"""
        feedback = self.get_object()
        if feedback.from_user != request.user and request.user.role != 'hr_admin':
            return Response(
                {"error": "You can only delete feedback you have given"},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def feedback_given_view(request):
    """Get feedback given by the current user"""
    user = request.user
    feedback = Feedback.objects.filter(from_user=user).select_related(
        'to_user', 'related_objective', 'related_goal', 'related_task'
    ).prefetch_related('tags', 'comments')
    
    # Apply filters
    feedback_type = request.query_params.get('feedback_type')
    if feedback_type:
        feedback = feedback.filter(feedback_type=feedback_type)
    
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')
    if date_from:
        feedback = feedback.filter(created_at__gte=date_from)
    if date_to:
        feedback = feedback.filter(created_at__lte=date_to)
    
    paginator = FeedbackPagination()
    page = paginator.paginate_queryset(feedback.order_by('-created_at'), request)
    serializer = FeedbackListSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def feedback_received_view(request):
    """Get feedback received by the current user"""
    user = request.user
    feedback = Feedback.objects.filter(to_user=user).select_related(
        'from_user', 'related_objective', 'related_goal', 'related_task'
    ).prefetch_related('tags', 'comments')
    
    # Apply filters
    feedback_type = request.query_params.get('feedback_type')
    if feedback_type:
        feedback = feedback.filter(feedback_type=feedback_type)
    
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')
    if date_from:
        feedback = feedback.filter(created_at__gte=date_from)
    if date_to:
        feedback = feedback.filter(created_at__lte=date_to)
    
    paginator = FeedbackPagination()
    page = paginator.paginate_queryset(feedback.order_by('-created_at'), request)
    serializer = FeedbackListSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsManager])
def team_feedback_summary_view(request):
    """Get feedback summary for manager's team"""
    manager = request.user
    team_members = User.objects.filter(manager=manager)
    
    team_summaries = []
    for member in team_members:
        # Get feedback counts
        received_count = Feedback.objects.filter(to_user=member).count()
        given_count = Feedback.objects.filter(from_user=member).count()
        
        # Get feedback by type
        feedback_by_type = Feedback.objects.filter(to_user=member).values(
            'feedback_type'
        ).annotate(count=Count('id'))
        
        feedback_type_dict = {item['feedback_type']: item['count'] for item in feedback_by_type}
        
        # Get recent feedback
        recent_feedback = Feedback.objects.filter(to_user=member).select_related(
            'from_user', 'related_objective', 'related_goal', 'related_task'
        ).prefetch_related('tags')[:5]
        
        # Get top tags
        top_tags = FeedbackTag.objects.filter(
            feedback__to_user=member
        ).values('tag_name').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        team_summaries.append({
            'team_member': member,
            'feedback_received_count': received_count,
            'feedback_given_count': given_count,
            'feedback_by_type': feedback_type_dict,
            'recent_feedback': recent_feedback,
            'top_received_tags': list(top_tags)
        })
    
    serializer = TeamFeedbackSummarySerializer(team_summaries, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def feedback_analytics_view(request):
    """Get feedback analytics for the current user"""
    user = request.user
    
    # Date range (default to last 30 days)
    end_date = timezone.now()
    start_date = end_date - timedelta(days=30)
    
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')
    
    if date_from:
        start_date = datetime.strptime(date_from, '%Y-%m-%d').replace(tzinfo=timezone.utc)
    if date_to:
        end_date = datetime.strptime(date_to, '%Y-%m-%d').replace(tzinfo=timezone.utc)
    
    # Basic counts
    total_given = Feedback.objects.filter(
        from_user=user, 
        created_at__range=[start_date, end_date]
    ).count()
    
    total_received = Feedback.objects.filter(
        to_user=user,
        created_at__range=[start_date, end_date]
    ).count()
    
    # Feedback by type
    feedback_by_type = Feedback.objects.filter(
        to_user=user,
        created_at__range=[start_date, end_date]
    ).values('feedback_type').annotate(count=Count('id'))
    
    feedback_type_dict = {item['feedback_type']: item['count'] for item in feedback_by_type}
    
    # Recent feedback
    recent_feedback = Feedback.objects.filter(
        Q(from_user=user) | Q(to_user=user),
        created_at__range=[start_date, end_date]
    ).select_related(
        'from_user', 'to_user', 'related_objective', 'related_goal', 'related_task'
    ).prefetch_related('tags')[:10]
    
    # Top tags
    top_tags = FeedbackTag.objects.filter(
        feedback__to_user=user,
        feedback__created_at__range=[start_date, end_date]
    ).values('tag_name').annotate(count=Count('id')).order_by('-count')[:10]
    
    # Team participation (for managers)
    team_participation = {}
    if user.role == 'manager':
        team_members = User.objects.filter(manager=user)
        total_team = team_members.count()
        active_team = team_members.filter(
            Q(feedback_given__created_at__range=[start_date, end_date]) |
            Q(feedback_received__created_at__range=[start_date, end_date])
        ).distinct().count()
        
        team_participation = {
            'total_team_members': total_team,
            'active_members': active_team,
            'participation_rate': (active_team / total_team * 100) if total_team > 0 else 0
        }
    
    # Monthly trends (last 6 months)
    monthly_trends = []
    for i in range(6):
        month_start = (end_date.replace(day=1) - timedelta(days=i*30)).replace(day=1)
        month_end = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
        
        month_given = Feedback.objects.filter(
            from_user=user,
            created_at__range=[month_start, month_end]
        ).count()
        
        month_received = Feedback.objects.filter(
            to_user=user,
            created_at__range=[month_start, month_end]
        ).count()
        
        monthly_trends.append({
            'month': calendar.month_name[month_start.month],
            'year': month_start.year,
            'given': month_given,
            'received': month_received
        })
    
    analytics_data = {
        'total_given': total_given,
        'total_received': total_received,
        'feedback_by_type': feedback_type_dict,
        'recent_feedback': recent_feedback,
        'top_tags': list(top_tags),
        'team_participation': team_participation,
        'monthly_trends': monthly_trends[::-1]  # Reverse to show oldest first
    }
    
    serializer = FeedbackAnalyticsSerializer(analytics_data)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def trending_tags_view(request):
    """Get trending feedback tags"""
    # Get tags from last 30 days
    end_date = timezone.now()
    start_date = end_date - timedelta(days=30)
    
    trending_tags = FeedbackTag.objects.filter(
        created_at__range=[start_date, end_date]
    ).values('tag_name').annotate(
        count=Count('id')
    ).order_by('-count')[:20]
    
    return Response(list(trending_tags))


# Feedback Tag Management Views
class FeedbackTagTemplateListCreateView(generics.ListCreateAPIView):
    """
    List and create feedback tag templates.
    Only HR Admin can create templates.
    """
    serializer_class = FeedbackTagTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return active tag templates"""
        queryset = FeedbackTagTemplate.objects.select_related('created_by')
        
        # Filter by category if specified
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset.order_by('category', 'name')
    
    def perform_create(self, serializer):
        """Only HR Admin can create tag templates"""
        if self.request.user.role != 'hr_admin':
            raise permissions.PermissionDenied("Only HR Admin can create tag templates")
        serializer.save(created_by=self.request.user)


class FeedbackTagTemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete feedback tag templates.
    Only HR Admin can modify templates.
    """
    queryset = FeedbackTagTemplate.objects.all()
    serializer_class = FeedbackTagTemplateSerializer
    permission_classes = [permissions.IsAuthenticated, IsHRAdmin]


# Feedback Tag Views
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_feedback_tag_view(request, feedback_id):
    """Add tag to feedback"""
    try:
        feedback = Feedback.objects.get(id=feedback_id)
    except Feedback.DoesNotExist:
        return Response(
            {"error": "Feedback not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check permissions
    user = request.user
    if (feedback.from_user != user and feedback.to_user != user and 
        user.role not in ['hr_admin', 'manager']):
        return Response(
            {"error": "You don't have permission to tag this feedback"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    tag_name = request.data.get('tag_name', '').strip().lower()
    if not tag_name:
        return Response(
            {"error": "Tag name is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create or get existing tag
    tag, created = FeedbackTag.objects.get_or_create(
        feedback=feedback,
        tag_name=tag_name
    )
    
    if not created:
        return Response(
            {"error": "Tag already exists on this feedback"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    serializer = FeedbackTagSerializer(tag)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def remove_feedback_tag_view(request, feedback_id, tag_name):
    """Remove tag from feedback"""
    try:
        feedback = Feedback.objects.get(id=feedback_id)
        tag = FeedbackTag.objects.get(feedback=feedback, tag_name=tag_name.lower())
    except (Feedback.DoesNotExist, FeedbackTag.DoesNotExist):
        return Response(
            {"error": "Feedback or tag not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check permissions
    user = request.user
    if (feedback.from_user != user and feedback.to_user != user and 
        user.role not in ['hr_admin', 'manager']):
        return Response(
            {"error": "You don't have permission to remove tags from this feedback"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    tag.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# Feedback Comment Views
class FeedbackCommentListCreateView(generics.ListCreateAPIView):
    """
    List and create comments for feedback.
    """
    serializer_class = FeedbackCommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get comments for specific feedback"""
        feedback_id = self.kwargs['feedback_id']
        return FeedbackComment.objects.filter(
            feedback_id=feedback_id
        ).select_related('comment_by').order_by('created_at')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return FeedbackCommentCreateSerializer
        return FeedbackCommentSerializer
    
    def get_serializer_context(self):
        """Add feedback to serializer context"""
        context = super().get_serializer_context()
        feedback_id = self.kwargs['feedback_id']
        try:
            feedback = Feedback.objects.get(id=feedback_id)
            context['feedback'] = feedback
        except Feedback.DoesNotExist:
            pass
        return context
    
    def create(self, request, *args, **kwargs):
        """Create comment with permission check"""
        feedback_id = self.kwargs['feedback_id']
        try:
            feedback = Feedback.objects.get(id=feedback_id)
        except Feedback.DoesNotExist:
            return Response(
                {"error": "Feedback not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user can comment
        user = request.user
        if (user not in [feedback.from_user, feedback.to_user] and
            user.role not in ['hr_admin', 'manager']):
            return Response(
                {"error": "You don't have permission to comment on this feedback"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().create(request, *args, **kwargs)


class FeedbackCommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete feedback comments.
    Only comment author can modify.
    """
    queryset = FeedbackComment.objects.all()
    serializer_class = FeedbackCommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def update(self, request, *args, **kwargs):
        """Only allow comment author to update"""
        comment = self.get_object()
        if comment.comment_by != request.user:
            return Response(
                {"error": "You can only edit your own comments"},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Only allow comment author or HR Admin to delete"""
        comment = self.get_object()
        if (comment.comment_by != request.user and 
            request.user.role != 'hr_admin'):
            return Response(
                {"error": "You can only delete your own comments"},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)
