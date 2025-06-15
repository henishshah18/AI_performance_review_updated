from django.urls import path
from .views import AnalyzeTextView, FeedbackSentimentView

app_name = 'ai_features'

urlpatterns = [
    path('analyze-text/', AnalyzeTextView.as_view(), name='analyze-text'),
    path('feedback/<uuid:feedback_id>/sentiment/', FeedbackSentimentView.as_view(), name='feedback-sentiment'),
] 