"""
OKR API Views
Implements all OKR-related API endpoints with role-based access control.
"""

from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Avg
from django.utils import timezone
from decimal import Decimal

from core.decorators import hr_admin_required, manager_required, own_data_only
from core.utils import filter_by_department, get_user_team
from .models import Objective, Goal, IndividualTask, TaskUpdate
from .serializers import (
    ObjectiveSerializer, ObjectiveListSerializer,
    GoalSerializer, GoalListSerializer,
    IndividualTaskSerializer, TaskListSerializer,
    TaskUpdateSerializer, ProgressUpdateSerializer
)


class ObjectiveListCreateView(generics.ListCreateAPIView):
    """
    List and create objectives.
    GET: List objectives (role-filtered)
    POST: Create objective (HR Admin only)
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ObjectiveListSerializer
        return ObjectiveSerializer
    
    def get_queryset(self):
        """Filter objectives based on user role"""
        user = self.request.user
        queryset = Objective.objects.select_related('owner', 'created_by').prefetch_related('departments', 'goals')
        
        if user.role == 'hr_admin':
            # HR Admin sees all objectives
            pass
        elif user.role == 'manager':
            # Managers see objectives they own or in their department
            queryset = queryset.filter(
                Q(owner=user) | Q(departments__in=[user.department])
            ).distinct()
        else:
            # Individual contributors see objectives from their department
            queryset = queryset.filter(departments__in=[user.department])
        
        # Apply filters
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        priority_filter = self.request.query_params.get('priority')
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)
        
        timeline_filter = self.request.query_params.get('timeline_type')
        if timeline_filter:
            queryset = queryset.filter(timeline_type=timeline_filter)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        """Create objective with proper validation"""
        if self.request.user.role != 'hr_admin':
            raise permissions.PermissionDenied("Only HR Admin can create objectives")
        
        serializer.save(created_by=self.request.user)


class ObjectiveDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete an objective.
    GET: Get objective details
    PUT/PATCH: Update objective (HR Admin only)
    DELETE: Delete objective (HR Admin only)
    """
    serializer_class = ObjectiveSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter objectives based on user role"""
        user = self.request.user
        queryset = Objective.objects.select_related('owner', 'created_by').prefetch_related('departments', 'goals')
        
        if user.role == 'hr_admin':
            return queryset
        elif user.role == 'manager':
            return queryset.filter(
                Q(owner=user) | Q(departments__in=[user.department])
            ).distinct()
        else:
            return queryset.filter(departments__in=[user.department])
    
    def perform_update(self, serializer):
        """Update objective with permission check"""
        if self.request.user.role != 'hr_admin':
            raise permissions.PermissionDenied("Only HR Admin can update objectives")
        
        serializer.save()
    
    def perform_destroy(self, instance):
        """Delete objective with permission check"""
        if self.request.user.role != 'hr_admin':
            raise permissions.PermissionDenied("Only HR Admin can delete objectives")
        
        # Check for active goals
        if instance.goals.filter(status__in=['not_started', 'in_progress']).exists():
            raise permissions.PermissionDenied("Cannot delete objective with active goals")
        
        instance.delete()


class GoalListCreateView(generics.ListCreateAPIView):
    """
    List and create goals for an objective.
    GET: List goals for objective
    POST: Create goal (Manager only)
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return GoalListSerializer
        return GoalSerializer
    
    def get_queryset(self):
        """Get goals for the specified objective"""
        objective_id = self.kwargs['objective_id']
        objective = get_object_or_404(Objective, id=objective_id)
        
        # Check access to objective
        user = self.request.user
        if user.role == 'hr_admin':
            pass  # HR Admin can see all
        elif user.role == 'manager':
            if objective.owner != user and user.department not in objective.departments.all():
                raise permissions.PermissionDenied("Access denied to this objective")
        else:
            if user.department not in objective.departments.all():
                raise permissions.PermissionDenied("Access denied to this objective")
        
        queryset = Goal.objects.filter(objective=objective).select_related(
            'assigned_to', 'created_by', 'objective'
        ).prefetch_related('tasks')
        
        # Apply filters
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        assignee_filter = self.request.query_params.get('assigned_to')
        if assignee_filter:
            queryset = queryset.filter(assigned_to_id=assignee_filter)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        """Create goal with proper validation"""
        if self.request.user.role != 'manager':
            raise permissions.PermissionDenied("Only Managers can create goals")
        
        objective_id = self.kwargs['objective_id']
        objective = get_object_or_404(Objective, id=objective_id)
        
        # Check if manager can create goals for this objective
        if objective.owner != self.request.user:
            raise permissions.PermissionDenied("You can only create goals for objectives you own")
        
        serializer.save(objective=objective, created_by=self.request.user)


class GoalDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a goal.
    GET: Get goal details
    PUT/PATCH: Update goal (Manager only)
    DELETE: Delete goal (Manager only)
    """
    serializer_class = GoalSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter goals based on user role"""
        user = self.request.user
        queryset = Goal.objects.select_related('assigned_to', 'created_by', 'objective').prefetch_related('tasks')
        
        if user.role == 'hr_admin':
            return queryset
        elif user.role == 'manager':
            return queryset.filter(created_by=user)
        else:
            return queryset.filter(assigned_to=user)
    
    def perform_update(self, serializer):
        """Update goal with permission check"""
        goal = self.get_object()
        
        if self.request.user.role == 'manager':
            if goal.created_by != self.request.user:
                raise permissions.PermissionDenied("You can only update goals you created")
        elif self.request.user.role == 'individual_contributor':
            if goal.assigned_to != self.request.user:
                raise permissions.PermissionDenied("You can only update your assigned goals")
            # Individual contributors can only update status and progress
            allowed_fields = ['status', 'progress_percentage']
            for field in serializer.validated_data:
                if field not in allowed_fields:
                    raise permissions.PermissionDenied(f"You cannot update the '{field}' field")
        else:
            raise permissions.PermissionDenied("Access denied")
        
        serializer.save()
    
    def perform_destroy(self, instance):
        """Delete goal with permission check"""
        if self.request.user.role != 'manager' or instance.created_by != self.request.user:
            raise permissions.PermissionDenied("Only the goal creator can delete goals")
        
        # Check for active tasks
        if instance.tasks.filter(status__in=['not_started', 'in_progress']).exists():
            raise permissions.PermissionDenied("Cannot delete goal with active tasks")
        
        instance.delete()


