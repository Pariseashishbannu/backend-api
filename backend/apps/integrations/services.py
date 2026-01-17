import os
import json
from pyicloud import PyiCloudService
from rest_framework.exceptions import ValidationError

# Pseudo-session store for iCloud (in memory for now, or file-based for persistence across requests in dev)
# In production, use Redis or DB
ICLOUD_SESSION_STORE = {}

class ICloudManager:
    @staticmethod
    def login(user_id, apple_id, password):
        try:
            api = PyiCloudService(apple_id, password)
            if api.requires_2fa:
                # Store the API instance or session data temporarily
                # Note: PyiCloud objects are not easily serializable. 
                # We often need to keep them in memory or serialized state.
                # For this implementation guide, we'll simulate the state management.
                ICLOUD_SESSION_STORE[user_id] = {
                    'apple_id': apple_id,
                    'password': password,
                    'instance': api # Warning: This won't work well with multiple workers
                }
                return {'requires_2fa': True}
            return {'requires_2fa': False, 'api': api}
        except Exception as e:
            raise ValidationError(f"iCloud Login failed: {str(e)}")

        del ICLOUD_SESSION_STORE[user_id] # Clear temp session
        return api

    @staticmethod
    def verify_2fa(user_id, code):
        session = ICLOUD_SESSION_STORE.get(user_id)
        if not session or 'instance' not in session:
            raise ValidationError("Session expired. Please log in again.")
            
        api = session['instance']
        
        try:
            result = api.validate_2fa_code(code)
            if not result:
                raise ValidationError("Failed to verify 2FA code.")
            
            # Trust this device/session if possible
            if not api.is_trusted_session:
                try:
                    api.trust_session()
                except:
                    pass # Trusting is optional but good for UX
            
            return api
        except Exception as e:
            raise ValidationError(f"2FA Verification failed: {str(e)}")

    @staticmethod
    def get_api_instance(user_id):
        # In a real scenario, we'd load the session from disk/db
        # providing valid credentials re-creation or using saved session files.
        # For this prototype, we rely on the session being alive in memory or pyicloud's default caching.
        # This is a simplification.
        # Ideally: load 'apple_id' and 'password' from encrypted storage if session expired.
        # Here we assume the user just logged in or we have a way to reconstruct.
        # We'll default to error if not found in our simple store for now, 
        # instructing user to re-login if needed.
        
        # NOTE: In a persistent django server process or with file-based cache ~/.pyicloud, 
        # we might be able to re-instantiate PyiCloudService(apple_id, password) 
        # and it might pick up the session token.
        
        # Simplified: Check active credential in DB to get apple_id
        from .models import IntegrationCredential
        cred = IntegrationCredential.objects.filter(user_id=user_id, provider='icloud', is_active=True).first()
        if not cred:
             raise ValidationError("No active iCloud connection.")
        
        # Try to re-login (this might prompt 2FA again if session expired, which is a limitation of this approach)
        # In prod, you'd manage the session token persistence more carefully.
        # We will attempt to rely on pyicloud's file system caching.
        # Recovering from ICLOUD_SESSION_STORE if available (just logged in)
        session = ICLOUD_SESSION_STORE.get(user_id)
        if session:
             return session['instance']
             
        # Fallback: relies on ~/.pyicloud/ 
        # We need the apple_id and password essentially. 
        # Storing password in plain text is BAD. Ideally, we shouldn't.
        # But pyicloud needs it for re-auth.
        # We will stop here for the prototype if not in memory session.
        raise ValidationError("Session expired. Please reconnect iCloud.")

    @staticmethod
    def scan_photos(user_id):
        api = ICloudManager.get_api_instance(user_id)
        photos = []
        # Get last 50 photos
        for photo in api.photos.all.fetch(limit=50):
            photos.append({
                'id': photo.filename, # Using filename as ID for simplicity
                'filename': photo.filename,
                'size': photo.size,
                'created': photo.created,
                'url': photo.versions.get('medium', {}).get('url') or photo.versions.get('thumb', {}).get('url') # Get thumb URL
            })
        return photos

    @staticmethod
    def import_photos(user_id, photo_filenames):
        api = ICloudManager.get_api_instance(user_id)
        from apps.files.models import File
        from apps.files.utils import get_unique_filename
        from django.core.files.base import ContentFile
        import requests
        
        imported_count = 0
        
        # This is inefficient O(N*M) but fine for 50 items.
        # Better: index by filename
        
        # We trigger finding the specific photo asset from iterator
        # Only feasible for small 'limit' or if we had real asset IDs
        # pyicloud 'filename' isn't truly unique ID, but we work with what we have.
        
        target_assets = []
        # We have to iterate to find them because .get() isn't straightforward in pyicloud wrapper
        # fetching 100 to be safe
        for photo in api.photos.all.fetch(limit=100):
            if photo.filename in photo_filenames:
                target_assets.append(photo)
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.get(id=user_id)

        for photo in target_assets:
            try:
                # Download
                download_url = photo.download()
                response = requests.get(download_url, stream=True)
                
                if response.status_code == 200:
                    file_name = get_unique_filename(user, photo.filename)
                    # Create File object
                    file_obj = File(
                        user=user,
                        name=file_name,
                        size=photo.size,
                        category='image', # Assumption
                        is_favorite=False
                    )
                    file_obj.file.save(file_name, ContentFile(response.content))
                    file_obj.save()
                    imported_count += 1
            except Exception as e:
                print(f"Failed to import {photo.filename}: {e}")
                
        return imported_count

class GooglePhotosManager:
    # Placeholder for OAuth logic
    # In a real app, use flow.from_client_secrets_file...
    pass
