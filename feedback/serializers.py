from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import Feedback, FeedbackTag, FeedbackTagTemplate, FeedbackComment
from okr.models import Objective, Goal, IndividualTask
from core.serializers import UserBasicSerializer

User = get_user_model()


class FeedbackTagSerializer(serializers.ModelSerializer):
    """Serializer for feedback tags"""
    
    class Meta:
        model = FeedbackTag
        fields = ['id', 'tag_name', 'created_at']
        read_only_fields = ['id', 'created_at']


class FeedbackTagTemplateSerializer(serializers.ModelSerializer):
    """Serializer for feedback tag templates"""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    usage_count = serializers.ReadOnlyField()
    
    class Meta:
        model = FeedbackTagTemplate
        fields = [
            'id', 'name', 'description', 'category', 'is_active',
            'created_by', 'created_by_name', 'usage_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def validate_name(self, value):
        """Ensure tag name is unique and properly formatted"""
        value = value.strip().lower()
        if len(value) < 2:
            raise serializers.ValidationError("Tag name must be at least 2 characters long")
        return value


class FeedbackCommentSerializer(serializers.ModelSerializer):
    """Serializer for feedback comments"""
    comment_by_name = serializers.CharField(source='comment_by.get_full_name', read_only=True)
    comment_by_avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = FeedbackComment
        fields = [
            'id', 'content', 'comment_by', 'comment_by_name', 
            'comment_by_avatar', 'created_at'
        ]
        read_only_fields = ['id', 'comment_by', 'created_at']
    
    def get_comment_by_avatar(self, obj):
        """Return avatar URL for comment author"""
        return f"https://ui-avatars.com/api/?name={obj.comment_by.get_full_name()}&background=random"
    
    def validate_content(self, value):
        """Validate comment content"""
        if len(value.strip()) < 5:
            raise serializers.ValidationError("Comment must be at least 5 characters long")
        return value.strip()


class FeedbackSerializer(serializers.ModelSerializer):
    """Main feedback serializer with full details"""
    from_user_name = serializers.CharField(source='from_user.get_full_name', read_only=True)
    from_user_avatar = serializers.SerializerMethodField()
    to_user_name = serializers.CharField(source='to_user.get_full_name', read_only=True)
    to_user_avatar = serializers.SerializerMethodField()
    
    display_sender = serializers.ReadOnlyField()
    content_preview = serializers.ReadOnlyField()
    related_entity_display = serializers.ReadOnlyField()
    
    tags = FeedbackTagSerializer(many=True, read_only=True)
    comments = FeedbackCommentSerializer(many=True, read_only=True)
    comments_count = serializers.SerializerMethodField()
    
    # Related entity details
    related_objective_title = serializers.CharField(source='related_objective.title', read_only=True)
    related_goal_title = serializers.CharField(source='related_goal.title', read_only=True)
    related_task_title = serializers.CharField(source='related_task.title', read_only=True)
    
    class Meta:
        model = Feedback
        fields = [
            'id', 'from_user', 'from_user_name', 'from_user_avatar',
            'to_user', 'to_user_name', 'to_user_avatar',
            'feedback_type', 'visibility', 'content', 'content_preview',
            'related_objective', 'related_objective_title',
            'related_goal', 'related_goal_title',
            'related_task', 'related_task_title',
            'related_entity_display', 'is_anonymous', 'display_sender',
            'sentiment_analyzed', 'tags', 'comments', 'comments_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'from_user', 'sentiment_analyzed', 'created_at', 'updated_at'
        ]
    
    def get_from_user_avatar(self, obj):
        """Return avatar URL for feedback giver"""
        return f"https://ui-avatars.com/api/?name={obj.from_user.get_full_name()}&background=random"
    
    def get_to_user_avatar(self, obj):
        """Return avatar URL for feedback receiver"""
        return f"https://ui-avatars.com/api/?name={obj.to_user.get_full_name()}&background=random"
    
    def get_comments_count(self, obj):
        """Return count of comments on this feedback"""
        return obj.comments.count()
    
    def validate_content(self, value):
        """Validate feedback content"""
        content = value.strip()
        if len(content) < 10:
            raise serializers.ValidationError("Feedback must be at least 10 characters long")
        if len(content) > 500:
            raise serializers.ValidationError("Feedback cannot exceed 500 characters")
        return content
    
    def validate(self, attrs):
        """Cross-field validation"""
        request = self.context.get('request')
        if request and request.user:
            # Prevent self-feedback
            if attrs.get('to_user') == request.user:
                raise serializers.ValidationError("You cannot give feedback to yourself")
            
            # Validate related entities belong to recipient
            to_user = attrs.get('to_user')
            
            if attrs.get('related_objective'):
                obj = attrs['related_objective']
                if obj.owner != to_user and to_user.department != obj.owner.department:
                    raise serializers.ValidationError(
                        "Related objective must belong to feedback recipient or their department"
                    )
            
            if attrs.get('related_goal'):
                goal = attrs['related_goal']
                if goal.assigned_to != to_user:
                    raise serializers.ValidationError(
                        "Related goal must be assigned to feedback recipient"
                    )
            
            if attrs.get('related_task'):
                task = attrs['related_task']
                if task.assigned_to != to_user:
                    raise serializers.ValidationError(
                        "Related task must be assigned to feedback recipient"
                    )
        
        return attrs
    
    def create(self, validated_data):
        """Create feedback with proper user assignment"""
        request = self.context.get('request')
        if request and request.user:
            validated_data['from_user'] = request.user
        return super().create(validated_data)


class FeedbackCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for creating feedback"""
    tag_names = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        allow_empty=True,
        help_text="List of tag names to apply to this feedback"
    )
    
    class Meta:
        model = Feedback
        fields = [
            'to_user', 'feedback_type', 'visibility', 'content',
            'related_objective', 'related_goal', 'related_task',
            'is_anonymous', 'tag_names'
        ]
    
    def validate_content(self, value):
        """Validate feedback content"""
        content = value.strip()
        if len(content) < 10:
            raise serializers.ValidationError("Feedback must be at least 10 characters long")
        if len(content) > 500:
            raise serializers.ValidationError("Feedback cannot exceed 500 characters")
        return content
    
    def validate_tag_names(self, value):
        """Validate tag names"""
        if len(value) > 5:
            raise serializers.ValidationError("Maximum 5 tags allowed per feedback")
        
        # Clean and validate each tag
        cleaned_tags = []
        for tag in value:
            cleaned_tag = tag.strip().lower()
            if len(cleaned_tag) < 2:
                raise serializers.ValidationError(f"Tag '{tag}' must be at least 2 characters long")
            if len(cleaned_tag) > 50:
                raise serializers.ValidationError(f"Tag '{tag}' cannot exceed 50 characters")
            cleaned_tags.append(cleaned_tag)
        
        return cleaned_tags
    
    def validate(self, attrs):
        """Cross-field validation"""
        request = self.context.get('request')
        if request and request.user:
            # Prevent self-feedback
            if attrs.get('to_user') == request.user:
                raise serializers.ValidationError("You cannot give feedback to yourself")
            
            # Validate related entities
            to_user = attrs.get('to_user')
            
            if attrs.get('related_objective'):
                obj = attrs['related_objective']
                if obj.owner != to_user and to_user.department != obj.owner.department:
                    raise serializers.ValidationError(
                        "Related objective must belong to feedback recipient or their department"
                    )
            
            if attrs.get('related_goal'):
                goal = attrs['related_goal']
                if goal.assigned_to != to_user:
                    raise serializers.ValidationError(
                        "Related goal must be assigned to feedback recipient"
                    )
            
            if attrs.get('related_task'):
                task = attrs['related_task']
                if task.assigned_to != to_user:
                    raise serializers.ValidationError(
                        "Related task must be assigned to feedback recipient"
                    )
        
        return attrs
    
    @transaction.atomic
    def create(self, validated_data):
        """Create feedback with tags"""
        tag_names = validated_data.pop('tag_names', [])
        request = self.context.get('request')
        
        if request and request.user:
            validated_data['from_user'] = request.user
        
        feedback = Feedback.objects.create(**validated_data)
        
        # Create tags
        for tag_name in tag_names:
            FeedbackTag.objects.create(
                feedback=feedback,
                tag_name=tag_name
            )
        
        return feedback


class FeedbackListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for feedback lists"""
    from_user_name = serializers.CharField(source='from_user.get_full_name', read_only=True)
    to_user_name = serializers.CharField(source='to_user.get_full_name', read_only=True)
    display_sender = serializers.ReadOnlyField()
    content_preview = serializers.ReadOnlyField()
    related_entity_display = serializers.ReadOnlyField()
    tags_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Feedback
        fields = [
            'id', 'from_user_name', 'to_user_name', 'display_sender',
            'feedback_type', 'visibility', 'content_preview',
            'related_entity_display', 'is_anonymous',
            'tags_count', 'comments_count', 'created_at'
        ]
    
    def get_tags_count(self, obj):
        """Return count of tags on this feedback"""
        return obj.tags.count()
    
    def get_comments_count(self, obj):
        """Return count of comments on this feedback"""
        return obj.comments.count()


class FeedbackAnalyticsSerializer(serializers.Serializer):
    """Serializer for feedback analytics data"""
    total_given = serializers.IntegerField()
    total_received = serializers.IntegerField()
    feedback_by_type = serializers.DictField()
    recent_feedback = FeedbackListSerializer(many=True)
    top_tags = serializers.ListField(child=serializers.DictField())
    team_participation = serializers.DictField()
    monthly_trends = serializers.ListField(child=serializers.DictField())


class TeamFeedbackSummarySerializer(serializers.Serializer):
    """Serializer for team feedback summary"""
    team_member = UserBasicSerializer()
    feedback_received_count = serializers.IntegerField()
    feedback_given_count = serializers.IntegerField()
    feedback_by_type = serializers.DictField()
    recent_feedback = FeedbackListSerializer(many=True)
    top_received_tags = serializers.ListField(child=serializers.DictField())


class FeedbackCommentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating feedback comments"""
    
    class Meta:
        model = FeedbackComment
        fields = ['content']
    
    def validate_content(self, value):
        """Validate comment content"""
        content = value.strip()
        if len(content) < 5:
            raise serializers.ValidationError("Comment must be at least 5 characters long")
        if len(content) > 300:
            raise serializers.ValidationError("Comment cannot exceed 300 characters")
        return content
    
    def create(self, validated_data):
        """Create comment with proper user and feedback assignment"""
        request = self.context.get('request')
        feedback = self.context.get('feedback')
        
        if request and request.user:
            validated_data['comment_by'] = request.user
        if feedback:
            validated_data['feedback'] = feedback
            
        return super().create(validated_data) 