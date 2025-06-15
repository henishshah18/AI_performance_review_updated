from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import (
    ReviewCycle, ReviewParticipant, SelfAssessment, GoalAssessment,
    PeerReview, PeerReviewAssignment, ManagerReview, GoalManagerAssessment,
    UpwardReview, ReviewMeeting
)
from okr.models import Goal
from core.serializers import UserBasicSerializer

User = get_user_model()


class ReviewCycleSerializer(serializers.ModelSerializer):
    """
    Serializer for ReviewCycle model with full details.
    """
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    current_phase = serializers.ReadOnlyField()
    is_active = serializers.ReadOnlyField()
    participant_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ReviewCycle
        fields = [
            'id', 'name', 'review_type', 'status',
            'review_period_start', 'review_period_end',
            'self_assessment_start', 'self_assessment_end',
            'peer_review_start', 'peer_review_end',
            'manager_review_start', 'manager_review_end',
            'created_by', 'created_by_name', 'current_phase', 'is_active',
            'participant_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def get_participant_count(self, obj):
        """Get the number of active participants in this cycle"""
        return obj.participants.filter(is_active=True).count()
    
    def validate(self, data):
        """Validate date logic for review cycle"""
        if data.get('review_period_start') and data.get('review_period_end'):
            if data['review_period_start'] >= data['review_period_end']:
                raise serializers.ValidationError("Review period start must be before end date")
        
        if data.get('self_assessment_start') and data.get('self_assessment_end'):
            if data['self_assessment_start'] >= data['self_assessment_end']:
                raise serializers.ValidationError("Self-assessment start must be before end date")
        
        return data


class ReviewCycleListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing review cycles.
    """
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    current_phase = serializers.ReadOnlyField()
    participant_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ReviewCycle
        fields = [
            'id', 'name', 'review_type', 'status', 'current_phase',
            'created_by_name', 'participant_count', 'created_at'
        ]
    
    def get_participant_count(self, obj):
        return obj.participants.filter(is_active=True).count()


class ReviewParticipantSerializer(serializers.ModelSerializer):
    """
    Serializer for ReviewParticipant model.
    """
    user_details = UserBasicSerializer(source='user', read_only=True)
    cycle_name = serializers.CharField(source='cycle.name', read_only=True)
    
    class Meta:
        model = ReviewParticipant
        fields = [
            'id', 'cycle', 'user', 'user_details', 'cycle_name',
            'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class GoalAssessmentSerializer(serializers.ModelSerializer):
    """
    Serializer for GoalAssessment model.
    """
    goal_title = serializers.CharField(source='goal.title', read_only=True)
    goal_description = serializers.CharField(source='goal.description', read_only=True)
    
    class Meta:
        model = GoalAssessment
        fields = [
            'id', 'goal', 'goal_title', 'goal_description',
            'self_rating', 'accomplishments', 'evidence_links',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SelfAssessmentSerializer(serializers.ModelSerializer):
    """
    Serializer for SelfAssessment model with goal assessments.
    """
    user_details = UserBasicSerializer(source='user', read_only=True)
    cycle_name = serializers.CharField(source='cycle.name', read_only=True)
    goal_assessments = GoalAssessmentSerializer(many=True, read_only=True)
    completion_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = SelfAssessment
        fields = [
            'id', 'cycle', 'user', 'user_details', 'cycle_name', 'status',
            'technical_excellence', 'technical_examples',
            'collaboration', 'collaboration_examples',
            'problem_solving', 'problem_solving_examples',
            'initiative', 'initiative_examples',
            'development_goals', 'manager_support_needed', 'career_interests',
            'goal_assessments', 'completion_percentage',
            'sentiment_analyzed', 'submitted_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Validate rating ranges"""
        rating_fields = ['technical_excellence', 'collaboration', 'problem_solving', 'initiative']
        for field in rating_fields:
            if data.get(field) and (data[field] < 1 or data[field] > 5):
                raise serializers.ValidationError(f"{field} must be between 1 and 5")
        return data


class SelfAssessmentCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating self-assessments.
    """
    class Meta:
        model = SelfAssessment
        fields = [
            'cycle', 'status',
            'technical_excellence', 'technical_examples',
            'collaboration', 'collaboration_examples',
            'problem_solving', 'problem_solving_examples',
            'initiative', 'initiative_examples',
            'development_goals', 'manager_support_needed', 'career_interests'
        ]
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class PeerReviewSerializer(serializers.ModelSerializer):
    """
    Serializer for PeerReview model.
    """
    reviewer_details = UserBasicSerializer(source='reviewer', read_only=True)
    reviewee_details = UserBasicSerializer(source='reviewee', read_only=True)
    cycle_name = serializers.CharField(source='cycle.name', read_only=True)
    display_reviewer = serializers.SerializerMethodField()
    
    class Meta:
        model = PeerReview
        fields = [
            'id', 'cycle', 'reviewer', 'reviewee', 'reviewer_details', 'reviewee_details',
            'cycle_name', 'is_anonymous', 'status', 'display_reviewer',
            'collaboration_rating', 'collaboration_examples',
            'impact_rating', 'impact_examples',
            'development_suggestions', 'strengths_to_continue',
            'sentiment_analyzed', 'submitted_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'reviewer', 'created_at', 'updated_at']
    
    def get_display_reviewer(self, obj):
        """Return reviewer name or 'Anonymous' based on is_anonymous flag"""
        if obj.is_anonymous:
            return "Anonymous"
        return obj.reviewer.get_full_name()
    
    def validate(self, data):
        """Validate rating ranges and prevent self-review"""
        rating_fields = ['collaboration_rating', 'impact_rating']
        for field in rating_fields:
            if data.get(field) and (data[field] < 1 or data[field] > 5):
                raise serializers.ValidationError(f"{field} must be between 1 and 5")
        
        # Prevent self-review
        if data.get('reviewee') == self.context['request'].user:
            raise serializers.ValidationError("You cannot review yourself")
        
        return data


class PeerReviewCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating peer reviews.
    """
    class Meta:
        model = PeerReview
        fields = [
            'cycle', 'reviewee', 'is_anonymous', 'status',
            'collaboration_rating', 'collaboration_examples',
            'impact_rating', 'impact_examples',
            'development_suggestions', 'strengths_to_continue'
        ]
    
    def create(self, validated_data):
        validated_data['reviewer'] = self.context['request'].user
        return super().create(validated_data)


class PeerReviewAssignmentSerializer(serializers.ModelSerializer):
    """
    Serializer for PeerReviewAssignment model.
    """
    reviewee_details = UserBasicSerializer(source='reviewee', read_only=True)
    reviewer_details = UserBasicSerializer(source='reviewer', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = PeerReviewAssignment
        fields = [
            'id', 'reviewee', 'reviewer', 'reviewee_details', 'reviewer_details',
            'review_cycle', 'status', 'due_date', 'created_by', 'created_by_name',
            'completed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


class GoalManagerAssessmentSerializer(serializers.ModelSerializer):
    """
    Serializer for GoalManagerAssessment model.
    """
    goal_title = serializers.CharField(source='goal.title', read_only=True)
    goal_description = serializers.CharField(source='goal.description', read_only=True)
    
    class Meta:
        model = GoalManagerAssessment
        fields = [
            'id', 'goal', 'goal_title', 'goal_description',
            'manager_rating', 'manager_feedback', 'business_impact',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ManagerReviewSerializer(serializers.ModelSerializer):
    """
    Serializer for ManagerReview model with goal assessments.
    """
    manager_details = UserBasicSerializer(source='manager', read_only=True)
    employee_details = UserBasicSerializer(source='employee', read_only=True)
    cycle_name = serializers.CharField(source='cycle.name', read_only=True)
    goal_assessments = GoalManagerAssessmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = ManagerReview
        fields = [
            'id', 'cycle', 'manager', 'employee', 'manager_details', 'employee_details',
            'cycle_name', 'status', 'overall_rating',
            'technical_excellence', 'technical_justification',
            'collaboration', 'collaboration_justification',
            'problem_solving', 'problem_solving_justification',
            'initiative', 'initiative_justification',
            'development_plan', 'manager_support', 'business_impact',
            'goal_assessments', 'sentiment_analyzed',
            'submitted_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'manager', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Validate rating ranges and manager-employee relationship"""
        rating_fields = ['technical_excellence', 'collaboration', 'problem_solving', 'initiative']
        for field in rating_fields:
            if data.get(field) and (data[field] < 1 or data[field] > 5):
                raise serializers.ValidationError(f"{field} must be between 1 and 5")
        
        # Validate manager-employee relationship
        if data.get('employee') and data['employee'].manager != self.context['request'].user:
            raise serializers.ValidationError("You can only review your direct reports")
        
        return data


class ManagerReviewCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating manager reviews.
    """
    class Meta:
        model = ManagerReview
        fields = [
            'cycle', 'employee', 'status', 'overall_rating',
            'technical_excellence', 'technical_justification',
            'collaboration', 'collaboration_justification',
            'problem_solving', 'problem_solving_justification',
            'initiative', 'initiative_justification',
            'development_plan', 'manager_support', 'business_impact'
        ]
    
    def create(self, validated_data):
        validated_data['manager'] = self.context['request'].user
        return super().create(validated_data)


class UpwardReviewSerializer(serializers.ModelSerializer):
    """
    Serializer for UpwardReview model.
    """
    reviewer_details = UserBasicSerializer(source='reviewer', read_only=True)
    manager_details = UserBasicSerializer(source='manager', read_only=True)
    cycle_name = serializers.CharField(source='cycle.name', read_only=True)
    display_reviewer = serializers.SerializerMethodField()
    
    class Meta:
        model = UpwardReview
        fields = [
            'id', 'cycle', 'reviewer', 'manager', 'reviewer_details', 'manager_details',
            'cycle_name', 'is_anonymous', 'status', 'display_reviewer',
            'leadership_effectiveness', 'leadership_examples',
            'communication_clarity', 'communication_examples',
            'support_provided', 'support_examples',
            'areas_for_improvement', 'additional_comments',
            'sentiment_analyzed', 'submitted_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'reviewer', 'created_at', 'updated_at']
    
    def get_display_reviewer(self, obj):
        """Return reviewer name or 'Anonymous' based on is_anonymous flag"""
        if obj.is_anonymous:
            return "Anonymous"
        return obj.reviewer.get_full_name()
    
    def validate(self, data):
        """Validate rating ranges and manager-employee relationship"""
        rating_fields = ['leadership_effectiveness', 'communication_clarity', 'support_provided']
        for field in rating_fields:
            if data.get(field) and (data[field] < 1 or data[field] > 5):
                raise serializers.ValidationError(f"{field} must be between 1 and 5")
        
        # Validate manager-employee relationship
        if data.get('manager') != self.context['request'].user.manager:
            raise serializers.ValidationError("You can only review your direct manager")
        
        return data


class UpwardReviewCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating upward reviews.
    """
    class Meta:
        model = UpwardReview
        fields = [
            'cycle', 'manager', 'is_anonymous', 'status',
            'leadership_effectiveness', 'leadership_examples',
            'communication_clarity', 'communication_examples',
            'support_provided', 'support_examples',
            'areas_for_improvement', 'additional_comments'
        ]
    
    def create(self, validated_data):
        validated_data['reviewer'] = self.context['request'].user
        return super().create(validated_data)


class ReviewMeetingSerializer(serializers.ModelSerializer):
    """
    Serializer for ReviewMeeting model.
    """
    manager_details = UserBasicSerializer(source='manager', read_only=True)
    employee_details = UserBasicSerializer(source='employee', read_only=True)
    cycle_name = serializers.CharField(source='cycle.name', read_only=True)
    
    class Meta:
        model = ReviewMeeting
        fields = [
            'id', 'cycle', 'manager', 'employee', 'manager_details', 'employee_details',
            'cycle_name', 'scheduled_at', 'status', 'meeting_notes', 'action_items',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ReviewCycleProgressSerializer(serializers.ModelSerializer):
    """
    Serializer for review cycle progress tracking.
    """
    self_assessment_progress = serializers.SerializerMethodField()
    peer_review_progress = serializers.SerializerMethodField()
    manager_review_progress = serializers.SerializerMethodField()
    upward_review_progress = serializers.SerializerMethodField()
    
    class Meta:
        model = ReviewCycle
        fields = [
            'id', 'name', 'status', 'current_phase',
            'self_assessment_progress', 'peer_review_progress',
            'manager_review_progress', 'upward_review_progress'
        ]
    
    def get_self_assessment_progress(self, obj):
        """Get self-assessment completion progress"""
        total_participants = obj.participants.filter(is_active=True).count()
        if total_participants == 0:
            return {'completed': 0, 'total': 0, 'percentage': 0}
        
        completed = obj.self_assessments.filter(status='completed').count()
        return {
            'completed': completed,
            'total': total_participants,
            'percentage': round((completed / total_participants) * 100)
        }
    
    def get_peer_review_progress(self, obj):
        """Get peer review completion progress"""
        total_reviews = obj.peer_reviews.count()
        if total_reviews == 0:
            return {'completed': 0, 'total': 0, 'percentage': 0}
        
        completed = obj.peer_reviews.filter(status='completed').count()
        return {
            'completed': completed,
            'total': total_reviews,
            'percentage': round((completed / total_reviews) * 100)
        }
    
    def get_manager_review_progress(self, obj):
        """Get manager review completion progress"""
        total_reviews = obj.manager_reviews.count()
        if total_reviews == 0:
            return {'completed': 0, 'total': 0, 'percentage': 0}
        
        completed = obj.manager_reviews.filter(status='completed').count()
        return {
            'completed': completed,
            'total': total_reviews,
            'percentage': round((completed / total_reviews) * 100)
        }
    
    def get_upward_review_progress(self, obj):
        """Get upward review completion progress"""
        total_reviews = obj.upward_reviews.count()
        if total_reviews == 0:
            return {'completed': 0, 'total': 0, 'percentage': 0}
        
        completed = obj.upward_reviews.filter(status='completed').count()
        return {
            'completed': completed,
            'total': total_reviews,
            'percentage': round((completed / total_reviews) * 100)
        }


class ReviewAnalyticsSerializer(serializers.Serializer):
    """
    Serializer for review analytics data.
    """
    cycles_participated = serializers.IntegerField()
    self_assessments_completed = serializers.IntegerField()
    peer_reviews_given = serializers.IntegerField()
    peer_reviews_received = serializers.IntegerField()
    manager_reviews_received = serializers.IntegerField()
    upward_reviews_given = serializers.IntegerField()
    average_self_rating = serializers.FloatField()
    average_peer_rating = serializers.FloatField()
    average_manager_rating = serializers.FloatField()
    recent_feedback_trends = serializers.ListField()
    development_themes = serializers.ListField()


class TeamReviewSummarySerializer(serializers.Serializer):
    """
    Serializer for team review summary data (for managers).
    """
    team_size = serializers.IntegerField()
    active_cycles = serializers.IntegerField()
    completion_rates = serializers.DictField()
    average_ratings = serializers.DictField()
    team_members = serializers.ListField()
    development_priorities = serializers.ListField()
    review_trends = serializers.ListField() 