class TaskListCreateView(generics.ListCreateAPIView):
    """
    List and create tasks for a goal.
    GET: List tasks for goal
    POST: Create task
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return TaskListSerializer
        return IndividualTaskSerializer
    
    def get_queryset(self):
        """Get tasks for the specified goal"""
        goal_id = self.kwargs['goal_id']
        goal = get_object_or_404(Goal, id=goal_id)
        
        # Check access to goal
        user = self.request.user
        if user.role == 'hr_admin':
            pass  # HR Admin can see all
        elif user.role == 'manager':
            if goal.created_by != user:
                raise permissions.PermissionDenied("Access denied to this goal")
        else:
            if goal.assigned_to != user:
                raise permissions.PermissionDenied("Access denied to this goal")
        
        queryset = IndividualTask.objects.filter(goal=goal).select_related(
            'assigned_to', 'created_by', 'goal'
        ).prefetch_related('updates')
        
        # Apply filters
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        priority_filter = self.request.query_params.get('priority')
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        """Create task with proper validation"""
        goal_id = self.kwargs['goal_id']
        goal = get_object_or_404(Goal, id=goal_id)
        
        # Check if user can create tasks for this goal
        user = self.request.user
        if user.role == 'individual_contributor':
            if goal.assigned_to != user:
                raise permissions.PermissionDenied("You can only create tasks for your assigned goals")
            # Auto-assign to self
            serializer.save(goal=goal, assigned_to=user, created_by=user)
        elif user.role == 'manager':
            if goal.created_by != user:
                raise permissions.PermissionDenied("You can only create tasks for goals you created")
            # Manager can assign to goal assignee or specify different assignee
            assigned_to = serializer.validated_data.get('assigned_to', goal.assigned_to)
            serializer.save(goal=goal, assigned_to=assigned_to, created_by=user)
        else:
            raise permissions.PermissionDenied("Access denied")


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a task.
    GET: Get task details
    PUT/PATCH: Update task
    DELETE: Delete task
    """
    serializer_class = IndividualTaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter tasks based on user role"""
        user = self.request.user
        queryset = IndividualTask.objects.select_related('assigned_to', 'created_by', 'goal').prefetch_related('updates')
        
        if user.role == 'hr_admin':
            return queryset
        elif user.role == 'manager':
            return queryset.filter(Q(created_by=user) | Q(goal__created_by=user))
        else:
            return queryset.filter(assigned_to=user)
    
    def perform_update(self, serializer):
        """Update task with permission check and progress tracking"""
        task = self.get_object()
        user = self.request.user
        
        # Check permissions
        if user.role == 'individual_contributor':
            if task.assigned_to != user:
                raise permissions.PermissionDenied("You can only update your assigned tasks")
        elif user.role == 'manager':
            if task.created_by != user and task.goal.created_by != user:
                raise permissions.PermissionDenied("Access denied to this task")
        
        # Track progress changes
        old_progress = task.progress_percentage
        old_status = task.status
        
        serializer.save()
        
        # Create progress update record if significant change
        new_progress = serializer.instance.progress_percentage
        new_status = serializer.instance.status
        
        if old_progress != new_progress or old_status != new_status:
            TaskUpdate.objects.create(
                task=task,
                updated_by=user,
                previous_progress=old_progress,
                new_progress=new_progress,
                previous_status=old_status,
                new_status=new_status,
                update_notes=self.request.data.get('update_notes', ''),
                evidence_added=self.request.data.get('evidence_links', [])
            )
    
    def perform_destroy(self, instance):
        """Delete task with permission check"""
        user = self.request.user
        
        if user.role == 'individual_contributor':
            if instance.assigned_to != user:
                raise permissions.PermissionDenied("You can only delete your assigned tasks")
        elif user.role == 'manager':
            if instance.created_by != user and instance.goal.created_by != user:
                raise permissions.PermissionDenied("Access denied to this task")
        
        instance.delete()


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_objectives(request):
    """Get current user's objectives based on role"""
    user = request.user
    
    if user.role == 'hr_admin':
        objectives = Objective.objects.all()
    elif user.role == 'manager':
        objectives = Objective.objects.filter(owner=user)
    else:
        objectives = Objective.objects.filter(
            goals__assigned_to=user
        ).distinct()
    
    serializer = ObjectiveListSerializer(objectives, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_goals(request):
    """Get current user's goals"""
    user = request.user
    
    if user.role == 'manager':
        goals = Goal.objects.filter(created_by=user)
    else:
        goals = Goal.objects.filter(assigned_to=user)
    
    # Apply filters
    status_filter = request.query_params.get('status')
    if status_filter:
        goals = goals.filter(status=status_filter)
    
    serializer = GoalListSerializer(goals, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_tasks(request):
    """Get current user's tasks"""
    user = request.user
    
    if user.role == 'manager':
        tasks = IndividualTask.objects.filter(
            Q(assigned_to__manager=user) | Q(created_by=user)
        )
    else:
        tasks = IndividualTask.objects.filter(assigned_to=user)
    
    # Apply filters
    status_filter = request.query_params.get('status')
    if status_filter:
        tasks = tasks.filter(status=status_filter)
    
    priority_filter = request.query_params.get('priority')
    if priority_filter:
        tasks = tasks.filter(priority=priority_filter)
    
    serializer = TaskListSerializer(tasks, many=True)
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def update_task_progress(request, task_id):
    """Update task progress with validation and tracking"""
    task = get_object_or_404(IndividualTask, id=task_id)
    user = request.user
    
    # Check permissions
    if user.role == 'individual_contributor' and task.assigned_to != user:
        return Response(
            {'error': 'You can only update progress for your assigned tasks'},
            status=status.HTTP_403_FORBIDDEN
        )
    elif user.role == 'manager' and task.goal.created_by != user and task.assigned_to.manager != user:
        return Response(
            {'error': 'Access denied to this task'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = ProgressUpdateSerializer(data=request.data)
    if serializer.is_valid():
        # Track old values
        old_progress = task.progress_percentage
        old_status = task.status
        
        # Update task
        task.progress_percentage = serializer.validated_data['progress_percentage']
        task.status = serializer.validated_data['status']
        
        # Add evidence links if provided
        if 'evidence_links' in serializer.validated_data:
            new_links = serializer.validated_data['evidence_links']
            if task.evidence_links:
                task.evidence_links.extend(new_links)
            else:
                task.evidence_links = new_links
        
        task.save()
        
        # Create progress update record
        TaskUpdate.objects.create(
            task=task,
            updated_by=user,
            previous_progress=old_progress,
            new_progress=task.progress_percentage,
            previous_status=old_status,
            new_status=task.status,
            update_notes=serializer.validated_data.get('update_notes', ''),
            evidence_added=serializer.validated_data.get('evidence_links', [])
        )
        
        return Response({
            'message': 'Task progress updated successfully',
            'task': IndividualTaskSerializer(task).data
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def okr_analytics(request):
    """Get OKR analytics data based on user role"""
    user = request.user
    
    # Base querysets based on role
    if user.role == 'hr_admin':
        objectives = Objective.objects.all()
        goals = Goal.objects.all()
        tasks = IndividualTask.objects.all()
    elif user.role == 'manager':
        objectives = Objective.objects.filter(owner=user)
        goals = Goal.objects.filter(created_by=user)
        tasks = IndividualTask.objects.filter(goal__created_by=user)
    else:
        objectives = Objective.objects.filter(goals__assigned_to=user).distinct()
        goals = Goal.objects.filter(assigned_to=user)
        tasks = IndividualTask.objects.filter(assigned_to=user)
    
    # Calculate analytics
    analytics = {
        'objectives': {
            'total': objectives.count(),
            'active': objectives.filter(status='active').count(),
            'completed': objectives.filter(status='completed').count(),
            'overdue': objectives.filter(status='overdue').count(),
            'avg_progress': objectives.aggregate(avg=Avg('progress_percentage'))['avg'] or 0
        },
        'goals': {
            'total': goals.count(),
            'not_started': goals.filter(status='not_started').count(),
            'in_progress': goals.filter(status='in_progress').count(),
            'completed': goals.filter(status='completed').count(),
            'blocked': goals.filter(status='blocked').count(),
            'avg_progress': goals.aggregate(avg=Avg('progress_percentage'))['avg'] or 0
        },
        'tasks': {
            'total': tasks.count(),
            'not_started': tasks.filter(status='not_started').count(),
            'in_progress': tasks.filter(status='in_progress').count(),
            'completed': tasks.filter(status='completed').count(),
            'blocked': tasks.filter(status='blocked').count(),
            'avg_progress': tasks.aggregate(avg=Avg('progress_percentage'))['avg'] or 0
        }
    }
    
    return Response(analytics)
