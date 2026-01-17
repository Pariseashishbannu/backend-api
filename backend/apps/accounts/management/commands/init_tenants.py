from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.conf import settings

User = get_user_model()

class Command(BaseCommand):
    help = 'Initialize tenants and admin user'

    def handle(self, *args, **kwargs):
        users_data = [
            {'username': 'bannu', 'email': 'bannu@example.com', 'is_staff': True, 'is_superuser': True},
            {'username': 'ashish', 'email': 'ashish@example.com', 'is_staff': False, 'is_superuser': False},
            {'username': 'arun', 'email': 'arun@example.com', 'is_staff': False, 'is_superuser': False},
            {'username': 'antony', 'email': 'antony@example.com', 'is_staff': False, 'is_superuser': False},
            {'username': 'karuna', 'email': 'karuna@example.com', 'is_staff': False, 'is_superuser': False},
        ]

        default_password = 'password123'

        for data in users_data:
            username = data['username']
            email = data['email']
            
            created = False
            try:
                user = User.objects.get(username=username)
                self.stdout.write(self.style.WARNING(f"User {username} already exists."))
            except User.DoesNotExist:
                user = User.objects.create_user(username=username, email=email, password=default_password)
                created = True
                self.stdout.write(self.style.SUCCESS(f"Created user {username}"))

            # Update attributes
            user.is_staff = data['is_staff']
            user.is_superuser = data['is_superuser']
            user.save()
            
            if created:
                self.stdout.write(self.style.SUCCESS(f"  - Setup complete for {username}"))
            else:
                 # Ensure password is set if force reset needed (optional, skipping to avoid locking out actual usage if changed)
                 pass

        self.stdout.write(self.style.SUCCESS('Successfully initialized all tenants'))
