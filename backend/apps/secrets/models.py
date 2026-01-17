import uuid
from django.db import models
from django.conf import settings

class Secret(models.Model):
    TYPE_CHOICES = (
        ('PASSWORD', 'Password'),
        ('NOTE', 'Secure Note'),
        ('API_KEY', 'API Key'),
        ('OTHER', 'Other'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='secrets')
    title = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='PASSWORD')
    
    # In a real rigorous impl, we'd use a BinaryField or separate encrypted fields.
    # For now, we assume the frontend sends an encrypted JSON blob or we encrypt it here.
    # To keep it flexible for "Zero Knowledge" future phases, we store the payload as text (e.g. base64 encoded ciphertext).
    encrypted_payload = models.TextField(help_text="Encrypted JSON data containing the secret")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.user})"
