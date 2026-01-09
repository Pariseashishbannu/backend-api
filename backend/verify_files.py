import os
import django
import sys
from pathlib import Path
import json
from django.core.files.uploadedfile import SimpleUploadedFile

# Setup Django environment
sys.path.append(str(Path(__file__).resolve().parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.dev')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.files.models import File

User = get_user_model()
client = APIClient()

def run_verification():
    print("--- Starting Files App Verification ---")

    # 1. Setup User
    username = 'filetester'
    password = 'password123'
    if not User.objects.filter(username=username).exists():
        user = User.objects.create_user(username=username, password=password)
        print(f"Created user: {username}")
    else:
        user = User.objects.get(username=username)
        print(f"Using existing user: {username}")

    # 2. Get JWT
    response = client.post('/api/v1/auth/token/', {'username': username, 'password': password}, format='json')
    if response.status_code != 200:
        print(f"FAILED to get token: {response.content}")
        return
    token = response.data['access']
    client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)
    print("Authentication successful.")

    # 2.5 Test GET first to isolate issue
    print("Testing GET /api/v1/files/...")
    response_get = client.get('/api/v1/files/')
    if response_get.status_code == 200:
        print("GET successful.")
    else:
        print(f"GET FAILED. Status: {response_get.status_code}")
        try:
             import re
             content = response_get.content.decode('utf-8')
             match = re.search(r'<pre class="exception_value">(.*?)</pre>', content)
             if match:
                 print(f"EXCEPTION: {match.group(1)}")
             else:
                 print(f"Response start: {content[:1000]}")
        except:
             pass

    # 3. Upload File
    file_content = b"Hello, World! This is a test file."
    file_name = "hello.txt"
    test_file = SimpleUploadedFile(file_name, file_content, content_type="text/plain")

    print("Testing POST /api/v1/files/...")
    response = client.post('/api/v1/files/', {'file': test_file}, format='multipart')

    if response.status_code == 201:
        file_id = response.data['id']
        print(f"Upload successful. File ID: {file_id}")
    else:
        print(f"FAILED to upload file. Status: {response.status_code}")
        try:
            content = response.content.decode('utf-8')
            print(f"Response start: {content[:1000]}")
        except:
            print(f"Response (binary): {response.content[:200]}")
        return


    # 4. List Files
    response = client.get('/api/v1/files/')
    if response.status_code == 200 and len(response.data) > 0:
        print(f"List files successful. Count: {len(response.data)}")
    else:
        print(f"FAILED to list files: {response.content}")
        return

    # 5. Download File
    response = client.get(f'/api/v1/files/{file_id}/download/')
    if response.status_code == 200:
        downloaded_content = b"".join(response.streaming_content)
        if downloaded_content == file_content:
             print("Download successful. Content matches.")
        else:
             print(f"Download content MISMATCH. Got: {downloaded_content}")
    else:
        print(f"FAILED to download file: {response.content}")

    # 6. Delete File
    response = client.delete(f'/api/v1/files/{file_id}/')
    if response.status_code == 204:
        print("Delete successful.")
        # Verify from DB
        if not File.objects.filter(id=file_id).exists():
            print("Verified file removed from DB.")
        else:
             print("FAILED: File still in DB.")
        # Verify from Disk (optional, relies on internal storage knowledge)
    else:
        print(f"FAILED to delete file: {response.content}")

    print("--- Verification Complete ---")

if __name__ == "__main__":
    try:
        run_verification()
    except Exception as e:
        print(f"An error occurred: {e}")
