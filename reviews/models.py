from django.db import models
import uuid
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from okr.models import Goal

User = get_user_model()


class ReviewCycle(models.Model):
    """
    Review cycle model for managing 360° performance review periods.
    Defines the timeline and participants for a review cycle.
    """
    REVIEW_TYPE_CHOICES = [
        ('quarterly', 'Quarterly'),
        ('half_yearly', 'Half Yearly'),
        ('annual', 'Annual'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(
        max_length=255,
        help_text="Name of the review cycle (e.g., 'Q4 2024 Performance Review')"
    )
    review_type = models.CharField(
        max_length=20,
        choices=REVIEW_TYPE_CHOICES,
        help_text="Type of review cycle"
    )
    
    # Review period dates
    review_period_start = models.DateField(
        help_text="Start date of the performance period being reviewed"
    )
    review_period_end = models.DateField(
        help_text="End date of the performance period being reviewed"
    )
    
    # Self-assessment phase
    self_assessment_start = models.DateField(
        help_text="When employees can start their self-assessments"
    )
    self_assessment_end = models.DateField(
        help_text="Deadline for self-assessment completion"
    )
    
    # Peer review phase
    peer_review_start = models.DateField(
        help_text="When peer reviews can begin"
    )
    peer_review_end = models.DateField(
        help_text="Deadline for peer review completion"
    )
    
    # Manager review phase
    manager_review_start = models.DateField(
        help_text="When manager reviews can begin"
    )
    manager_review_end = models.DateField(
        help_text="Deadline for manager review completion"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        help_text="Current status of the review cycle"
    )
    
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        help_text="HR Admin who created this review cycle"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['review_type']),
            models.Index(fields=['created_at']),
        ]
    
    def clean(self):
        """Validate date logic for review cycle"""
        if self.review_period_start and self.review_period_end:
            if self.review_period_start >= self.review_period_end:
                raise ValidationError("Review period start must be before end date")
        
        if self.self_assessment_start and self.self_assessment_end:
            if self.self_assessment_start >= self.self_assessment_end:
                raise ValidationError("Self-assessment start must be before end date")
        
        if self.peer_review_start and self.peer_review_end:
            if self.peer_review_start >= self.peer_review_end:
                raise ValidationError("Peer review start must be before end date")
        
        if self.manager_review_start and self.manager_review_end:
            if self.manager_review_start >= self.manager_review_end:
                raise ValidationError("Manager review start must be before end date")
        
        # Ensure phases don't overlap inappropriately
        if (self.self_assessment_end and self.peer_review_start and 
            self.self_assessment_end > self.peer_review_start):
            raise ValidationError("Self-assessment should complete before peer reviews begin")
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.name} ({self.get_review_type_display()})"
    
    @property
    def is_active(self):
        """Check if the review cycle is currently active"""
        return self.status == 'active'
    
    @property
    def current_phase(self):
        """Determine the current phase of the review cycle"""
        today = timezone.now().date()
        
        if today < self.self_assessment_start:
            return "Not Started"
        elif self.self_assessment_start <= today <= self.self_assessment_end:
            return "Self Assessment"
        elif self.peer_review_start <= today <= self.peer_review_end:
            return "Peer Review"
        elif self.manager_review_start <= today <= self.manager_review_end:
            return "Manager Review"
        else:
            return "Completed"


