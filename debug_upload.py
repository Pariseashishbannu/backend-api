import requests
import os

BASE_URL = 'http://127.0.0.1:8000/api/v1'

def run_debug():
    # 1. Register/Login
    username = 'arun'
    password = 'password123'
    email = 'arun@example.com'
    
    # Try Register
    print(f"Registering {username}...")
    try:
        resp = requests.post(f"{BASE_URL}/auth/register/", json={
            'username': username,
            'email': email,
            'password': password
        })
        
        if resp.status_code == 201:
            print("Registration successful.")
        elif resp.status_code == 400 and ('username' in resp.text or 'already exists' in resp.text):
            print("User already exists, proceeding to login.")
        else:
            print(f"Registration failed: {resp.status_code} {resp.text[:200]}")
            # Try login anyway
    except Exception as e:
        print(f"Connection failed: {e}")
        return

    # Login
    print("Logging in...")
    resp = requests.post(f"{BASE_URL}/auth/token/", json={
        'username': username,
        'password': password
    })
    
    if resp.status_code != 200:
        print(f"Login failed: {resp.status_code} {resp.text}")
        return
        
    token = resp.json()['access']
    print("Login successful. Token obtained.")
    
    # 2. Upload File
    headers = {'Authorization': f'Bearer {token}'}
    
    # Create dummy file
    with open('test_upload.txt', 'w') as f:
        f.write('This is a test content.')
        
    print("Uploading file...")
    # Re-open in binary mode
    files = {'file': open('test_upload.txt', 'rb')}
    data = {'is_folder': 'false', 'category': 'DOCUMENT'}
    
    try:
        resp = requests.post(f"{BASE_URL}/files/", headers=headers, files=files, data=data)
        print(f"Upload Response Status: {resp.status_code}")
        print(f"Upload Response Body: {resp.text[:200]}")
    except Exception as e:
        print(f"Request failed: {e}")
    finally:
        files['file'].close()
        if os.path.exists('test_upload.txt'):
            os.remove('test_upload.txt')

if __name__ == '__main__':
    run_debug()
