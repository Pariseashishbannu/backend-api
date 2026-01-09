import uuid
from django.db import models
from django.conf import settings
from shared.storage import user_directory_path

class File(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='files')
    file = models.FileField(upload_to=user_directory_path)
    name = models.CharField(max_length=255)
    size = models.BigIntegerField()
    mime_type = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    def delete(self, *args, **kwargs):
        # Delete the file from the filesystem
        if self.file:
            self.file.delete(save=False)
        super().delete(*args, **kwargs)
