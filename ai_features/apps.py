from django.apps import AppConfig


class AiFeaturesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "ai_features"

    def ready(self):
        # Implicitly connect signal handlers decorated with @receiver.
        from . import handlers
