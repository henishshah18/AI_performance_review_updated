"""
Management command to create a superuser with all required fields.
"""

from django.core.management.base import BaseCommand
from core.models import User, Department


class Command(BaseCommand):
    help = 'Create a superuser with all required fields'

    def add_arguments(self, parser):
        parser.add_argument('--email', default='admin@example.com', help='Admin email')
        parser.add_argument('--username', default='admin', help='Admin username')
        parser.add_argument('--password', default='admin123', help='Admin password')

    def handle(self, *args, **options):
        email = options['email']
        username = options['username']
        password = options['password']
        
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            self.stdout.write(
                self.style.WARNING(f'User with email {email} already exists!')
            )
            return
        
        # Get the HR department
        try:
            hr_dept = Department.objects.get(name='hr')
        except Department.DoesNotExist:
            self.stdout.write(
                self.style.ERROR('HR department not found. Please run init_system first.')
            )
            return
        
        # Create superuser
        user = User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
            first_name='Admin',
            last_name='User',
            role='hr_admin',
            department=hr_dept
        )
        
        self.stdout.write(
            self.style.SUCCESS(f'Superuser created successfully!')
        )
        self.stdout.write(f'Email: {user.email}')
        self.stdout.write(f'Username: {user.username}')
        self.stdout.write(f'Role: {user.role}')
        self.stdout.write(f'Department: {user.department}')
        self.stdout.write(f'Password: {password}')
        self.stdout.write(
            self.style.WARNING('Please change the password after first login!')
        ) 