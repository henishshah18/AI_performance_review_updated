from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.models import User
from django.utils import timezone
from django.db.models import Q, Count, Avg
from datetime import timedelta, date

from .models import (
    CompanyMetrics, DepartmentStats, ActivityLog, 
    UserDashboardMetrics, TeamMetrics, Notification
)
from .serializers import (
    CompanyMetricsSerializer, DepartmentStatsSerializer, ActivityLogSerializer,
    UserDashboardMetricsSerializer, TeamMetricsSerializer, NotificationSerializer,
    DashboardSummarySerializer
)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def hr_admin_dashboard(request):
    """
    HR Admin Dashboard API - Company overview, department stats, recent activities
    """
    try:
        # Get or create company metrics for today
        today = date.today()
        company_metrics, created = CompanyMetrics.objects.get_or_create(
            date=today,
            defaults={
                'total_employees': User.objects.filter(is_active=True).count(),
                'active_objectives': 24,  # Mock data
                'completion_rate': 68.0,
                'pending_reviews': 2,
                'total_departments': 8,
            }
        )
        
        # Get department statistics
        department_stats = DepartmentStats.objects.filter(date=today)
        if not department_stats.exists():
            # Create mock department data
            departments_data = [
                {'department': 'engineering', 'employee_count': 45, 'completion_rate': 72.0, 'active_objectives': 8, 'completed_objectives': 6},
                {'department': 'product', 'employee_count': 12, 'completion_rate': 85.0, 'active_objectives': 4, 'completed_objectives': 3},
                {'department': 'design', 'employee_count': 8, 'completion_rate': 90.0, 'active_objectives': 3, 'completed_objectives': 3},
                {'department': 'marketing', 'employee_count': 15, 'completion_rate': 60.0, 'active_objectives': 5, 'completed_objectives': 2},
                {'department': 'sales', 'employee_count': 25, 'completion_rate': 55.0, 'active_objectives': 6, 'completed_objectives': 2},
                {'department': 'hr', 'employee_count': 6, 'completion_rate': 100.0, 'active_objectives': 2, 'completed_objectives': 2},
            ]
            
            for dept_data in departments_data:
                DepartmentStats.objects.create(date=today, **dept_data)
            
            department_stats = DepartmentStats.objects.filter(date=today)
        
        # Get recent activities (last 10)
        recent_activities = ActivityLog.objects.all()[:10]
        if not recent_activities.exists():
            # Create mock activities
            mock_activities = [
                {'user': request.user, 'activity_type': 'objective_created', 'description': 'Created Q4 Engineering Objectives'},
                {'user': request.user, 'activity_type': 'review_completed', 'description': 'Completed performance review for John Doe'},
                {'user': request.user, 'activity_type': 'team_updated', 'description': 'Updated Product team structure'},
            ]
            
            for activity_data in mock_activities:
                ActivityLog.objects.create(**activity_data)
            
            recent_activities = ActivityLog.objects.all()[:10]
        
        # Serialize data
        data = {
            'company_metrics': CompanyMetricsSerializer(company_metrics).data,
            'department_stats': DepartmentStatsSerializer(department_stats, many=True).data,
            'recent_activities': ActivityLogSerializer(recent_activities, many=True).data,
        }
        
        return Response(data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch HR admin dashboard data: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def manager_dashboard(request):
    """
    Manager Dashboard API - Team metrics, objectives, team member performance
    """
    try:
        # Get or create team metrics for the manager
        team_metrics, created = TeamMetrics.objects.get_or_create(
            manager=request.user,
            defaults={
                'team_size': 8,
                'active_goals': 24,
                'completed_goals': 18,
                'overdue_goals': 3,
                'team_performance_avg': 4.2,
            }
        )
        
        # Get team activities
        team_activities = ActivityLog.objects.filter(
            user__manager=request.user
        )[:10]
        
        # Mock team member data
        team_members_data = [
            {
                'id': 1,
                'name': 'Sarah Johnson',
                'role': 'Senior Developer',
                'goals_completed': 8,
                'goals_total': 10,
                'performance_score': 4.5,
                'last_activity': '2 hours ago'
            },
            {
                'id': 2,
                'name': 'Mike Chen',
                'role': 'Product Designer',
                'goals_completed': 6,
                'goals_total': 8,
                'performance_score': 4.2,
                'last_activity': '1 day ago'
            },
            {
                'id': 3,
                'name': 'Emily Davis',
                'role': 'Frontend Developer',
                'goals_completed': 5,
                'goals_total': 7,
                'performance_score': 4.0,
                'last_activity': '3 hours ago'
            },
        ]
        
        # Mock objectives data
        objectives_data = [
            {
                'id': 1,
                'title': 'Q4 Product Launch',
                'description': 'Launch new product features by end of Q4',
                'progress': 75,
                'status': 'in_progress',
                'due_date': '2024-12-31',
                'assigned_to': 'Product Team'
            },
            {
                'id': 2,
                'title': 'Team Performance Review',
                'description': 'Complete performance reviews for all team members',
                'progress': 60,
                'status': 'in_progress',
                'due_date': '2024-11-30',
                'assigned_to': 'All Team Members'
            },
        ]
        
        data = {
            'team_metrics': TeamMetricsSerializer(team_metrics).data,
            'team_activities': ActivityLogSerializer(team_activities, many=True).data,
            'team_members': team_members_data,
            'objectives': objectives_data,
        }
        
        return Response(data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch manager dashboard data: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def individual_dashboard(request):
    """
    Individual Dashboard API - Personal goals, tasks, feedback, manager info
    """
    try:
        # Get or create user dashboard metrics
        user_metrics, created = UserDashboardMetrics.objects.get_or_create(
            user=request.user,
            defaults={
                'total_goals': 23,
                'completed_goals': 13,
                'in_progress_goals': 7,
                'overdue_goals': 3,
                'goals_due_soon': 5,
                'performance_score': 4.1,
            }
        )
        
        # Get user's recent activities
        user_activities = ActivityLog.objects.filter(user=request.user)[:5]
        
        # Mock goals data
        goals_data = [
            {
                'id': 1,
                'title': 'Complete React Dashboard',
                'description': 'Finish the user dashboard component with all features',
                'priority': 'high',
                'status': 'in_progress',
                'progress': 80,
                'due_date': '2024-11-25',
                'category': 'Development'
            },
            {
                'id': 2,
                'title': 'API Integration',
                'description': 'Integrate backend APIs with frontend components',
                'priority': 'medium',
                'status': 'completed',
                'progress': 100,
                'due_date': '2024-11-20',
                'category': 'Development'
            },
            {
                'id': 3,
                'title': 'Code Review',
                'description': 'Review team members\' pull requests',
                'priority': 'low',
                'status': 'in_progress',
                'progress': 40,
                'due_date': '2024-11-30',
                'category': 'Collaboration'
            },
        ]
        
        # Mock manager info
        try:
            manager_info = {
                'name': request.user.manager.get_full_name() if request.user.manager else None,
                'email': request.user.manager.email if request.user.manager else None,
                'role': 'Engineering Manager',
                'last_meeting': '2024-11-15',
            } if request.user.manager else None
        except:
            manager_info = {
                'name': 'John Smith',
                'email': 'john.smith@company.com',
                'role': 'Engineering Manager',
                'last_meeting': '2024-11-15',
            }
        
        # Mock feedback data
        feedback_data = [
            {
                'id': 1,
                'from': 'John Smith',
                'type': 'positive',
                'message': 'Great work on the dashboard implementation. Very clean code!',
                'date': '2024-11-18',
                'category': 'Technical Skills'
            },
            {
                'id': 2,
                'from': 'Sarah Johnson',
                'type': 'constructive',
                'message': 'Consider adding more unit tests for better code coverage.',
                'date': '2024-11-16',
                'category': 'Code Quality'
            },
        ]
        
        data = {
            'user_metrics': UserDashboardMetricsSerializer(user_metrics).data,
            'recent_activities': ActivityLogSerializer(user_activities, many=True).data,
            'goals': goals_data,
            'manager_info': manager_info,
            'recent_feedback': feedback_data,
        }
        
        return Response(data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch individual dashboard data: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notifications_list(request):
    """
    Get user notifications with pagination
    """
    try:
        notifications = Notification.objects.filter(user=request.user)
        
        # If no notifications exist, create some mock ones
        if not notifications.exists():
            mock_notifications = [
                {
                    'user': request.user,
                    'title': 'Goal Deadline Approaching',
                    'message': 'Your goal "Complete React Dashboard" is due in 3 days.',
                    'notification_type': 'goal_deadline',
                    'priority': 'high'
                },
                {
                    'user': request.user,
                    'title': 'New Feedback Received',
                    'message': 'You received positive feedback from John Smith.',
                    'notification_type': 'feedback_received',
                    'priority': 'medium'
                },
                {
                    'user': request.user,
                    'title': 'Review Reminder',
                    'message': 'Don\'t forget to complete your quarterly review.',
                    'notification_type': 'review_reminder',
                    'priority': 'medium'
                },
            ]
            
            for notif_data in mock_notifications:
                Notification.objects.create(**notif_data)
            
            notifications = Notification.objects.filter(user=request.user)
        
        # Get unread count
        unread_count = notifications.filter(is_read=False).count()
        
        # Limit to recent 10 notifications
        recent_notifications = notifications[:10]
        
        data = {
            'notifications': NotificationSerializer(recent_notifications, many=True).data,
            'unread_count': unread_count,
            'total_count': notifications.count(),
        }
        
        return Response(data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch notifications: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    """
    Mark a specific notification as read
    """
    try:
        notification = Notification.objects.get(
            id=notification_id, 
            user=request.user
        )
        notification.mark_as_read()
        
        return Response(
            {'message': 'Notification marked as read'}, 
            status=status.HTTP_200_OK
        )
        
    except Notification.DoesNotExist:
        return Response(
            {'error': 'Notification not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to mark notification as read: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    """
    Mark all user notifications as read
    """
    try:
        notifications = Notification.objects.filter(
            user=request.user, 
            is_read=False
        )
        
        count = notifications.count()
        notifications.update(
            is_read=True, 
            read_at=timezone.now()
        )
        
        return Response(
            {'message': f'{count} notifications marked as read'}, 
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        return Response(
            {'error': f'Failed to mark notifications as read: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    """
    Get dashboard summary based on user role
    """
    try:
        role = request.user.role
        
        if role == 'hr_admin':
            return hr_admin_dashboard(request)
        elif role == 'manager':
            return manager_dashboard(request)
        elif role == 'individual_contributor':
            return individual_dashboard(request)
        else:
            return Response(
                {'error': 'Invalid user role'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch dashboard summary: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
