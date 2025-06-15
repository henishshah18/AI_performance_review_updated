"""
Management command to initialize the system with default data.
This command creates default departments and system settings.
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from core.models import Department, SystemSettings
from core.constants import DEFAULT_SYSTEM_SETTINGS, DEPARTMENT_CHOICES


class Command(BaseCommand):
    help = 'Initialize the system with default departments and settings'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force initialization even if data already exists',
        )

    def handle(self, *args, **options):
        force = options['force']
        
        with transaction.atomic():
            # Create default departments
            self.create_departments(force)
            
            # Create default system settings
            self.create_system_settings(force)
        
        self.stdout.write(
            self.style.SUCCESS('Successfully initialized the system!')
        )

    def create_departments(self, force):
        """Create default departments."""
        self.stdout.write('Creating default departments...')
        
        created_count = 0
        for dept_code, dept_name in DEPARTMENT_CHOICES:
            department, created = Department.objects.get_or_create(
                name=dept_code,
                defaults={
                    'description': f'{dept_name} department',
                    'is_active': True,
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(f'  ✓ Created department: {dept_name}')
            elif force:
                department.description = f'{dept_name} department'
                department.is_active = True
                department.save()
                self.stdout.write(f'  ↻ Updated department: {dept_name}')
            else:
                self.stdout.write(f'  - Department already exists: {dept_name}')
        
        if created_count > 0:
            self.stdout.write(
                self.style.SUCCESS(f'Created {created_count} new departments')
            )

    def create_system_settings(self, force):
        """Create default system settings."""
        self.stdout.write('Creating default system settings...')
        
        # We need a user to create settings, but we might not have one yet
        # So we'll create settings without the created_by field for now
        created_count = 0
        
        for key, value in DEFAULT_SYSTEM_SETTINGS.items():
            setting, created = SystemSettings.objects.get_or_create(
                key=key,
                defaults={
                    'value': value,
                    'description': f'Default setting for {key}',
                    'is_active': True,
                    'created_by': None,  # Will be set later when we have users
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(f'  ✓ Created setting: {key} = {value}')
            elif force:
                setting.value = value
                setting.description = f'Default setting for {key}'
                setting.is_active = True
                setting.save()
                self.stdout.write(f'  ↻ Updated setting: {key} = {value}')
            else:
                self.stdout.write(f'  - Setting already exists: {key}')
        
        if created_count > 0:
            self.stdout.write(
                self.style.SUCCESS(f'Created {created_count} new settings')
            ) 