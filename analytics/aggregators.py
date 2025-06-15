"""
Analytics data aggregation services for Phase 7
Provides functions to calculate various metrics and insights
"""

from django.db.models import Count, Avg, Sum, Q, F
from django.utils import timezone
from datetime import datetime, timedelta, date
from typing import Dict, List, Any, Optional
from collections import defaultdict

from core.models import User
from .models import PerformanceMetrics, UserActivityLog

# Try to import OKR models, but handle gracefully if they don't exist
try:
    from okr.models import Objective, Goal, IndividualTask
    OKR_MODELS_AVAILABLE = True
except ImportError:
    OKR_MODELS_AVAILABLE = False

# Try to import feedback models, but handle gracefully if they don't exist
try:
    from feedback.models import Feedback, FeedbackTag
    FEEDBACK_MODELS_AVAILABLE = True
except ImportError:
    FEEDBACK_MODELS_AVAILABLE = False

# Try to import review models, but handle gracefully if they don't exist
try:
    from reviews.models import ReviewCycle, SelfAssessment, PeerReview, ManagerReview
    REVIEW_MODELS_AVAILABLE = True
except ImportError:
    REVIEW_MODELS_AVAILABLE = False


def calculate_okr_completion_rates(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    department: Optional[str] = None,
    user_id: Optional[int] = None
) -> Dict[str, Any]:
    """Calculate OKR completion rates with various filters"""
    
    # Default to last 30 days if no dates provided
    if not end_date:
        end_date = timezone.now().date()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    if not OKR_MODELS_AVAILABLE:
        # Return mock data if OKR models are not available
        return {
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
            },
            'objectives': {
                'total': 10,
                'completed': 7,
                'completion_rate': 70.0,
            },
            'goals': {
                'total': 25,
                'completed': 18,
                'completion_rate': 72.0,
            },
            'tasks': {
                'total': 50,
                'completed': 38,
                'completion_rate': 76.0,
            },
            'overall': {
                'total_items': 85,
                'completed_items': 63,
                'completion_rate': 74.1,
            }
        }
    
    # Base querysets
    objectives_qs = Objective.objects.filter(
        created_at__date__range=[start_date, end_date]
    )
    goals_qs = Goal.objects.filter(
        created_at__date__range=[start_date, end_date]
    )
    tasks_qs = IndividualTask.objects.filter(
        created_at__date__range=[start_date, end_date]
    )
    
    # Apply filters
    if department:
        objectives_qs = objectives_qs.filter(owner__department__name=department)
        goals_qs = goals_qs.filter(assigned_to__department__name=department)
        tasks_qs = tasks_qs.filter(assigned_to__department__name=department)
    
    if user_id:
        objectives_qs = objectives_qs.filter(owner_id=user_id)
        goals_qs = goals_qs.filter(assigned_to_id=user_id)
        tasks_qs = tasks_qs.filter(assigned_to_id=user_id)
    
    # Calculate metrics
    total_objectives = objectives_qs.count()
    completed_objectives = objectives_qs.filter(status='completed').count()
    
    total_goals = goals_qs.count()
    completed_goals = goals_qs.filter(status='completed').count()
    
    total_tasks = tasks_qs.count()
    completed_tasks = tasks_qs.filter(status='completed').count()
    
    # Calculate completion rates
    objective_completion_rate = (completed_objectives / total_objectives * 100) if total_objectives > 0 else 0
    goal_completion_rate = (completed_goals / total_goals * 100) if total_goals > 0 else 0
    task_completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    
    # Overall completion rate (weighted average)
    total_items = total_objectives + total_goals + total_tasks
    completed_items = completed_objectives + completed_goals + completed_tasks
    overall_completion_rate = (completed_items / total_items * 100) if total_items > 0 else 0
    
    return {
        'period': {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
        },
        'objectives': {
            'total': total_objectives,
            'completed': completed_objectives,
            'completion_rate': round(objective_completion_rate, 2),
        },
        'goals': {
            'total': total_goals,
            'completed': completed_goals,
            'completion_rate': round(goal_completion_rate, 2),
        },
        'tasks': {
            'total': total_tasks,
            'completed': completed_tasks,
            'completion_rate': round(task_completion_rate, 2),
        },
        'overall': {
            'total_items': total_items,
            'completed_items': completed_items,
            'completion_rate': round(overall_completion_rate, 2),
        }
    }


