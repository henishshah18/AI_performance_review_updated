from django.urls import path
from . import views

app_name = 'reviews'

urlpatterns = [
    # Review Cycle Management
    path('cycles/', views.ReviewCycleListCreateView.as_view(), name='review-cycle-list-create'),
    path('cycles/<uuid:pk>/', views.ReviewCycleDetailView.as_view(), name='review-cycle-detail'),
    path('cycles/active/', views.active_review_cycles_view, name='active-review-cycles'),
    path('cycles/<uuid:cycle_id>/participants/', views.review_cycle_participants_view, name='cycle-participants'),
    path('cycles/<uuid:cycle_id>/progress/', views.review_cycle_progress_view, name='cycle-progress'),
    
    # Self-Assessment Endpoints
    path('self-assessments/', views.SelfAssessmentListCreateView.as_view(), name='self-assessment-list-create'),
    path('self-assessments/<uuid:pk>/', views.SelfAssessmentDetailView.as_view(), name='self-assessment-detail'),
    path('self-assessments/<uuid:assessment_id>/submit/', views.submit_self_assessment_view, name='submit-self-assessment'),
    
    # Peer Review Endpoints
    path('peer-reviews/', views.PeerReviewListCreateView.as_view(), name='peer-review-list-create'),
    path('peer-reviews/<uuid:pk>/', views.PeerReviewDetailView.as_view(), name='peer-review-detail'),
    
    # Manager Review Endpoints
    path('manager-reviews/', views.ManagerReviewListCreateView.as_view(), name='manager-review-list-create'),
    path('manager-reviews/<uuid:pk>/', views.ManagerReviewDetailView.as_view(), name='manager-review-detail'),
    
    # Dashboard and Analytics
    path('dashboard/', views.user_review_dashboard_view, name='user-review-dashboard'),
    path('team-summary/', views.team_review_summary_view, name='team-review-summary'),
] 