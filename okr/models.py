"""
OKR (Objectives and Key Results) Models
Implements the complete OKR hierarchy: Objectives → Goals → Individual Tasks
"""

import uuid
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal
from core.models import User, Department
from core.constants import (
    OBJECTIVE_STATUS_CHOICES, GOAL_STATUS_CHOICES, TASK_STATUS_CHOICES,
    PRIORITY_CHOICES, TIMELINE_TYPES
)


class Objective(models.Model):
    """
    Company/Department level objectives that can only be created by HR Admin
    and assigned to managers for execution.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255, help_text="Clear, concise objective title")
    description = models.TextField(blank=True, null=True, help_text="Detailed objective description")
    
    # Ownership and Assignment
    owner = models.ForeignKey(
        User, 
        on_delete=models.PROTECT,
        related_name='owned_objectives',
        limit_choices_to={'role': 'manager'},
        help_text="Manager responsible for this objective"
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='created_objectives',
        limit_choices_to={'role': 'hr_admin'},
        help_text="HR Admin who created this objective"
    )
    departments = models.ManyToManyField(
        Department,
        related_name='objectives',
        help_text="Departments involved in this objective"
    )
    
    # Status and Priority
    status = models.CharField(
        max_length=20,
        choices=OBJECTIVE_STATUS_CHOICES,
        default='draft',
        help_text="Current status of the objective"
    )
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default='medium',
        help_text="Priority level of the objective"
    )
    
    # Timeline
    timeline_type = models.CharField(
        max_length=20,
        choices=TIMELINE_TYPES,
        help_text="Duration type for this objective"
    )
    start_date = models.DateField(help_text="Objective start date")
    end_date = models.DateField(help_text="Objective end date")
    
    # Success Metrics and Progress
    success_metrics = models.TextField(
        blank=True, 
        null=True,
        help_text="Key Performance Indicators and success criteria"
    )
    progress_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Auto-calculated progress based on goals completion"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'priority']),
            models.Index(fields=['start_date', 'end_date']),
            models.Index(fields=['owner', 'status']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(end_date__gt=models.F('start_date')),
                name='objective_end_after_start'
            ),
            models.CheckConstraint(
                check=models.Q(progress_percentage__gte=0) & models.Q(progress_percentage__lte=100),
                name='objective_progress_valid_range'
            ),
        ]
    
    def clean(self):
        """Validate objective business rules"""
        super().clean()
        
        # Validate timeline type matches duration
        if self.start_date and self.end_date:
            duration_days = (self.end_date - self.start_date).days
            
            if self.timeline_type == 'quarterly' and not (80 <= duration_days <= 100):
                raise ValidationError({
                    'timeline_type': 'Quarterly objectives must be approximately 3 months (80-100 days)'
                })
            elif self.timeline_type == 'yearly' and not (350 <= duration_days <= 380):
                raise ValidationError({
                    'timeline_type': 'Yearly objectives must be approximately 12 months (350-380 days)'
                })
        
        # Validate owner is a manager
        if self.owner and self.owner.role != 'manager':
            raise ValidationError({
                'owner': 'Objectives can only be assigned to users with Manager role'
            })
        
        # Validate creator is HR Admin
        if self.created_by and self.created_by.role != 'hr_admin':
            raise ValidationError({
                'created_by': 'Objectives can only be created by HR Admin users'
            })
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
        
        # Auto-update status based on dates
        if self.status == 'active' and self.end_date < timezone.now().date():
            self.status = 'overdue'
            super().save(update_fields=['status'])
    
    def calculate_progress(self):
        """Calculate progress based on associated goals completion"""
        goals = self.goals.all()
        if not goals.exists():
            return Decimal('0.00')
        
        total_progress = sum(goal.progress_percentage for goal in goals)
        average_progress = total_progress / goals.count()
        
        # Update the progress field
        self.progress_percentage = round(average_progress, 2)
        self.save(update_fields=['progress_percentage'])
        
        return self.progress_percentage
    
    def get_completion_status(self):
        """Get human-readable completion status"""
        if self.progress_percentage == 100:
            return "Completed"
        elif self.progress_percentage >= 75:
            return "Nearly Complete"
        elif self.progress_percentage >= 50:
            return "On Track"
        elif self.progress_percentage >= 25:
            return "In Progress"
        else:
            return "Just Started"
    
    def is_overdue(self):
        """Check if objective is overdue"""
        return self.end_date < timezone.now().date() and self.status != 'completed'
    
    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"


class Goal(models.Model):
    """
    Team-level goals created by managers under objectives.
    Goals are assigned to individual contributors for execution.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    objective = models.ForeignKey(
        Objective,
        on_delete=models.CASCADE,
        related_name='goals',
        help_text="Parent objective this goal belongs to"
    )
    title = models.CharField(max_length=255, help_text="Clear, actionable goal title")
    description = models.TextField(blank=True, null=True, help_text="Detailed goal description")
    
    # Assignment and Ownership
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='assigned_goals',
        limit_choices_to={'role': 'individual_contributor'},
        help_text="Individual contributor assigned to this goal"
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='created_goals',
        limit_choices_to={'role': 'manager'},
        help_text="Manager who created this goal"
    )
    
    # Status and Priority
    status = models.CharField(
        max_length=20,
        choices=GOAL_STATUS_CHOICES,
        default='not_started',
        help_text="Current status of the goal"
    )
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default='medium',
        help_text="Priority level of the goal"
    )
    
    # Timeline
    due_date = models.DateField(
        blank=True, 
        null=True,
        help_text="Goal completion deadline"
    )
    
    # Progress Tracking
    progress_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Auto-calculated progress based on tasks completion"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'priority']),
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['objective', 'status']),
            models.Index(fields=['due_date']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['objective', 'title'],
                name='unique_goal_title_per_objective'
            ),
            models.CheckConstraint(
                check=models.Q(progress_percentage__gte=0) & models.Q(progress_percentage__lte=100),
                name='goal_progress_valid_range'
            ),
        ]
    
    def clean(self):
        """Validate goal business rules"""
        super().clean()
        
        # Validate due date is within objective timeline
        if self.due_date and self.objective:
            if self.due_date > self.objective.end_date:
                raise ValidationError({
                    'due_date': f'Goal due date cannot be after objective end date ({self.objective.end_date})'
                })
            if self.due_date < self.objective.start_date:
                raise ValidationError({
                    'due_date': f'Goal due date cannot be before objective start date ({self.objective.start_date})'
                })
        
        # Validate assigned user is individual contributor
        if self.assigned_to and self.assigned_to.role != 'individual_contributor':
            raise ValidationError({
                'assigned_to': 'Goals can only be assigned to Individual Contributors'
            })
        
        # Validate creator is manager
        if self.created_by and self.created_by.role != 'manager':
            raise ValidationError({
                'created_by': 'Goals can only be created by Managers'
            })
        
        # Validate department alignment
        if self.assigned_to and self.created_by:
            if self.assigned_to.department != self.created_by.department:
                raise ValidationError({
                    'assigned_to': 'Goals can only be assigned to users in the same department'
                })
        
        # Validate manager relationship
        if self.assigned_to and self.created_by:
            if self.assigned_to.manager != self.created_by:
                raise ValidationError({
                    'assigned_to': 'Goals can only be assigned to your direct reports'
                })
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
        
        # Auto-update status based on dates
        if self.due_date and self.due_date < timezone.now().date() and self.status not in ['completed', 'cancelled']:
            self.status = 'overdue'
            super().save(update_fields=['status'])
        
        # Update parent objective progress
        if self.objective:
            self.objective.calculate_progress()
    
    def calculate_progress(self):
        """Calculate progress based on associated tasks completion"""
        tasks = self.tasks.all()
        if not tasks.exists():
            return Decimal('0.00')
        
        total_progress = sum(task.progress_percentage for task in tasks)
        average_progress = total_progress / tasks.count()
        
        # Update the progress field
        self.progress_percentage = round(average_progress, 2)
        self.save(update_fields=['progress_percentage'])
        
        return self.progress_percentage
    
    def is_overdue(self):
        """Check if goal is overdue"""
        return self.due_date and self.due_date < timezone.now().date() and self.status != 'completed'
    
    def get_days_remaining(self):
        """Get days remaining until due date"""
        if not self.due_date:
            return None
        
        days = (self.due_date - timezone.now().date()).days
        return max(0, days)
    
    def __str__(self):
        return f"{self.title} - {self.assigned_to.get_full_name()} ({self.get_status_display()})"