def calculate_feedback_metrics(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    department: Optional[str] = None,
    user_id: Optional[int] = None
) -> Dict[str, Any]:
    """Calculate feedback metrics and insights"""
    
    # Default to last 30 days if no dates provided
    if not end_date:
        end_date = timezone.now().date()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    if not FEEDBACK_MODELS_AVAILABLE:
        # Return mock data if feedback models are not available
        return {
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
            },
            'total_feedback': 45,
            'type_distribution': {
                'commendation': 20,
                'guidance': 15,
                'constructive': 10,
            },
            'visibility_distribution': {
                'public': 30,
                'private': 15,
            },
            'anonymous_percentage': 22.2,
            'top_tags': [
                {'tag_name': 'Communication', 'count': 12},
                {'tag_name': 'Leadership', 'count': 8},
                {'tag_name': 'Technical Skills', 'count': 6},
            ],
            'participation': {
                'unique_givers': 15,
                'unique_receivers': 18,
                'participation_rate': 75.0,
            }
        }
    
    # Base queryset
    feedback_qs = Feedback.objects.filter(
        created_at__date__range=[start_date, end_date]
    )
    
    # Apply filters
    if department:
        feedback_qs = feedback_qs.filter(
            Q(from_user__department__name=department) | Q(to_user__department__name=department)
        )
    
    if user_id:
        feedback_qs = feedback_qs.filter(
            Q(from_user_id=user_id) | Q(to_user_id=user_id)
        )
    
    # Calculate basic metrics
    total_feedback = feedback_qs.count()
    
    # Feedback by type
    feedback_by_type = feedback_qs.values('feedback_type').annotate(
        count=Count('id')
    ).order_by('feedback_type')
    
    type_distribution = {item['feedback_type']: item['count'] for item in feedback_by_type}
    
    # Feedback by visibility
    feedback_by_visibility = feedback_qs.values('visibility').annotate(
        count=Count('id')
    ).order_by('visibility')
    
    visibility_distribution = {item['visibility']: item['count'] for item in feedback_by_visibility}
    
    # Anonymous feedback percentage
    anonymous_count = feedback_qs.filter(is_anonymous=True).count()
    anonymous_percentage = (anonymous_count / total_feedback * 100) if total_feedback > 0 else 0
    
    # Top feedback tags
    top_tags = FeedbackTag.objects.filter(
        feedback__in=feedback_qs
    ).values('tag_name').annotate(
        count=Count('id')
    ).order_by('-count')[:10]
    
    # Participation metrics
    unique_givers = feedback_qs.values('from_user').distinct().count()
    unique_receivers = feedback_qs.values('to_user').distinct().count()
    
    # Calculate participation rate (if department filter is applied)
    participation_rate = 0
    if department:
        total_users_in_dept = User.objects.filter(department__name=department, is_active=True).count()
        participating_users = feedback_qs.values('from_user', 'to_user').distinct().count()
        participation_rate = (participating_users / total_users_in_dept * 100) if total_users_in_dept > 0 else 0
    
    return {
        'period': {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
        },
        'total_feedback': total_feedback,
        'type_distribution': type_distribution,
        'visibility_distribution': visibility_distribution,
        'anonymous_percentage': round(anonymous_percentage, 2),
        'top_tags': list(top_tags),
        'participation': {
            'unique_givers': unique_givers,
            'unique_receivers': unique_receivers,
            'participation_rate': round(participation_rate, 2),
        }
    }


