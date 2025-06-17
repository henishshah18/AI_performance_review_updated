#!/usr/bin/env python
"""
Test script for the start review cycle functionality
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'performance_management.settings')
django.setup()

from django.contrib.auth import get_user_model
from reviews.models import ReviewCycle
from core.models import Department

User = get_user_model()

def test_start_cycle():
    print("Testing start review cycle functionality...")
    
    # Get a draft cycle
    draft_cycle = ReviewCycle.objects.filter(status='draft').first()
    if not draft_cycle:
        print("No draft cycles found. Creating one...")
        hr_admin = User.objects.filter(role='hr_admin').first()
        if not hr_admin:
            print("No HR admin found!")
            return
        
        draft_cycle = ReviewCycle.objects.create(
            name="Test Cycle",
            review_type="quarterly",
            review_period_start="2024-01-01",
            review_period_end="2024-03-31",
            self_assessment_start="2024-04-01",
            self_assessment_end="2024-04-15",
            peer_review_start="2024-04-16",
            peer_review_end="2024-04-30",
            manager_review_start="2024-05-01",
            manager_review_end="2024-05-15",
            created_by=hr_admin
        )
        print(f"Created test cycle: {draft_cycle.name}")
    
    print(f"Found draft cycle: {draft_cycle.name} (Status: {draft_cycle.status})")
    
    # Get departments
    departments = Department.objects.all()
    print(f"Found {departments.count()} departments")
    
    if departments.count() == 0:
        print("No departments found! Creating test department...")
        dept = Department.objects.create(name="Test Department")
        departments = [dept]
    
    # Test the start cycle logic
    department_ids = [str(dept.id) for dept in departments]
    settings = {
        'auto_assign_peer_reviews': True,
        'peer_review_anonymous': True,
        'exclude_probationary': True,
        'exclude_contractors': False
    }
    
    print(f"Department IDs: {department_ids}")
    print(f"Settings: {settings}")
    
    # Get users in departments
    users = User.objects.filter(department__in=departments, is_active=True)
    print(f"Found {users.count()} active users in selected departments")
    
    for user in users:
        print(f"  - {user.get_full_name()} ({user.role}) - Dept: {user.department}")
    
    print("\nTest completed successfully!")

if __name__ == "__main__":
    test_start_cycle() 