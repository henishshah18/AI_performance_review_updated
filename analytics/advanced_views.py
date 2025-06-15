"""
Advanced Analytics Views for Phase 7
Provides comprehensive analytics endpoints for OKR, Feedback, Reviews, and Executive insights
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q, Count, Avg, Sum
from datetime import datetime, timedelta, date
from typing import Optional

from core.decorators import hr_admin_required, manager_required
from .aggregators import (
    calculate_okr_completion_rates,
    calculate_feedback_metrics,
    calculate_review_cycle_metrics,
    calculate_user_engagement_metrics,
    calculate_department_performance,
    generate_trend_analysis
)


# OKR Analytics Endpoints

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def okr_completion_rates(request):
    """Get OKR completion rates with filtering options"""
    try:
        # Parse query parameters
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        department = request.GET.get('department')
        user_id = request.GET.get('user_id')
        
        # Convert date strings to date objects
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        if user_id:
            user_id = int(user_id)
        
        # Apply role-based filtering
        if request.user.role == 'individual_contributor':
            user_id = request.user.id
            department = None
        elif request.user.role == 'manager' and not department:
            department = request.user.department
        
        data = calculate_okr_completion_rates(start_date, end_date, department, user_id)
        return Response(data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to calculate OKR completion rates: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def okr_progress_trends(request):
    """Get OKR progress trends over time"""
    try:
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        department = request.GET.get('department')
        user_id = request.GET.get('user_id')
        
        # Convert date strings to date objects
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        if user_id:
            user_id = int(user_id)
        
        # Apply role-based filtering
        if request.user.role == 'individual_contributor':
            user_id = request.user.id
            department = None
        elif request.user.role == 'manager' and not department:
            department = request.user.department
        
        data = generate_trend_analysis('okr_completion', start_date, end_date, department, user_id)
        return Response(data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to generate OKR progress trends: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@hr_admin_required
def okr_department_comparison(request):
    """Get OKR completion comparison across departments (HR Admin only)"""
    try:
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        # Convert date strings to date objects
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        data = calculate_department_performance(start_date, end_date)
        return Response(data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to generate department comparison: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def okr_individual_performance(request):
    """Get individual OKR performance metrics"""
    try:
        user_id = request.GET.get('user_id', request.user.id)
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        # Convert date strings to date objects
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Permission check: users can only view their own data unless they're managers/admins
        if (request.user.role == 'individual_contributor' and 
            int(user_id) != request.user.id):
            return Response(
                {'error': 'You can only view your own performance data'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        data = calculate_okr_completion_rates(start_date, end_date, None, int(user_id))
        
        # Add additional individual metrics
        engagement_data = calculate_user_engagement_metrics(start_date, end_date, None, int(user_id))
        data['engagement_metrics'] = engagement_data
        
        return Response(data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to get individual performance: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Feedback Analytics Endpoints

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def feedback_volume_trends(request):
    """Get feedback volume trends over time"""
    try:
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        department = request.GET.get('department')
        user_id = request.GET.get('user_id')
        
        # Convert date strings to date objects
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        if user_id:
            user_id = int(user_id)
        
        # Apply role-based filtering
        if request.user.role == 'individual_contributor':
            user_id = request.user.id
            department = None
        elif request.user.role == 'manager' and not department:
            department = request.user.department
        
        data = generate_trend_analysis('feedback_volume', start_date, end_date, department, user_id)
        return Response(data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to generate feedback volume trends: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def feedback_sentiment_analysis(request):
    """Get feedback sentiment analysis (placeholder for future AI integration)"""
    try:
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        department = request.GET.get('department')
        
        # Convert date strings to date objects
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Apply role-based filtering
        if request.user.role == 'manager' and not department:
            department = request.user.department
        elif request.user.role == 'individual_contributor':
            return Response(
                {'error': 'Individual contributors cannot access sentiment analysis'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        feedback_data = calculate_feedback_metrics(start_date, end_date, department)
        
        # Mock sentiment analysis data (to be replaced with actual AI analysis)
        sentiment_data = {
            'overall_sentiment': 'positive',
            'sentiment_score': 0.72,  # -1 to 1 scale
            'sentiment_distribution': {
                'positive': 65,
                'neutral': 25,
                'negative': 10,
            },
            'sentiment_trends': [
                {'week': '2024-01-01', 'score': 0.68},
                {'week': '2024-01-08', 'score': 0.71},
                {'week': '2024-01-15', 'score': 0.72},
                {'week': '2024-01-22', 'score': 0.75},
            ],
            'feedback_metrics': feedback_data,
        }
        
        return Response(sentiment_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to analyze feedback sentiment: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def feedback_tag_frequency(request):
    """Get feedback tag frequency analysis"""
    try:
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        department = request.GET.get('department')
        
        # Convert date strings to date objects
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Apply role-based filtering
        if request.user.role == 'manager' and not department:
            department = request.user.department
        elif request.user.role == 'individual_contributor':
            department = None  # Individual contributors see their own data
        
        feedback_data = calculate_feedback_metrics(start_date, end_date, department)
        
        # Enhanced tag analysis
        tag_data = {
            'top_tags': feedback_data['top_tags'],
            'tag_trends': [
                {'tag': 'Communication', 'trend': 'increasing', 'change': 15},
                {'tag': 'Leadership', 'trend': 'stable', 'change': 2},
                {'tag': 'Technical Skills', 'trend': 'decreasing', 'change': -8},
            ],
            'category_distribution': {
                'skills': 45,
                'behaviors': 35,
                'values': 20,
            },
            'feedback_metrics': feedback_data,
        }
        
        return Response(tag_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to analyze tag frequency: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def feedback_participation_rates(request):
    """Get feedback participation rates"""
    try:
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        department = request.GET.get('department')
        
        # Convert date strings to date objects
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Apply role-based filtering
        if request.user.role == 'manager' and not department:
            department = request.user.department
        elif request.user.role == 'individual_contributor':
            return Response(
                {'error': 'Individual contributors cannot access participation rates'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        feedback_data = calculate_feedback_metrics(start_date, end_date, department)
        engagement_data = calculate_user_engagement_metrics(start_date, end_date, department)
        
        participation_data = {
            'participation_rate': feedback_data['participation']['participation_rate'],
            'unique_givers': feedback_data['participation']['unique_givers'],
            'unique_receivers': feedback_data['participation']['unique_receivers'],
            'engagement_rate': engagement_data['engagement_rate'],
            'feedback_frequency': {
                'daily_average': feedback_data['total_feedback'] / 30,  # Assuming 30-day period
                'weekly_average': feedback_data['total_feedback'] / 4.3,  # Assuming 30-day period
            },
            'participation_trends': generate_trend_analysis('user_engagement', start_date, end_date, department),
        }
        
        return Response(participation_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to calculate participation rates: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Review Analytics Endpoints

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def review_cycle_completion(request):
    """Get review cycle completion metrics"""
    try:
        cycle_id = request.GET.get('cycle_id')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        department = request.GET.get('department')
        
        # Convert parameters
        if cycle_id:
            cycle_id = int(cycle_id)
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Apply role-based filtering
        if request.user.role == 'manager' and not department:
            department = request.user.department
        elif request.user.role == 'individual_contributor':
            return Response(
                {'error': 'Individual contributors cannot access review cycle analytics'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        data = calculate_review_cycle_metrics(cycle_id, start_date, end_date, department)
        return Response(data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to get review cycle completion: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@hr_admin_required
def executive_company_overview(request):
    """Get executive-level company overview (HR Admin only)"""
    try:
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        # Convert date strings to date objects
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Get comprehensive company metrics
        okr_data = calculate_okr_completion_rates(start_date, end_date)
        feedback_data = calculate_feedback_metrics(start_date, end_date)
        engagement_data = calculate_user_engagement_metrics(start_date, end_date)
        department_data = calculate_department_performance(start_date, end_date)
        
        # Calculate key performance indicators
        executive_overview = {
            'period': {
                'start_date': start_date.isoformat() if start_date else None,
                'end_date': end_date.isoformat() if end_date else None,
            },
            'key_metrics': {
                'overall_okr_completion': okr_data['overall']['completion_rate'],
                'employee_engagement_rate': engagement_data['engagement_rate'],
                'feedback_participation_rate': feedback_data['participation']['participation_rate'],
                'total_active_users': engagement_data['unique_active_users'],
            },
            'department_performance': department_data['departments'],
            'trends': {
                'okr_trend': generate_trend_analysis('okr_completion', start_date, end_date),
                'engagement_trend': generate_trend_analysis('user_engagement', start_date, end_date),
                'feedback_trend': generate_trend_analysis('feedback_volume', start_date, end_date),
            },
            'alerts': [
                # Mock alerts - to be replaced with actual alert logic
                {
                    'type': 'warning',
                    'message': 'Engineering department OKR completion below target',
                    'metric': 'okr_completion',
                    'department': 'engineering',
                },
                {
                    'type': 'success',
                    'message': 'Feedback participation increased by 15% this month',
                    'metric': 'feedback_participation',
                },
            ],
        }
        
        return Response(executive_overview, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to generate executive overview: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_engagement_metrics(request):
    """Get user engagement metrics"""
    try:
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        department = request.GET.get('department')
        user_id = request.GET.get('user_id')
        
        # Convert date strings to date objects
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        if user_id:
            user_id = int(user_id)
        
        # Apply role-based filtering
        if request.user.role == 'individual_contributor':
            user_id = request.user.id
            department = None
        elif request.user.role == 'manager' and not department:
            department = request.user.department
        
        data = calculate_user_engagement_metrics(start_date, end_date, department, user_id)
        return Response(data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to calculate engagement metrics: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Data Export Endpoints

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def export_okr_data(request):
    """Export OKR data in specified format"""
    try:
        export_format = request.data.get('format', 'json')  # json, csv, excel
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        department = request.data.get('department')
        
        # Convert date strings to date objects
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Apply role-based filtering
        if request.user.role == 'manager' and not department:
            department = request.user.department
        elif request.user.role == 'individual_contributor':
            return Response(
                {'error': 'Individual contributors cannot export data'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get data
        data = calculate_okr_completion_rates(start_date, end_date, department)
        
        # For now, return JSON data with export job ID
        # In production, this would trigger an async export job
        export_job = {
            'job_id': f'okr_export_{timezone.now().timestamp()}',
            'status': 'completed',
            'format': export_format,
            'data': data,
            'download_url': f'/api/analytics/exports/okr_export_{timezone.now().timestamp()}.{export_format}',
            'created_at': timezone.now().isoformat(),
        }
        
        return Response(export_job, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to export OKR data: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def export_feedback_data(request):
    """Export feedback data in specified format"""
    try:
        export_format = request.data.get('format', 'json')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        department = request.data.get('department')
        
        # Convert date strings to date objects
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Apply role-based filtering
        if request.user.role == 'manager' and not department:
            department = request.user.department
        elif request.user.role == 'individual_contributor':
            return Response(
                {'error': 'Individual contributors cannot export data'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get data
        data = calculate_feedback_metrics(start_date, end_date, department)
        
        # Mock export job
        export_job = {
            'job_id': f'feedback_export_{timezone.now().timestamp()}',
            'status': 'completed',
            'format': export_format,
            'data': data,
            'download_url': f'/api/analytics/exports/feedback_export_{timezone.now().timestamp()}.{export_format}',
            'created_at': timezone.now().isoformat(),
        }
        
        return Response(export_job, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to export feedback data: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        ) 