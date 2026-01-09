from rest_framework import serializers
from .models import File

class FileSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = ['id', 'name', 'size', 'mime_type', 'created_at', 'updated_at', 'file']
        read_only_fields = ['id', 'created_at', 'updated_at', 'user', 'size', 'mime_type', 'name']

    def create(self, validated_data):
        # We handle file metadata extraction in the view, but if needed here:
        # The view will pass 'user', 'name', 'size', 'mime_type' explicitly if not read_only
        # But standard DRF CreateModelMixin might be skipped for custom logic
        return super().create(validated_data)
