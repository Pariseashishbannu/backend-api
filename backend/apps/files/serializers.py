from rest_framework import serializers
from .models import File, FileVersion

class FileVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FileVersion
        fields = ['id', 'version_number', 'created_at', 'size'] # Expose download link if needed, or assume standard download by ID? Maybe not file url directly.

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = File.tags.rel.model # Get Tag model dynamically or import it
        fields = ['id', 'name', 'color']

class FileSerializer(serializers.ModelSerializer):
    # We can use PrimaryKeyRelatedField for writing tags, and maybe a nested serializer for reading if needed.
    # For now, let's keep it simple: read/write tags?
    # Actually, let's make it writable.
    tags = serializers.SerializerMethodField()
    versions = FileVersionSerializer(many=True, read_only=True)

    class Meta:
        model = File
        fields = ['id', 'name', 'size', 'mime_type', 'created_at', 'updated_at', 'file',
                  'parent', 'is_folder', 'is_favorite', 'category', 'metadata', 'tags', 'file_type', 'thumbnail', 'versions']
        read_only_fields = ['id', 'created_at', 'updated_at', 'size', 'mime_type']

    def get_tags(self, obj):
        # Simple list of tag objects or names
        return [{'id': tag.id, 'name': tag.name, 'color': tag.color} for tag in obj.tags.all()]

    def create(self, validated_data):
        # We handle file metadata extraction in the view, but if needed here:
        # The view will pass 'user', 'name', 'size', 'mime_type' explicitly if not read_only
        # But standard DRF CreateModelMixin might be skipped for custom logic
        return super().create(validated_data)
