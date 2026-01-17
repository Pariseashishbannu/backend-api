from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import File
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
import os

@receiver(post_save, sender=File)
def generate_thumbnail(sender, instance, created, **kwargs):
    if not instance.file:
        return
        
    # Only process photos
    if instance.file_type != 'PHOTO':
        return

    # Prevent infinite loop if we are saving the thumbnail
    # If thumbnail already exists, skip (unless we want to regenerate on update, but keep simple)
    if instance.thumbnail:
        return

    try:
        # Open the original file
        # We need to open it carefully depending on storage backend (local vs cloud)
        # For local, .path or .open() works.
        
        with instance.file.open('rb') as f:
            t_image = Image.open(f)
            
            # Convert to RGB if needed (e.g. PNG with alpha)
            if t_image.mode in ('RGBA', 'LA'):
                fill_color = (255, 255, 255) # White background
                background = Image.new(t_image.mode[:-1], t_image.size, fill_color)
                background.paste(t_image, t_image.split()[-1])
                t_image = background
            
            # Resize
            t_image.thumbnail((300, 300))
            
            # Save to buffer
            thumb_io = BytesIO()
            t_image.save(thumb_io, format='JPEG', quality=85)
            
            # Create filename
            file_name, ext = os.path.splitext(os.path.basename(instance.file.name))
            thumb_filename = f"{file_name}_thumb.jpg"
            
            # Save to model
            instance.thumbnail.save(thumb_filename, ContentFile(thumb_io.getvalue()), save=False)
            instance.save(update_fields=['thumbnail'])
            
    except Exception as e:
        print(f"Error generating thumbnail for {instance.id}: {e}")
