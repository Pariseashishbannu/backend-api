import os
import mimetypes
from django.core.management.base import BaseCommand
from django.conf import settings
from django.contrib.auth import get_user_model
from apps.files.models import File

User = get_user_model()

class Command(BaseCommand):
    help = 'Imports existing files from MEDIA_ROOT into the database'

    def add_arguments(self, parser):
        parser.add_argument('--user', type=str, required=True, help='Username to assign files to')
        parser.add_argument('--path', type=str, default='', help='Subpath within MEDIA_ROOT to scan (optional)')

    def handle(self, *args, **options):
        username = options['user']
        subpath = options['path']

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User "{username}" does not exist'))
            return

        base_path = settings.MEDIA_ROOT
        if subpath:
            target_path = os.path.join(base_path, subpath)
        else:
            target_path = base_path

        if not os.path.exists(target_path):
            self.stdout.write(self.style.ERROR(f'Path "{target_path}" does not exist'))
            return

        self.stdout.write(f'Scanning {target_path} for user {username}...')

        count = 0
        for root, dirs, files in os.walk(target_path):
            for filename in files:
                file_path = os.path.join(root, filename)
                
                # Calculate relative path for storage field
                # Django's FileField generally expects path structure relative to MEDIA_ROOT
                rel_path = os.path.relpath(file_path, settings.MEDIA_ROOT)
                
                # Check if already exists to avoid duplicates
                # Note: exact match on name might be tricky if user_directory_path varies
                # Checking by exact file path match in DB is safer if possible, 
                # but 'file' field stores relative path.
                if File.objects.filter(file=rel_path).exists():
                    self.stdout.write(self.style.WARNING(f'Skipping existing: {filename}'))
                    continue

                try:
                    size = os.path.getsize(file_path)
                    mime_type, _ = mimetypes.guess_type(file_path)
                    if not mime_type:
                        mime_type = 'application/octet-stream'

                    File.objects.create(
                        user=user,
                        file=rel_path,
                        name=filename,
                        size=size,
                        mime_type=mime_type
                    )
                    self.stdout.write(self.style.SUCCESS(f'Imported: {filename}'))
                    count += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Failed to import {filename}: {e}'))

        self.stdout.write(self.style.SUCCESS(f'Successfully imported {count} files.'))
