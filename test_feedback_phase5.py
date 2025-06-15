#!/usr/bin/env python3
"""
Comprehensive Test Script for Phase 5: Continuous Feedback Module
Tests all feedback functionality including models, APIs, and business rules.
"""

import os
import sys
import django
import json
from datetime import datetime, timedelta

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'performance_management.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.test import TestCase, Client
from django.urls import reverse
from django.core.exceptions import ValidationError
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from feedback.models import Feedback, FeedbackTag, FeedbackTagTemplate, FeedbackComment
from okr.models import Objective, Goal, IndividualTask
from core.models import Department

User = get_user_model()


class FeedbackPhase5TestSuite:
    """Comprehensive test suite for Phase 5 feedback functionality"""
    
    def __init__(self):
        self.client = APIClient()
        self.test_results = []
        self.setup_test_data()
    
    def setup_test_data(self):
        """Setup test users and data"""
        print("Setting up test data...")
        
        # Get or create department
        self.department, _ = Department.objects.get_or_create(
            name='engineering',
            defaults={'description': 'Engineering Department'}
        )
        
        # Create test users
        self.hr_admin = User.objects.filter(role='hr_admin').first()
        if not self.hr_admin:
            self.hr_admin = User.objects.create_user(
                username='hradmin',
                email='hr@test.com',
                password='testpass123',
                first_name='HR',
                last_name='Admin',
                role='hr_admin',
                department=self.department
            )
        
        self.manager = User.objects.filter(role='manager').first()
        if not self.manager:
            self.manager = User.objects.create_user(
                username='manager1',
                email='manager@test.com',
                password='testpass123',
                first_name='Test',
                last_name='Manager',
                role='manager',
                department=self.department
            )
        
        self.individual1 = User.objects.filter(role='individual_contributor').first()
        if not self.individual1:
            self.individual1 = User.objects.create_user(
                username='individual1',
                email='individual1@test.com',
                password='testpass123',
                first_name='John',
                last_name='Developer',
                role='individual_contributor',
                department=self.department,
                manager=self.manager
            )
        
        self.individual2 = User.objects.filter(role='individual_contributor').exclude(id=self.individual1.id).first()
        if not self.individual2:
            self.individual2 = User.objects.create_user(
                username='individual2',
                email='individual2@test.com',
                password='testpass123',
                first_name='Jane',
                last_name='Designer',
                role='individual_contributor',
                department=self.department,
                manager=self.manager
            )
    
    def get_auth_token(self, user):
        """Get JWT token for user authentication"""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def authenticate_user(self, user):
        """Authenticate user for API calls"""
        token = self.get_auth_token(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    
    def log_test_result(self, test_name, passed, message=""):
        """Log test result"""
        status_icon = "✅" if passed else "❌"
        self.test_results.append({
            'test': test_name,
            'passed': passed,
            'message': message
        })
        print(f"{status_icon} {test_name}: {message}")
    
    def test_feedback_models(self):
        """Test feedback model creation and validation"""
        print("\n=== Testing Feedback Models ===")
        
        try:
            # Test feedback creation
            feedback = Feedback.objects.create(
                from_user=self.manager,
                to_user=self.individual1,
                content="Great work on the project! Your attention to detail was excellent.",
                feedback_type='commendation',
                visibility='public'
            )
            
            self.log_test_result(
                "Feedback Model Creation",
                True,
                f"Created feedback: {feedback.id}"
            )
            
            # Test feedback properties
            display_sender = feedback.display_sender
            content_preview = feedback.content_preview
            
            self.log_test_result(
                "Feedback Properties",
                display_sender == self.manager.get_full_name() and len(content_preview) > 0,
                f"Display sender: {display_sender}, Preview: {content_preview[:30]}..."
            )
            
            # Test self-feedback validation
            try:
                Feedback.objects.create(
                    from_user=self.individual1,
                    to_user=self.individual1,
                    content="Self feedback test",
                    feedback_type='commendation'
                )
                self.log_test_result("Self-Feedback Validation", False, "Should not allow self-feedback")
            except ValidationError:
                self.log_test_result("Self-Feedback Validation", True, "Correctly prevented self-feedback")
            
        except Exception as e:
            self.log_test_result("Feedback Model Creation", False, str(e))
    
    def test_feedback_tag_templates(self):
        """Test feedback tag template functionality"""
        print("\n=== Testing Feedback Tag Templates ===")
        
        try:
            # Test tag template creation
            template = FeedbackTagTemplate.objects.create(
                name='test-skill',
                category='skill',
                description='Test skill tag',
                created_by=self.hr_admin
            )
            
            self.log_test_result(
                "Tag Template Creation",
                True,
                f"Created template: {template.name}"
            )
            
            # Test usage count
            feedback = Feedback.objects.first()
            if feedback:
                FeedbackTag.objects.create(
                    feedback=feedback,
                    tag_name='test-skill'
                )
                
                usage_count = template.usage_count
                self.log_test_result(
                    "Tag Usage Count",
                    usage_count > 0,
                    f"Usage count: {usage_count}"
                )
            
        except Exception as e:
            self.log_test_result("Tag Template Creation", False, str(e))
    
    def test_feedback_comments(self):
        """Test feedback comment functionality"""
        print("\n=== Testing Feedback Comments ===")
        
        try:
            feedback = Feedback.objects.first()
            if feedback:
                # Test comment creation
                comment = FeedbackComment.objects.create(
                    feedback=feedback,
                    comment_by=feedback.to_user,
                    content="Thank you for this feedback!"
                )
                
                self.log_test_result(
                    "Comment Creation",
                    True,
                    f"Created comment: {comment.id}"
                )
                
                # Test comment validation
                try:
                    FeedbackComment.objects.create(
                        feedback=feedback,
                        comment_by=self.individual2,  # Not involved in feedback
                        content="Unauthorized comment"
                    )
                    self.log_test_result("Comment Permission Validation", False, "Should not allow unauthorized comments")
                except ValidationError:
                    self.log_test_result("Comment Permission Validation", True, "Correctly prevented unauthorized comment")
            
        except Exception as e:
            self.log_test_result("Comment Creation", False, str(e))
    
    def test_feedback_api_endpoints(self):
        """Test feedback API endpoints"""
        print("\n=== Testing Feedback API Endpoints ===")
        
        # Test feedback list endpoint
        self.authenticate_user(self.manager)
        response = self.client.get('/api/feedback/')
        
        self.log_test_result(
            "Feedback List API",
            response.status_code == 200,
            f"Status: {response.status_code}, Count: {response.data.get('count', 0) if hasattr(response, 'data') else 'N/A'}"
        )
        
        # Test feedback creation
        feedback_data = {
            'to_user': self.individual1.id,
            'content': 'API test feedback - excellent problem solving skills!',
            'feedback_type': 'commendation',
            'visibility': 'public',
            'tag_names': ['problem-solving', 'technical-expertise']
        }
        
        response = self.client.post('/api/feedback/', feedback_data, format='json')
        
        self.log_test_result(
            "Feedback Creation API",
            response.status_code == 201,
            f"Status: {response.status_code}"
        )
        
        if response.status_code == 201:
            feedback_id = response.data['id']
            
            # Test feedback detail endpoint
            response = self.client.get(f'/api/feedback/{feedback_id}/')
            
            self.log_test_result(
                "Feedback Detail API",
                response.status_code == 200,
                f"Status: {response.status_code}"
            )
    
    def test_feedback_analytics(self):
        """Test feedback analytics endpoint"""
        print("\n=== Testing Feedback Analytics ===")
        
        self.authenticate_user(self.individual1)
        response = self.client.get('/api/feedback/analytics/')
        
        self.log_test_result(
            "Feedback Analytics API",
            response.status_code == 200,
            f"Status: {response.status_code}"
        )
        
        if response.status_code == 200:
            analytics_data = response.data
            required_fields = ['total_given', 'total_received', 'feedback_by_type', 'recent_feedback']
            
            has_all_fields = all(field in analytics_data for field in required_fields)
            self.log_test_result(
                "Analytics Data Structure",
                has_all_fields,
                f"Has required fields: {has_all_fields}"
            )
    
    def test_team_feedback_summary(self):
        """Test team feedback summary for managers"""
        print("\n=== Testing Team Feedback Summary ===")
        
        self.authenticate_user(self.manager)
        response = self.client.get('/api/feedback/team-summary/')
        
        self.log_test_result(
            "Team Feedback Summary API",
            response.status_code == 200,
            f"Status: {response.status_code}"
        )
        
        # Test individual access (should be forbidden)
        self.authenticate_user(self.individual1)
        response = self.client.get('/api/feedback/team-summary/')
        
        self.log_test_result(
            "Team Summary Access Control",
            response.status_code == 403,
            f"Individual access correctly forbidden: {response.status_code}"
        )
    
    def test_tag_management(self):
        """Test feedback tag management"""
        print("\n=== Testing Tag Management ===")
        
        # Test tag template list
        self.authenticate_user(self.hr_admin)
        response = self.client.get('/api/feedback/settings/tag-templates/')
        
        self.log_test_result(
            "Tag Template List API",
            response.status_code == 200,
            f"Status: {response.status_code}, Count: {len(response.data) if hasattr(response, 'data') else 'N/A'}"
        )
        
        # Test tag template creation (HR Admin only)
        template_data = {
            'name': 'api-test-tag',
            'category': 'skill',
            'description': 'API test tag template'
        }
        
        response = self.client.post('/api/feedback/settings/tag-templates/', template_data, format='json')
        
        self.log_test_result(
            "Tag Template Creation API",
            response.status_code == 201,
            f"Status: {response.status_code}"
        )
        
        # Test individual access (should be forbidden for creation)
        self.authenticate_user(self.individual1)
        response = self.client.post('/api/feedback/settings/tag-templates/', template_data, format='json')
        
        self.log_test_result(
            "Tag Template Creation Access Control",
            response.status_code == 403,
            f"Individual creation correctly forbidden: {response.status_code}"
        )
    
    def test_feedback_filtering(self):
        """Test feedback filtering and search"""
        print("\n=== Testing Feedback Filtering ===")
        
        self.authenticate_user(self.manager)
        
        # Test feedback type filtering
        response = self.client.get('/api/feedback/?feedback_type=commendation')
        
        self.log_test_result(
            "Feedback Type Filtering",
            response.status_code == 200,
            f"Status: {response.status_code}"
        )
        
        # Test visibility filtering
        response = self.client.get('/api/feedback/?visibility=public')
        
        self.log_test_result(
            "Feedback Visibility Filtering",
            response.status_code == 200,
            f"Status: {response.status_code}"
        )
        
        # Test search functionality
        response = self.client.get('/api/feedback/?search=excellent')
        
        self.log_test_result(
            "Feedback Search",
            response.status_code == 200,
            f"Status: {response.status_code}"
        )
    
    def test_role_based_access(self):
        """Test role-based access control"""
        print("\n=== Testing Role-Based Access Control ===")
        
        # Create feedback between individuals
        feedback = Feedback.objects.create(
            from_user=self.individual1,
            to_user=self.individual2,
            content="Peer feedback test",
            feedback_type='guidance',
            visibility='private'
        )
        
        # Test individual can see their own feedback
        self.authenticate_user(self.individual1)
        response = self.client.get(f'/api/feedback/{feedback.id}/')
        
        self.log_test_result(
            "Individual Own Feedback Access",
            response.status_code == 200,
            f"Status: {response.status_code}"
        )
        
        # Test manager can see team feedback
        self.authenticate_user(self.manager)
        response = self.client.get(f'/api/feedback/{feedback.id}/')
        
        self.log_test_result(
            "Manager Team Feedback Access",
            response.status_code == 200,
            f"Status: {response.status_code}"
        )
        
        # Test HR Admin can see all feedback
        self.authenticate_user(self.hr_admin)
        response = self.client.get(f'/api/feedback/{feedback.id}/')
        
        self.log_test_result(
            "HR Admin All Feedback Access",
            response.status_code == 200,
            f"Status: {response.status_code}"
        )
    
    def test_trending_tags(self):
        """Test trending tags endpoint"""
        print("\n=== Testing Trending Tags ===")
        
        self.authenticate_user(self.individual1)
        response = self.client.get('/api/feedback/tags/trending/')
        
        self.log_test_result(
            "Trending Tags API",
            response.status_code == 200,
            f"Status: {response.status_code}, Tags: {len(response.data) if hasattr(response, 'data') else 'N/A'}"
        )
    
    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting Phase 5 Feedback Module Test Suite")
        print("=" * 60)
        
        # Run all test methods
        self.test_feedback_models()
        self.test_feedback_tag_templates()
        self.test_feedback_comments()
        self.test_feedback_api_endpoints()
        self.test_feedback_analytics()
        self.test_team_feedback_summary()
        self.test_tag_management()
        self.test_feedback_filtering()
        self.test_role_based_access()
        self.test_trending_tags()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed_tests = sum(1 for result in self.test_results if result['passed'])
        total_tests = len(self.test_results)
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {total_tests - passed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print("🎉 EXCELLENT! Phase 5 implementation is highly successful!")
        elif success_rate >= 75:
            print("✅ GOOD! Phase 5 implementation is mostly working well.")
        elif success_rate >= 50:
            print("⚠️  FAIR! Phase 5 implementation needs some improvements.")
        else:
            print("❌ POOR! Phase 5 implementation needs significant work.")
        
        # Print failed tests
        failed_tests = [result for result in self.test_results if not result['passed']]
        if failed_tests:
            print("\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['message']}")
        
        return success_rate


if __name__ == "__main__":
    try:
        test_suite = FeedbackPhase5TestSuite()
        success_rate = test_suite.run_all_tests()
        
        # Exit with appropriate code
        sys.exit(0 if success_rate >= 75 else 1)
        
    except Exception as e:
        print(f"❌ Test suite failed to run: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1) 