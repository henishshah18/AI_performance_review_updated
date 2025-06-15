"""
OKR API Serializers
Handles serialization and validation for all OKR models.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from core.models import Department
from .models import Objective, Goal, IndividualTask, TaskUpdate

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user information for nested serialization"""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'full_name', 'email', 'department_name']
        read_only_fields = ['id', 'full_name', 'department_name']


class DepartmentBasicSerializer(serializers.ModelSerializer):
    """Basic department information for nested serialization"""
    
    class Meta:
        model = Department
        fields = ['id', 'name', 'description']
        read_only_fields = ['id']


class TaskUpdateSerializer(serializers.ModelSerializer):
    """Serializer for task progress updates"""
    updated_by = UserBasicSerializer(read_only=True)
    progress_change = serializers.DecimalField(
        max_digits=5, decimal_places=2, read_only=True, source='get_progress_change'
    )
    is_significant = serializers.BooleanField(read_only=True, source='is_significant_update')
    
    class Meta:
        model = TaskUpdate
        fields = [
            'id', 'task', 'updated_by', 'previous_progress', 'new_progress',
            'previous_status', 'new_status', 'update_notes', 'evidence_added',
            'progress_change', 'is_significant', 'created_at'
        ]
        read_only_fields = ['id', 'updated_by', 'progress_change', 'is_significant', 'created_at']


class IndividualTaskSerializer(serializers.ModelSerializer):
    """Serializer for individual tasks"""
    assigned_to = UserBasicSerializer(read_only=True)
    created_by = UserBasicSerializer(read_only=True)
    goal_title = serializers.CharField(source='goal.title', read_only=True)
    objective_title = serializers.CharField(source='goal.objective.title', read_only=True)
    
    # Computed fields
    is_overdue = serializers.BooleanField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True, source='get_days_remaining')
    evidence_count = serializers.SerializerMethodField()
    recent_updates = TaskUpdateSerializer(source='updates', many=True, read_only=True)
    
    # Write fields for assignment
    assigned_to_id = serializers.UUIDField(write_only=True, required=False)
    
    class Meta:
        model = IndividualTask
        fields = [
            'id', 'goal', 'title', 'description', 'assigned_to', 'created_by',
            'status', 'priority', 'due_date', 'progress_percentage',
            'evidence_links', 'blocker_reason', 'created_at', 'updated_at',
            'completed_at', 'goal_title', 'objective_title', 'is_overdue',
            'days_remaining', 'evidence_count', 'recent_updates', 'assigned_to_id'
        ]
        read_only_fields = [
            'id', 'assigned_to', 'created_by', 'created_at', 'updated_at',
            'completed_at', 'goal_title', 'objective_title', 'is_overdue',
            'days_remaining', 'evidence_count', 'recent_updates'
        ]
    
    def get_evidence_count(self, obj):
        """Get count of evidence links"""
        return len(obj.evidence_links) if obj.evidence_links else 0
    
    def get_recent_updates(self, obj):
        """Get recent task updates (last 5)"""
        return obj.updates.all()[:5]
    
    def validate_evidence_links(self, value):
        """Validate evidence links format"""
        if not value:
            return value
        
        if not isinstance(value, list):
            raise serializers.ValidationError("Evidence links must be a list")
        
        for link in value:
            if not isinstance(link, dict):
                raise serializers.ValidationError("Each evidence link must be an object")
            
            required_fields = ['url', 'title']
            for field in required_fields:
                if field not in link:
                    raise serializers.ValidationError(f"Evidence link missing required field: {field}")
        
        return value
    
    def validate(self, attrs):
        """Validate task data"""
        # Validate assigned_to_id if provided
        if 'assigned_to_id' in attrs:
            try:
                user = User.objects.get(id=attrs['assigned_to_id'])
                if user.role != 'individual_contributor':
                    raise serializers.ValidationError({
                        'assigned_to_id': 'Tasks can only be assigned to Individual Contributors'
                    })
                attrs['assigned_to'] = user
            except User.DoesNotExist:
                raise serializers.ValidationError({
                    'assigned_to_id': 'User not found'
                })
        
        # Validate blocker reason when status is blocked
        if attrs.get('status') == 'blocked' and not attrs.get('blocker_reason'):
            raise serializers.ValidationError({
                'blocker_reason': 'Blocker reason is required when status is blocked'
            })
        
        return attrs


