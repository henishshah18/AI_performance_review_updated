#!/usr/bin/env python
import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'performance_management.settings')
django.setup()

from ai_features.models import AISettings
from ai_features.services.openai_service import OpenAIService

def test_basic_ai():
    print("🚀 Testing Basic AI Integration...")
    
    # Test 1: AI Settings
    try:
        settings_obj = AISettings.get_settings()
        print(f"✅ AI Settings: {settings_obj.openai_model}")
    except Exception as e:
        print(f"❌ AI Settings Error: {e}")
        return False
    
    # Test 2: OpenAI Service
    try:
        service = OpenAIService()
        print("✅ OpenAI Service initialized")
        
        # Test sentiment analysis
        result = service.analyze_sentiment("This is excellent work!")
        if result and 'sentiment_label' in result:
            print(f"✅ Sentiment Analysis: {result['sentiment_label']}")
        else:
            print("❌ Sentiment analysis failed")
            return False
            
    except Exception as e:
        print(f"❌ OpenAI Service Error: {e}")
        return False
    
    print("🎉 Basic AI integration working!")
    return True

if __name__ == "__main__":
    success = test_basic_ai()
    sys.exit(0 if success else 1)
