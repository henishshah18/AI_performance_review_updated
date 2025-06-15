"""
OKR URL Configuration
Defines all URL patterns for OKR API endpoints.
"""

from django.urls import path
from . import views

app_name = "okr"

urlpatterns = [
    # Objective endpoints
    path("objectives/", views.ObjectiveListCreateView.as_view(), name="objective-list-create"),
    path("objectives/<uuid:pk>/", views.ObjectiveDetailView.as_view(), name="objective-detail"),
    
    # Goal endpoints
    path("objectives/<uuid:objective_id>/goals/", views.GoalListCreateView.as_view(), name="goal-list-create"),
    path("goals/<uuid:pk>/", views.GoalDetailView.as_view(), name="goal-detail"),
    
    # Task endpoints
    path("goals/<uuid:goal_id>/tasks/", views.TaskListCreateView.as_view(), name="task-list-create"),
    path("tasks/<uuid:pk>/", views.TaskDetailView.as_view(), name="task-detail"),
    path("tasks/<uuid:task_id>/progress/", views.update_task_progress, name="task-progress-update"),
    
    # User-specific endpoints
    path("my-objectives/", views.my_objectives, name="my-objectives"),
    path("my-goals/", views.my_goals, name="my-goals"),
    path("my-tasks/", views.my_tasks, name="my-tasks"),
    
    # Analytics endpoint
    path("analytics/", views.okr_analytics, name="okr-analytics"),
] 