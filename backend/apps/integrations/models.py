from django.db import models
from django.conf import settings
from django.utils import timezone

class IntegrationCredential(models.Model):
    PROVIDER_CHOICES = [
        ('google', 'Google Photos'),
        ('icloud', 'iCloud'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='integrations')
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES)
    
    # Stores JSON tokens (encrypted via app logic or just raw JSON in this env)
    credentials = models.JSONField(default=dict)
    
    is_active = models.BooleanField(default=True)
    last_synced_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'provider')
        ordering = ['provider']

    def __str__(self):
        return f"{self.user.username} - {self.provider}"
