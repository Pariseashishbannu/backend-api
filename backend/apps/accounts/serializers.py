from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db.models import Sum

User = get_user_model()

class SocialLoginSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)
    provider = serializers.ChoiceField(choices=[('google', 'Google'), ('apple', 'Apple')])

class UserSerializer(serializers.ModelSerializer):
    storage_used = serializers.SerializerMethodField()
    
    name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'name', 'email', 'first_name', 'last_name', 'date_joined', 'storage_quota_gb', 'storage_used']
        read_only_fields = ['id', 'username', 'date_joined', 'storage_quota_gb', 'storage_used']

    def get_name(self, obj):
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        return obj.first_name or obj.username

    def get_storage_used(self, obj):
        # Sum size of all files belonging to user
        # Note: 'files' is the related_name in File model
        # using aggregate to sum the 'size' field
        total_bytes = obj.files.aggregate(total=Sum('size'))['total'] or 0
        return total_bytes
