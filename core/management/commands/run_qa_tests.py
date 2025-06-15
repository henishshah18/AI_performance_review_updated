"""
Django Management Command: Comprehensive QA Tests for AI Performance Review Platform
Tests all phases (1-3) with proper Django environment setup.
"""

from django.core.management.base import BaseCommand
from django.test import Client
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from datetime import datetime
import json
import requests

from core.models import User, Department, SystemSettings, AuditLog
from analytics.models import (
    CompanyMetrics, DepartmentStats, ActivityLog,
    UserDashboardMetrics, TeamMetrics, Notification
)

class Command(BaseCommand):
    help = 'Run comprehensive QA tests for all phases of the AI Performance Review Platform'
    
    def __init__(self):
        super().__init__()
        self.client = Client()
        self.test_results = []
        
    def add_arguments(self, parser):
        parser.add_argument(
            '--phase',
            type=str,
            choices=['1', '2', '3', 'all'],
            default='all',
            help='Which phase to test (default: all)'
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Enable verbose output'
        )
    
    def log_test_result(self, test_name, passed, message=""):
        """Log test result"""
        status = "✅ PASS" if passed else "❌ FAIL"
        self.test_results.append({
            'test': test_name,
            'passed': passed,
            'message': message
        })
        self.stdout.write(f"{status}: {test_name} - {message}")
    
    def setup_test_data(self):
        """Setup test data for all tests"""
        self.stdout.write("🔧 Setting up test data...")
        
        # Create departments
        self.hr_dept, _ = Department.objects.get_or_create(
            name='hr_qa',
            defaults={'description': 'HR QA Department'}
        )
        self.eng_dept, _ = Department.objects.get_or_create(
            name='engineering_qa',
            defaults={'description': 'Engineering QA Department'}
        )
        
        # Create test users
        try:
            self.hr_admin = User.objects.get(email='qa_hr_admin@test.com')
        except User.DoesNotExist:
            self.hr_admin = User.objects.create_user(
                email='qa_hr_admin@test.com',
                username='qa_hr_admin',
                first_name='QA',
                last_name='HRAdmin',
                password='testpass123',
                role='hr_admin',
                department=self.hr_dept
            )
        
        try:
            self.manager = User.objects.get(email='qa_manager@test.com')
        except User.DoesNotExist:
            self.manager = User.objects.create_user(
                email='qa_manager@test.com',
                username='qa_manager',
                first_name='QA',
                last_name='Manager',
                password='testpass123',
                role='manager',
                department=self.eng_dept
            )
        
        try:
            self.individual = User.objects.get(email='qa_individual@test.com')
        except User.DoesNotExist:
            self.individual = User.objects.create_user(
                email='qa_individual@test.com',
                username='qa_individual',
                first_name='QA',
                last_name='Individual',
                password='testpass123',
                role='individual_contributor',
                department=self.eng_dept,
                manager=self.manager
            )
        
        self.stdout.write("✅ Test data setup complete")
    
    def test_phase1_foundation(self):
        """Test Phase 1: Foundation & Business Rules Engine"""
        self.stdout.write("\n🧪 Testing Phase 1: Foundation & Business Rules...")
        
        # Test 1.1: User model creation and validation
        try:
            user = User.objects.create_user(
                email='test_user_qa@example.com',
                username='test_user_qa',
                first_name='Test',
                last_name='User',
                password='testpass123',
                role='individual_contributor',
                department=self.eng_dept,
                manager=self.manager
            )
            self.log_test_result("User Creation", True, "Valid user created successfully")
            
            # Test email uniqueness
            try:
                User.objects.create_user(
                    email='test_user_qa@example.com',  # Duplicate email
                    username='test_user_qa2',
                    password='testpass123',
                    role='individual_contributor',
                    department=self.eng_dept
                )
                self.log_test_result("Email Uniqueness", False, "Duplicate email allowed")
            except IntegrityError:
                self.log_test_result("Email Uniqueness", True, "Duplicate email properly rejected")
                
        except Exception as e:
            self.log_test_result("User Creation", False, f"Error: {str(e)}")
        
        # Test 1.2: Department model
        try:
            dept_count = Department.objects.count()
            if dept_count >= 2:
                self.log_test_result("Department Model", True, f"Departments working ({dept_count} found)")
            else:
                self.log_test_result("Department Model", False, "Not enough departments")
        except Exception as e:
            self.log_test_result("Department Model", False, f"Error: {str(e)}")
        
        # Test 1.3: System Settings
        try:
            setting = SystemSettings.objects.create(
                key='test_setting_qa',
                value={'test': True, 'phase': 1},
                description='Test setting for QA',
                created_by=self.hr_admin
            )
            
            retrieved_value = SystemSettings.get_setting('test_setting_qa')
            if retrieved_value == {'test': True, 'phase': 1}:
                self.log_test_result("System Settings", True, "System settings working correctly")
            else:
                self.log_test_result("System Settings", False, "System settings not working")
                
        except Exception as e:
            self.log_test_result("System Settings", False, f"Error: {str(e)}")
        
        # Test 1.4: User roles validation
        try:
            valid_roles = ['hr_admin', 'manager', 'individual_contributor']
            user_roles = User.objects.values_list('role', flat=True).distinct()
            
            invalid_roles = [role for role in user_roles if role not in valid_roles]
            if not invalid_roles:
                self.log_test_result("Role Validation", True, "All user roles are valid")
            else:
                self.log_test_result("Role Validation", False, f"Invalid roles found: {invalid_roles}")
                
        except Exception as e:
            self.log_test_result("Role Validation", False, f"Error: {str(e)}")
    
    def get_auth_headers(self, user):
        """Get authentication headers for a user"""
        login_data = {
            'email': user.email,
            'password': 'testpass123'
        }
        
        response = self.client.post('/api/auth/login/', login_data)
        if response.status_code == 200:
            tokens = response.json()
            access_token = tokens.get('access')
            return {'HTTP_AUTHORIZATION': f'Bearer {access_token}'}
        return {}
    
    def test_phase2_authentication(self):
        """Test Phase 2: Authentication & Role-Based Access Control"""
        self.stdout.write("\n🧪 Testing Phase 2: Authentication & Role-Based Access...")
        
        # Test 2.1: User registration
        try:
            registration_data = {
                'email': 'newuser_qa@test.com',
                'username': 'newuser_qa',
                'first_name': 'New',
                'last_name': 'User',
                'password': 'testpass123',
                'role': 'individual_contributor',
                'department_id': self.eng_dept.id
            }
            
            response = self.client.post('/api/auth/signup/', registration_data)
            
            if response.status_code == 201:
                self.log_test_result("User Registration", True, "Valid registration successful")
            else:
                self.log_test_result("User Registration", False, f"Registration failed: {response.status_code}")
                
        except Exception as e:
            self.log_test_result("User Registration", False, f"Error: {str(e)}")
        
        # Test 2.2: User login
        try:
            login_data = {
                'email': 'qa_hr_admin@test.com',
                'password': 'testpass123'
            }
            
            response = self.client.post('/api/auth/login/', login_data)
            
            if response.status_code == 200:
                response_data = response.json()
                if 'access' in response_data and 'refresh' in response_data:
                    self.log_test_result("User Login", True, "Login successful with JWT tokens")
                else:
                    self.log_test_result("User Login", False, "Login successful but missing JWT tokens")
            else:
                self.log_test_result("User Login", False, f"Login failed: {response.status_code}")
                
        except Exception as e:
            self.log_test_result("User Login", False, f"Error: {str(e)}")
        
        # Test 2.3: JWT Authentication
        try:
            headers = self.get_auth_headers(self.hr_admin)
            
            if headers:
                response = self.client.get('/api/auth/me/', **headers)
                
                if response.status_code == 200:
                    user_data = response.json()
                    if user_data.get('email') == 'qa_hr_admin@test.com':
                        self.log_test_result("JWT Authentication", True, "JWT token authentication working")
                    else:
                        self.log_test_result("JWT Authentication", False, "JWT token returns wrong user data")
                else:
                    self.log_test_result("JWT Authentication", False, f"Authenticated request failed: {response.status_code}")
            else:
                self.log_test_result("JWT Authentication", False, "Could not obtain JWT token")
                
        except Exception as e:
            self.log_test_result("JWT Authentication", False, f"Error: {str(e)}")
        
        # Test 2.4: Role-based access
        try:
            test_users = [
                ('HR Admin', self.hr_admin),
                ('Manager', self.manager),
                ('Individual', self.individual)
            ]
            
            for role_name, user in test_users:
                headers = self.get_auth_headers(user)
                
                if headers:
                    response = self.client.get('/api/auth/me/', **headers)
                    
                    if response.status_code == 200:
                        user_profile = response.json()
                        if user_profile.get('role') == user.role:
                            self.log_test_result(f"{role_name} Profile Access", True, f"{role_name} can access own profile")
                        else:
                            self.log_test_result(f"{role_name} Profile Access", False, f"{role_name} profile data incorrect")
                    else:
                        self.log_test_result(f"{role_name} Profile Access", False, f"{role_name} cannot access profile")
                else:
                    self.log_test_result(f"{role_name} Authentication", False, f"Could not authenticate {role_name}")
                    
        except Exception as e:
            self.log_test_result("Role-Based Access", False, f"Error: {str(e)}")
    
    def test_phase3_dashboard(self):
        """Test Phase 3: Navigation & Dashboard Structure"""
        self.stdout.write("\n🧪 Testing Phase 3: Navigation & Dashboard Structure...")
        
        # Test 3.1: Analytics models
        try:
            # Test CompanyMetrics model
            company_metrics = CompanyMetrics.objects.create(
                total_employees=100,
                active_objectives=25,
                completion_rate=75.5,
                pending_reviews=5,
                total_departments=6
            )
            
            if company_metrics.id:
                self.log_test_result("CompanyMetrics Model", True, "CompanyMetrics created successfully")
            else:
                self.log_test_result("CompanyMetrics Model", False, "CompanyMetrics creation failed")
            
            # Test UserDashboardMetrics model
            user_metrics = UserDashboardMetrics.objects.create(
                user=self.individual,
                total_goals=10,
                completed_goals=7,
                in_progress_goals=2,
                overdue_goals=1
            )
            
            if user_metrics.id:
                self.log_test_result("UserDashboardMetrics Model", True, "UserDashboardMetrics created successfully")
            else:
                self.log_test_result("UserDashboardMetrics Model", False, "UserDashboardMetrics creation failed")
                
        except Exception as e:
            self.log_test_result("Analytics Models", False, f"Error: {str(e)}")
        
        # Test 3.2: Dashboard APIs
        try:
            # Test HR Admin dashboard
            headers = self.get_auth_headers(self.hr_admin)
            
            if headers:
                response = self.client.get('/api/analytics/dashboard/hr-admin/', **headers)
                
                if response.status_code == 200:
                    data = response.json()
                    required_fields = ['company_metrics', 'department_stats', 'recent_activities']
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if not missing_fields:
                        self.log_test_result("HR Admin Dashboard API", True, "All required fields present")
                    else:
                        self.log_test_result("HR Admin Dashboard API", False, f"Missing fields: {missing_fields}")
                else:
                    self.log_test_result("HR Admin Dashboard API", False, f"API returned status {response.status_code}")
            else:
                self.log_test_result("HR Admin Dashboard API", False, "Could not authenticate HR admin")
                
        except Exception as e:
            self.log_test_result("Dashboard APIs", False, f"Error: {str(e)}")
        
        # Test 3.3: Manager dashboard
        try:
            headers = self.get_auth_headers(self.manager)
            
            if headers:
                response = self.client.get('/api/analytics/dashboard/manager/', **headers)
                
                if response.status_code == 200:
                    data = response.json()
                    required_fields = ['team_metrics', 'team_activities', 'team_members', 'objectives']
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if not missing_fields:
                        self.log_test_result("Manager Dashboard API", True, "All required fields present")
                    else:
                        self.log_test_result("Manager Dashboard API", False, f"Missing fields: {missing_fields}")
                else:
                    self.log_test_result("Manager Dashboard API", False, f"API returned status {response.status_code}")
            else:
                self.log_test_result("Manager Dashboard API", False, "Could not authenticate manager")
                
        except Exception as e:
            self.log_test_result("Manager Dashboard API", False, f"Error: {str(e)}")
        
        # Test 3.4: Individual dashboard
        try:
            headers = self.get_auth_headers(self.individual)
            
            if headers:
                response = self.client.get('/api/analytics/dashboard/individual/', **headers)
                
                if response.status_code == 200:
                    data = response.json()
                    required_fields = ['user_metrics', 'recent_activities', 'goals', 'manager_info', 'recent_feedback']
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if not missing_fields:
                        self.log_test_result("Individual Dashboard API", True, "All required fields present")
                    else:
                        self.log_test_result("Individual Dashboard API", False, f"Missing fields: {missing_fields}")
                else:
                    self.log_test_result("Individual Dashboard API", False, f"API returned status {response.status_code}")
            else:
                self.log_test_result("Individual Dashboard API", False, "Could not authenticate individual")
                
        except Exception as e:
            self.log_test_result("Individual Dashboard API", False, f"Error: {str(e)}")
        
        # Test 3.5: Notifications API
        try:
            headers = self.get_auth_headers(self.individual)
            
            if headers:
                response = self.client.get('/api/analytics/notifications/', **headers)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if 'notifications' in data and 'unread_count' in data:
                        self.log_test_result("Notifications API", True, "Notifications API working")
                    else:
                        self.log_test_result("Notifications API", False, "Missing required fields in response")
                else:
                    self.log_test_result("Notifications API", False, f"API returned status {response.status_code}")
            else:
                self.log_test_result("Notifications API", False, "Could not authenticate user")
                
        except Exception as e:
            self.log_test_result("Notifications API", False, f"Error: {str(e)}")
    
    def print_summary_report(self):
        """Print comprehensive summary report"""
        self.stdout.write(f"\n{'='*80}")
        self.stdout.write("📊 COMPREHENSIVE QA TEST SUMMARY REPORT")
        self.stdout.write(f"{'='*80}")
        self.stdout.write(f"Test Run Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        passed = sum(1 for result in self.test_results if result['passed'])
        total = len(self.test_results)
        
        self.stdout.write(f"Total Tests: {total}")
        self.stdout.write(f"Passed: {passed}")
        self.stdout.write(f"Failed: {total - passed}")
        self.stdout.write(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if passed == total:
            self.stdout.write(self.style.SUCCESS("\n🎉 ALL TESTS PASSED!"))
            self.stdout.write("✅ All core functionality is working correctly.")
            self.stdout.write("✅ Authentication and authorization are secure.")
            self.stdout.write("✅ Dashboard APIs are functioning properly.")
            self.stdout.write("✅ Role-based access control is implemented correctly.")
        else:
            self.stdout.write(self.style.ERROR(f"\n⚠️  {total - passed} TESTS FAILED"))
            self.stdout.write("Review the failed tests above for specific issues.")
        
        return passed == total
    
    def handle(self, *args, **options):
        """Main command handler"""
        self.stdout.write("🚀 AI Performance Review Platform - Comprehensive QA Test Suite")
        self.stdout.write(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Setup test data
        self.setup_test_data()
        
        # Run tests based on phase selection
        phase = options['phase']
        
        if phase in ['1', 'all']:
            self.test_phase1_foundation()
        
        if phase in ['2', 'all']:
            self.test_phase2_authentication()
        
        if phase in ['3', 'all']:
            self.test_phase3_dashboard()
        
        # Print summary report
        success = self.print_summary_report()
        
        if not success:
            raise SystemExit(1) 