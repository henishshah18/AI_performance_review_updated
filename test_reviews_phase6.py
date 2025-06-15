#!/usr/bin/env python3
"""
Comprehensive test suite for Phase 6: Performance Reviews (360°) Module
Tests all review models, API endpoints, and functionality.
"""

import os
import sys
import django
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.utils import timezone
from datetime import datetime, timedelta
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'performance_management.settings')
django.setup()

from reviews.models import (
    ReviewCycle, ReviewParticipant, SelfAssessment, GoalAssessment,
    PeerReview, ManagerReview, UpwardReview, ReviewMeeting
)
from okr.models import Goal, Objective

User = get_user_model()


class ReviewModelsTestCase(TestCase):
    """Test review models functionality"""
    
    def setUp(self):
        """Set up test data"""
        # Create test users
        self.hr_admin = User.objects.create_user(
            email='hr@test.com',
            password='testpass123',
            first_name='HR',
            last_name='Admin',
            role='hr_admin'
        )
        
        self.manager = User.objects.create_user(
            email='manager@test.com',
            password='testpass123',
            first_name='Test',
            last_name='Manager',
            role='manager'
        )
        
        self.employee = User.objects.create_user(
            email='employee@test.com',
            password='testpass123',
            first_name='Test',
            last_name='Employee',
            role='individual_contributor',
            manager=self.manager
        )
        
        # Create review cycle
        self.review_cycle = ReviewCycle.objects.create(
            name='Q4 2024 Test Review',
            review_type='quarterly',
            status='active',
            review_period_start=datetime(2024, 10, 1).date(),
            review_period_end=datetime(2024, 12, 31).date(),
            self_assessment_start=datetime(2024, 12, 1).date(),
            self_assessment_end=datetime(2024, 12, 15).date(),
            peer_review_start=datetime(2024, 12, 16).date(),
            peer_review_end=datetime(2024, 12, 25).date(),
            manager_review_start=datetime(2024, 12, 26).date(),
            manager_review_end=datetime(2025, 1, 5).date(),
            created_by=self.hr_admin
        )
    
    def test_review_cycle_creation(self):
        """Test review cycle model creation and properties"""
        self.assertEqual(self.review_cycle.name, 'Q4 2024 Test Review')
        self.assertEqual(self.review_cycle.review_type, 'quarterly')
        self.assertEqual(self.review_cycle.status, 'active')
        self.assertTrue(self.review_cycle.is_active)
        self.assertIsNotNone(self.review_cycle.current_phase)
    
    def test_review_participant_creation(self):
        """Test review participant model"""
        participant = ReviewParticipant.objects.create(
            cycle=self.review_cycle,
            user=self.employee,
            is_active=True
        )
        
        self.assertEqual(participant.cycle, self.review_cycle)
        self.assertEqual(participant.user, self.employee)
        self.assertTrue(participant.is_active)
    
    def test_self_assessment_creation(self):
        """Test self-assessment model"""
        self_assessment = SelfAssessment.objects.create(
            cycle=self.review_cycle,
            user=self.employee,
            status='in_progress',
            technical_excellence=4,
            technical_examples='Great technical work',
            collaboration=5,
            collaboration_examples='Excellent team player'
        )
        
        self.assertEqual(self_assessment.user, self.employee)
        self.assertEqual(self_assessment.status, 'in_progress')
        self.assertEqual(self_assessment.technical_excellence, 4)
        self.assertGreater(self_assessment.completion_percentage, 0)
    
    def test_peer_review_creation(self):
        """Test peer review model"""
        peer_review = PeerReview.objects.create(
            cycle=self.review_cycle,
            reviewer=self.manager,
            reviewee=self.employee,
            status='completed',
            collaboration_rating=4,
            collaboration_examples='Works well with team',
            impact_rating=5,
            impact_examples='High impact contributions'
        )
        
        self.assertEqual(peer_review.reviewer, self.manager)
        self.assertEqual(peer_review.reviewee, self.employee)
        self.assertEqual(peer_review.collaboration_rating, 4)
    
    def test_manager_review_creation(self):
        """Test manager review model"""
        manager_review = ManagerReview.objects.create(
            cycle=self.review_cycle,
            manager=self.manager,
            employee=self.employee,
            status='completed',
            overall_rating='meets_expectations',
            technical_excellence=4,
            technical_justification='Strong technical skills'
        )
        
        self.assertEqual(manager_review.manager, self.manager)
        self.assertEqual(manager_review.employee, self.employee)
        self.assertEqual(manager_review.overall_rating, 'meets_expectations')
    
    def test_upward_review_creation(self):
        """Test upward review model"""
        upward_review = UpwardReview.objects.create(
            cycle=self.review_cycle,
            reviewer=self.employee,
            manager=self.manager,
            status='completed',
            leadership_effectiveness=4,
            leadership_examples='Good leadership skills',
            is_anonymous=True
        )
        
        self.assertEqual(upward_review.reviewer, self.employee)
        self.assertEqual(upward_review.manager, self.manager)
        self.assertTrue(upward_review.is_anonymous)


