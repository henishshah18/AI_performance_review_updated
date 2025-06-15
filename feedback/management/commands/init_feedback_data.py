from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from feedback.models import Feedback, FeedbackTag, FeedbackTagTemplate, FeedbackComment
from okr.models import Objective, Goal, IndividualTask
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Initialize feedback system with sample data and tag templates'

    def add_arguments(self, parser):
        parser.add_argument(
            '--skip-data',
            action='store_true',
            help='Skip creating sample feedback data, only create tag templates',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting feedback data initialization...'))
        
        with transaction.atomic():
            # Create tag templates first
            self.create_tag_templates()
            
            if not options['skip_data']:
                # Create sample feedback data
                self.create_sample_feedback()
            
        self.stdout.write(self.style.SUCCESS('Feedback data initialization completed!'))

    def create_tag_templates(self):
        """Create predefined tag templates"""
        self.stdout.write('Creating feedback tag templates...')
        
        # Get HR Admin user (first one found)
        hr_admin = User.objects.filter(role='hr_admin').first()
        if not hr_admin:
            self.stdout.write(
                self.style.WARNING('No HR Admin found. Creating tag templates with first superuser.')
            )
            hr_admin = User.objects.filter(is_superuser=True).first()
            if not hr_admin:
                self.stdout.write(
                    self.style.ERROR('No superuser found. Cannot create tag templates.')
                )
                return

        tag_templates = [
            # Skills
            {'name': 'communication', 'category': 'skill', 'description': 'Effective verbal and written communication'},
            {'name': 'technical-expertise', 'category': 'skill', 'description': 'Strong technical knowledge and application'},
            {'name': 'problem-solving', 'category': 'skill', 'description': 'Ability to analyze and solve complex problems'},
            {'name': 'time-management', 'category': 'skill', 'description': 'Efficient use of time and meeting deadlines'},
            {'name': 'analytical-thinking', 'category': 'skill', 'description': 'Strong analytical and critical thinking abilities'},
            
            # Behaviors
            {'name': 'collaboration', 'category': 'behavior', 'description': 'Works well with team members'},
            {'name': 'initiative', 'category': 'behavior', 'description': 'Takes proactive action and shows initiative'},
            {'name': 'adaptability', 'category': 'behavior', 'description': 'Adapts well to change and new situations'},
            {'name': 'attention-to-detail', 'category': 'behavior', 'description': 'Careful attention to details and accuracy'},
            {'name': 'mentoring', 'category': 'behavior', 'description': 'Helps and guides other team members'},
            
            # Values
            {'name': 'integrity', 'category': 'value', 'description': 'Demonstrates honesty and ethical behavior'},
            {'name': 'accountability', 'category': 'value', 'description': 'Takes responsibility for actions and outcomes'},
            {'name': 'innovation', 'category': 'value', 'description': 'Brings creative ideas and innovative solutions'},
            {'name': 'customer-focus', 'category': 'value', 'description': 'Prioritizes customer needs and satisfaction'},
            {'name': 'continuous-learning', 'category': 'value', 'description': 'Committed to ongoing learning and development'},
            
            # Competencies
            {'name': 'leadership', 'category': 'competency', 'description': 'Demonstrates leadership qualities and potential'},
            {'name': 'decision-making', 'category': 'competency', 'description': 'Makes sound decisions under pressure'},
            {'name': 'strategic-thinking', 'category': 'competency', 'description': 'Thinks strategically about long-term goals'},
            {'name': 'project-management', 'category': 'competency', 'description': 'Effectively manages projects and resources'},
            {'name': 'conflict-resolution', 'category': 'competency', 'description': 'Handles conflicts and disagreements well'},
        ]

        created_count = 0
        for template_data in tag_templates:
            template, created = FeedbackTagTemplate.objects.get_or_create(
                name=template_data['name'],
                defaults={
                    'category': template_data['category'],
                    'description': template_data['description'],
                    'created_by': hr_admin,
                    'is_active': True
                }
            )
            if created:
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(f'Created {created_count} tag templates')
        )

    def create_sample_feedback(self):
        """Create sample feedback data"""
        self.stdout.write('Creating sample feedback data...')
        
        # Get users by role
        managers = list(User.objects.filter(role='manager'))
        individuals = list(User.objects.filter(role='individual_contributor'))
        
        if not managers or not individuals:
            self.stdout.write(
                self.style.WARNING('Not enough users found to create sample feedback')
            )
            return

        # Get available tag templates
        tag_templates = list(FeedbackTagTemplate.objects.filter(is_active=True))

        feedback_samples = [
            {
                'content': 'Great job on the quarterly presentation! Your communication skills really shone through and the data visualization was excellent.',
                'feedback_type': 'commendation',
                'visibility': 'public',
                'tags': ['communication', 'technical-expertise', 'attention-to-detail']
            },
            {
                'content': 'I noticed you\'ve been struggling with time management on recent projects. Consider using project management tools to better track your tasks and deadlines.',
                'feedback_type': 'guidance',
                'visibility': 'private',
                'tags': ['time-management', 'project-management']
            },
            {
                'content': 'Your problem-solving approach on the recent bug fixes was impressive. You systematically identified the root cause and implemented a robust solution.',
                'feedback_type': 'commendation',
                'visibility': 'public',
                'tags': ['problem-solving', 'analytical-thinking', 'technical-expertise']
            },
            {
                'content': 'While your technical skills are strong, I think there\'s room for improvement in team collaboration. Try to be more inclusive in team discussions.',
                'feedback_type': 'constructive',
                'visibility': 'private',
                'tags': ['collaboration', 'communication']
            },
            {
                'content': 'Thank you for taking the initiative to mentor the new team member. Your guidance has been invaluable to their onboarding process.',
                'feedback_type': 'commendation',
                'visibility': 'public',
                'tags': ['mentoring', 'leadership', 'initiative']
            },
            {
                'content': 'Your adaptability during the recent organizational changes has been remarkable. You\'ve helped the team navigate through uncertainty with a positive attitude.',
                'feedback_type': 'commendation',
                'visibility': 'public',
                'tags': ['adaptability', 'leadership', 'collaboration']
            },
            {
                'content': 'I appreciate your innovative approach to solving the customer integration challenge. Your creative solution saved us significant development time.',
                'feedback_type': 'commendation',
                'visibility': 'public',
                'tags': ['innovation', 'problem-solving', 'customer-focus']
            },
            {
                'content': 'Consider improving your decision-making process by gathering more input from stakeholders before finalizing major changes.',
                'feedback_type': 'guidance',
                'visibility': 'private',
                'tags': ['decision-making', 'collaboration']
            }
        ]

        created_feedback = 0
        for i, feedback_data in enumerate(feedback_samples):
            # Randomly assign from_user and to_user
            if random.choice([True, False]) and managers:
                from_user = random.choice(managers)
                to_user = random.choice(individuals)
            else:
                from_user = random.choice(individuals)
                to_user = random.choice([u for u in individuals if u != from_user])

            # Find related entities that belong to the to_user
            related_entity = {}
            
            # Try to find a goal assigned to the to_user
            user_goals = Goal.objects.filter(assigned_to=to_user)
            if user_goals.exists() and random.choice([True, False]):
                related_entity['related_goal'] = random.choice(user_goals)
            
            # Try to find a task assigned to the to_user
            user_tasks = IndividualTask.objects.filter(assigned_to=to_user)
            if user_tasks.exists() and random.choice([True, False]) and not related_entity:
                related_entity['related_task'] = random.choice(user_tasks)
            
            # Try to find an objective owned by the to_user or their department
            user_objectives = Objective.objects.filter(
                Q(owner=to_user) | Q(owner__department=to_user.department)
            )
            if user_objectives.exists() and random.choice([True, False]) and not related_entity:
                related_entity['related_objective'] = random.choice(user_objectives)

            # Create feedback
            try:
                feedback = Feedback.objects.create(
                    from_user=from_user,
                    to_user=to_user,
                    content=feedback_data['content'],
                    feedback_type=feedback_data['feedback_type'],
                    visibility=feedback_data['visibility'],
                    is_anonymous=random.choice([True, False]) if feedback_data['feedback_type'] != 'commendation' else False,
                    **related_entity
                )

                # Add tags
                for tag_name in feedback_data['tags']:
                    if tag_templates:
                        template = next((t for t in tag_templates if t.name == tag_name), None)
                        if template:
                            FeedbackTag.objects.create(
                                feedback=feedback,
                                tag_name=tag_name
                            )

                # Randomly add comments to some feedback
                if random.choice([True, False, False]):  # 33% chance
                    comment_user = to_user if random.choice([True, False]) else from_user
                    comment_content = random.choice([
                        "Thank you for this feedback, it's very helpful!",
                        "I appreciate you taking the time to share this.",
                        "This gives me good direction for improvement.",
                        "Great points, I'll work on implementing these suggestions.",
                        "Thanks for recognizing my efforts on this!"
                    ])
                    
                    FeedbackComment.objects.create(
                        feedback=feedback,
                        comment_by=comment_user,
                        content=comment_content
                    )

                created_feedback += 1
                
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f'Failed to create feedback {i+1}: {str(e)}')
                )
                continue

        self.stdout.write(
            self.style.SUCCESS(f'Created {created_feedback} sample feedback items')
        ) 