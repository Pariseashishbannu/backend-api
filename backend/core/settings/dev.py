from .base import *

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-zn3wc67pen#kue2jh$5xjr=o4y8bad8t^@700o6c55_=mu04il'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'testserver']

# Database
# https://docs.djangoproject.com/en/6.0/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

