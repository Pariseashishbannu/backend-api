import uuid
import os

def user_directory_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT/users/<user_id>/<filename>
    return 'users/{0}/{1}'.format(instance.user.id, filename)