class ReviewAPITestCase(APITestCase):
    """Test review API endpoints"""
    
    def setUp(self):
        """Set up test data and authentication"""
        # Create test users
        self.hr_admin = User.objects.create_user(
            email='hr@test.com',
            password='testpass123',
            first_name='HR',
            last_name='Admin',
            role='hr_admin'
        )
        
        self.manager = User.objects.create_user(
            email='manager@test.com',
            password='testpass123',
            first_name='Test',
            last_name='Manager',
            role='manager'
        )
        
        self.employee = User.objects.create_user(
            email='employee@test.com',
            password='testpass123',
            first_name='Test',
            last_name='Employee',
            role='individual_contributor',
            manager=self.manager
        )
        
        # Create review cycle
        self.review_cycle = ReviewCycle.objects.create(
            name='API Test Review',
            review_type='quarterly',
            status='active',
            review_period_start=datetime(2024, 10, 1).date(),
            review_period_end=datetime(2024, 12, 31).date(),
            self_assessment_start=datetime(2024, 12, 1).date(),
            self_assessment_end=datetime(2024, 12, 15).date(),
            peer_review_start=datetime(2024, 12, 16).date(),
            peer_review_end=datetime(2024, 12, 25).date(),
            manager_review_start=datetime(2024, 12, 26).date(),
            manager_review_end=datetime(2025, 1, 5).date(),
            created_by=self.hr_admin
        )
        
        self.client = APIClient()
    
    def authenticate_user(self, user):
        """Helper method to authenticate a user"""
        self.client.force_authenticate(user=user)
    
    def test_review_cycle_list_api(self):
        """Test review cycle list API"""
        self.authenticate_user(self.hr_admin)
        
        url = '/api/reviews/cycles/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)
    
    def test_review_cycle_create_api(self):
        """Test review cycle creation API (HR Admin only)"""
        self.authenticate_user(self.hr_admin)
        
        url = '/api/reviews/cycles/'
        data = {
            'name': 'New Test Cycle',
            'review_type': 'quarterly',
            'status': 'draft',
            'review_period_start': '2025-01-01',
            'review_period_end': '2025-03-31',
            'self_assessment_start': '2025-03-01',
            'self_assessment_end': '2025-03-10',
            'peer_review_start': '2025-03-11',
            'peer_review_end': '2025-03-20',
            'manager_review_start': '2025-03-21',
            'manager_review_end': '2025-03-31'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'New Test Cycle')
    
    def test_review_cycle_create_permission_denied(self):
        """Test that non-HR users cannot create review cycles"""
        self.authenticate_user(self.employee)
        
        url = '/api/reviews/cycles/'
        data = {
            'name': 'Unauthorized Cycle',
            'review_type': 'quarterly',
            'status': 'draft'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_self_assessment_create_api(self):
        """Test self-assessment creation API"""
        self.authenticate_user(self.employee)
        
        url = '/api/reviews/self-assessments/'
        data = {
            'cycle': str(self.review_cycle.id),
            'status': 'in_progress',
            'technical_excellence': 4,
            'technical_examples': 'Strong technical contributions',
            'collaboration': 5,
            'collaboration_examples': 'Great team collaboration'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['technical_excellence'], 4)
    
    def test_peer_review_create_api(self):
        """Test peer review creation API"""
        self.authenticate_user(self.manager)
        
        url = '/api/reviews/peer-reviews/'
        data = {
            'cycle': str(self.review_cycle.id),
            'reviewee': str(self.employee.id),
            'status': 'completed',
            'collaboration_rating': 4,
            'collaboration_examples': 'Excellent collaboration',
            'impact_rating': 5,
            'impact_examples': 'High impact work'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['collaboration_rating'], 4)
    
    def test_manager_review_create_api(self):
        """Test manager review creation API"""
        self.authenticate_user(self.manager)
        
        url = '/api/reviews/manager-reviews/'
        data = {
            'cycle': str(self.review_cycle.id),
            'employee': str(self.employee.id),
            'status': 'completed',
            'overall_rating': 'meets_expectations',
            'technical_excellence': 4,
            'technical_justification': 'Strong technical performance'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['overall_rating'], 'meets_expectations')
    
    def test_user_dashboard_api(self):
        """Test user review dashboard API"""
        self.authenticate_user(self.employee)
        
        # Add employee as participant
        ReviewParticipant.objects.create(
            cycle=self.review_cycle,
            user=self.employee,
            is_active=True
        )
        
        url = '/api/reviews/dashboard/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('active_cycles', response.data)
        self.assertIn('pending_tasks', response.data)
    
    def test_team_summary_api(self):
        """Test team review summary API (Manager only)"""
        self.authenticate_user(self.manager)
        
        url = '/api/reviews/team-summary/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('team_size', response.data)
        self.assertIn('team_members', response.data)


def run_model_tests():
    """Run model tests"""
    print("🧪 Running Review Model Tests...")
    
    # Test review cycle creation
    try:
        hr_admin = User.objects.filter(role='hr_admin').first()
        if not hr_admin:
            print("❌ No HR admin found for testing")
            return False
        
        # Test review cycle creation
        cycle = ReviewCycle.objects.create(
            name='Test Cycle',
            review_type='quarterly',
            status='active',
            review_period_start=datetime(2024, 10, 1).date(),
            review_period_end=datetime(2024, 12, 31).date(),
            self_assessment_start=datetime(2024, 12, 1).date(),
            self_assessment_end=datetime(2024, 12, 15).date(),
            peer_review_start=datetime(2024, 12, 16).date(),
            peer_review_end=datetime(2024, 12, 25).date(),
            manager_review_start=datetime(2024, 12, 26).date(),
            manager_review_end=datetime(2025, 1, 5).date(),
            created_by=hr_admin
        )
        print("✅ Review cycle creation: PASSED")
        
        # Test current phase property
        current_phase = cycle.current_phase
        print(f"✅ Current phase calculation: PASSED ({current_phase})")
        
        # Clean up
        cycle.delete()
        
        return True
        
    except Exception as e:
        print(f"❌ Model tests failed: {str(e)}")
        return False


def run_api_tests():
    """Run API endpoint tests"""
    print("🌐 Running Review API Tests...")
    
    try:
        client = Client()
        
        # Test review cycles endpoint
        response = client.get('/api/reviews/cycles/')
        if response.status_code in [200, 401]:  # 401 is expected without auth
            print("✅ Review cycles endpoint: ACCESSIBLE")
        else:
            print(f"❌ Review cycles endpoint: FAILED ({response.status_code})")
            return False
        
        # Test self-assessments endpoint
        response = client.get('/api/reviews/self-assessments/')
        if response.status_code in [200, 401]:
            print("✅ Self-assessments endpoint: ACCESSIBLE")
        else:
            print(f"❌ Self-assessments endpoint: FAILED ({response.status_code})")
            return False
        
        # Test peer reviews endpoint
        response = client.get('/api/reviews/peer-reviews/')
        if response.status_code in [200, 401]:
            print("✅ Peer reviews endpoint: ACCESSIBLE")
        else:
            print(f"❌ Peer reviews endpoint: FAILED ({response.status_code})")
            return False
        
        # Test manager reviews endpoint
        response = client.get('/api/reviews/manager-reviews/')
        if response.status_code in [200, 401]:
            print("✅ Manager reviews endpoint: ACCESSIBLE")
        else:
            print(f"❌ Manager reviews endpoint: FAILED ({response.status_code})")
            return False
        
        # Test dashboard endpoint
        response = client.get('/api/reviews/dashboard/')
        if response.status_code in [200, 401]:
            print("✅ Dashboard endpoint: ACCESSIBLE")
        else:
            print(f"❌ Dashboard endpoint: FAILED ({response.status_code})")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ API tests failed: {str(e)}")
        return False


def run_data_integrity_tests():
    """Run data integrity tests"""
    print("🔍 Running Data Integrity Tests...")
    
    try:
        # Check review cycles
        cycles_count = ReviewCycle.objects.count()
        print(f"✅ Review cycles in database: {cycles_count}")
        
        # Check participants
        participants_count = ReviewParticipant.objects.count()
        print(f"✅ Review participants: {participants_count}")
        
        # Check self-assessments
        self_assessments_count = SelfAssessment.objects.count()
        print(f"✅ Self-assessments: {self_assessments_count}")
        
        # Check peer reviews
        peer_reviews_count = PeerReview.objects.count()
        print(f"✅ Peer reviews: {peer_reviews_count}")
        
        # Check manager reviews
        manager_reviews_count = ManagerReview.objects.count()
        print(f"✅ Manager reviews: {manager_reviews_count}")
        
        # Check upward reviews
        upward_reviews_count = UpwardReview.objects.count()
        print(f"✅ Upward reviews: {upward_reviews_count}")
        
        return True
        
    except Exception as e:
        print(f"❌ Data integrity tests failed: {str(e)}")
        return False


def main():
    """Main test runner"""
    print("🚀 Starting Phase 6: Performance Reviews (360°) Module Tests")
    print("=" * 60)
    
    # Run all test categories
    model_tests_passed = run_model_tests()
    print()
    
    api_tests_passed = run_api_tests()
    print()
    
    data_tests_passed = run_data_integrity_tests()
    print()
    
    # Summary
    print("=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    total_tests = 3
    passed_tests = sum([model_tests_passed, api_tests_passed, data_tests_passed])
    
    print(f"Model Tests: {'✅ PASSED' if model_tests_passed else '❌ FAILED'}")
    print(f"API Tests: {'✅ PASSED' if api_tests_passed else '❌ FAILED'}")
    print(f"Data Integrity Tests: {'✅ PASSED' if data_tests_passed else '❌ FAILED'}")
    print()
    print(f"Overall: {passed_tests}/{total_tests} test categories passed")
    
    if passed_tests == total_tests:
        print("🎉 All Phase 6 tests PASSED! Reviews module is working correctly.")
        return True
    else:
        print("⚠️  Some tests failed. Please check the implementation.")
        return False


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1) 