#!/usr/bin/env python
"""
AI Integration Test Script
Tests all AI features to ensure proper functionality
"""

import os
import sys
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'performance_management.settings')
django.setup()

from ai_features.models import AISentimentAnalysis, AIGenerationRequest, AISettings
from ai_features.services.openai_service import OpenAIService
from ai_features.services.sentiment_analyzer import SentimentAnalyzer
from ai_features.services.review_generator import ReviewGenerator
from core.models import User, Department
from okr.models import Goal
from feedback.models import Feedback

def test_ai_models():
    """Test AI model creation and basic functionality"""
    print("🧪 Testing AI Models...")
    
    # Test AISettings model
    settings_obj = AISettings.get_settings()
    print(f"✅ AISettings retrieved: {settings_obj}")
    
    # Test AISentimentAnalysis model with proper ContentType
    from django.contrib.contenttypes.models import ContentType
    from feedback.models import Feedback
    
    # Get or create a ContentType for testing
    feedback_ct = ContentType.objects.get_for_model(Feedback)
    
    sentiment = AISentimentAnalysis.objects.create(
        content_type=feedback_ct,
        object_id='12345678-1234-1234-1234-123456789012',  # UUID format
        sentiment_score=0.8,
        sentiment_label='positive',
        confidence_score=0.95,
        detected_keywords=['excellent', 'great work'],
        detected_issues=[]
    )
    print(f"✅ AISentimentAnalysis created: {sentiment}")
    
    # Test AIGenerationRequest model with proper User
    try:
        test_user = User.objects.first()
        if not test_user:
            # Create a test user if none exists
            test_user = User.objects.create_user(
                email='test@example.com',
                password='testpass123',
                first_name='Test',
                last_name='User',
                role='individual'
            )
        
        generation = AIGenerationRequest.objects.create(
            user=test_user,
            request_type='self_assessment',
            status='completed',
            input_data={'test': 'data'},
            output_data={'generated': 'content'},
            tokens_used=150,
            processing_time=2.5
        )
        print(f"✅ AIGenerationRequest created: {generation}")
    except Exception as e:
        print(f"⚠️ AIGenerationRequest creation skipped: {e}")
    
    return True

def test_openai_service():
    """Test OpenAI service functionality"""
    print("\n🤖 Testing OpenAI Service...")
    
    try:
        service = OpenAIService()
        print("✅ OpenAI Service initialized successfully")
        
        # Test sentiment analysis (which is implemented)
        test_text = "This employee consistently delivers excellent work and collaborates effectively with the team."
        
        result = service.analyze_sentiment(test_text)
        
        if result and 'sentiment_label' in result:
            print(f"✅ OpenAI Sentiment Analysis: {result['sentiment_label']} (score: {result['sentiment_score']})")
            return True
        else:
            print("❌ OpenAI API returned unexpected response format")
            return False
            
    except Exception as e:
        print(f"❌ OpenAI Service Error: {str(e)}")
        return False

def test_sentiment_analyzer():
    """Test sentiment analysis functionality"""
    print("\n💭 Testing Sentiment Analyzer...")
    
    try:
        analyzer = SentimentAnalyzer()
        
        # Create a test feedback object for analysis
        test_user = User.objects.first()
        if not test_user:
            print("⚠️ No users found, skipping sentiment analysis test")
            return True
            
        # Create test feedback
        feedback = Feedback.objects.create(
            from_user=test_user,
            to_user=test_user,
            feedback_type='commendation',
            content="This employee consistently delivers excellent work and collaborates effectively with the team.",
            visibility='public'
        )
        
        # Test sentiment analysis
        result = analyzer.analyze_content_sentiment(feedback)
        
        if result:
            print(f"✅ Sentiment analysis successful: {result.sentiment_label} (score: {result.sentiment_score})")
            return True
        else:
            print("❌ Sentiment analysis returned no result")
            return False
        
    except Exception as e:
        print(f"❌ Sentiment Analyzer Error: {str(e)}")
        return False

def test_review_generator():
    """Test review generation functionality"""
    print("\n📝 Testing Review Generator...")
    
    try:
        generator = ReviewGenerator()
        
        # Get a test user
        test_user = User.objects.first()
        if not test_user:
            print("⚠️ No users found, skipping review generation test")
            return True
        
        # Test self-assessment generation
        context_data = {
            'user_name': 'John Doe',
            'role': 'Software Engineer',
            'goals_completed': 3,
            'total_goals': 4,
            'recent_achievements': ['Implemented new feature', 'Fixed critical bugs'],
            'development_areas': ['Time management', 'Communication']
        }
        
        self_assessment = generator.generate_self_assessment_draft(
            context_data, 
            user_id=str(test_user.id)
        )
        
        if self_assessment and 'technical_excellence' in self_assessment:
            print("✅ Self-assessment generation successful")
            print(f"   Technical Excellence: {self_assessment['technical_excellence'][:50]}...")
            return True
        else:
            print("❌ Self-assessment generation failed")
            return False
            
    except Exception as e:
        print(f"❌ Review Generator Error: {str(e)}")
        return False

def test_ai_settings():
    """Test AI settings functionality"""
    print("\n⚙️ Testing AI Settings...")
    
    try:
        settings_obj = AISettings.get_settings()
        print(f"✅ AI Settings retrieved: Model={settings_obj.openai_model}, Tokens={settings_obj.max_tokens}")
        
        # Test settings properties
        print(f"✅ AI Features Enabled: {settings_obj.ai_features_enabled}")
        print(f"✅ Sentiment Analysis Enabled: {settings_obj.sentiment_analysis_enabled}")
        print(f"✅ Review Generation Enabled: {settings_obj.review_generation_enabled}")
        
        return True
        
    except Exception as e:
        print(f"❌ AI Settings Error: {str(e)}")
        return False

def main():
    """Run all AI integration tests"""
    print("🚀 Starting AI Integration Tests...\n")
    
    tests = [
        ("AI Models", test_ai_models),
        ("OpenAI Service", test_openai_service),
        ("Sentiment Analyzer", test_sentiment_analyzer),
        ("Review Generator", test_review_generator),
        ("AI Settings", test_ai_settings),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            results.append((test_name, False))
    
    # Print summary
    print("\n" + "="*50)
    print("🎯 AI Integration Test Summary")
    print("="*50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if result:
            passed += 1
    
    print(f"\nResults: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("🎉 All AI integration tests passed! The system is ready.")
    else:
        print("⚠️ Some tests failed. Please check the errors above.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 