from rest_framework import serializers
from .models import IntegrationCredential

class IntegrationCredentialSerializer(serializers.ModelSerializer):
    class Meta:
        model = IntegrationCredential
        fields = ['id', 'provider', 'is_active', 'last_synced_at', 'created_at']
        read_only_fields = ['id', 'last_synced_at', 'created_at']

class ICloudLoginSerializer(serializers.Serializer):
    apple_id = serializers.EmailField()
    password = serializers.CharField(write_only=True)

class ICloud2FASerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6, min_length=6)
    
class GoogleAuthURLSerializer(serializers.Serializer):
    redirect_uri = serializers.URLField()
    
class GoogleAuthCallbackSerializer(serializers.Serializer):
    code = serializers.CharField()
    redirect_uri = serializers.URLField()