class GoalSerializer(serializers.ModelSerializer):
    """Serializer for goals"""
    assigned_to = UserBasicSerializer(read_only=True)
    created_by = UserBasicSerializer(read_only=True)
    objective_title = serializers.CharField(source='objective.title', read_only=True)
    
    # Computed fields
    is_overdue = serializers.BooleanField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True, source='get_days_remaining')
    tasks_count = serializers.SerializerMethodField()
    completed_tasks_count = serializers.SerializerMethodField()
    tasks = IndividualTaskSerializer(many=True, read_only=True)
    
    # Write fields for assignment
    assigned_to_id = serializers.UUIDField(write_only=True, required=False)
    
    class Meta:
        model = Goal
        fields = [
            'id', 'objective', 'title', 'description', 'assigned_to', 'created_by',
            'status', 'priority', 'due_date', 'progress_percentage',
            'created_at', 'updated_at', 'objective_title', 'is_overdue',
            'days_remaining', 'tasks_count', 'completed_tasks_count',
            'tasks', 'assigned_to_id'
        ]
        read_only_fields = [
            'id', 'assigned_to', 'created_by', 'progress_percentage',
            'created_at', 'updated_at', 'objective_title', 'is_overdue',
            'days_remaining', 'tasks_count', 'completed_tasks_count', 'tasks'
        ]
    
    def get_tasks_count(self, obj):
        """Get total count of tasks"""
        return obj.tasks.count()
    
    def get_completed_tasks_count(self, obj):
        """Get count of completed tasks"""
        return obj.tasks.filter(status='completed').count()
    
    def validate(self, attrs):
        """Validate goal data"""
        # Validate assigned_to_id if provided
        if 'assigned_to_id' in attrs:
            try:
                user = User.objects.get(id=attrs['assigned_to_id'])
                if user.role != 'individual_contributor':
                    raise serializers.ValidationError({
                        'assigned_to_id': 'Goals can only be assigned to Individual Contributors'
                    })
                attrs['assigned_to'] = user
            except User.DoesNotExist:
                raise serializers.ValidationError({
                    'assigned_to_id': 'User not found'
                })
        
        # Validate due date is within objective timeline
        if 'due_date' in attrs and attrs['due_date']:
            objective = attrs.get('objective') or (self.instance.objective if self.instance else None)
            if objective:
                if attrs['due_date'] > objective.end_date:
                    raise serializers.ValidationError({
                        'due_date': f'Goal due date cannot be after objective end date ({objective.end_date})'
                    })
                if attrs['due_date'] < objective.start_date:
                    raise serializers.ValidationError({
                        'due_date': f'Goal due date cannot be before objective start date ({objective.start_date})'
                    })
        
        return attrs


class ObjectiveSerializer(serializers.ModelSerializer):
    """Serializer for objectives"""
    owner = UserBasicSerializer(read_only=True)
    created_by = UserBasicSerializer(read_only=True)
    departments = DepartmentBasicSerializer(many=True, read_only=True)
    
    # Computed fields
    is_overdue = serializers.BooleanField(read_only=True)
    completion_status = serializers.CharField(read_only=True, source='get_completion_status')
    goals_count = serializers.SerializerMethodField()
    completed_goals_count = serializers.SerializerMethodField()
    total_tasks_count = serializers.SerializerMethodField()
    goals = GoalSerializer(many=True, read_only=True)
    
    # Write fields for assignment
    owner_id = serializers.UUIDField(write_only=True, required=False)
    department_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Objective
        fields = [
            'id', 'title', 'description', 'owner', 'created_by', 'departments',
            'status', 'priority', 'timeline_type', 'start_date', 'end_date',
            'success_metrics', 'progress_percentage', 'created_at', 'updated_at',
            'is_overdue', 'completion_status', 'goals_count', 'completed_goals_count',
            'total_tasks_count', 'goals', 'owner_id', 'department_ids'
        ]
        read_only_fields = [
            'id', 'owner', 'created_by', 'departments', 'progress_percentage',
            'created_at', 'updated_at', 'is_overdue', 'completion_status',
            'goals_count', 'completed_goals_count', 'total_tasks_count', 'goals'
        ]
    
    def get_goals_count(self, obj):
        """Get total count of goals"""
        return obj.goals.count()
    
    def get_completed_goals_count(self, obj):
        """Get count of completed goals"""
        return obj.goals.filter(status='completed').count()
    
    def get_total_tasks_count(self, obj):
        """Get total count of tasks across all goals"""
        return sum(goal.tasks.count() for goal in obj.goals.all())
    
    def validate(self, attrs):
        """Validate objective data"""
        # Validate owner_id if provided
        if 'owner_id' in attrs:
            try:
                user = User.objects.get(id=attrs['owner_id'])
                if user.role != 'manager':
                    raise serializers.ValidationError({
                        'owner_id': 'Objectives can only be assigned to Managers'
                    })
                attrs['owner'] = user
            except User.DoesNotExist:
                raise serializers.ValidationError({
                    'owner_id': 'User not found'
                })
        
        # Validate department_ids if provided
        if 'department_ids' in attrs:
            try:
                departments = Department.objects.filter(id__in=attrs['department_ids'])
                if departments.count() != len(attrs['department_ids']):
                    raise serializers.ValidationError({
                        'department_ids': 'One or more departments not found'
                    })
                attrs['departments'] = departments
            except Exception:
                raise serializers.ValidationError({
                    'department_ids': 'Invalid department IDs'
                })
        
        # Validate timeline type matches duration
        if 'start_date' in attrs and 'end_date' in attrs and 'timeline_type' in attrs:
            duration_days = (attrs['end_date'] - attrs['start_date']).days
            
            if attrs['timeline_type'] == 'quarterly' and not (80 <= duration_days <= 100):
                raise serializers.ValidationError({
                    'timeline_type': 'Quarterly objectives must be approximately 3 months (80-100 days)'
                })
            elif attrs['timeline_type'] == 'yearly' and not (350 <= duration_days <= 380):
                raise serializers.ValidationError({
                    'timeline_type': 'Yearly objectives must be approximately 12 months (350-380 days)'
                })
        
        return attrs
    
    def create(self, validated_data):
        """Create objective with many-to-many relationships"""
        departments = validated_data.pop('departments', [])
        objective = super().create(validated_data)
        
        if departments:
            objective.departments.set(departments)
        
        return objective
    
    def update(self, instance, validated_data):
        """Update objective with many-to-many relationships"""
        departments = validated_data.pop('departments', None)
        objective = super().update(instance, validated_data)
        
        if departments is not None:
            objective.departments.set(departments)
        
        return objective


class ObjectiveListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for objective lists"""
    owner = UserBasicSerializer(read_only=True)
    departments = DepartmentBasicSerializer(many=True, read_only=True)
    completion_status = serializers.CharField(read_only=True, source='get_completion_status')
    goals_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Objective
        fields = [
            'id', 'title', 'owner', 'departments', 'status', 'priority',
            'timeline_type', 'start_date', 'end_date', 'progress_percentage',
            'completion_status', 'goals_count', 'created_at'
        ]
        read_only_fields = fields
    
    def get_goals_count(self, obj):
        """Get total count of goals"""
        return obj.goals.count()


class GoalListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for goal lists"""
    assigned_to = UserBasicSerializer(read_only=True)
    objective_title = serializers.CharField(source='objective.title', read_only=True)
    tasks_count = serializers.SerializerMethodField()
    is_overdue = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Goal
        fields = [
            'id', 'title', 'assigned_to', 'objective_title', 'status',
            'priority', 'due_date', 'progress_percentage', 'tasks_count',
            'is_overdue', 'created_at'
        ]
        read_only_fields = fields
    
    def get_tasks_count(self, obj):
        """Get total count of tasks"""
        return obj.tasks.count()


class TaskListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for task lists"""
    assigned_to = UserBasicSerializer(read_only=True)
    goal_title = serializers.CharField(source='goal.title', read_only=True)
    objective_title = serializers.CharField(source='goal.objective.title', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    evidence_count = serializers.SerializerMethodField()
    
    class Meta:
        model = IndividualTask
        fields = [
            'id', 'title', 'assigned_to', 'goal_title', 'objective_title',
            'status', 'priority', 'due_date', 'progress_percentage',
            'evidence_count', 'is_overdue', 'created_at'
        ]
        read_only_fields = fields
    
    def get_evidence_count(self, obj):
        """Get count of evidence links"""
        return len(obj.evidence_links) if obj.evidence_links else 0


class ProgressUpdateSerializer(serializers.Serializer):
    """Serializer for task progress updates"""
    progress_percentage = serializers.DecimalField(
        max_digits=5, decimal_places=2, min_value=0, max_value=100
    )
    status = serializers.ChoiceField(choices=IndividualTask._meta.get_field('status').choices)
    update_notes = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    evidence_links = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_empty=True
    )
    
    def validate_evidence_links(self, value):
        """Validate evidence links format"""
        if not value:
            return value
        
        for link in value:
            if not isinstance(link, dict):
                raise serializers.ValidationError("Each evidence link must be an object")
            
            required_fields = ['url', 'title']
            for field in required_fields:
                if field not in link:
                    raise serializers.ValidationError(f"Evidence link missing required field: {field}")
        
        return value 