class ReviewParticipant(models.Model):
    """
    Tracks which users are participating in a specific review cycle.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cycle = models.ForeignKey(
        ReviewCycle,
        on_delete=models.CASCADE,
        related_name='participants'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='review_participations'
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this user is actively participating in the review"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['cycle', 'user']
        indexes = [
            models.Index(fields=['cycle', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.cycle.name}"


class SelfAssessment(models.Model):
    """
    Self-assessment model for employees to evaluate their own performance.
    """
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cycle = models.ForeignKey(
        ReviewCycle,
        on_delete=models.CASCADE,
        related_name='self_assessments'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='self_assessments'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='not_started'
    )
    
    # Performance ratings (1-5 scale)
    technical_excellence = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Technical skills and expertise (1-5 scale)"
    )
    technical_examples = models.TextField(
        null=True,
        blank=True,
        help_text="Examples of technical achievements and contributions"
    )
    
    collaboration = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Teamwork and collaboration skills (1-5 scale)"
    )
    collaboration_examples = models.TextField(
        null=True,
        blank=True,
        help_text="Examples of collaboration and teamwork"
    )
    
    problem_solving = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Problem-solving and analytical skills (1-5 scale)"
    )
    problem_solving_examples = models.TextField(
        null=True,
        blank=True,
        help_text="Examples of problem-solving achievements"
    )
    
    initiative = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Initiative and proactive behavior (1-5 scale)"
    )
    initiative_examples = models.TextField(
        null=True,
        blank=True,
        help_text="Examples of taking initiative and going above and beyond"
    )
    
    # Development and career planning
    development_goals = models.TextField(
        null=True,
        blank=True,
        help_text="Personal development goals for the next period"
    )
    manager_support_needed = models.TextField(
        null=True,
        blank=True,
        help_text="Support needed from manager for growth and development"
    )
    career_interests = models.TextField(
        null=True,
        blank=True,
        help_text="Career interests and aspirations"
    )
    
    sentiment_analyzed = models.BooleanField(
        default=False,
        help_text="Whether AI sentiment analysis has been performed"
    )
    
    submitted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the self-assessment was submitted"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['cycle', 'user']
        indexes = [
            models.Index(fields=['cycle', 'status']),
            models.Index(fields=['user', 'created_at']),
        ]
    
    def __str__(self):
        return f"Self Assessment - {self.user.get_full_name()} ({self.cycle.name})"
    
    @property
    def completion_percentage(self):
        """Calculate completion percentage based on filled fields"""
        total_fields = 8  # technical, collaboration, problem_solving, initiative + examples
        filled_fields = 0
        
        if self.technical_excellence:
            filled_fields += 1
        if self.technical_examples:
            filled_fields += 1
        if self.collaboration:
            filled_fields += 1
        if self.collaboration_examples:
            filled_fields += 1
        if self.problem_solving:
            filled_fields += 1
        if self.problem_solving_examples:
            filled_fields += 1
        if self.initiative:
            filled_fields += 1
        if self.initiative_examples:
            filled_fields += 1
        
        return round((filled_fields / total_fields) * 100)


class GoalAssessment(models.Model):
    """
    Self-assessment of individual goals within a review cycle.
    """
    RATING_CHOICES = [
        ('exceeded', 'Exceeded'),
        ('met', 'Met'),
        ('partially_met', 'Partially Met'),
        ('not_met', 'Not Met'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    self_assessment = models.ForeignKey(
        SelfAssessment,
        on_delete=models.CASCADE,
        related_name='goal_assessments'
    )
    goal = models.ForeignKey(
        Goal,
        on_delete=models.CASCADE,
        related_name='self_assessments'
    )
    self_rating = models.CharField(
        max_length=20,
        choices=RATING_CHOICES,
        help_text="Self-assessment rating for this goal"
    )
    accomplishments = models.TextField(
        null=True,
        blank=True,
        help_text="Key accomplishments and achievements for this goal"
    )
    evidence_links = models.JSONField(
        default=list,
        blank=True,
        help_text="Links to evidence, documents, or artifacts"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['self_assessment', 'goal']
        indexes = [
            models.Index(fields=['self_assessment']),
            models.Index(fields=['goal']),
        ]
    
    def __str__(self):
        return f"Goal Assessment - {self.goal.title} ({self.get_self_rating_display()})"


class PeerReview(models.Model):
    """
    Peer review model for colleagues to provide feedback on each other.
    """
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cycle = models.ForeignKey(
        ReviewCycle,
        on_delete=models.CASCADE,
        related_name='peer_reviews'
    )
    reviewer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='peer_reviews_given',
        help_text="User providing the peer review"
    )
    reviewee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='peer_reviews_received',
        help_text="User being reviewed"
    )
    is_anonymous = models.BooleanField(
        default=True,
        help_text="Whether this review should be anonymous to the reviewee"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='not_started'
    )
    
    # Peer review ratings
    collaboration_rating = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Collaboration effectiveness (1-5 scale)"
    )
    collaboration_examples = models.TextField(
        null=True,
        blank=True,
        help_text="Examples of collaboration strengths or areas for improvement"
    )
    
    impact_rating = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Impact and contribution to team/projects (1-5 scale)"
    )
    impact_examples = models.TextField(
        null=True,
        blank=True,
        help_text="Examples of positive impact and contributions"
    )
    
    development_suggestions = models.TextField(
        null=True,
        blank=True,
        help_text="Constructive suggestions for professional development"
    )
    strengths_to_continue = models.TextField(
        null=True,
        blank=True,
        help_text="Strengths and behaviors to continue"
    )
    
    sentiment_analyzed = models.BooleanField(
        default=False,
        help_text="Whether AI sentiment analysis has been performed"
    )
    
    submitted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the peer review was submitted"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['cycle', 'reviewer', 'reviewee']
        indexes = [
            models.Index(fields=['cycle', 'status']),
            models.Index(fields=['reviewer']),
            models.Index(fields=['reviewee']),
        ]
    
    def clean(self):
        """Validate that users cannot review themselves"""
        if self.reviewer_id == self.reviewee_id:
            raise ValidationError("Users cannot provide peer reviews for themselves")
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        reviewer_name = "Anonymous" if self.is_anonymous else self.reviewer.get_full_name()
        return f"Peer Review - {reviewer_name} → {self.reviewee.get_full_name()}"


class PeerReviewAssignment(models.Model):
    """
    Assignments for peer reviews - who should review whom.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('declined', 'Declined'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reviewee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='peer_review_assignments_received',
        help_text="User to be reviewed"
    )
    reviewer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='peer_review_assignments_given',
        help_text="User assigned to provide the review"
    )
    review_cycle = models.CharField(
        max_length=100,
        help_text="Review cycle identifier"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    due_date = models.DateField(
        help_text="Due date for completing the peer review"
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='peer_review_assignments_created',
        help_text="Manager or HR who created this assignment"
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the peer review was completed"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['reviewee', 'reviewer', 'review_cycle']
        indexes = [
            models.Index(fields=['review_cycle', 'status']),
            models.Index(fields=['due_date']),
        ]
    
    def __str__(self):
        return f"Assignment: {self.reviewer.get_full_name()} → {self.reviewee.get_full_name()}"


class ManagerReview(models.Model):
    """
    Manager review model for supervisors to evaluate their direct reports.
    """
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    
    OVERALL_RATING_CHOICES = [
        ('exceeds_expectations', 'Exceeds Expectations'),
        ('meets_expectations', 'Meets Expectations'),
        ('below_expectations', 'Below Expectations'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cycle = models.ForeignKey(
        ReviewCycle,
        on_delete=models.CASCADE,
        related_name='manager_reviews'
    )
    manager = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='manager_reviews_given',
        help_text="Manager providing the review"
    )
    employee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='manager_reviews_received',
        help_text="Employee being reviewed"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='not_started'
    )
    
    overall_rating = models.CharField(
        max_length=30,
        choices=OVERALL_RATING_CHOICES,
        null=True,
        blank=True,
        help_text="Overall performance rating"
    )
    
    # Detailed performance ratings
    technical_excellence = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Technical skills and expertise (1-5 scale)"
    )
    technical_justification = models.TextField(
        null=True,
        blank=True,
        help_text="Justification for technical excellence rating"
    )
    
    collaboration = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Collaboration and teamwork (1-5 scale)"
    )
    collaboration_justification = models.TextField(
        null=True,
        blank=True,
        help_text="Justification for collaboration rating"
    )
    
    problem_solving = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Problem-solving abilities (1-5 scale)"
    )
    problem_solving_justification = models.TextField(
        null=True,
        blank=True,
        help_text="Justification for problem-solving rating"
    )
    
    initiative = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Initiative and proactive behavior (1-5 scale)"
    )
    initiative_justification = models.TextField(
        null=True,
        blank=True,
        help_text="Justification for initiative rating"
    )
    
    # Development and planning
    development_plan = models.TextField(
        null=True,
        blank=True,
        help_text="Development plan and growth opportunities"
    )
    manager_support = models.TextField(
        null=True,
        blank=True,
        help_text="Support manager will provide for employee development"
    )
    business_impact = models.TextField(
        null=True,
        blank=True,
        help_text="Assessment of business impact and contributions"
    )
    
    sentiment_analyzed = models.BooleanField(
        default=False,
        help_text="Whether AI sentiment analysis has been performed"
    )
    
    submitted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the manager review was submitted"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['cycle', 'manager', 'employee']
        indexes = [
            models.Index(fields=['cycle', 'status']),
            models.Index(fields=['manager']),
            models.Index(fields=['employee']),
        ]
    
    def clean(self):
        """Validate manager-employee relationship"""
        if self.employee.manager != self.manager:
            raise ValidationError("Manager must be the direct supervisor of the employee")
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Manager Review - {self.manager.get_full_name()} → {self.employee.get_full_name()}"


