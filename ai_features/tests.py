import unittest
from unittest.mock import patch, MagicMock
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from feedback.models import Feedback
from ai_features.models import AISentimentAnalysis
from core.models import Department

User = get_user_model()

class AIPhase9TestSuite(TestCase):
    def setUp(self):
        self.client = Client()
        self.hr_admin = User.objects.create_user(
            email='hr_admin_ai@test.com',
            password='testpass123',
            role='hr_admin',
            department=Department.objects.create(name='AI-Test-Dept')
        )
        self.user1 = User.objects.create_user('user1@test.com', 'testpass123', role='individual_contributor', department=self.hr_admin.department)
        self.client.login(email='hr_admin_ai@test.com', password='testpass123')

    @patch('ai_features.services.openai_service.OpenAIService.analyze_sentiment')
    def test_sentiment_analysis_on_feedback_creation(self, mock_analyze_sentiment):
        """Test that sentiment analysis is triggered and saved when feedback is created."""
        mock_analyze_sentiment.return_value = {
            'sentiment_label': 'positive',
            'sentiment_score': 0.95,
            'confidence_score': 0.98,
            'detected_issues': [],
            'keywords': ['great', 'teamwork']
        }

        feedback = Feedback.objects.create(
            from_user=self.hr_admin,
            to_user=self.user1,
            content="This is a test feedback with positive sentiment.",
            feedback_type='commendation'
        )

        self.assertEqual(AISentimentAnalysis.objects.count(), 1)
        analysis = AISentimentAnalysis.objects.first()
        self.assertEqual(analysis.content_object, feedback)
        self.assertEqual(analysis.sentiment_label, 'positive')
        self.assertEqual(analysis.sentiment_score, 0.95)
        mock_analyze_sentiment.assert_called_once_with("This is a test feedback with positive sentiment.")

    @patch('ai_features.services.openai_service.OpenAIService.get_completion')
    def test_generate_self_assessment_draft_api(self, mock_get_completion):
        """Test the API endpoint for generating a self-assessment draft."""
        mock_get_completion.return_value = "This is a generated self-assessment draft."
        
        url = reverse('ai_features:generate-self-assessment')
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['draft'], "This is a generated self-assessment draft.")
        mock_get_completion.assert_called_once()

    def test_sentiment_analytics_view(self):
        """Test the sentiment analytics dashboard endpoint."""
        # This is a placeholder for a more detailed test.
        # For a real test, you would create more AISentimentAnalysis objects.
        url = reverse('ai_features:sentiment-analytics')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('overall_distribution', response.json())
        self.assertIn('sentiment_trend', response.json())

if __name__ == '__main__':
    unittest.main() 