from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta
import random

from reviews.models import (
    ReviewCycle, ReviewParticipant, SelfAssessment, GoalAssessment,
    PeerReview, ManagerReview, UpwardReview
)
from okr.models import Goal

User = get_user_model()


class Command(BaseCommand):
    help = 'Initialize sample review data for testing and demonstration'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing review data before creating new data',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing review data...')
            ReviewCycle.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Existing review data cleared.'))

        self.stdout.write('Creating sample review data...')
        
        # Get users for sample data
        users = list(User.objects.all())
        if len(users) < 5:
            self.stdout.write(
                self.style.ERROR('Need at least 5 users to create meaningful review data. '
                                'Please run init_sample_data first.')
            )
            return

        # Get HR admin and managers
        hr_admin = User.objects.filter(role='hr_admin').first()
        if not hr_admin:
            self.stdout.write(
                self.style.ERROR('No HR admin found. Please create an HR admin user first.')
            )
            return

        managers = list(User.objects.filter(role='manager'))
        employees = list(User.objects.filter(role='individual_contributor'))

        # Create review cycles
        self.create_review_cycles(hr_admin)
        
        # Add participants to cycles
        self.add_cycle_participants(users)
        
        # Create sample reviews
        self.create_sample_reviews(managers, employees)
        
        self.stdout.write(self.style.SUCCESS('Sample review data created successfully!'))

    def create_review_cycles(self, hr_admin):
        """Create sample review cycles"""
        self.stdout.write('Creating review cycles...')
        
        # Current active cycle
        active_cycle = ReviewCycle.objects.create(
            name='Q4 2024 Performance Review',
            review_type='quarterly',
            status='active',
            review_period_start=datetime(2024, 10, 1).date(),
            review_period_end=datetime(2024, 12, 31).date(),
            self_assessment_start=datetime(2024, 12, 1).date(),
            self_assessment_end=datetime(2024, 12, 15).date(),
            peer_review_start=datetime(2024, 12, 16).date(),
            peer_review_end=datetime(2024, 12, 25).date(),
            manager_review_start=datetime(2024, 12, 26).date(),
            manager_review_end=datetime(2025, 1, 5).date(),
            created_by=hr_admin
        )
        
        # Completed cycle
        completed_cycle = ReviewCycle.objects.create(
            name='Q3 2024 Performance Review',
            review_type='quarterly',
            status='completed',
            review_period_start=datetime(2024, 7, 1).date(),
            review_period_end=datetime(2024, 9, 30).date(),
            self_assessment_start=datetime(2024, 9, 1).date(),
            self_assessment_end=datetime(2024, 9, 10).date(),
            peer_review_start=datetime(2024, 9, 11).date(),
            peer_review_end=datetime(2024, 9, 20).date(),
            manager_review_start=datetime(2024, 9, 21).date(),
            manager_review_end=datetime(2024, 9, 30).date(),
            created_by=hr_admin
        )
        
        # Draft cycle for next quarter
        draft_cycle = ReviewCycle.objects.create(
            name='Q1 2025 Performance Review',
            review_type='quarterly',
            status='draft',
            review_period_start=datetime(2025, 1, 1).date(),
            review_period_end=datetime(2025, 3, 31).date(),
            self_assessment_start=datetime(2025, 3, 1).date(),
            self_assessment_end=datetime(2025, 3, 10).date(),
            peer_review_start=datetime(2025, 3, 11).date(),
            peer_review_end=datetime(2025, 3, 20).date(),
            manager_review_start=datetime(2025, 3, 21).date(),
            manager_review_end=datetime(2025, 3, 31).date(),
            created_by=hr_admin
        )
        
        # Annual review cycle
        annual_cycle = ReviewCycle.objects.create(
            name='2024 Annual Performance Review',
            review_type='annual',
            status='active',
            review_period_start=datetime(2024, 1, 1).date(),
            review_period_end=datetime(2024, 12, 31).date(),
            self_assessment_start=datetime(2024, 12, 1).date(),
            self_assessment_end=datetime(2024, 12, 20).date(),
            peer_review_start=datetime(2024, 12, 21).date(),
            peer_review_end=datetime(2025, 1, 10).date(),
            manager_review_start=datetime(2025, 1, 11).date(),
            manager_review_end=datetime(2025, 1, 25).date(),
            created_by=hr_admin
        )
        
        self.stdout.write(f'Created {ReviewCycle.objects.count()} review cycles')

    def add_cycle_participants(self, users):
        """Add participants to review cycles"""
        self.stdout.write('Adding participants to review cycles...')
        
        active_cycles = ReviewCycle.objects.filter(status__in=['active', 'completed'])
        
        for cycle in active_cycles:
            # Add all users as participants (except HR admin for some cycles)
            participants_to_add = users
            if cycle.review_type == 'quarterly':
                # For quarterly reviews, include most users
                participants_to_add = random.sample(users, min(len(users), max(3, len(users) - 1)))
            
            for user in participants_to_add:
                ReviewParticipant.objects.get_or_create(
                    cycle=cycle,
                    user=user,
                    defaults={'is_active': True}
                )
        
        total_participants = ReviewParticipant.objects.count()
        self.stdout.write(f'Added {total_participants} participant assignments')

    def create_sample_reviews(self, managers, employees):
        """Create sample self-assessments, peer reviews, and manager reviews"""
        self.stdout.write('Creating sample reviews...')
        
        active_cycles = ReviewCycle.objects.filter(status__in=['active', 'completed'])
        
        for cycle in active_cycles:
            participants = list(cycle.participants.filter(is_active=True))
            
            # Create self-assessments
            self.create_self_assessments(cycle, participants)
            
            # Create peer reviews
            self.create_peer_reviews(cycle, participants)
            
            # Create manager reviews
            self.create_manager_reviews(cycle, participants, managers)
            
            # Create upward reviews
            self.create_upward_reviews(cycle, participants, managers)

    def create_self_assessments(self, cycle, participants):
        """Create sample self-assessments"""
        sample_examples = {
            'technical': [
                'Led the implementation of the new microservices architecture, reducing system latency by 40%.',
                'Mentored 3 junior developers on React best practices and code review processes.',
                'Successfully migrated legacy codebase to TypeScript, improving code maintainability.',
                'Implemented automated testing suite that increased code coverage from 60% to 85%.'
            ],
            'collaboration': [
                'Facilitated cross-team workshops to align on API design standards.',
                'Actively participated in code reviews and provided constructive feedback to team members.',
                'Collaborated with product team to refine user stories and acceptance criteria.',
                'Organized team knowledge-sharing sessions on new technologies and best practices.'
            ],
            'problem_solving': [
                'Identified and resolved critical performance bottleneck in the payment processing system.',
                'Designed innovative solution for handling high-volume data processing requirements.',
                'Troubleshot complex production issues and implemented preventive measures.',
                'Analyzed user feedback and proposed UX improvements that increased user satisfaction by 25%.'
            ],
            'initiative': [
                'Proposed and led the adoption of new development tools that improved team productivity.',
                'Volunteered to lead the company hackathon and mentored participating teams.',
                'Initiated documentation improvements that reduced onboarding time for new team members.',
                'Proactively identified security vulnerabilities and implemented fixes before they became issues.'
            ]
        }
        
        development_goals = [
            'Improve public speaking skills by presenting at team meetings and conferences.',
            'Learn cloud architecture patterns and obtain AWS certification.',
            'Develop leadership skills by mentoring junior team members.',
            'Enhance product management knowledge to better collaborate with product teams.',
            'Improve data analysis skills to make more data-driven decisions.'
        ]
        
        for participant in participants:
            # Create self-assessment for some participants
            if random.random() < 0.7:  # 70% chance
                status = random.choice(['completed', 'in_progress', 'not_started'])
                if cycle.status == 'completed':
                    status = 'completed'
                
                self_assessment = SelfAssessment.objects.create(
                    cycle=cycle,
                    user=participant.user,
                    status=status,
                    technical_excellence=random.randint(3, 5) if status != 'not_started' else None,
                    technical_examples=random.choice(sample_examples['technical']) if status != 'not_started' else None,
                    collaboration=random.randint(3, 5) if status != 'not_started' else None,
                    collaboration_examples=random.choice(sample_examples['collaboration']) if status != 'not_started' else None,
                    problem_solving=random.randint(3, 5) if status != 'not_started' else None,
                    problem_solving_examples=random.choice(sample_examples['problem_solving']) if status != 'not_started' else None,
                    initiative=random.randint(3, 5) if status != 'not_started' else None,
                    initiative_examples=random.choice(sample_examples['initiative']) if status != 'not_started' else None,
                    development_goals=random.choice(development_goals) if status != 'not_started' else None,
                    manager_support_needed='Regular 1:1 meetings and feedback on leadership opportunities' if status != 'not_started' else None,
                    career_interests='Interested in technical leadership and solution architecture roles' if status != 'not_started' else None,
                    submitted_at=timezone.now() - timedelta(days=random.randint(1, 30)) if status == 'completed' else None
                )
                
                # Create goal assessments for completed self-assessments
                if status == 'completed':
                    user_goals = Goal.objects.filter(assigned_to=participant.user)[:3]
                    for goal in user_goals:
                        GoalAssessment.objects.create(
                            self_assessment=self_assessment,
                            goal=goal,
                            self_rating=random.choice(['exceeded', 'met', 'partially_met']),
                            accomplishments=f'Successfully achieved key milestones for {goal.title}',
                            evidence_links=['https://github.com/project/pull/123', 'https://docs.company.com/project']
                        )

    def create_peer_reviews(self, cycle, participants):
        """Create sample peer reviews"""
        peer_feedback_examples = {
            'collaboration': [
                'Always willing to help team members and shares knowledge generously.',
                'Excellent at facilitating discussions and finding consensus in team meetings.',
                'Communicates clearly and keeps everyone informed about project progress.',
                'Great at giving constructive feedback during code reviews.'
            ],
            'impact': [
                'Delivered high-quality features that significantly improved user experience.',
                'Consistently meets deadlines and delivers work that exceeds expectations.',
                'Made valuable contributions to architectural decisions and technical strategy.',
                'Helped improve team processes and development workflows.'
            ],
            'development': [
                'Could benefit from taking on more leadership opportunities in team projects.',
                'Consider exploring new technologies to expand technical skill set.',
                'Would benefit from more proactive communication about blockers and challenges.',
                'Could improve by participating more actively in team retrospectives.'
            ],
            'strengths': [
                'Strong technical skills and attention to detail.',
                'Excellent problem-solving abilities and creative thinking.',
                'Great team player who is always willing to help others.',
                'Consistently delivers high-quality work on time.'
            ]
        }
        
        # Create peer reviews between participants
        for participant in participants:
            # Each participant gives 2-3 peer reviews
            potential_reviewees = [p for p in participants if p.user != participant.user]
            reviewees = random.sample(potential_reviewees, min(3, len(potential_reviewees)))
            
            for reviewee_participant in reviewees:
                if random.random() < 0.6:  # 60% chance of creating peer review
                    status = random.choice(['completed', 'in_progress', 'not_started'])
                    if cycle.status == 'completed':
                        status = 'completed'
                    
                    PeerReview.objects.create(
                        cycle=cycle,
                        reviewer=participant.user,
                        reviewee=reviewee_participant.user,
                        is_anonymous=random.choice([True, False]),
                        status=status,
                        collaboration_rating=random.randint(3, 5) if status != 'not_started' else None,
                        collaboration_examples=random.choice(peer_feedback_examples['collaboration']) if status != 'not_started' else None,
                        impact_rating=random.randint(3, 5) if status != 'not_started' else None,
                        impact_examples=random.choice(peer_feedback_examples['impact']) if status != 'not_started' else None,
                        development_suggestions=random.choice(peer_feedback_examples['development']) if status != 'not_started' else None,
                        strengths_to_continue=random.choice(peer_feedback_examples['strengths']) if status != 'not_started' else None,
                        submitted_at=timezone.now() - timedelta(days=random.randint(1, 20)) if status == 'completed' else None
                    )

    def create_manager_reviews(self, cycle, participants, managers):
        """Create sample manager reviews"""
        manager_feedback = {
            'technical': 'Demonstrates strong technical skills and consistently delivers high-quality solutions.',
            'collaboration': 'Works effectively with team members and contributes positively to team dynamics.',
            'problem_solving': 'Shows excellent analytical thinking and approaches challenges methodically.',
            'initiative': 'Proactively identifies opportunities for improvement and takes ownership of solutions.',
            'development': 'Focus on developing leadership skills and taking on more complex technical challenges.',
            'support': 'Will provide opportunities for technical leadership and cross-functional collaboration.',
            'impact': 'Made significant contributions to project success and team productivity.'
        }
        
        for manager in managers:
            # Get team members for this manager
            team_members = [p for p in participants if p.user.manager == manager]
            
            for team_member_participant in team_members:
                if random.random() < 0.8:  # 80% chance of manager review
                    status = random.choice(['completed', 'in_progress', 'not_started'])
                    if cycle.status == 'completed':
                        status = 'completed'
                    
                    ManagerReview.objects.create(
                        cycle=cycle,
                        manager=manager,
                        employee=team_member_participant.user,
                        status=status,
                        overall_rating=random.choice(['exceeds_expectations', 'meets_expectations']) if status != 'not_started' else None,
                        technical_excellence=random.randint(3, 5) if status != 'not_started' else None,
                        technical_justification=manager_feedback['technical'] if status != 'not_started' else None,
                        collaboration=random.randint(3, 5) if status != 'not_started' else None,
                        collaboration_justification=manager_feedback['collaboration'] if status != 'not_started' else None,
                        problem_solving=random.randint(3, 5) if status != 'not_started' else None,
                        problem_solving_justification=manager_feedback['problem_solving'] if status != 'not_started' else None,
                        initiative=random.randint(3, 5) if status != 'not_started' else None,
                        initiative_justification=manager_feedback['initiative'] if status != 'not_started' else None,
                        development_plan=manager_feedback['development'] if status != 'not_started' else None,
                        manager_support=manager_feedback['support'] if status != 'not_started' else None,
                        business_impact=manager_feedback['impact'] if status != 'not_started' else None,
                        submitted_at=timezone.now() - timedelta(days=random.randint(1, 15)) if status == 'completed' else None
                    )

    def create_upward_reviews(self, cycle, participants, managers):
        """Create sample upward reviews"""
        upward_feedback = {
            'leadership': [
                'Provides clear direction and supports team members in achieving their goals.',
                'Creates a positive work environment and encourages open communication.',
                'Demonstrates strong leadership skills and leads by example.',
                'Effectively manages team priorities and helps remove blockers.'
            ],
            'communication': [
                'Communicates expectations clearly and provides regular feedback.',
                'Keeps the team informed about organizational changes and priorities.',
                'Listens actively to team concerns and addresses them promptly.',
                'Facilitates effective team meetings and one-on-one discussions.'
            ],
            'support': [
                'Provides opportunities for professional development and growth.',
                'Offers constructive feedback and guidance on career advancement.',
                'Supports work-life balance and team well-being.',
                'Advocates for the team and helps secure necessary resources.'
            ],
            'improvement': [
                'Could provide more frequent feedback on performance and development.',
                'Would benefit from more regular one-on-one meetings with team members.',
                'Could improve by being more available for questions and guidance.',
                'Consider providing more opportunities for skill development and training.'
            ]
        }
        
        for manager in managers:
            # Get team members who can provide upward reviews
            team_members = [p for p in participants if p.user.manager == manager]
            
            for team_member_participant in team_members:
                if random.random() < 0.5:  # 50% chance of upward review
                    status = random.choice(['completed', 'in_progress', 'not_started'])
                    if cycle.status == 'completed':
                        status = 'completed'
                    
                    UpwardReview.objects.create(
                        cycle=cycle,
                        reviewer=team_member_participant.user,
                        manager=manager,
                        is_anonymous=True,  # Most upward reviews are anonymous
                        status=status,
                        leadership_effectiveness=random.randint(3, 5) if status != 'not_started' else None,
                        leadership_examples=random.choice(upward_feedback['leadership']) if status != 'not_started' else None,
                        communication_clarity=random.randint(3, 5) if status != 'not_started' else None,
                        communication_examples=random.choice(upward_feedback['communication']) if status != 'not_started' else None,
                        support_provided=random.randint(3, 5) if status != 'not_started' else None,
                        support_examples=random.choice(upward_feedback['support']) if status != 'not_started' else None,
                        areas_for_improvement=random.choice(upward_feedback['improvement']) if status != 'not_started' else None,
                        additional_comments='Overall, great manager who supports the team well.' if status != 'not_started' else None,
                        submitted_at=timezone.now() - timedelta(days=random.randint(1, 25)) if status == 'completed' else None
                    ) 