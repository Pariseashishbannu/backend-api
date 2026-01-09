import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # We can keep username/email/first_name/last_name from AbstractUser
    # Add any other fields if necessary, currently sticking to basics
    
    def __str__(self):
        return self.username
