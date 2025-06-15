import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.core.validators import MaxLengthValidator
from okr.models import Objective, Goal, IndividualTask
from django.conf import settings
from core.models import Department
from ai_features.signals import new_content_for_analysis

User = get_user_model()


class Feedback(models.Model):
    """
    Core feedback model for continuous feedback between users.
    Supports different types of feedback with optional anonymity.
    """
    FEEDBACK_TYPE_CHOICES = [
        ('commendation', 'Commendation'),
        ('guidance', 'Guidance'),
        ('constructive', 'Constructive'),
    ]
    
    VISIBILITY_CHOICES = [
        ('private', 'Private'),
        ('public', 'Public'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    from_user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='feedback_given',
        help_text="User who is giving the feedback"
    )
    to_user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='feedback_received',
        help_text="User who is receiving the feedback"
    )
    feedback_type = models.CharField(
        max_length=20, 
        choices=FEEDBACK_TYPE_CHOICES,
        help_text="Type of feedback being given"
    )
    visibility = models.CharField(
        max_length=10, 
        choices=VISIBILITY_CHOICES, 
        default='private',
        help_text="Who can see this feedback"
    )
    content = models.TextField(
        validators=[MaxLengthValidator(500)],
        help_text="The feedback content (max 500 characters)"
    )
    
    # Optional relationships to OKR entities
    related_objective = models.ForeignKey(
        Objective, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='feedback_items',
        help_text="Related objective if feedback is about specific objective"
    )
    related_goal = models.ForeignKey(
        Goal, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='feedback_items',
        help_text="Related goal if feedback is about specific goal"
    )
    related_task = models.ForeignKey(
        IndividualTask, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='feedback_items',
        help_text="Related task if feedback is about specific task"
    )
    
    is_anonymous = models.BooleanField(
        default=False,
        help_text="Whether this feedback should be shown as anonymous"
    )
    sentiment_analyzed = models.BooleanField(
        default=False,
        help_text="Whether AI sentiment analysis has been performed"
    )
    
    tags = models.ManyToManyField('FeedbackTag', related_name='feedback_items', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['from_user', 'created_at']),
            models.Index(fields=['to_user', 'created_at']),
            models.Index(fields=['feedback_type']),
            models.Index(fields=['visibility']),
            models.Index(fields=['created_at']),
        ]
        
    def clean(self):
        """Validate that users cannot give feedback to themselves"""
        if self.from_user_id == self.to_user_id:
            raise ValidationError("Users cannot give feedback to themselves")
            
        # Validate related entities belong to the correct users
        if self.related_objective and self.related_objective.owner != self.to_user:
            if not self.to_user.department == self.related_objective.owner.department:
                raise ValidationError("Related objective must belong to feedback recipient or their department")
                
        if self.related_goal and self.related_goal.assigned_to != self.to_user:
            raise ValidationError("Related goal must be assigned to feedback recipient")
            
        if self.related_task and self.related_task.assigned_to != self.to_user:
            raise ValidationError("Related task must be assigned to feedback recipient")
    
    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)
        if is_new:
            # Send signal for AI analysis
            new_content_for_analysis.send(sender=self.__class__, instance=self)
    
    def __str__(self):
        from_user_name = "Anonymous" if self.is_anonymous else self.from_user.get_full_name()
        return f"Feedback from {from_user_name} to {self.to_user.get_full_name()} at {self.created_at.strftime('%Y-%m-%d')}"
    
    @property
    def display_sender(self):
        """Return sender name or 'Anonymous' based on is_anonymous flag"""
        return "Anonymous" if self.is_anonymous else self.from_user.get_full_name()
    
    @property
    def content_preview(self):
        """Return truncated content for previews"""
        return self.content[:100] + "..." if len(self.content) > 100 else self.content
    
    @property
    def related_entity_display(self):
        """Return display text for related entity"""
        if self.related_task:
            return f"Task: {self.related_task.title}"
        elif self.related_goal:
            return f"Goal: {self.related_goal.title}"
        elif self.related_objective:
            return f"Objective: {self.related_objective.title}"
        return "General feedback"


