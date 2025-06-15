from django.apps import AppConfig


class AiFeaturesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "ai_features"
    verbose_name = "AI Features"
    
    def ready(self):
        """Import signal handlers when the app is ready"""
        try:
            import ai_features.signals
        except ImportError:
            pass
