from django.urls import path
from . import views
from . import advanced_views

app_name = 'analytics'

urlpatterns = [
    # Dashboard endpoints
    path('dashboard/summary/', views.dashboard_summary, name='dashboard_summary'),
    path('dashboard/hr-admin/', views.hr_admin_dashboard, name='hr_admin_dashboard'),
    path('dashboard/manager/', views.manager_dashboard, name='manager_dashboard'),
    path('dashboard/individual/', views.individual_dashboard, name='individual_dashboard'),
    
    # Notification endpoints
    path('notifications/', views.notifications_list, name='notifications_list'),
    path('notifications/<int:notification_id>/read/', views.mark_notification_read, name='mark_notification_read'),
    path('notifications/mark-all-read/', views.mark_all_notifications_read, name='mark_all_notifications_read'),
    
    # Phase 7 Advanced Analytics Endpoints
    
    # OKR Analytics
    path('okr/completion-rates/', advanced_views.okr_completion_rates, name='okr_completion_rates'),
    path('okr/progress-trends/', advanced_views.okr_progress_trends, name='okr_progress_trends'),
    path('okr/department-comparison/', advanced_views.okr_department_comparison, name='okr_department_comparison'),
    path('okr/individual-performance/', advanced_views.okr_individual_performance, name='okr_individual_performance'),
    
    # Feedback Analytics
    path('feedback/volume-trends/', advanced_views.feedback_volume_trends, name='feedback_volume_trends'),
    path('feedback/sentiment-analysis/', advanced_views.feedback_sentiment_analysis, name='feedback_sentiment_analysis'),
    path('feedback/tag-frequency/', advanced_views.feedback_tag_frequency, name='feedback_tag_frequency'),
    path('feedback/participation-rates/', advanced_views.feedback_participation_rates, name='feedback_participation_rates'),
    
    # Review Analytics
    path('reviews/cycle-completion/', advanced_views.review_cycle_completion, name='review_cycle_completion'),
    
    # Executive Dashboard
    path('executive/company-overview/', advanced_views.executive_company_overview, name='executive_company_overview'),
    
    # User Engagement
    path('engagement/metrics/', advanced_views.user_engagement_metrics, name='user_engagement_metrics'),
    
    # Data Export
    path('export/okr-data/', advanced_views.export_okr_data, name='export_okr_data'),
    path('export/feedback-data/', advanced_views.export_feedback_data, name='export_feedback_data'),
] 