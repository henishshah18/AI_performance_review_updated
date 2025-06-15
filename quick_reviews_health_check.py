#!/usr/bin/env python3
"""
Quick health check for Phase 6: Performance Reviews (360°) Module
"""

import os
import sys
import django
import requests
from django.test import Client

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'performance_management.settings')
django.setup()

from reviews.models import (
    ReviewCycle, ReviewParticipant, SelfAssessment, 
    PeerReview, ManagerReview, UpwardReview
)
from django.contrib.auth import get_user_model

User = get_user_model()


def test_database_connectivity():
    """Test database connectivity and model access"""
    print("🔍 Testing database connectivity...")
    
    try:
        # Test review cycles
        cycles_count = ReviewCycle.objects.count()
        print(f"✅ Review cycles: {cycles_count} found")
        
        # Test participants
        participants_count = ReviewParticipant.objects.count()
        print(f"✅ Review participants: {participants_count} found")
        
        # Test self-assessments
        self_assessments_count = SelfAssessment.objects.count()
        print(f"✅ Self-assessments: {self_assessments_count} found")
        
        # Test peer reviews
        peer_reviews_count = PeerReview.objects.count()
        print(f"✅ Peer reviews: {peer_reviews_count} found")
        
        # Test manager reviews
        manager_reviews_count = ManagerReview.objects.count()
        print(f"✅ Manager reviews: {manager_reviews_count} found")
        
        # Test upward reviews
        upward_reviews_count = UpwardReview.objects.count()
        print(f"✅ Upward reviews: {upward_reviews_count} found")
        
        return True
        
    except Exception as e:
        print(f"❌ Database connectivity failed: {str(e)}")
        return False


def test_api_endpoints():
    """Test API endpoints accessibility"""
    print("🌐 Testing API endpoints...")
    
    try:
        client = Client()
        
        endpoints = [
            '/api/reviews/cycles/',
            '/api/reviews/self-assessments/',
            '/api/reviews/peer-reviews/',
            '/api/reviews/manager-reviews/',
            '/api/reviews/dashboard/',
        ]
        
        for endpoint in endpoints:
            try:
                response = client.get(endpoint)
                # 401 (Unauthorized) is expected without authentication
                if response.status_code in [200, 401]:
                    print(f"✅ {endpoint}: ACCESSIBLE")
                else:
                    print(f"❌ {endpoint}: FAILED ({response.status_code})")
                    return False
            except Exception as e:
                print(f"❌ {endpoint}: ERROR ({str(e)})")
                return False
        
        return True
        
    except Exception as e:
        print(f"❌ API endpoint tests failed: {str(e)}")
        return False


def test_model_relationships():
    """Test model relationships and data integrity"""
    print("🔗 Testing model relationships...")
    
    try:
        # Test review cycle with participants
        active_cycles = ReviewCycle.objects.filter(status='active')
        if active_cycles.exists():
            cycle = active_cycles.first()
            participants = cycle.participants.all()
            print(f"✅ Review cycle '{cycle.name}' has {participants.count()} participants")
            
            # Test self-assessments for this cycle
            self_assessments = cycle.self_assessments.all()
            print(f"✅ Cycle has {self_assessments.count()} self-assessments")
            
            # Test peer reviews for this cycle
            peer_reviews = cycle.peer_reviews.all()
            print(f"✅ Cycle has {peer_reviews.count()} peer reviews")
            
            # Test manager reviews for this cycle
            manager_reviews = cycle.manager_reviews.all()
            print(f"✅ Cycle has {manager_reviews.count()} manager reviews")
        else:
            print("⚠️  No active review cycles found")
        
        return True
        
    except Exception as e:
        print(f"❌ Model relationship tests failed: {str(e)}")
        return False


def main():
    """Main health check runner"""
    print("🚀 Phase 6: Performance Reviews (360°) Module - Health Check")
    print("=" * 60)
    
    # Run health checks
    db_test = test_database_connectivity()
    print()
    
    api_test = test_api_endpoints()
    print()
    
    relationship_test = test_model_relationships()
    print()
    
    # Summary
    print("=" * 60)
    print("📊 HEALTH CHECK SUMMARY")
    print("=" * 60)
    
    total_tests = 3
    passed_tests = sum([db_test, api_test, relationship_test])
    
    print(f"Database Connectivity: {'✅ PASSED' if db_test else '❌ FAILED'}")
    print(f"API Endpoints: {'✅ PASSED' if api_test else '❌ FAILED'}")
    print(f"Model Relationships: {'✅ PASSED' if relationship_test else '❌ FAILED'}")
    print()
    print(f"Overall: {passed_tests}/{total_tests} health checks passed")
    
    if passed_tests == total_tests:
        print("🎉 All health checks PASSED! Phase 6 Reviews module is healthy.")
        return True
    else:
        print("⚠️  Some health checks failed. Please investigate.")
        return False


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1) 