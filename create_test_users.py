#!/usr/bin/env python3
"""
Script to create test users for the performance review system.
Run this script to create working credentials for testing.
"""

import os
import sys
import django
from django.db import transaction

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'performance_management.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import Department

User = get_user_model()

def create_test_users():
    """Create test users with working credentials."""
    
    print("🔧 Creating test users...")
    
    with transaction.atomic():
        # Create departments first
        hr_dept, created = Department.objects.get_or_create(
            name='human_resources',
            defaults={'description': 'Human Resources Department'}
        )
        if created:
            print(f"✅ Created HR department: {hr_dept.name}")
        
        eng_dept, created = Department.objects.get_or_create(
            name='engineering',
            defaults={'description': 'Engineering Department'}
        )
        if created:
            print(f"✅ Created Engineering department: {eng_dept.name}")
        
        product_dept, created = Department.objects.get_or_create(
            name='product',
            defaults={'description': 'Product Department'}
        )
        if created:
            print(f"✅ Created Product department: {product_dept.name}")
        
        # Create HR Admin first
        hr_admin_data = {
            'email': 'hr@demo.com',
            'username': 'hr_admin',
            'first_name': 'Sarah',
            'last_name': 'Johnson',
            'password': 'demo123',
            'role': 'hr_admin',
            'department': hr_dept,
            'role_title': 'HR Director'
        }
        
        try:
            hr_admin = User.objects.get(email='hr@demo.com')
            print(f"ℹ️  User hr@demo.com already exists")
        except User.DoesNotExist:
            hr_admin = User.objects.create_user(**hr_admin_data)
            print(f"✅ Created user: hr@demo.com")
        
        # Create managers
        manager_data = [
            {
                'email': 'manager@demo.com', 
                'username': 'manager1',
                'first_name': 'Michael',
                'last_name': 'Chen',
                'password': 'demo123',
                'role': 'manager',
                'department': eng_dept,
                'role_title': 'Engineering Manager'
            },
            {
                'email': 'manager2@demo.com',
                'username': 'manager2', 
                'first_name': 'Emily',
                'last_name': 'Rodriguez',
                'password': 'demo123',
                'role': 'manager',
                'department': product_dept,
                'role_title': 'Product Manager'
            }
        ]
        
        managers = {}
        for data in manager_data:
            email = data['email']
            try:
                manager = User.objects.get(email=email)
                print(f"ℹ️  User {email} already exists")
            except User.DoesNotExist:
                manager = User.objects.create_user(**data)
                print(f"✅ Created user: {email}")
            managers[email] = manager
        
        # Get managers for employee assignment
        manager1 = User.objects.get(email='manager@demo.com')
        manager2 = User.objects.get(email='manager2@demo.com')
        
        # Create employees with managers assigned
        employee_data = [
            {
                'email': 'employee1@demo.com',
                'username': 'employee1',
                'first_name': 'David',
                'last_name': 'Smith',
                'password': 'demo123',
                'role': 'individual_contributor',
                'department': eng_dept,
                'role_title': 'Senior Software Engineer',
                'manager': manager1
            },
            {
                'email': 'employee2@demo.com',
                'username': 'employee2',
                'first_name': 'Lisa',
                'last_name': 'Wang',
                'password': 'demo123',
                'role': 'individual_contributor',
                'department': eng_dept,
                'role_title': 'Frontend Developer',
                'manager': manager1
            },
            {
                'email': 'employee3@demo.com',
                'username': 'employee3',
                'first_name': 'James',
                'last_name': 'Brown',
                'password': 'demo123',
                'role': 'individual_contributor',
                'department': product_dept,
                'role_title': 'Product Designer',
                'manager': manager2
            }
        ]
        
        # Create employees
        for data in employee_data:
            email = data['email']
            try:
                employee = User.objects.get(email=email)
                print(f"ℹ️  User {email} already exists")
            except User.DoesNotExist:
                employee = User.objects.create_user(**data)
                print(f"✅ Created user: {email}")
        
    print("\n🎉 Test users created successfully!")
    print("\n📋 LOGIN CREDENTIALS:")
    print("=" * 50)
    
    # Display credentials
    credentials = [
        ("HR Admin", "hr@demo.com", "demo123", "Access to all admin features"),
        ("Manager (Engineering)", "manager@demo.com", "demo123", "Manage engineering team"),
        ("Manager (Product)", "manager2@demo.com", "demo123", "Manage product team"),  
        ("Employee (Engineering)", "employee1@demo.com", "demo123", "Reports to Michael Chen"),
        ("Employee (Engineering)", "employee2@demo.com", "demo123", "Reports to Michael Chen"),
        ("Employee (Product)", "employee3@demo.com", "demo123", "Reports to Emily Rodriguez")
    ]
    
    for role, email, password, description in credentials:
        print(f"🔑 {role}")
        print(f"   Email: {email}")
        print(f"   Password: {password}")
        print(f"   Description: {description}")
        print()
    
    print("🌐 Frontend URL: http://localhost:3000")
    print("🔧 Backend URL: http://localhost:8000")
    print("\n💡 Dashboard Routes:")
    print("   • HR Admin: http://localhost:3000/dashboard")
    print("   • Manager: http://localhost:3000/manager/dashboard") 
    print("   • Employee: http://localhost:3000/individual/dashboard")

if __name__ == '__main__':
    create_test_users() 