class FeedbackTag(models.Model):
    """
    Tags that can be applied to feedback for categorization and analysis.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    feedback = models.ForeignKey(
        Feedback, 
        on_delete=models.CASCADE, 
        related_name='tags'
    )
    tag_name = models.CharField(
        max_length=100,
        help_text="Name of the tag"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['feedback', 'tag_name']
        indexes = [
            models.Index(fields=['tag_name']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return self.tag_name


class FeedbackTagTemplate(models.Model):
    """
    Predefined tag templates that can be used across the organization.
    Managed by HR Admin.
    """
    CATEGORY_CHOICES = [
        ('skill', 'Skill'),
        ('behavior', 'Behavior'),
        ('value', 'Value'),
        ('competency', 'Competency'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(
        max_length=100, 
        unique=True,
        help_text="Name of the tag template"
    )
    description = models.TextField(
        null=True, 
        blank=True,
        help_text="Description of what this tag represents"
    )
    category = models.CharField(
        max_length=20, 
        choices=CATEGORY_CHOICES,
        help_text="Category this tag belongs to"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this tag template is available for use"
    )
    created_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        help_text="HR Admin who created this tag template"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['category', 'name']
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['is_active']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"
    
    @property
    def usage_count(self):
        """Return count of how many times this tag has been used"""
        return FeedbackTag.objects.filter(tag_name=self.name).count()


class FeedbackComment(models.Model):
    """
    Comments that can be added to feedback for additional discussion.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    feedback = models.ForeignKey(
        Feedback, 
        on_delete=models.CASCADE, 
        related_name='comments'
    )
    comment_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        help_text="User who made the comment"
    )
    content = models.TextField(
        validators=[MaxLengthValidator(300)],
        help_text="Comment content (max 300 characters)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['feedback', 'created_at']),
            models.Index(fields=['comment_by']),
        ]
    
    def __str__(self):
        return f"Comment by {self.comment_by.get_full_name()} on {self.feedback}"
    
    def clean(self):
        """Validate comment permissions"""
        # Only feedback participants (giver, receiver) and managers can comment
        if self.comment_by not in [self.feedback.from_user, self.feedback.to_user]:
            # Check if commenter is a manager of either participant
            if (self.comment_by.role != 'manager' or 
                (self.feedback.from_user.manager != self.comment_by and 
                 self.feedback.to_user.manager != self.comment_by)):
                raise ValidationError("Only feedback participants and their managers can comment")
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


# Signal handlers for feedback notifications
# TODO: Uncomment when Notification model is implemented
# from django.db.models.signals import post_save
# from django.dispatch import receiver

# @receiver(post_save, sender=Feedback)
# def create_feedback_notification(sender, instance, created, **kwargs):
#     """Create notification when feedback is given"""
#     if created:
#         # Import here to avoid circular imports
#         from core.models import Notification
        
#         # Create notification for feedback recipient
#         Notification.objects.create(
#             user=instance.to_user,
#             title="New Feedback Received",
#             message=f"You received {instance.get_feedback_type_display().lower()} feedback from {instance.display_sender}",
#             notification_type='feedback',
#             related_object_id=str(instance.id),
#             action_url=f"/feedback/{instance.id}/"
#         )
        
#         # If feedback is related to a goal/task, notify the manager
#         if instance.related_goal or instance.related_task:
#             manager = instance.to_user.manager
#             if manager and manager != instance.from_user:
#                 Notification.objects.create(
#                     user=manager,
#                     title="Team Member Received Feedback",
#                     message=f"{instance.to_user.get_full_name()} received feedback on {instance.related_entity_display}",
#                     notification_type='team_update',
#                     related_object_id=str(instance.id),
#                     action_url=f"/feedback/{instance.id}/"
#                 )

# @receiver(post_save, sender=FeedbackComment)
# def create_comment_notification(sender, instance, created, **kwargs):
#     """Create notification when comment is added to feedback"""
#     if created:
#         from core.models import Notification
        
#         # Notify feedback participants (except the commenter)
#         recipients = [instance.feedback.from_user, instance.feedback.to_user]
#         for recipient in recipients:
#             if recipient != instance.comment_by:
#                 Notification.objects.create(
#                     user=recipient,
#                     title="New Comment on Feedback",
#                     message=f"{instance.comment_by.get_full_name()} commented on feedback",
#                     notification_type='comment',
#                     related_object_id=str(instance.feedback.id),
#                     action_url=f"/feedback/{instance.feedback.id}/"
#                 )