class IndividualTask(models.Model):
    """
    Individual tasks created by employees under goals.
    These are the actual work items that drive goal completion.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    goal = models.ForeignKey(
        Goal,
        on_delete=models.CASCADE,
        related_name='tasks',
        help_text="Parent goal this task belongs to"
    )
    title = models.CharField(max_length=255, help_text="Specific, actionable task title")
    description = models.TextField(blank=True, null=True, help_text="Detailed task description")
    
    # Ownership
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='assigned_tasks',
        help_text="User responsible for this task"
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='created_tasks',
        help_text="User who created this task"
    )
    
    # Status and Priority
    status = models.CharField(
        max_length=20,
        choices=TASK_STATUS_CHOICES,
        default='not_started',
        help_text="Current status of the task"
    )
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default='medium',
        help_text="Priority level of the task"
    )
    
    # Timeline
    due_date = models.DateField(
        blank=True, 
        null=True,
        help_text="Task completion deadline"
    )
    
    # Progress and Evidence
    progress_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Manual progress input by assignee"
    )
    evidence_links = models.JSONField(
        default=list,
        blank=True,
        help_text="Links to work evidence (documents, repos, etc.)"
    )
    blocker_reason = models.TextField(
        blank=True,
        null=True,
        help_text="Reason for blocking (if status is blocked)"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'priority']),
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['goal', 'status']),
            models.Index(fields=['due_date']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(progress_percentage__gte=0) & models.Q(progress_percentage__lte=100),
                name='task_progress_valid_range'
            ),
        ]
    
    def clean(self):
        """Validate task business rules"""
        super().clean()
        
        # Validate due date is within goal timeline
        if self.due_date and self.goal and self.goal.due_date:
            if self.due_date > self.goal.due_date:
                raise ValidationError({
                    'due_date': f'Task due date cannot be after goal due date ({self.goal.due_date})'
                })
        
        # Validate blocker reason when status is blocked
        if self.status == 'blocked' and not self.blocker_reason:
            raise ValidationError({
                'blocker_reason': 'Blocker reason is required when task status is blocked'
            })
        
        # Validate evidence links format
        if self.evidence_links:
            if not isinstance(self.evidence_links, list):
                raise ValidationError({
                    'evidence_links': 'Evidence links must be a list of URLs'
                })
            
            for link in self.evidence_links:
                if not isinstance(link, dict) or 'url' not in link or 'title' not in link:
                    raise ValidationError({
                        'evidence_links': 'Each evidence link must have "url" and "title" fields'
                    })
    
    def save(self, *args, **kwargs):
        self.full_clean()
        
        # Set completed_at when status changes to completed
        if self.status == 'completed' and not self.completed_at:
            self.completed_at = timezone.now()
            self.progress_percentage = Decimal('100.00')
        elif self.status != 'completed':
            self.completed_at = None
        
        # Auto-update status based on dates
        if self.due_date and self.due_date < timezone.now().date() and self.status not in ['completed', 'cancelled']:
            self.status = 'overdue'
        
        super().save(*args, **kwargs)
        
        # Update parent goal progress
        if self.goal:
            self.goal.calculate_progress()
    
    def is_overdue(self):
        """Check if task is overdue"""
        return self.due_date and self.due_date < timezone.now().date() and self.status != 'completed'
    
    def get_days_remaining(self):
        """Get days remaining until due date"""
        if not self.due_date:
            return None
        
        days = (self.due_date - timezone.now().date()).days
        return max(0, days)
    
    def add_evidence_link(self, url, title, description=""):
        """Add an evidence link to the task"""
        if not self.evidence_links:
            self.evidence_links = []
        
        evidence = {
            'url': url,
            'title': title,
            'description': description,
            'added_at': timezone.now().isoformat()
        }
        
        self.evidence_links.append(evidence)
        self.save(update_fields=['evidence_links'])
    
    def __str__(self):
        return f"{self.title} - {self.assigned_to.get_full_name()} ({self.get_status_display()})"


class TaskUpdate(models.Model):
    """
    Progress updates and history tracking for individual tasks.
    Maintains a complete audit trail of task progress changes.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(
        IndividualTask,
        on_delete=models.CASCADE,
        related_name='updates',
        help_text="Task this update belongs to"
    )
    updated_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='task_updates',
        help_text="User who made this update"
    )
    
    # Progress Information
    previous_progress = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="Progress percentage before this update"
    )
    new_progress = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="Progress percentage after this update"
    )
    previous_status = models.CharField(
        max_length=20,
        choices=TASK_STATUS_CHOICES,
        help_text="Status before this update"
    )
    new_status = models.CharField(
        max_length=20,
        choices=TASK_STATUS_CHOICES,
        help_text="Status after this update"
    )
    
    # Update Details
    update_notes = models.TextField(
        blank=True,
        null=True,
        help_text="Notes about this progress update"
    )
    evidence_added = models.JSONField(
        default=list,
        blank=True,
        help_text="Evidence links added in this update"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['task', '-created_at']),
            models.Index(fields=['updated_by', '-created_at']),
        ]
    
    def get_progress_change(self):
        """Get the progress change amount"""
        return self.new_progress - self.previous_progress
    
    def is_significant_update(self):
        """Check if this is a significant progress update (>10% change)"""
        return abs(self.get_progress_change()) >= 10
    
    def __str__(self):
        progress_change = self.get_progress_change()
        change_indicator = "+" if progress_change > 0 else ""
        return f"{self.task.title} - {change_indicator}{progress_change}% progress by {self.updated_by.get_full_name()}"
