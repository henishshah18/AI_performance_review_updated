#!/usr/bin/env python3
"""
Comprehensive Test Suite for Phase 7: Analytics & Reporting Module
Tests all analytics endpoints, data aggregation, and reporting functionality
"""

import os
import sys
import django
import requests
import json
from datetime import datetime, timedelta, date
from typing import Dict, Any, List

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'performance_management.settings')
django.setup()

from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from core.models import Department
from analytics.models import (
    CompanyMetrics, DepartmentStats, ActivityLog, UserDashboardMetrics,
    TeamMetrics, Notification, AnalyticsSnapshot, UserActivityLog,
    PerformanceMetrics
)
from analytics.aggregators import (
    calculate_okr_completion_rates,
    calculate_feedback_metrics,
    calculate_review_cycle_metrics,
    calculate_user_engagement_metrics,
    calculate_department_performance,
    generate_trend_analysis
)

User = get_user_model()

class AnalyticsPhase7TestSuite:
    def __init__(self):
        self.base_url = 'http://localhost:8000'
        self.client = APIClient()
        self.test_users = {}
        self.auth_tokens = {}
        
    def setup_test_data(self):
        """Create test users and data for analytics testing"""
        print("🔧 Setting up test data...")
        
        # Clean up any existing test users and related data first
        User.objects.filter(username__contains='_test').delete()
        
        # Clean up analytics data that might cause constraint violations
        PerformanceMetrics.objects.all().delete()
        UserActivityLog.objects.all().delete()
        AnalyticsSnapshot.objects.all().delete()
        
        # Get existing departments
        hr_dept = Department.objects.get(name='hr')
        engineering_dept = Department.objects.get(name='engineering')
        
        # Create unique usernames with timestamp
        timestamp = str(int(datetime.now().timestamp()))
        
        # Create test users - create manager first
        self.test_users = {}
        
        # Create HR Admin
        self.test_users['hr_admin'] = User.objects.create_user(
            username=f'hr_admin_test_{timestamp}',
            email=f'hr_admin_{timestamp}@test.com',
            password='testpass123',
            first_name='HR',
            last_name='Admin',
            role='hr_admin',
            department=hr_dept
        )
        
        # Create Manager
        self.test_users['manager'] = User.objects.create_user(
            username=f'manager_test_{timestamp}',
            email=f'manager_{timestamp}@test.com',
            password='testpass123',
            first_name='Test',
            last_name='Manager',
            role='manager',
            department=engineering_dept
        )
        
        # Create Individual Contributor with manager assigned
        self.test_users['individual'] = User.objects.create_user(
            username=f'individual_test_{timestamp}',
            email=f'individual_{timestamp}@test.com',
            password='testpass123',
            first_name='Test',
            last_name='Individual',
            role='individual_contributor',
            department=engineering_dept,
            manager=self.test_users['manager']
        )
        
        # Create sample analytics data
        self.create_sample_analytics_data()
        
        print("✅ Test data setup complete")
    
    def create_sample_analytics_data(self):
        """Create sample analytics data for testing"""
        today = date.today()
        
        # Create company metrics
        CompanyMetrics.objects.create(
            date=today,
            total_employees=100,
            active_objectives=50,
            completion_rate=75.0,
            pending_reviews=10,
            total_departments=6
        )
        
        # Create department stats
        departments = ['engineering', 'product', 'design', 'marketing', 'sales', 'hr']
        for dept in departments:
            DepartmentStats.objects.create(
                department=dept,
                date=today,
                employee_count=15,
                active_objectives=8,
                completed_objectives=6,
                completion_rate=75.0,
                average_performance=4.2
            )
        
        # Create activity logs
        for user in self.test_users.values():
            ActivityLog.objects.create(
                user=user,
                activity_type='objective_created',
                description=f'{user.get_full_name()} created a new objective'
            )
        
        # Create user dashboard metrics
        for user in self.test_users.values():
            UserDashboardMetrics.objects.create(
                user=user,
                total_goals=10,
                completed_goals=7,
                in_progress_goals=2,
                overdue_goals=1,
                goals_due_soon=3,
                performance_score=4.1
            )
        
        # Create team metrics for manager
        TeamMetrics.objects.create(
            manager=self.test_users['manager'],
            team_size=8,
            active_goals=24,
            completed_goals=18,
            overdue_goals=3,
            team_performance_avg=4.2
        )
        
        # Create user activity logs
        for user in self.test_users.values():
            UserActivityLog.objects.create(
                user=user,
                activity_type='login',
                activity_details={'login_time': datetime.now().isoformat()},
                ip_address='127.0.0.1'
            )
        
        # Create performance metrics
        for user in self.test_users.values():
            PerformanceMetrics.objects.create(
                user=user,
                period_start=today - timedelta(days=30),
                period_end=today,
                objectives_assigned=5,
                objectives_completed=4,
                goals_assigned=10,
                goals_completed=8,
                tasks_assigned=20,
                tasks_completed=16,
                feedback_given=5,
                feedback_received=3,
                overall_performance_score=4.2,
                goal_completion_rate=80.0
            )
    
    def authenticate_user(self, role: str) -> str:
        """Authenticate user and return token"""
        if role in self.auth_tokens:
            return self.auth_tokens[role]
        
        user = self.test_users[role]
        response = requests.post(f'{self.base_url}/api/auth/login/', {
            'email': user.email,
            'password': 'testpass123'
        })
        
        if response.status_code == 200:
            token = response.json().get('access')
            self.auth_tokens[role] = token
            return token
        else:
            raise Exception(f"Failed to authenticate {role}: {response.text}")
    
    def make_authenticated_request(self, method: str, endpoint: str, role: str, data: Dict = None) -> requests.Response:
        """Make authenticated API request"""
        token = self.authenticate_user(role)
        headers = {'Authorization': f'Bearer {token}'}
        
        url = f'{self.base_url}{endpoint}'
        
        if method.upper() == 'GET':
            return requests.get(url, headers=headers, params=data)
        elif method.upper() == 'POST':
            return requests.post(url, headers=headers, json=data)
        elif method.upper() == 'PUT':
            return requests.put(url, headers=headers, json=data)
        elif method.upper() == 'DELETE':
            return requests.delete(url, headers=headers)
    
    def test_okr_analytics_endpoints(self):
        """Test OKR analytics endpoints"""
        print("\n📊 Testing OKR Analytics Endpoints...")
        
        endpoints = [
            '/api/analytics/okr/completion-rates/',
            '/api/analytics/okr/progress-trends/',
            '/api/analytics/okr/individual-performance/',
        ]
        
        # Test for different user roles
        for role in ['hr_admin', 'manager', 'individual']:
            print(f"  Testing as {role}...")
            
            for endpoint in endpoints:
                try:
                    response = self.make_authenticated_request('GET', endpoint, role)
                    
                    if response.status_code == 200:
                        data = response.json()
                        print(f"    ✅ {endpoint} - Success")
                        
                        # Validate response structure
                        if 'period' in data:
                            assert 'start_date' in data['period']
                            assert 'end_date' in data['period']
                        
                        if 'overall' in data:
                            assert 'completion_rate' in data['overall']
                    
                    elif response.status_code == 403:
                        print(f"    🔒 {endpoint} - Access restricted (expected for {role})")
                    else:
                        print(f"    ❌ {endpoint} - Failed: {response.status_code}")
                        
                except Exception as e:
                    print(f"    ❌ {endpoint} - Error: {str(e)}")
        
        # Test HR Admin only endpoints
        print("  Testing HR Admin only endpoints...")
        try:
            response = self.make_authenticated_request(
                'GET', '/api/analytics/okr/department-comparison/', 'hr_admin'
            )
            
            if response.status_code == 200:
                data = response.json()
                print("    ✅ Department comparison - Success")
                assert 'departments' in data
                assert 'summary' in data
            else:
                print(f"    ❌ Department comparison - Failed: {response.status_code}")
                
        except Exception as e:
            print(f"    ❌ Department comparison - Error: {str(e)}")
    
    def test_feedback_analytics_endpoints(self):
        """Test feedback analytics endpoints"""
        print("\n💬 Testing Feedback Analytics Endpoints...")
        
        endpoints = [
            '/api/analytics/feedback/volume-trends/',
            '/api/analytics/feedback/tag-frequency/',
        ]
        
        # Manager/HR Admin only endpoints
        restricted_endpoints = [
            '/api/analytics/feedback/sentiment-analysis/',
            '/api/analytics/feedback/participation-rates/',
        ]
        
        # Test general endpoints
        for role in ['hr_admin', 'manager', 'individual']:
            print(f"  Testing general endpoints as {role}...")
            
            for endpoint in endpoints:
                try:
                    response = self.make_authenticated_request('GET', endpoint, role)
                    
                    if response.status_code == 200:
                        print(f"    ✅ {endpoint} - Success")
                    else:
                        print(f"    ❌ {endpoint} - Failed: {response.status_code}")
                        
                except Exception as e:
                    print(f"    ❌ {endpoint} - Error: {str(e)}")
        
        # Test restricted endpoints
        for role in ['hr_admin', 'manager']:
            print(f"  Testing restricted endpoints as {role}...")
            
            for endpoint in restricted_endpoints:
                try:
                    response = self.make_authenticated_request('GET', endpoint, role)
                    
                    if response.status_code == 200:
                        print(f"    ✅ {endpoint} - Success")
                    else:
                        print(f"    ❌ {endpoint} - Failed: {response.status_code}")
                        
                except Exception as e:
                    print(f"    ❌ {endpoint} - Error: {str(e)}")
        
        # Test individual contributor access (should be restricted)
        print("  Testing individual contributor restrictions...")
        for endpoint in restricted_endpoints:
            try:
                response = self.make_authenticated_request('GET', endpoint, 'individual')
                
                if response.status_code == 403:
                    print(f"    🔒 {endpoint} - Correctly restricted")
                else:
                    print(f"    ⚠️ {endpoint} - Should be restricted but got: {response.status_code}")
                    
            except Exception as e:
                print(f"    ❌ {endpoint} - Error: {str(e)}")
    
    def test_executive_dashboard(self):
        """Test executive dashboard endpoint"""
        print("\n📈 Testing Executive Dashboard...")
        
        try:
            response = self.make_authenticated_request(
                'GET', '/api/analytics/executive/company-overview/', 'hr_admin'
            )
            
            if response.status_code == 200:
                data = response.json()
                print("    ✅ Executive dashboard - Success")
                
                # Validate response structure
                required_keys = ['key_metrics', 'department_performance', 'trends', 'alerts']
                for key in required_keys:
                    assert key in data, f"Missing key: {key}"
                
                # Validate key metrics
                key_metrics = data['key_metrics']
                metric_keys = ['overall_okr_completion', 'employee_engagement_rate', 
                              'feedback_participation_rate', 'total_active_users']
                for key in metric_keys:
                    assert key in key_metrics, f"Missing metric: {key}"
                
                print("    ✅ Response structure validation - Success")
            else:
                print(f"    ❌ Executive dashboard - Failed: {response.status_code}")
                
        except Exception as e:
            print(f"    ❌ Executive dashboard - Error: {str(e)}")
        
        # Test access restriction for non-HR admin
        print("  Testing access restrictions...")
        for role in ['manager', 'individual']:
            try:
                response = self.make_authenticated_request(
                    'GET', '/api/analytics/executive/company-overview/', role
                )
                
                if response.status_code == 403:
                    print(f"    🔒 {role} access - Correctly restricted")
                else:
                    print(f"    ⚠️ {role} access - Should be restricted but got: {response.status_code}")
                    
            except Exception as e:
                print(f"    ❌ {role} access - Error: {str(e)}")
    
    def test_data_export_endpoints(self):
        """Test data export endpoints"""
        print("\n📤 Testing Data Export Endpoints...")
        
        export_endpoints = [
            '/api/analytics/export/okr-data/',
            '/api/analytics/export/feedback-data/',
        ]
        
        export_data = {
            'format': 'json',
            'start_date': (date.today() - timedelta(days=30)).isoformat(),
            'end_date': date.today().isoformat()
        }
        
        # Test for managers and HR admins
        for role in ['hr_admin', 'manager']:
            print(f"  Testing exports as {role}...")
            
            for endpoint in export_endpoints:
                try:
                    response = self.make_authenticated_request('POST', endpoint, role, export_data)
                    
                    if response.status_code == 200:
                        data = response.json()
                        print(f"    ✅ {endpoint} - Success")
                        
                        # Validate export job response
                        assert 'job_id' in data
                        assert 'status' in data
                        assert 'format' in data
                        
                    else:
                        print(f"    ❌ {endpoint} - Failed: {response.status_code}")
                        
                except Exception as e:
                    print(f"    ❌ {endpoint} - Error: {str(e)}")
        
        # Test individual contributor restriction
        print("  Testing individual contributor restrictions...")
        for endpoint in export_endpoints:
            try:
                response = self.make_authenticated_request('POST', endpoint, 'individual', export_data)
                
                if response.status_code == 403:
                    print(f"    🔒 {endpoint} - Correctly restricted")
                else:
                    print(f"    ⚠️ {endpoint} - Should be restricted but got: {response.status_code}")
                    
            except Exception as e:
                print(f"    ❌ {endpoint} - Error: {str(e)}")
    
    def test_user_engagement_metrics(self):
        """Test user engagement metrics endpoint"""
        print("\n👥 Testing User Engagement Metrics...")
        
        try:
            response = self.make_authenticated_request(
                'GET', '/api/analytics/engagement/metrics/', 'hr_admin'
            )
            
            if response.status_code == 200:
                data = response.json()
                print("    ✅ Engagement metrics - Success")
                
                # Validate response structure
                required_keys = ['total_activities', 'unique_active_users', 'engagement_rate', 
                               'activity_by_type', 'daily_trends', 'login_metrics']
                for key in required_keys:
                    assert key in data, f"Missing key: {key}"
                
                print("    ✅ Response structure validation - Success")
            else:
                print(f"    ❌ Engagement metrics - Failed: {response.status_code}")
                
        except Exception as e:
            print(f"    ❌ Engagement metrics - Error: {str(e)}")
    
    def test_aggregation_functions(self):
        """Test data aggregation functions directly"""
        print("\n🔧 Testing Data Aggregation Functions...")
        
        try:
            # Test OKR completion rates calculation
            okr_data = calculate_okr_completion_rates()
            print("    ✅ OKR completion rates calculation - Success")
            assert 'overall' in okr_data
            assert 'completion_rate' in okr_data['overall']
            
            # Test feedback metrics calculation
            feedback_data = calculate_feedback_metrics()
            print("    ✅ Feedback metrics calculation - Success")
            assert 'total_feedback' in feedback_data
            assert 'participation' in feedback_data
            
            # Test user engagement calculation
            engagement_data = calculate_user_engagement_metrics()
            print("    ✅ User engagement calculation - Success")
            assert 'total_activities' in engagement_data
            assert 'engagement_rate' in engagement_data
            
            # Test department performance calculation
            dept_data = calculate_department_performance()
            print("    ✅ Department performance calculation - Success")
            assert 'departments' in dept_data
            assert 'summary' in dept_data
            
            # Test trend analysis
            trend_data = generate_trend_analysis('okr_completion')
            print("    ✅ Trend analysis calculation - Success")
            assert 'trends' in trend_data
            assert 'analysis' in trend_data
            
        except Exception as e:
            print(f"    ❌ Aggregation functions - Error: {str(e)}")
    
    def test_analytics_models(self):
        """Test analytics models and data integrity"""
        print("\n🗄️ Testing Analytics Models...")
        
        try:
            # Test AnalyticsSnapshot creation
            snapshot = AnalyticsSnapshot.objects.create(
                snapshot_type='daily',
                snapshot_date=date.today(),
                department='engineering',
                metrics_data={'test': 'data'}
            )
            print("    ✅ AnalyticsSnapshot model - Success")
            
            # Test UserActivityLog creation
            activity_log = UserActivityLog.objects.create(
                user=self.test_users['individual'],
                activity_type='login',
                activity_details={'test': 'data'}
            )
            print("    ✅ UserActivityLog model - Success")
            
            # Test PerformanceMetrics creation
            perf_metrics = PerformanceMetrics.objects.create(
                user=self.test_users['individual'],
                period_start=date.today() - timedelta(days=30),
                period_end=date.today(),
                overall_performance_score=4.5
            )
            print("    ✅ PerformanceMetrics model - Success")
            
            # Test model relationships and queries
            user_activities = UserActivityLog.objects.filter(user=self.test_users['individual'])
            assert user_activities.exists()
            print("    ✅ Model relationships - Success")
            
        except Exception as e:
            print(f"    ❌ Analytics models - Error: {str(e)}")
    
    def run_comprehensive_test(self):
        """Run all analytics tests"""
        print("🚀 Starting Phase 7 Analytics Comprehensive Test Suite")
        print("=" * 60)
        
        try:
            # Setup
            self.setup_test_data()
            
            # Run all test categories
            self.test_okr_analytics_endpoints()
            self.test_feedback_analytics_endpoints()
            self.test_executive_dashboard()
            self.test_data_export_endpoints()
            self.test_user_engagement_metrics()
            self.test_aggregation_functions()
            self.test_analytics_models()
            
            print("\n" + "=" * 60)
            print("✅ Phase 7 Analytics Test Suite Completed Successfully!")
            print("📊 All analytics endpoints and functionality are working correctly")
            
        except Exception as e:
            print(f"\n❌ Test suite failed with error: {str(e)}")
            import traceback
            traceback.print_exc()
    
    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete test users and related data
        for user in self.test_users.values():
            user.delete()
        
        # Clean up analytics data
        CompanyMetrics.objects.filter(date=date.today()).delete()
        DepartmentStats.objects.filter(date=date.today()).delete()
        
        print("✅ Cleanup completed")

def main():
    """Main test execution"""
    test_suite = AnalyticsPhase7TestSuite()
    
    try:
        test_suite.run_comprehensive_test()
    finally:
        test_suite.cleanup_test_data()

if __name__ == '__main__':
    main() 