class GoalManagerAssessment(models.Model):
    """
    Manager's assessment of employee goals within a review cycle.
    """
    RATING_CHOICES = [
        ('exceeded', 'Exceeded'),
        ('met', 'Met'),
        ('partially_met', 'Partially Met'),
        ('not_met', 'Not Met'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    manager_review = models.ForeignKey(
        ManagerReview,
        on_delete=models.CASCADE,
        related_name='goal_assessments'
    )
    goal = models.ForeignKey(
        Goal,
        on_delete=models.CASCADE,
        related_name='manager_assessments'
    )
    manager_rating = models.CharField(
        max_length=20,
        choices=RATING_CHOICES,
        help_text="Manager's rating for this goal"
    )
    manager_feedback = models.TextField(
        null=True,
        blank=True,
        help_text="Manager's feedback on goal achievement"
    )
    business_impact = models.TextField(
        null=True,
        blank=True,
        help_text="Assessment of business impact from this goal"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['manager_review', 'goal']
        indexes = [
            models.Index(fields=['manager_review']),
            models.Index(fields=['goal']),
        ]
    
    def __str__(self):
        return f"Manager Goal Assessment - {self.goal.title} ({self.get_manager_rating_display()})"


class UpwardReview(models.Model):
    """
    Upward review model for employees to provide feedback on their managers.
    """
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cycle = models.ForeignKey(
        ReviewCycle,
        on_delete=models.CASCADE,
        related_name='upward_reviews'
    )
    reviewer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='upward_reviews_given',
        help_text="Employee providing feedback on their manager"
    )
    manager = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='upward_reviews_received',
        help_text="Manager being reviewed"
    )
    is_anonymous = models.BooleanField(
        default=True,
        help_text="Whether this review should be anonymous"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='not_started'
    )
    
    # Leadership assessment
    leadership_effectiveness = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Leadership effectiveness (1-5 scale)"
    )
    leadership_examples = models.TextField(
        null=True,
        blank=True,
        help_text="Examples of effective leadership or areas for improvement"
    )
    
    communication_clarity = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Communication clarity and frequency (1-5 scale)"
    )
    communication_examples = models.TextField(
        null=True,
        blank=True,
        help_text="Examples of communication strengths or areas for improvement"
    )
    
    support_provided = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Support provided for growth and development (1-5 scale)"
    )
    support_examples = models.TextField(
        null=True,
        blank=True,
        help_text="Examples of support provided or needed"
    )
    
    areas_for_improvement = models.TextField(
        null=True,
        blank=True,
        help_text="Areas where the manager could improve"
    )
    additional_comments = models.TextField(
        null=True,
        blank=True,
        help_text="Additional feedback or comments"
    )
    
    sentiment_analyzed = models.BooleanField(
        default=False,
        help_text="Whether AI sentiment analysis has been performed"
    )
    
    submitted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the upward review was submitted"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['cycle', 'reviewer', 'manager']
        indexes = [
            models.Index(fields=['cycle', 'status']),
            models.Index(fields=['reviewer']),
            models.Index(fields=['manager']),
        ]
    
    def clean(self):
        """Validate manager-employee relationship"""
        if self.reviewer.manager != self.manager:
            raise ValidationError("Reviewer must be a direct report of the manager")
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        reviewer_name = "Anonymous" if self.is_anonymous else self.reviewer.get_full_name()
        return f"Upward Review - {reviewer_name} → {self.manager.get_full_name()}"


class ReviewMeeting(models.Model):
    """
    Review meeting model for tracking one-on-one review discussions.
    """
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cycle = models.ForeignKey(
        ReviewCycle,
        on_delete=models.CASCADE,
        related_name='review_meetings'
    )
    manager = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='review_meetings_as_manager',
        help_text="Manager conducting the review meeting"
    )
    employee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='review_meetings_as_employee',
        help_text="Employee participating in the review meeting"
    )
    scheduled_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Scheduled date and time for the review meeting"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='scheduled'
    )
    meeting_notes = models.TextField(
        null=True,
        blank=True,
        help_text="Notes from the review meeting discussion"
    )
    action_items = models.JSONField(
        default=list,
        blank=True,
        help_text="Action items and follow-ups from the meeting"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['cycle', 'manager', 'employee']
        indexes = [
            models.Index(fields=['cycle', 'status']),
            models.Index(fields=['scheduled_at']),
        ]
    
    def __str__(self):
        return f"Review Meeting - {self.manager.get_full_name()} & {self.employee.get_full_name()}"
