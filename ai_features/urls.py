from django.urls import path
from . import views

app_name = 'ai_features'

urlpatterns = [
    # AI Settings Management (HR Admin only)
    path('settings/', views.AISettingsView.as_view(), name='ai-settings'),
    
    # AI Review Generation Endpoints
    path('generate/self-assessment/', views.generate_self_assessment_draft, name='generate-self-assessment'),
    path('generate/peer-review/', views.generate_peer_review_draft, name='generate-peer-review'),
    path('generate/manager-review/', views.generate_manager_review_draft, name='generate-manager-review'),
    
    # Sentiment Analysis Endpoints
    path('sentiment/analyze/', views.analyze_sentiment, name='analyze-sentiment'),
    path('sentiment/dashboard/', views.sentiment_dashboard, name='sentiment-dashboard'),
    path('sentiment/alerts/', views.sentiment_alerts, name='sentiment-alerts'),
    
    # AI Generation History and Analytics
    path('generation-history/', views.AIGenerationHistoryView.as_view(), name='generation-history'),
    path('analytics/usage/', views.ai_usage_analytics, name='usage-analytics'),
    path('insights/', views.ai_insights, name='ai-insights'),
] 