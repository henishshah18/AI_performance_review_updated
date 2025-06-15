from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user serializer for displaying user information in other apps"""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    avatar_url = serializers.SerializerMethodField()
    department_name = serializers.CharField(source='department.name', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'full_name', 'avatar_url', 'department_name', 'role', 'role_display'
        ]
        read_only_fields = ['id', 'username', 'email']
    
    def get_avatar_url(self, obj):
        """Return avatar URL - placeholder for now"""
        return f"https://ui-avatars.com/api/?name={obj.get_full_name()}&background=random" 