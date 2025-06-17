#!/usr/bin/env python3

import os
import django
from datetime import timedelta
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'performance_management.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from core.models import User, Department
from reviews.models import ReviewCycle, ReviewParticipant, SelfAssessment, PeerReview, ManagerReview
from feedback.models import Feedback, FeedbackTagTemplate

User = get_user_model()

def main():
    print("Creating comprehensive historical data...")
    
    # Get existing users
    manager = User.objects.get(email='manager@demo.com')
    team_members = list(User.objects.filter(manager=manager))
    
    print(f"Found manager: {manager.email}")
    print(f"Found {len(team_members)} team members")
    
    # Create feedback tag templates
    tag_templates_data = [
        ('Technical Excellence', 'skill', 'Demonstrates strong technical skills'),
        ('Communication', 'skill', 'Excellent communication abilities'),
        ('Leadership', 'behavior', 'Shows leadership qualities'),
        ('Problem Solving', 'skill', 'Great at solving complex problems'),
        ('Teamwork', 'behavior', 'Works well with team members')
    ]
    
    tag_templates = []
    hr_admin = User.objects.filter(role='hr_admin').first()
    for name, category, desc in tag_templates_data:
        template, created = FeedbackTagTemplate.objects.get_or_create(
            name=name,
            defaults={
                'description': desc, 
                'category': category,
                'is_active': True,
                'created_by': hr_admin or manager
            }
        )
        tag_templates.append(template)
        if created:
            print(f"Created feedback tag template: {name}")
    
    # Create historical review cycles
    cycles_data = [
        ('Q1 2024 Performance Review', 'completed', '2024-01-01', '2024-03-31', '2024-04-01', '2024-04-07', '2024-04-08', '2024-04-14', '2024-04-15', '2024-04-21'),
        ('Q2 2024 Performance Review', 'completed', '2024-04-01', '2024-06-30', '2024-07-01', '2024-07-07', '2024-07-08', '2024-07-14', '2024-07-15', '2024-07-21'),
        ('Q3 2024 Performance Review', 'active', '2024-07-01', '2024-09-30', '2024-10-01', '2024-10-07', '2024-10-08', '2024-10-14', '2024-10-15', '2024-10-21')
    ]
    
    cycles = []
    for name, status, period_start, period_end, self_start, self_end, peer_start, peer_end, mgr_start, mgr_end in cycles_data:
        cycle, created = ReviewCycle.objects.get_or_create(
            name=name,
            defaults={
                'review_type': 'quarterly',
                'status': status,
                'review_period_start': period_start,
                'review_period_end': period_end,
                'self_assessment_start': self_start,
                'self_assessment_end': self_end,
                'peer_review_start': peer_start,
                'peer_review_end': peer_end,
                'manager_review_start': mgr_start,
                'manager_review_end': mgr_end,
                'created_by': hr_admin or manager
            }
        )
        cycles.append(cycle)
        if created:
            print(f"Created cycle: {name}")
    
    # Add participants to all cycles
    all_employees = [manager] + team_members
    for cycle in cycles:
        for employee in all_employees:
            ReviewParticipant.objects.get_or_create(
                cycle=cycle,
                user=employee,
                defaults={'is_active': True}
            )
    
    # Create historical feedback
    feedback_texts = [
        "Excellent technical skills and problem-solving ability",
        "Great team player and always willing to help",
        "Strong communication skills and clear explanations",
        "Reliable and consistently delivers quality work",
        "Shows initiative and takes ownership of tasks"
    ]
    
    feedback_types = ['commendation', 'guidance', 'constructive']
    
    for giver in all_employees:
        for receiver in all_employees:
            if giver != receiver and random.random() < 0.3:
                feedback, created = Feedback.objects.get_or_create(
                    from_user=giver,
                    to_user=receiver,
                    defaults={
                        'content': random.choice(feedback_texts),
                        'feedback_type': random.choice(feedback_types),
                        'visibility': 'private',
                        'is_anonymous': random.choice([True, False]),
                        'created_at': timezone.now() - timedelta(days=random.randint(10, 100))
                    }
                )
    
    # Create completed self-assessments for historical cycles
    for cycle in cycles[:2]:  # Only for completed cycles
        for employee in all_employees:
            assessment, created = SelfAssessment.objects.get_or_create(
                cycle=cycle,
                user=employee,
                defaults={
                    'status': 'completed',
                    'technical_excellence': random.randint(3, 5),
                    'technical_examples': f"Successfully delivered key projects in {cycle.name}",
                    'collaboration': random.randint(3, 5),
                    'collaboration_examples': "Worked effectively with team members",
                    'problem_solving': random.randint(3, 5),
                    'problem_solving_examples': "Solved complex technical challenges",
                    'initiative': random.randint(3, 5),
                    'initiative_examples': "Took ownership of critical tasks",
                    'development_goals': "Continue improving technical skills",
                    'submitted_at': timezone.now() - timedelta(days=random.randint(30, 120))
                }
            )
    
    # Create completed peer reviews for historical cycles
    for cycle in cycles[:2]:  # Only for completed cycles
        for reviewer in all_employees:
            potential_reviewees = [e for e in all_employees if e != reviewer]
            reviewees = random.sample(potential_reviewees, min(3, len(potential_reviewees)))
            
            for reviewee in reviewees:
                review, created = PeerReview.objects.get_or_create(
                    cycle=cycle,
                    reviewer=reviewer,
                    reviewee=reviewee,
                    defaults={
                        'status': 'completed',
                        'collaboration_rating': random.randint(3, 5),
                        'collaboration_examples': f"{reviewee.first_name} has excellent collaboration skills",
                        'impact_rating': random.randint(3, 5),
                        'impact_examples': "Makes significant contributions to team projects",
                        'development_suggestions': "Could improve on time management",
                        'strengths_to_continue': "Continue excellent technical work",
                        'submitted_at': timezone.now() - timedelta(days=random.randint(20, 100))
                    }
                )
    
    # Create completed manager reviews for historical cycles
    for cycle in cycles[:2]:  # Only for completed cycles
        for employee in team_members:
            review, created = ManagerReview.objects.get_or_create(
                cycle=cycle,
                manager=manager,
                employee=employee,
                defaults={
                    'status': 'completed',
                    'overall_rating': random.choice(['exceeds_expectations', 'meets_expectations']),
                    'technical_excellence': random.randint(3, 5),
                    'technical_justification': f"{employee.first_name} consistently delivers high-quality work",
                    'collaboration': random.randint(3, 5),
                    'collaboration_justification': "Works well with team members",
                    'problem_solving': random.randint(3, 5),
                    'problem_solving_justification': "Shows strong analytical skills",
                    'initiative': random.randint(3, 5),
                    'initiative_justification': "Takes ownership and shows leadership",
                    'development_plan': "Continue developing leadership skills",
                    'business_impact': f"Led key projects successfully in {cycle.name}",
                    'submitted_at': timezone.now() - timedelta(days=random.randint(10, 90))
                }
            )
    
    # Create pending reviews for active cycle
    active_cycle = cycles[2]  # Q3 2024 cycle
    
    # Pending self-assessments
    for employee in all_employees:
        assessment, created = SelfAssessment.objects.get_or_create(
            cycle=active_cycle,
            user=employee,
            defaults={'status': 'not_started'}
        )
    
    # Pending peer reviews
    for reviewer in all_employees:
        potential_reviewees = [e for e in all_employees if e != reviewer]
        reviewees = random.sample(potential_reviewees, min(3, len(potential_reviewees)))
        
        for reviewee in reviewees:
            review, created = PeerReview.objects.get_or_create(
                cycle=active_cycle,
                reviewer=reviewer,
                reviewee=reviewee,
                defaults={'status': 'not_started'}
            )
    
    # Pending manager reviews
    for employee in team_members:
        review, created = ManagerReview.objects.get_or_create(
            cycle=active_cycle,
            manager=manager,
            employee=employee,
            defaults={'status': 'not_started'}
        )
    
    print("\n" + "="*60)
    print("COMPREHENSIVE HISTORICAL DATA CREATION COMPLETE!")
    print("="*60)
    
    print("\nLOGIN CREDENTIALS:")
    print("-"*30)
    print(f"Manager: {manager.email} / demo123")
    print("Team Members:")
    for member in team_members:
        print(f"  {member.email} / demo123")
    print("\nHR Admin: hr@demo.com / demo123")
    
    print("\nDATA SUMMARY:")
    print("-"*30)
    print(f"Review Cycles: {ReviewCycle.objects.count()}")
    print(f"Users: {User.objects.count()}")
    print(f"Self Assessments: {SelfAssessment.objects.count()}")
    print(f"Peer Reviews: {PeerReview.objects.count()}")
    print(f"Manager Reviews: {ManagerReview.objects.count()}")
    print(f"Feedback Entries: {Feedback.objects.count()}")
    print(f"Feedback Tag Templates: {FeedbackTagTemplate.objects.count()}")
    
    # Show active cycle info
    print(f"\nACTIVE CYCLE: {active_cycle.name}")
    print(f"Status: {active_cycle.status}")
    print(f"Current Phase: {active_cycle.current_phase}")
    
    pending_self = SelfAssessment.objects.filter(cycle=active_cycle, status='not_started').count()
    pending_peer = PeerReview.objects.filter(cycle=active_cycle, status='not_started').count()
    pending_manager = ManagerReview.objects.filter(cycle=active_cycle, status='not_started').count()
    
    print("\nPENDING REVIEWS:")
    print(f"- Self Assessments: {pending_self}")
    print(f"- Peer Reviews: {pending_peer}")
    print(f"- Manager Reviews: {pending_manager}")

if __name__ == '__main__':
    main()
