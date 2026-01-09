import os
import django
import sys
from pathlib import Path
from django.urls import reverse

sys.path.append(str(Path(__file__).resolve().parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.dev')
django.setup()

try:
    from django.urls import resolve
    url = reverse('file-list-create')
    resolved = resolve(url)
    print(f"Resolved URL: {url}")
    print(f"Resolved View: {resolved.func}")
except Exception as e:
    print(f"Error resolving URL: {e}")

from django.db import connection
print(f"Tables: {connection.introspection.table_names()}")
