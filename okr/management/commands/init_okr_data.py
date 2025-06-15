"""
Management command to initialize sample OKR data for testing Phase 4.
Creates objectives, goals, and tasks with proper relationships.
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
from decimal import Decimal

from core.models import User, Department
from okr.models import Objective, Goal, IndividualTask


class Command(BaseCommand):
    help = 'Initialize sample OKR data for testing Phase 4'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing OKR data before creating new data',
        )
    
    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing OKR data...')
            IndividualTask.objects.all().delete()
            Goal.objects.all().delete()
            Objective.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Existing OKR data cleared.'))
        
        # Get users for testing
        try:
            hr_admin = User.objects.filter(role='hr_admin').first()
            managers = User.objects.filter(role='manager')
            individuals = User.objects.filter(role='individual_contributor')
            
            if not hr_admin:
                self.stdout.write(self.style.ERROR('No HR Admin found. Please create users first.'))
                return
            
            if not managers.exists():
                self.stdout.write(self.style.ERROR('No Managers found. Please create users first.'))
                return
            
            if not individuals.exists():
                self.stdout.write(self.style.ERROR('No Individual Contributors found. Please create users first.'))
                return
            
            self.stdout.write(f'Found {managers.count()} managers and {individuals.count()} individual contributors')
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error getting users: {e}'))
            return
        
        # Create sample objectives
        objectives_data = [
            {
                'title': 'Increase Customer Satisfaction',
                'description': 'Improve overall customer satisfaction scores and reduce churn rate',
                'timeline_type': 'quarterly',
                'priority': 'high',
                'success_metrics': 'Achieve 90% customer satisfaction score, reduce churn by 15%'
            },
            {
                'title': 'Digital Transformation Initiative',
                'description': 'Modernize our technology stack and improve operational efficiency',
                'timeline_type': 'yearly',
                'priority': 'critical',
                'success_metrics': 'Complete cloud migration, implement new CRM system, 25% efficiency gain'
            }
        ]
        
        created_objectives = []
        
        for i, obj_data in enumerate(objectives_data):
            # Calculate dates based on timeline type
            start_date = date.today()
            if obj_data['timeline_type'] == 'quarterly':
                end_date = start_date + timedelta(days=90)
            else:  # yearly
                end_date = start_date + timedelta(days=365)
            
            # Assign to different managers
            manager = managers[i % managers.count()]
            
            objective = Objective.objects.create(
                title=obj_data['title'],
                description=obj_data['description'],
                owner=manager,
                created_by=hr_admin,
                status='active',
                priority=obj_data['priority'],
                timeline_type=obj_data['timeline_type'],
                start_date=start_date,
                end_date=end_date,
                success_metrics=obj_data['success_metrics']
            )
            
            # Add departments
            objective.departments.add(manager.department)
            created_objectives.append(objective)
            
            self.stdout.write(f'Created objective: {objective.title}')
        
        # Create sample goals
        goals_data = [
            {
                'title': 'Implement Customer Feedback System',
                'description': 'Deploy automated customer feedback collection system',
                'priority': 'high'
            },
            {
                'title': 'Complete Cloud Migration',
                'description': 'Migrate all systems to cloud infrastructure',
                'priority': 'critical'
            }
        ]
        
        created_goals = []
        
        for i, objective in enumerate(created_objectives):
            goal_data = goals_data[i]
            
            # Find an individual in the same department as the manager
            same_dept_individuals = individuals.filter(department=objective.owner.department)
            if not same_dept_individuals.exists():
                # Use any individual if none in same department
                individual = individuals.first()
            else:
                individual = same_dept_individuals.first()
            
            goal = Goal.objects.create(
                objective=objective,
                title=goal_data['title'],
                description=goal_data['description'],
                assigned_to=individual,
                created_by=objective.owner,
                status='in_progress',
                priority=goal_data['priority'],
                due_date=objective.end_date - timedelta(days=7)
            )
            
            created_goals.append(goal)
            self.stdout.write(f'  Created goal: {goal.title} -> {individual.get_full_name()}')
        
        # Create sample tasks
        tasks_data = [
            'Research solution options',
            'Create implementation plan',
            'Implement core functionality',
            'Conduct testing'
        ]
        
        for goal in created_goals:
            for i, task_title in enumerate(tasks_data):
                progress = Decimal(str(i * 25))  # 0, 25, 50, 75
                
                if progress == 0:
                    status = 'not_started'
                elif progress == 100:
                    status = 'completed'
                else:
                    status = 'in_progress'
                
                task = IndividualTask.objects.create(
                    goal=goal,
                    title=f"{task_title} for {goal.title}",
                    description=f'Task description for {task_title}',
                    assigned_to=goal.assigned_to,
                    created_by=goal.assigned_to,
                    status=status,
                    priority=goal.priority,
                    due_date=goal.due_date - timedelta(days=i*2),
                    progress_percentage=progress
                )
        
        # Update progress calculations
        for goal in created_goals:
            goal.calculate_progress()
        
        for objective in created_objectives:
            objective.calculate_progress()
        
        self.stdout.write(self.style.SUCCESS('\n=== OKR Data Initialization Complete ==='))
        self.stdout.write(f'Created {len(created_objectives)} objectives')
        self.stdout.write(f'Created {len(created_goals)} goals')
        self.stdout.write(f'Created {len(created_goals) * len(tasks_data)} tasks')
        
        for objective in created_objectives:
            self.stdout.write(f'{objective.title}: {objective.progress_percentage}% complete')
        
        self.stdout.write(self.style.SUCCESS('Sample OKR data created successfully!')) 