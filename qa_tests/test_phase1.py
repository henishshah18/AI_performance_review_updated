#!/usr/bin/env python
"""
Simplified QA Test for Phase 1: Foundation & Business Rules Engine
"""

from django.core.management.base import BaseCommand
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from core.models import User, Department, SystemSettings, AuditLog

def run_phase1_tests():
    """Run Phase 1 tests"""
    print("🚀 Starting Phase 1 QA Tests...")
    print("=" * 60)
    
    test_results = []
    
    def log_test_result(test_name, passed, message=""):
        """Log test result"""
        status = "✅ PASS" if passed else "❌ FAIL"
        test_results.append({'test': test_name, 'passed': passed, 'message': message})
        print(f"{status}: {test_name} - {message}")
    
    # Test 1: User model creation
    try:
        # Create departments first
        hr_dept, _ = Department.objects.get_or_create(
            name='hr_test',
            defaults={'description': 'HR Test Department'}
        )
        eng_dept, _ = Department.objects.get_or_create(
            name='eng_test',
            defaults={'description': 'Engineering Test Department'}
        )
        
        # Test user creation
        user = User.objects.create_user(
            email='test_phase1@example.com',
            username='testuser_phase1',
            first_name='Test',
            last_name='User',
            password='testpass123',
            role='individual_contributor',
            department=eng_dept
        )
        log_test_result("User Creation", True, "User created successfully")
        
        # Test email uniqueness
        try:
            User.objects.create_user(
                email='test_phase1@example.com',  # Duplicate email
                username='testuser2_phase1',
                password='testpass123',
                role='individual_contributor',
                department=eng_dept
            )
            log_test_result("Email Uniqueness", False, "Duplicate email allowed")
        except IntegrityError:
            log_test_result("Email Uniqueness", True, "Duplicate email properly rejected")
            
    except Exception as e:
        log_test_result("User Model Tests", False, f"Error: {str(e)}")
    
    # Test 2: Department model
    try:
        dept_count = Department.objects.count()
        if dept_count >= 2:
            log_test_result("Department Model", True, f"Departments working ({dept_count} found)")
        else:
            log_test_result("Department Model", False, "Not enough departments")
    except Exception as e:
        log_test_result("Department Model", False, f"Error: {str(e)}")
    
    # Test 3: System Settings
    try:
        # Create a test user for system settings
        admin_user = User.objects.filter(role='hr_admin').first()
        if not admin_user:
            admin_user = User.objects.create_user(
                email='admin_test@example.com',
                username='admin_test',
                password='testpass123',
                role='hr_admin',
                department=hr_dept
            )
        
        setting = SystemSettings.objects.create(
            key='test_setting_phase1',
            value={'test': True},
            description='Test setting for Phase 1',
            created_by=admin_user
        )
        
        retrieved_value = SystemSettings.get_setting('test_setting_phase1')
        if retrieved_value == {'test': True}:
            log_test_result("System Settings", True, "System settings working correctly")
        else:
            log_test_result("System Settings", False, "System settings not working")
            
    except Exception as e:
        log_test_result("System Settings", False, f"Error: {str(e)}")
    
    # Test 4: User roles validation
    try:
        valid_roles = ['hr_admin', 'manager', 'individual_contributor']
        user_roles = User.objects.values_list('role', flat=True).distinct()
        
        invalid_roles = [role for role in user_roles if role not in valid_roles]
        if not invalid_roles:
            log_test_result("Role Validation", True, "All user roles are valid")
        else:
            log_test_result("Role Validation", False, f"Invalid roles found: {invalid_roles}")
            
    except Exception as e:
        log_test_result("Role Validation", False, f"Error: {str(e)}")
    
    # Print summary
    print("\n" + "=" * 60)
    print("📊 PHASE 1 TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for result in test_results if result['passed'])
    total = len(test_results)
    
    print(f"Total Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    
    if passed == total:
        print("\n🎉 ALL PHASE 1 TESTS PASSED!")
        return True
    else:
        print(f"\n⚠️  {total - passed} TESTS FAILED - Review implementation")
        return False

if __name__ == "__main__":
    import os
    import django
    
    # Setup Django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'performance_management.settings')
    django.setup()
    
    success = run_phase1_tests()
    exit(0 if success else 1) 