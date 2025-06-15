from django.urls import path
from . import views

app_name = 'feedback'

urlpatterns = [
    # Core Feedback Endpoints
    path('', views.FeedbackListCreateView.as_view(), name='feedback-list-create'),
    path('<uuid:pk>/', views.FeedbackDetailView.as_view(), name='feedback-detail'),
    
    # User-specific Feedback Endpoints
    path('given/', views.feedback_given_view, name='feedback-given'),
    path('received/', views.feedback_received_view, name='feedback-received'),
    
    # Analytics and Summary Endpoints
    path('analytics/', views.feedback_analytics_view, name='feedback-analytics'),
    path('team-summary/', views.team_feedback_summary_view, name='team-feedback-summary'),
    path('tags/trending/', views.trending_tags_view, name='trending-tags'),
    
    # Feedback Tag Management
    path('<uuid:feedback_id>/tags/', views.add_feedback_tag_view, name='add-feedback-tag'),
    path('<uuid:feedback_id>/tags/<str:tag_name>/', views.remove_feedback_tag_view, name='remove-feedback-tag'),
    
    # Feedback Tag Templates (HR Admin)
    path('settings/tag-templates/', views.FeedbackTagTemplateListCreateView.as_view(), name='tag-template-list-create'),
    path('settings/tag-templates/<uuid:pk>/', views.FeedbackTagTemplateDetailView.as_view(), name='tag-template-detail'),
    
    # Feedback Comments
    path('<uuid:feedback_id>/comments/', views.FeedbackCommentListCreateView.as_view(), name='feedback-comment-list-create'),
    path('comments/<uuid:pk>/', views.FeedbackCommentDetailView.as_view(), name='feedback-comment-detail'),
] 