def calculate_review_cycle_metrics(
    cycle_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    department: Optional[str] = None
) -> Dict[str, Any]:
    """Calculate review cycle completion and quality metrics"""
    
    if not REVIEW_MODELS_AVAILABLE:
        # Return mock data if review models are not available
        return {
            'cycles': [
                {
                    'cycle_id': 1,
                    'cycle_name': 'Q4 2024 Review',
                    'cycle_period': {
                        'start_date': '2024-10-01',
                        'end_date': '2024-12-31',
                    },
                    'participants': 50,
                    'completion_rates': {
                        'self_assessment': 85.0,
                        'peer_review': 78.0,
                        'manager_review': 92.0,
                        'overall': 85.0,
                    },
                    'review_counts': {
                        'self_assessments': {'completed': 42, 'total': 50},
                        'peer_reviews': {'completed': 78, 'total': 100},
                        'manager_reviews': {'completed': 46, 'total': 50},
                    },
                    'average_ratings': {
                        'technical_excellence': 4.2,
                        'collaboration': 4.1,
                        'problem_solving': 4.0,
                        'initiative': 3.9,
                        'development_goals': 4.3,
                    },
                }
            ],
            'summary': {
                'total_cycles': 1,
                'avg_completion_rate': 85.0,
            }
        }
    
    # Base queryset
    if cycle_id:
        cycles_qs = ReviewCycle.objects.filter(id=cycle_id)
    else:
        cycles_qs = ReviewCycle.objects.all()
        if start_date and end_date:
            cycles_qs = cycles_qs.filter(
                start_date__gte=start_date,
                end_date__lte=end_date
            )
    
    metrics = []
    
    for cycle in cycles_qs:
        # Get all participants
        participants_qs = User.objects.filter(is_active=True)
        if department:
            participants_qs = participants_qs.filter(department__name=department)
        
        total_participants = participants_qs.count()
        
        # Self-assessment metrics
        self_assessments = SelfAssessment.objects.filter(review_cycle=cycle)
        if department:
            self_assessments = self_assessments.filter(reviewee__department__name=department)
        
        completed_self_assessments = self_assessments.filter(status='completed').count()
        self_assessment_completion_rate = (completed_self_assessments / total_participants * 100) if total_participants > 0 else 0
        
        # Peer review metrics
        peer_reviews = PeerReview.objects.filter(review_cycle=cycle)
        if department:
            peer_reviews = peer_reviews.filter(reviewee__department__name=department)
        
        completed_peer_reviews = peer_reviews.filter(status='completed').count()
        total_peer_reviews_expected = peer_reviews.count()
        peer_review_completion_rate = (completed_peer_reviews / total_peer_reviews_expected * 100) if total_peer_reviews_expected > 0 else 0
        
        # Manager review metrics
        manager_reviews = ManagerReview.objects.filter(review_cycle=cycle)
        if department:
            manager_reviews = manager_reviews.filter(reviewee__department__name=department)
        
        completed_manager_reviews = manager_reviews.filter(status='completed').count()
        manager_review_completion_rate = (completed_manager_reviews / total_participants * 100) if total_participants > 0 else 0
        
        # Overall cycle completion
        overall_completion_rate = (
            self_assessment_completion_rate + 
            peer_review_completion_rate + 
            manager_review_completion_rate
        ) / 3
        
        # Rating distributions (for completed reviews)
        completed_self_assessments_qs = self_assessments.filter(status='completed')
        avg_self_ratings = {}
        if completed_self_assessments_qs.exists():
            # Calculate average ratings for each category
            for category in ['technical_excellence', 'collaboration', 'problem_solving', 'initiative', 'development_goals']:
                avg_rating = completed_self_assessments_qs.aggregate(
                    avg=Avg(f'{category}_rating')
                )['avg'] or 0
                avg_self_ratings[category] = round(avg_rating, 2)
        
        cycle_metrics = {
            'cycle_id': cycle.id,
            'cycle_name': cycle.name,
            'cycle_period': {
                'start_date': cycle.start_date.isoformat(),
                'end_date': cycle.end_date.isoformat(),
            },
            'participants': total_participants,
            'completion_rates': {
                'self_assessment': round(self_assessment_completion_rate, 2),
                'peer_review': round(peer_review_completion_rate, 2),
                'manager_review': round(manager_review_completion_rate, 2),
                'overall': round(overall_completion_rate, 2),
            },
            'review_counts': {
                'self_assessments': {
                    'completed': completed_self_assessments,
                    'total': total_participants,
                },
                'peer_reviews': {
                    'completed': completed_peer_reviews,
                    'total': total_peer_reviews_expected,
                },
                'manager_reviews': {
                    'completed': completed_manager_reviews,
                    'total': total_participants,
                },
            },
            'average_ratings': avg_self_ratings,
        }
        
        metrics.append(cycle_metrics)
    
    return {
        'cycles': metrics,
        'summary': {
            'total_cycles': len(metrics),
            'avg_completion_rate': round(
                sum(cycle['completion_rates']['overall'] for cycle in metrics) / len(metrics), 2
            ) if metrics else 0,
        }
    }


