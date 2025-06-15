#!/usr/bin/env python
"""
QA Test Script for Phase 2: Authentication & Role-Based Access Control
Tests authentication endpoints, JWT tokens, and role-based access.
"""

import os
import sys
import django
import json
import requests
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'performance_management.settings')
django.setup()

from core.models import User, Department

class Phase2QATests:
    """Comprehensive QA tests for Phase 2 implementation"""
    
    def __init__(self):
        self.client = Client()
        self.base_url = "http://localhost:8000"
        self.test_results = []
        self.setup_test_data()
    
    def setup_test_data(self):
        """Setup test data for authentication tests"""
        print("🔧 Setting up test data...")
        
        # Create departments
        self.hr_dept, _ = Department.objects.get_or_create(
            name='hr',
            defaults={'description': 'Human Resources Department'}
        )
        self.eng_dept, _ = Department.objects.get_or_create(
            name='engineering',
            defaults={'description': 'Engineering Department'}
        )
        
        # Create test users for authentication
        self.test_users = {
            'hr_admin': {
                'email': 'qa_hr@test.com',
                'username': 'qa_hradmin',
                'first_name': 'QA',
                'last_name': 'HRAdmin',
                'password': 'testpass123',
                'role': 'hr_admin',
                'department': self.hr_dept
            },
            'manager': {
                'email': 'qa_manager@test.com',
                'username': 'qa_manager',
                'first_name': 'QA',
                'last_name': 'Manager',
                'password': 'testpass123',
                'role': 'manager',
                'department': self.eng_dept
            },
            'individual': {
                'email': 'qa_individual@test.com',
                'username': 'qa_individual',
                'first_name': 'QA',
                'last_name': 'Individual',
                'password': 'testpass123',
                'role': 'individual_contributor',
                'department': self.eng_dept
            }
        }
        
        # Create users in database
        for role, user_data in self.test_users.items():
            try:
                user = User.objects.create_user(**user_data)
                if role == 'individual':
                    manager = User.objects.get(username='qa_manager')
                    user.manager = manager
                    user.save()
            except Exception as e:
                print(f"Warning: Could not create {role} user: {e}")
        
        print("✅ Test data setup complete")
    
    def log_test_result(self, test_name, passed, message=""):
        """Log test result"""
        status = "✅ PASS" if passed else "❌ FAIL"
        self.test_results.append({
            'test': test_name,
            'passed': passed,
            'message': message
        })
        print(f"{status}: {test_name} - {message}")
    
    def test_user_registration(self):
        """Test 2.1: User registration endpoint"""
        print("\n🧪 Testing User Registration...")
        
        try:
            # Test valid registration
            registration_data = {
                'email': 'newuser@test.com',
                'username': 'newuser',
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
            
            # Test duplicate email registration
            response = self.client.post('/api/auth/signup/', registration_data)
            
            if response.status_code == 400:
                self.log_test_result("Duplicate Email Prevention", True, "Duplicate email properly rejected")
            else:
                self.log_test_result("Duplicate Email Prevention", False, "Duplicate email not prevented")
            
            # Test invalid role registration
            invalid_data = registration_data.copy()
            invalid_data['email'] = 'invalid@test.com'
            invalid_data['username'] = 'invalid'
            invalid_data['role'] = 'invalid_role'
            
            response = self.client.post('/api/auth/signup/', invalid_data)
            
            if response.status_code == 400:
                self.log_test_result("Invalid Role Prevention", True, "Invalid role properly rejected")
            else:
                self.log_test_result("Invalid Role Prevention", False, "Invalid role not prevented")
                
        except Exception as e:
            self.log_test_result("User Registration", False, f"Error: {str(e)}")
    
    def test_user_login(self):
        """Test 2.2: User login and JWT token generation"""
        print("\n🧪 Testing User Login...")
        
        try:
            # Test valid login
            login_data = {
                'email': 'qa_hr@test.com',
                'password': 'testpass123'
            }
            
            response = self.client.post('/api/auth/login/', login_data)
            
            if response.status_code == 200:
                response_data = response.json()
                if 'access' in response_data and 'refresh' in response_data:
                    self.log_test_result("User Login", True, "Login successful with JWT tokens")
                    self.access_token = response_data['access']
                    self.refresh_token = response_data['refresh']
                else:
                    self.log_test_result("User Login", False, "Login successful but missing JWT tokens")
            else:
                self.log_test_result("User Login", False, f"Login failed: {response.status_code}")
            
            # Test invalid credentials
            invalid_login = {
                'email': 'qa_hr@test.com',
                'password': 'wrongpassword'
            }
            
            response = self.client.post('/api/auth/login/', invalid_login)
            
            if response.status_code == 401:
                self.log_test_result("Invalid Credentials", True, "Invalid credentials properly rejected")
            else:
                self.log_test_result("Invalid Credentials", False, "Invalid credentials not properly handled")
                
        except Exception as e:
            self.log_test_result("User Login", False, f"Error: {str(e)}")
    
    def test_jwt_authentication(self):
        """Test 2.3: JWT token authentication"""
        print("\n🧪 Testing JWT Authentication...")
        
        try:
            # First login to get token
            login_data = {
                'email': 'qa_hr@test.com',
                'password': 'testpass123'
            }
            
            response = self.client.post('/api/auth/login/', login_data)
            
            if response.status_code == 200:
                tokens = response.json()
                access_token = tokens.get('access')
                
                # Test authenticated request
                headers = {'HTTP_AUTHORIZATION': f'Bearer {access_token}'}
                response = self.client.get('/api/auth/me/', **headers)
                
                if response.status_code == 200:
                    user_data = response.json()
                    if user_data.get('email') == 'qa_hr@test.com':
                        self.log_test_result("JWT Authentication", True, "JWT token authentication working")
                    else:
                        self.log_test_result("JWT Authentication", False, "JWT token returns wrong user data")
                else:
                    self.log_test_result("JWT Authentication", False, f"Authenticated request failed: {response.status_code}")
                
                # Test request without token
                response = self.client.get('/api/auth/me/')
                
                if response.status_code == 401:
                    self.log_test_result("Unauthenticated Access", True, "Unauthenticated requests properly blocked")
                else:
                    self.log_test_result("Unauthenticated Access", False, "Unauthenticated requests not blocked")
            else:
                self.log_test_result("JWT Authentication", False, "Could not obtain JWT token for testing")
                
        except Exception as e:
            self.log_test_result("JWT Authentication", False, f"Error: {str(e)}")
    
    def test_role_based_access(self):
        """Test 2.4: Role-based access control"""
        print("\n🧪 Testing Role-Based Access Control...")
        
        try:
            # Test each role's access to user profile endpoint
            for role, user_data in self.test_users.items():
                login_data = {
                    'email': user_data['email'],
                    'password': user_data['password']
                }
                
                response = self.client.post('/api/auth/login/', login_data)
                
                if response.status_code == 200:
                    tokens = response.json()
                    access_token = tokens.get('access')
                    
                    # Test profile access
                    headers = {'HTTP_AUTHORIZATION': f'Bearer {access_token}'}
                    response = self.client.get('/api/auth/me/', **headers)
                    
                    if response.status_code == 200:
                        user_profile = response.json()
                        if user_profile.get('role') == user_data['role']:
                            self.log_test_result(f"{role.title()} Profile Access", True, f"{role} can access own profile")
                        else:
                            self.log_test_result(f"{role.title()} Profile Access", False, f"{role} profile data incorrect")
                    else:
                        self.log_test_result(f"{role.title()} Profile Access", False, f"{role} cannot access profile")
                else:
                    self.log_test_result(f"{role.title()} Login", False, f"{role} login failed")
                    
        except Exception as e:
            self.log_test_result("Role-Based Access", False, f"Error: {str(e)}")
    
    def test_token_refresh(self):
        """Test 2.5: JWT token refresh functionality"""
        print("\n🧪 Testing Token Refresh...")
        
        try:
            # Login to get tokens
            login_data = {
                'email': 'qa_hr@test.com',
                'password': 'testpass123'
            }
            
            response = self.client.post('/api/auth/login/', login_data)
            
            if response.status_code == 200:
                tokens = response.json()
                refresh_token = tokens.get('refresh')
                
                # Test token refresh
                refresh_data = {'refresh': refresh_token}
                response = self.client.post('/api/auth/token/refresh/', refresh_data)
                
                if response.status_code == 200:
                    new_tokens = response.json()
                    if 'access' in new_tokens:
                        self.log_test_result("Token Refresh", True, "Token refresh working correctly")
                    else:
                        self.log_test_result("Token Refresh", False, "Token refresh missing access token")
                else:
                    self.log_test_result("Token Refresh", False, f"Token refresh failed: {response.status_code}")
            else:
                self.log_test_result("Token Refresh", False, "Could not obtain tokens for refresh test")
                
        except Exception as e:
            self.log_test_result("Token Refresh", False, f"Error: {str(e)}")
    
    def test_logout_functionality(self):
        """Test 2.6: User logout and token blacklisting"""
        print("\n🧪 Testing Logout Functionality...")
        
        try:
            # Login to get tokens
            login_data = {
                'email': 'qa_hr@test.com',
                'password': 'testpass123'
            }
            
            response = self.client.post('/api/auth/login/', login_data)
            
            if response.status_code == 200:
                tokens = response.json()
                access_token = tokens.get('access')
                refresh_token = tokens.get('refresh')
                
                # Test logout
                headers = {'HTTP_AUTHORIZATION': f'Bearer {access_token}'}
                logout_data = {'refresh': refresh_token}
                response = self.client.post('/api/auth/logout/', logout_data, **headers)
                
                if response.status_code == 200:
                    self.log_test_result("User Logout", True, "Logout successful")
                    
                    # Test if token is blacklisted
                    response = self.client.get('/api/auth/me/', **headers)
                    if response.status_code == 401:
                        self.log_test_result("Token Blacklisting", True, "Token properly blacklisted after logout")
                    else:
                        self.log_test_result("Token Blacklisting", False, "Token not blacklisted after logout")
                else:
                    self.log_test_result("User Logout", False, f"Logout failed: {response.status_code}")
            else:
                self.log_test_result("User Logout", False, "Could not obtain tokens for logout test")
                
        except Exception as e:
            self.log_test_result("Logout Functionality", False, f"Error: {str(e)}")
    
    def test_password_validation(self):
        """Test 2.7: Password validation rules"""
        print("\n🧪 Testing Password Validation...")
        
        try:
            # Test weak password
            weak_password_data = {
                'email': 'weakpass@test.com',
                'username': 'weakpass',
                'first_name': 'Weak',
                'last_name': 'Password',
                'password': '123',  # Too short
                'role': 'individual_contributor',
                'department_id': self.eng_dept.id
            }
            
            response = self.client.post('/api/auth/signup/', weak_password_data)
            
            if response.status_code == 400:
                self.log_test_result("Weak Password Rejection", True, "Weak password properly rejected")
            else:
                self.log_test_result("Weak Password Rejection", False, "Weak password not rejected")
            
            # Test strong password
            strong_password_data = weak_password_data.copy()
            strong_password_data['email'] = 'strongpass@test.com'
            strong_password_data['username'] = 'strongpass'
            strong_password_data['password'] = 'StrongPassword123!'
            
            response = self.client.post('/api/auth/signup/', strong_password_data)
            
            if response.status_code == 201:
                self.log_test_result("Strong Password Acceptance", True, "Strong password accepted")
            else:
                self.log_test_result("Strong Password Acceptance", False, "Strong password rejected")
                
        except Exception as e:
            self.log_test_result("Password Validation", False, f"Error: {str(e)}")
    
    def run_all_tests(self):
        """Run all Phase 2 tests"""
        print("🚀 Starting Phase 2 QA Tests...")
        print("=" * 60)
        
        self.test_user_registration()
        self.test_user_login()
        self.test_jwt_authentication()
        self.test_role_based_access()
        self.test_token_refresh()
        self.test_logout_functionality()
        self.test_password_validation()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 PHASE 2 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['passed'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if passed == total:
            print("\n🎉 ALL PHASE 2 TESTS PASSED!")
        else:
            print(f"\n⚠️  {total - passed} TESTS FAILED - Review implementation")
        
        return passed == total

if __name__ == "__main__":
    tester = Phase2QATests()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1) 