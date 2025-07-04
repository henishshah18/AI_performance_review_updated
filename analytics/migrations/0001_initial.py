# Generated by Django 4.2 on 2025-06-15 15:34

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="CompanyMetrics",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("date", models.DateField(default=django.utils.timezone.now)),
                ("total_employees", models.IntegerField(default=0)),
                ("active_objectives", models.IntegerField(default=0)),
                ("completion_rate", models.FloatField(default=0.0)),
                ("pending_reviews", models.IntegerField(default=0)),
                ("total_departments", models.IntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name_plural": "Company Metrics",
                "ordering": ["-date"],
            },
        ),
        migrations.CreateModel(
            name="UserDashboardMetrics",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("total_goals", models.IntegerField(default=0)),
                ("completed_goals", models.IntegerField(default=0)),
                ("in_progress_goals", models.IntegerField(default=0)),
                ("overdue_goals", models.IntegerField(default=0)),
                ("goals_due_soon", models.IntegerField(default=0)),
                ("last_feedback_date", models.DateTimeField(blank=True, null=True)),
                ("performance_score", models.FloatField(default=0.0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="dashboard_metrics",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name_plural": "User Dashboard Metrics",
            },
        ),
        migrations.CreateModel(
            name="TeamMetrics",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("team_size", models.IntegerField(default=0)),
                ("active_goals", models.IntegerField(default=0)),
                ("completed_goals", models.IntegerField(default=0)),
                ("overdue_goals", models.IntegerField(default=0)),
                ("team_performance_avg", models.FloatField(default=0.0)),
                ("last_review_cycle", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "manager",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="team_metrics",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name_plural": "Team Metrics",
            },
        ),
        migrations.CreateModel(
            name="Notification",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("title", models.CharField(max_length=200)),
                ("message", models.TextField()),
                (
                    "notification_type",
                    models.CharField(
                        choices=[
                            ("goal_deadline", "Goal Deadline"),
                            ("review_reminder", "Review Reminder"),
                            ("feedback_received", "Feedback Received"),
                            ("objective_assigned", "Objective Assigned"),
                            ("team_update", "Team Update"),
                            ("system_announcement", "System Announcement"),
                        ],
                        max_length=50,
                    ),
                ),
                (
                    "priority",
                    models.CharField(
                        choices=[
                            ("low", "Low"),
                            ("medium", "Medium"),
                            ("high", "High"),
                            ("urgent", "Urgent"),
                        ],
                        default="medium",
                        max_length=20,
                    ),
                ),
                ("is_read", models.BooleanField(default=False)),
                ("action_url", models.URLField(blank=True, null=True)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("read_at", models.DateTimeField(blank=True, null=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notifications",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="DepartmentStats",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "department",
                    models.CharField(
                        choices=[
                            ("engineering", "Engineering"),
                            ("product", "Product"),
                            ("design", "Design"),
                            ("marketing", "Marketing"),
                            ("sales", "Sales"),
                            ("hr", "HR"),
                            ("finance", "Finance"),
                            ("operations", "Operations"),
                        ],
                        max_length=50,
                    ),
                ),
                ("date", models.DateField(default=django.utils.timezone.now)),
                ("employee_count", models.IntegerField(default=0)),
                ("active_objectives", models.IntegerField(default=0)),
                ("completed_objectives", models.IntegerField(default=0)),
                ("completion_rate", models.FloatField(default=0.0)),
                ("average_performance", models.FloatField(default=0.0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name_plural": "Department Statistics",
                "ordering": ["-date", "department"],
                "unique_together": {("department", "date")},
            },
        ),
        migrations.CreateModel(
            name="ActivityLog",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "activity_type",
                    models.CharField(
                        choices=[
                            ("objective_created", "Objective Created"),
                            ("objective_completed", "Objective Completed"),
                            ("review_started", "Review Started"),
                            ("review_completed", "Review Completed"),
                            ("feedback_given", "Feedback Given"),
                            ("goal_updated", "Goal Updated"),
                            ("user_registered", "User Registered"),
                            ("team_updated", "Team Updated"),
                        ],
                        max_length=50,
                    ),
                ),
                ("description", models.TextField()),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="activities",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name_plural": "Activity Logs",
                "ordering": ["-created_at"],
            },
        ),
    ]