def calculate_user_engagement_metrics(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    department: Optional[str] = None,
    user_id: Optional[int] = None
) -> Dict[str, Any]:
    """Calculate user engagement and activity metrics"""
    
    # Default to last 30 days if no dates provided
    if not end_date:
        end_date = timezone.now().date()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    # Base queryset
    activity_qs = UserActivityLog.objects.filter(
        timestamp__date__range=[start_date, end_date]
    )
    
    # Apply filters
    if department:
        activity_qs = activity_qs.filter(user__department__name=department)
    
    if user_id:
        activity_qs = activity_qs.filter(user_id=user_id)
    
    # Calculate basic engagement metrics
    total_activities = activity_qs.count()
    unique_users = activity_qs.values('user').distinct().count()
    
    # Activity by type
    activity_by_type = activity_qs.values('activity_type').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Daily activity trends
    daily_activities = activity_qs.extra(
        select={'day': 'date(timestamp)'}
    ).values('day').annotate(
        count=Count('id')
    ).order_by('day')
    
    # Most active users
    most_active_users = activity_qs.values(
        'user__first_name', 'user__last_name', 'user__id'
    ).annotate(
        activity_count=Count('id')
    ).order_by('-activity_count')[:10]
    
    # Login frequency
    login_activities = activity_qs.filter(activity_type='login')
    unique_login_users = login_activities.values('user').distinct().count()
    
    # Calculate engagement score (simplified)
    total_possible_users = User.objects.filter(is_active=True)
    if department:
        total_possible_users = total_possible_users.filter(department__name=department)
    
    total_possible_users_count = total_possible_users.count()
    engagement_rate = (unique_users / total_possible_users_count * 100) if total_possible_users_count > 0 else 0
    
    return {
        'period': {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
        },
        'total_activities': total_activities,
        'unique_active_users': unique_users,
        'engagement_rate': round(engagement_rate, 2),
        'activity_by_type': list(activity_by_type),
        'daily_trends': list(daily_activities),
        'most_active_users': list(most_active_users),
        'login_metrics': {
            'total_logins': login_activities.count(),
            'unique_login_users': unique_login_users,
        }
    }


