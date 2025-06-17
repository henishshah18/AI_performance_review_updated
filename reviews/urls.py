from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Remove router since ViewSets don't exist
# router = DefaultRouter()
# router.register(r'cycles', views.ReviewCycleViewSet)
# router.register(r'self-assessments', views.SelfAssessmentViewSet)
# router.register(r'peer-reviews', views.PeerReviewViewSet)
# router.register(r'manager-reviews', views.ManagerReviewViewSet)

app_name = 'reviews'

urlpatterns = [
    # AI Draft Generation
    path('ai/generate-review-draft/', views.generate_review_draft, name='generate_review_draft'),
    
    # Review Cycle Management
    path('cycles/', views.ReviewCycleListCreateView.as_view(), name='review-cycle-list-create'),
    path('cycles/<uuid:pk>/', views.ReviewCycleDetailView.as_view(), name='review-cycle-detail'),
    path('cycles/active/', views.active_review_cycles_view, name='active-review-cycles'),
    path('cycles/<uuid:cycle_id>/participants/', views.review_cycle_participants_view, name='cycle-participants'),
    path('cycles/<uuid:cycle_id>/progress/', views.review_cycle_progress_view, name='cycle-progress'),
    path('cycles/<str:cycle_id>/start/', views.start_review_cycle_view, name='start_review_cycle'),
    
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