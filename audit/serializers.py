from rest_framework import serializers
from .models import AccessLog

class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = AccessLog
        fields = ['id', 'username', 'action', 'timestamp', 'ip_address', 'details']
        read_only_fields = ['id', 'username', 'action', 'timestamp', 'ip_address', 'details']