def calculate_department_performance(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> Dict[str, Any]:
    """Calculate performance metrics by department"""
    
    # Default to last 30 days if no dates provided
    if not end_date:
        end_date = timezone.now().date()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    departments = User.objects.filter(is_active=True).values_list('department__name', flat=True).distinct()
    department_metrics = []
    
    for department in departments:
        if not department:
            continue
            
        # Get OKR metrics for department
        okr_metrics = calculate_okr_completion_rates(start_date, end_date, department)
        
        # Get feedback metrics for department
        feedback_metrics = calculate_feedback_metrics(start_date, end_date, department)
        
        # Get engagement metrics for department
        engagement_metrics = calculate_user_engagement_metrics(start_date, end_date, department)
        
        # Calculate department size
        dept_size = User.objects.filter(department__name=department, is_active=True).count()
        
        department_metrics.append({
            'department': department,
            'employee_count': dept_size,
            'okr_completion_rate': okr_metrics['overall']['completion_rate'],
            'feedback_participation_rate': feedback_metrics['participation']['participation_rate'],
            'engagement_rate': engagement_metrics['engagement_rate'],
            'total_activities': engagement_metrics['total_activities'],
            'feedback_volume': feedback_metrics['total_feedback'],
        })
    
    # Sort by overall performance (weighted score)
    for dept in department_metrics:
        # Simple weighted performance score
        performance_score = (
            dept['okr_completion_rate'] * 0.4 +
            dept['feedback_participation_rate'] * 0.3 +
            dept['engagement_rate'] * 0.3
        )
        dept['performance_score'] = round(performance_score, 2)
    
    department_metrics.sort(key=lambda x: x['performance_score'], reverse=True)
    
    return {
        'period': {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
        },
        'departments': department_metrics,
        'summary': {
            'total_departments': len(department_metrics),
            'avg_performance_score': round(
                sum(dept['performance_score'] for dept in department_metrics) / len(department_metrics), 2
            ) if department_metrics else 0,
        }
    }


def generate_trend_analysis(
    metric_type: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    department: Optional[str] = None,
    user_id: Optional[int] = None
) -> Dict[str, Any]:
    """Generate trend analysis for various metrics over time"""
    
    # Default to last 90 days if no dates provided
    if not end_date:
        end_date = timezone.now().date()
    if not start_date:
        start_date = end_date - timedelta(days=90)
    
    # Generate weekly data points
    trends = []
    current_date = start_date
    
    while current_date <= end_date:
        week_end = min(current_date + timedelta(days=6), end_date)
        
        if metric_type == 'okr_completion':
            week_data = calculate_okr_completion_rates(current_date, week_end, department, user_id)
            trends.append({
                'week_start': current_date.isoformat(),
                'week_end': week_end.isoformat(),
                'value': week_data['overall']['completion_rate'],
                'details': week_data,
            })
        
        elif metric_type == 'feedback_volume':
            week_data = calculate_feedback_metrics(current_date, week_end, department, user_id)
            trends.append({
                'week_start': current_date.isoformat(),
                'week_end': week_end.isoformat(),
                'value': week_data['total_feedback'],
                'details': week_data,
            })
        
        elif metric_type == 'user_engagement':
            week_data = calculate_user_engagement_metrics(current_date, week_end, department, user_id)
            trends.append({
                'week_start': current_date.isoformat(),
                'week_end': week_end.isoformat(),
                'value': week_data['engagement_rate'],
                'details': week_data,
            })
        
        current_date += timedelta(days=7)
    
    # Calculate trend direction
    if len(trends) >= 2:
        recent_avg = sum(trend['value'] for trend in trends[-4:]) / min(4, len(trends))
        earlier_avg = sum(trend['value'] for trend in trends[:4]) / min(4, len(trends))
        trend_direction = 'increasing' if recent_avg > earlier_avg else 'decreasing'
        trend_percentage = ((recent_avg - earlier_avg) / earlier_avg * 100) if earlier_avg > 0 else 0
    else:
        trend_direction = 'stable'
        trend_percentage = 0
    
    return {
        'metric_type': metric_type,
        'period': {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
        },
        'trends': trends,
        'analysis': {
            'trend_direction': trend_direction,
            'trend_percentage': round(trend_percentage, 2),
            'data_points': len(trends),
        }
    } 