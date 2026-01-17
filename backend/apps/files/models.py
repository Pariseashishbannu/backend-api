import uuid
from django.db import models
from django.conf import settings
from shared.storage import user_directory_path

class Tag(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tags')
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=20, default='blue') # blue, red, green, etc.
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'name']

    def __str__(self):
        return self.name

def thumbnail_directory_path(instance, filename):
    return 'users/{0}/thumbnails/{1}'.format(instance.user.id, filename)

def version_directory_path(instance, filename):
    return 'users/{0}/versions/{1}/{2}'.format(instance.file_item.user.id, instance.file_item.id, filename)

class File(models.Model):
    CATEGORY_CHOICES = [
        ('DOCUMENT', 'Document'),
        ('MEDICAL', 'Medical'),
        ('FINANCE', 'Finance'),
        ('PHOTO', 'Photo'),
        ('VIDEO', 'Video'),
        ('OTHER', 'Other'),
    ]

    FILE_TYPE_CHOICES = [
        ('PHOTO', 'Photo'),
        ('VIDEO', 'Video'),
        ('FILE', 'File'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='files')
    file = models.FileField(upload_to=user_directory_path, null=True, blank=True)
    thumbnail = models.ImageField(upload_to=thumbnail_directory_path, null=True, blank=True)
    
    name = models.CharField(max_length=255)
    size = models.BigIntegerField(default=0)
    mime_type = models.CharField(max_length=100, blank=True, null=True)
    file_type = models.CharField(max_length=10, choices=FILE_TYPE_CHOICES, default='FILE', db_index=True)
    
    # Advanced Organization
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='OTHER')
    metadata = models.JSONField(default=dict, blank=True) # Stores dynamic info like expiry_date, doctor_name
    tags = models.ManyToManyField(Tag, blank=True, related_name='files')

    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    is_folder = models.BooleanField(default=False)
    is_favorite = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    def delete(self, *args, **kwargs):
        # Delete the file from the filesystem
        if self.file:
            self.file.delete(save=False)
        if self.thumbnail:
            self.thumbnail.delete(save=False)
        super().delete(*args, **kwargs)

class FileVersion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file_item = models.ForeignKey(File, on_delete=models.CASCADE, related_name='versions')
    file = models.FileField(upload_to=version_directory_path)
    version_number = models.IntegerField()
    size = models.BigIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-version_number']

    def __str__(self):
        return f"{self.file_item.name} v{self.version_number}"

class ChunkedUpload(models.Model):
    STATUS_CHOICES = [
        ('INIT', 'Initialized'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]

    upload_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chunked_uploads')
    filename = models.CharField(max_length=255)
    file_size = models.BigIntegerField()
    mime_type = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='INIT')
    
    # Checksum for verification (optional but good)
    # sha256 = models.CharField(max_length=64, null=True, blank=True)

    completed_file = models.ForeignKey(File, on_delete=models.SET_NULL, null=True, blank=True, related_name='upload_session')

    def __str__(self):
        return f"{self.filename} ({self.status})"
