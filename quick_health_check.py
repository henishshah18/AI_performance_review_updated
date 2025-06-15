#!/usr/bin/env python
"""
Quick Health Check for AI Performance Review Platform
Run this script anytime to verify the platform is working correctly.
"""

import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'performance_management.settings')
django.setup()

from core.models import User, Department, SystemSettings
from analytics.models import CompanyMetrics, UserDashboardMetrics, Notification
from django.db import connection

def check_database_connection():
    """Check if database is accessible"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return True, "Database connection successful"
    except Exception as e:
        return False, f"Database connection failed: {str(e)}"

def check_models():
    """Check if all models are working"""
    try:
        # Test core models
        user_count = User.objects.count()
        dept_count = Department.objects.count()
        settings_count = SystemSettings.objects.count()
        
        # Test analytics models
        metrics_count = CompanyMetrics.objects.count()
        user_metrics_count = UserDashboardMetrics.objects.count()
        notification_count = Notification.objects.count()
        
        return True, {
            'users': user_count,
            'departments': dept_count,
            'settings': settings_count,
            'company_metrics': metrics_count,
            'user_metrics': user_metrics_count,
            'notifications': notification_count
        }
    except Exception as e:
        return False, f"Model check failed: {str(e)}"

def check_user_roles():
    """Check if user roles are properly configured"""
    try:
        roles = list(User.objects.values_list('role', flat=True).distinct())
        expected_roles = ['hr_admin', 'manager', 'individual_contributor']
        
        valid_roles = all(role in expected_roles for role in roles if role)
        
        return valid_roles, {
            'found_roles': roles,
            'expected_roles': expected_roles,
            'valid': valid_roles
        }
    except Exception as e:
        return False, f"Role check failed: {str(e)}"

def main():
    """Run all health checks"""
    print("🏥 AI Performance Review Platform - Health Check")
    print("=" * 60)
    
    all_passed = True
    
    # Check 1: Database Connection
    print("\n🔍 Checking database connection...")
    db_ok, db_msg = check_database_connection()
    status = "✅ PASS" if db_ok else "❌ FAIL"
    print(f"{status}: {db_msg}")
    if not db_ok:
        all_passed = False
    
    # Check 2: Models
    print("\n🔍 Checking models...")
    models_ok, models_data = check_models()
    if models_ok:
        print("✅ PASS: All models accessible")
        for model, count in models_data.items():
            print(f"  - {model.replace('_', ' ').title()}: {count}")
    else:
        print(f"❌ FAIL: {models_data}")
        all_passed = False
    
    # Check 3: User Roles
    print("\n🔍 Checking user roles...")
    roles_ok, roles_data = check_user_roles()
    if roles_ok:
        print("✅ PASS: User roles properly configured")
        print(f"  - Found roles: {roles_data['found_roles']}")
    else:
        print(f"❌ FAIL: {roles_data}")
        all_passed = False
    
    # Check 4: Django Configuration
    print("\n🔍 Checking Django configuration...")
    try:
        from django.conf import settings
        print("✅ PASS: Django settings loaded")
        print(f"  - Debug mode: {settings.DEBUG}")
        print(f"  - Database engine: {settings.DATABASES['default']['ENGINE']}")
        print(f"  - Installed apps: {len(settings.INSTALLED_APPS)}")
    except Exception as e:
        print(f"❌ FAIL: Django configuration error: {str(e)}")
        all_passed = False
    
    # Summary
    print("\n" + "=" * 60)
    if all_passed:
        print("🎉 ALL HEALTH CHECKS PASSED!")
        print("✅ Platform is ready for use")
        print("✅ Database is accessible")
        print("✅ Models are working correctly")
        print("✅ User roles are configured")
        print("✅ Django configuration is valid")
        
        print("\n🚀 Ready for:")
        print("  - User registration and authentication")
        print("  - Dashboard data visualization")
        print("  - Role-based access control")
        print("  - Phase 4: OKR Module implementation")
        
        return 0
    else:
        print("⚠️  SOME HEALTH CHECKS FAILED")
        print("Please review the failed checks above")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code) 