"""
URL patterns for the authentication app.
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'authentication'

urlpatterns = [
    # Authentication endpoints
    path('signup/', views.SignupView.as_view(), name='signup'),
    path('login/', views.CustomTokenObtainPairView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User profile endpoints
    path('me/', views.UserProfileView.as_view(), name='user_profile'),
    path('change-password/', views.PasswordChangeView.as_view(), name='change_password'),
    
    # User data endpoints
    path('permissions/', views.user_permissions, name='user_permissions'),
    path('team/', views.user_team, name='user_team'),
    
    # Utility endpoints
    path('departments/', views.departments_list, name='departments_list'),
] 