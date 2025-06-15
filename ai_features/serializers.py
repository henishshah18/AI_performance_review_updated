from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import AISentimentAnalysis, AIGenerationRequest, AISettings

User = get_user_model()


class AISentimentAnalysisSerializer(serializers.ModelSerializer):
    """Serializer for AI sentiment analysis results"""
    
    content_type_name = serializers.CharField(source='content_type.model', read_only=True)
    
    class Meta:
        model = AISentimentAnalysis
        fields = [
            'id', 'content_type', 'content_type_name', 'object_id',
            'sentiment_score', 'sentiment_label', 'confidence_score',
            'detected_keywords', 'detected_issues', 'analysis_metadata',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class AIGenerationRequestSerializer(serializers.ModelSerializer):
    """Serializer for AI generation requests"""
    
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = AIGenerationRequest
        fields = [
            'id', 'user', 'user_name', 'generation_type', 'status',
            'input_data', 'generated_content', 'structured_output',
            'model_used', 'tokens_used', 'processing_time', 'error_message',
            'related_cycle_id', 'related_user_id', 'created_at', 'updated_at',
            'completed_at'
        ]
        read_only_fields = [
            'id', 'user', 'generated_content', 'structured_output', 
            'model_used', 'tokens_used', 'processing_time', 'error_message',
            'created_at', 'updated_at', 'completed_at'
        ]


class AIGenerationRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating AI generation requests"""
    
    class Meta:
        model = AIGenerationRequest
        fields = [
            'generation_type', 'input_data', 'related_cycle_id', 'related_user_id'
        ]
    
    def validate_generation_type(self, value):
        """Validate generation type"""
        valid_types = [choice[0] for choice in AIGenerationRequest.GENERATION_TYPES]
        if value not in valid_types:
            raise serializers.ValidationError(f"Invalid generation type. Must be one of: {valid_types}")
        return value
    
    def validate_input_data(self, value):
        """Validate input data is a dictionary"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Input data must be a valid JSON object")
        return value


class AISettingsSerializer(serializers.ModelSerializer):
    """Serializer for AI settings management"""
    
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)
    
    class Meta:
        model = AISettings
        fields = [
            'id', 'ai_features_enabled', 'sentiment_analysis_enabled',
            'review_generation_enabled', 'goal_suggestions_enabled',
            'max_generations_per_user_per_day', 'max_generations_per_user_per_hour',
            'openai_model', 'max_tokens', 'temperature',
            'auto_analyze_feedback', 'auto_analyze_reviews',
            'created_at', 'updated_at', 'updated_by', 'updated_by_name'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'updated_by']
    
    def validate_temperature(self, value):
        """Validate temperature is between 0.0 and 2.0"""
        if value < 0.0 or value > 2.0:
            raise serializers.ValidationError("Temperature must be between 0.0 and 2.0")
        return value
    
    def validate_max_tokens(self, value):
        """Validate max tokens is positive"""
        if value <= 0:
            raise serializers.ValidationError("Max tokens must be positive")
        return value
    
    def validate_max_generations_per_user_per_day(self, value):
        """Validate daily limit is reasonable"""
        if value <= 0 or value > 100:
            raise serializers.ValidationError("Daily limit must be between 1 and 100")
        return value
    
    def validate_max_generations_per_user_per_hour(self, value):
        """Validate hourly limit is reasonable"""
        if value <= 0 or value > 20:
            raise serializers.ValidationError("Hourly limit must be between 1 and 20")
        return value


class SentimentAnalysisRequestSerializer(serializers.Serializer):
    """Serializer for sentiment analysis requests"""
    
    content = serializers.CharField(
        max_length=5000,
        help_text="Text content to analyze for sentiment"
    )
    content_type = serializers.CharField(
        max_length=50,
        required=False,
        help_text="Type of content being analyzed (feedback, review, etc.)"
    )
    
    def validate_content(self, value):
        """Validate content is not empty"""
        if not value.strip():
            raise serializers.ValidationError("Content cannot be empty")
        return value.strip()


class ReviewGenerationRequestSerializer(serializers.Serializer):
    """Serializer for AI review generation requests"""
    
    generation_type = serializers.ChoiceField(
        choices=AIGenerationRequest.GENERATION_TYPES,
        help_text="Type of review to generate"
    )
    context_data = serializers.JSONField(
        help_text="Context data for generating the review"
    )
    cycle_id = serializers.UUIDField(
        required=False,
        help_text="Review cycle ID if applicable"
    )
    reviewee_id = serializers.UUIDField(
        required=False,
        help_text="ID of user being reviewed if applicable"
    )
    
    def validate_context_data(self, value):
        """Validate context data structure"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Context data must be a valid JSON object")
        
        # Validate required fields based on generation type
        generation_type = self.initial_data.get('generation_type')
        
        if generation_type == 'self_assessment':
            required_fields = ['name', 'role', 'department']
        elif generation_type == 'peer_review':
            required_fields = ['reviewee_name', 'reviewer_role']
        elif generation_type == 'manager_review':
            required_fields = ['employee_name', 'employee_role', 'manager_name']
        else:
            required_fields = []
        
        for field in required_fields:
            if field not in value:
                raise serializers.ValidationError(f"Missing required field: {field}")
        
        return value


class SentimentDashboardSerializer(serializers.Serializer):
    """Serializer for sentiment dashboard data"""
    
    overall_sentiment = serializers.CharField()
    sentiment_score = serializers.FloatField()
    sentiment_distribution = serializers.DictField()
    sentiment_trends = serializers.ListField()
    total_analyzed = serializers.IntegerField()
    analysis_period = serializers.CharField()


class AIUsageAnalyticsSerializer(serializers.Serializer):
    """Serializer for AI usage analytics"""
    
    total_generations = serializers.IntegerField()
    generations_by_type = serializers.DictField()
    generations_by_user = serializers.ListField()
    daily_usage = serializers.ListField()
    average_processing_time = serializers.FloatField()
    total_tokens_used = serializers.IntegerField()
    success_rate = serializers.FloatField()
    most_active_users = serializers.ListField()


class AIInsightsSerializer(serializers.Serializer):
    """Serializer for AI insights and recommendations"""
    
    insights = serializers.ListField(
        child=serializers.DictField(),
        help_text="List of AI-generated insights"
    )
    recommendations = serializers.ListField(
        child=serializers.DictField(),
        help_text="List of AI-generated recommendations"
    )
    sentiment_alerts = serializers.ListField(
        child=serializers.DictField(),
        help_text="List of sentiment-based alerts"
    )
    quality_flags = serializers.ListField(
        child=serializers.DictField(),
        help_text="List of content quality flags"
    ) 