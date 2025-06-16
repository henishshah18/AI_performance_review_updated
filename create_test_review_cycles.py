#!/usr/bin/env python
"""
Script to create test review cycles for the AI Performance Review system.
Run this script to populate the database with sample review cycles.
"""

import os
import sys
import django
from datetime import datetime, timedelta

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'performance_management.settings')
django.setup()

from django.contrib.auth import get_user_model
from reviews.models import ReviewCycle, ReviewParticipant, SelfAssessment, PeerReview, ManagerReview
from core.models import Department

User = get_user_model()

def create_test_review_cycles():
    """Create test review cycles with realistic data"""
    
    print("Creating test review cycles...")
    
    # Get HR admin user
    try:
        hr_admin = User.objects.get(email='hr@demo.com')
    except User.DoesNotExist:
        print("HR admin user not found. Please run create_test_users.py first.")
        return
    
    # Create Q4 2024 Review Cycle (Active)
    q4_cycle, created = ReviewCycle.objects.get_or_create(
        name="Q4 2024 Performance Review",
        defaults={
            'review_type': "quarterly",
            'status': "active",
            'review_period_start': datetime(2024, 10, 1).date(),
            'review_period_end': datetime(2024, 12, 31).date(),
            'self_assessment_start': datetime(2025, 1, 5).date(),
            'self_assessment_end': datetime(2025, 1, 15).date(),
            'peer_review_start': datetime(2025, 1, 16).date(),
            'peer_review_end': datetime(2025, 1, 25).date(),
            'manager_review_start': datetime(2025, 1, 26).date(),
            'manager_review_end': datetime(2025, 2, 5).date(),
            'created_by': hr_admin
        }
    )
    if created:
        print(f"Created Q4 2024 cycle: {q4_cycle.id}")
    else:
        print(f"Q4 2024 cycle already exists: {q4_cycle.id}")
    
    # Create Annual 2024 Review Cycle (Draft)
    annual_cycle, created = ReviewCycle.objects.get_or_create(
        name="Annual 2024 Performance Review",
        defaults={
            'review_type': "annual",
            'status': "draft",
            'review_period_start': datetime(2024, 1, 1).date(),
            'review_period_end': datetime(2024, 12, 31).date(),
            'self_assessment_start': datetime(2025, 2, 1).date(),
            'self_assessment_end': datetime(2025, 2, 15).date(),
            'peer_review_start': datetime(2025, 2, 16).date(),
            'peer_review_end': datetime(2025, 2, 28).date(),
            'manager_review_start': datetime(2025, 3, 1).date(),
            'manager_review_end': datetime(2025, 3, 15).date(),
            'created_by': hr_admin
        }
    )
    if created:
        print(f"Created Annual 2024 cycle: {annual_cycle.id}")
    else:
        print(f"Annual 2024 cycle already exists: {annual_cycle.id}")
    
    # Create Q1 2025 Review Cycle (Draft)
    q1_cycle = ReviewCycle.objects.create(
        name="Q1 2025 Performance Review",
        review_type="quarterly",
        status="draft",
        review_period_start=datetime(2025, 1, 1).date(),
        review_period_end=datetime(2025, 3, 31).date(),
        self_assessment_start=datetime(2025, 4, 1).date(),
        self_assessment_end=datetime(2025, 4, 10).date(),
        peer_review_start=datetime(2025, 4, 11).date(),
        peer_review_end=datetime(2025, 4, 20).date(),
        manager_review_start=datetime(2025, 4, 21).date(),
        manager_review_end=datetime(2025, 4, 30).date(),
        created_by=hr_admin
    )
    print(f"Created Q1 2025 cycle: {q1_cycle.id}")
    
    # Add participants to the active Q4 cycle
    print("Adding participants to Q4 2024 cycle...")
    
    # Get all active users
    active_users = User.objects.filter(is_active=True)
    
    for user in active_users:
        participant, created = ReviewParticipant.objects.get_or_create(
            cycle=q4_cycle,
            user=user,
            defaults={'is_active': True}
        )
        if created:
            print(f"Added participant: {user.email}")
    
    # Create some self-assessments for the active cycle
    print("Creating self-assessments...")
    
    for user in active_users[:5]:  # Create for first 5 users
        self_assessment, created = SelfAssessment.objects.get_or_create(
            cycle=q4_cycle,
            user=user,
            defaults={
                'status': 'completed' if user.email == 'employee1@demo.com' else 'in_progress',
                'technical_excellence': 4 if user.email == 'employee1@demo.com' else None,
                'technical_examples': 'Delivered high-quality code and mentored junior developers.' if user.email == 'employee1@demo.com' else '',
                'collaboration': 5 if user.email == 'employee1@demo.com' else None,
                'collaboration_examples': 'Worked effectively with cross-functional teams.' if user.email == 'employee1@demo.com' else '',
                'problem_solving': 4 if user.email == 'employee1@demo.com' else None,
                'problem_solving_examples': 'Solved complex technical challenges efficiently.' if user.email == 'employee1@demo.com' else '',
                'initiative': 4 if user.email == 'employee1@demo.com' else None,
                'initiative_examples': 'Proactively identified and addressed process improvements.' if user.email == 'employee1@demo.com' else '',
                'development_goals': 'Improve leadership skills and learn new technologies.' if user.email == 'employee1@demo.com' else '',
                'manager_support_needed': 'Guidance on career progression and skill development.' if user.email == 'employee1@demo.com' else '',
                'career_interests': 'Interested in technical leadership roles.' if user.email == 'employee1@demo.com' else ''
            }
        )
        if created:
            print(f"Created self-assessment for: {user.email}")
    
    # Create some peer reviews
    print("Creating peer reviews...")
    
    # Get employees for peer reviews
    employees = User.objects.filter(role='individual_contributor')[:4]
    
    for i, reviewer in enumerate(employees):
        for j, reviewee in enumerate(employees):
            if i != j:  # Don't review yourself
                peer_review, created = PeerReview.objects.get_or_create(
                    cycle=q4_cycle,
                    reviewer=reviewer,
                    reviewee=reviewee,
                    defaults={
                        'status': 'completed' if i == 0 and j == 1 else 'not_started',
                        'collaboration_rating': 4 if i == 0 and j == 1 else None,
                        'collaboration_examples': 'Great teamwork on the Q4 project.' if i == 0 and j == 1 else '',
                        'impact_rating': 5 if i == 0 and j == 1 else None,
                        'impact_examples': 'Significant contribution to team success.' if i == 0 and j == 1 else '',
                        'development_suggestions': 'Could improve documentation practices.' if i == 0 and j == 1 else '',
                        'strengths_to_continue': 'Strong technical skills and positive attitude.' if i == 0 and j == 1 else ''
                    }
                )
                if created:
                    print(f"Created peer review: {reviewer.email} -> {reviewee.email}")
    
    # Create some manager reviews
    print("Creating manager reviews...")
    
    # Get managers and their direct reports
    managers = User.objects.filter(role='manager')
    
    for manager in managers:
        # Get direct reports (users in same department)
        direct_reports = User.objects.filter(
            department=manager.department,
            role='individual_contributor'
        )[:3]  # Limit to 3 for testing
        
        for employee in direct_reports:
            manager_review, created = ManagerReview.objects.get_or_create(
                cycle=q4_cycle,
                manager=manager,
                employee=employee,
                defaults={
                    'status': 'completed' if employee.email == 'employee1@demo.com' else 'not_started',
                    'overall_rating': 'exceeds_expectations' if employee.email == 'employee1@demo.com' else None,
                    'technical_excellence': 4 if employee.email == 'employee1@demo.com' else None,
                    'technical_justification': 'Consistently delivers high-quality technical solutions.' if employee.email == 'employee1@demo.com' else '',
                    'collaboration': 5 if employee.email == 'employee1@demo.com' else None,
                    'collaboration_justification': 'Excellent team player and mentor.' if employee.email == 'employee1@demo.com' else '',
                    'problem_solving': 4 if employee.email == 'employee1@demo.com' else None,
                    'problem_solving_justification': 'Strong analytical and problem-solving skills.' if employee.email == 'employee1@demo.com' else '',
                    'initiative': 4 if employee.email == 'employee1@demo.com' else None,
                    'initiative_justification': 'Proactively identifies and addresses challenges.' if employee.email == 'employee1@demo.com' else '',
                    'development_plan': 'Focus on leadership development and advanced technical skills.' if employee.email == 'employee1@demo.com' else '',
                    'manager_support': 'Provide mentoring opportunities and stretch assignments.' if employee.email == 'employee1@demo.com' else '',
                    'business_impact': 'Significant positive impact on team productivity and quality.' if employee.email == 'employee1@demo.com' else ''
                }
            )
            if created:
                print(f"Created manager review: {manager.email} -> {employee.email}")
    
    print("\nTest review cycles created successfully!")
    print(f"Active cycles: {ReviewCycle.objects.filter(status='active').count()}")
    print(f"Draft cycles: {ReviewCycle.objects.filter(status='draft').count()}")
    print(f"Total participants: {ReviewParticipant.objects.filter(is_active=True).count()}")
    print(f"Self-assessments: {SelfAssessment.objects.count()}")
    print(f"Peer reviews: {PeerReview.objects.count()}")
    print(f"Manager reviews: {ManagerReview.objects.count()}")

def clean_existing_data():
    """Clean existing review data"""
    print("Cleaning existing review data...")
    
    ManagerReview.objects.all().delete()
    PeerReview.objects.all().delete()
    SelfAssessment.objects.all().delete()
    ReviewParticipant.objects.all().delete()
    ReviewCycle.objects.all().delete()
    
    print("Existing data cleaned.")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Create test review cycles')
    parser.add_argument('--clean', action='store_true', help='Clean existing data first')
    
    args = parser.parse_args()
    
    if args.clean:
        clean_existing_data()
    
    create_test_review_cycles() 