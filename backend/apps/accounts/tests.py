from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse
from apps.files.models import File

User = get_user_model()

class ProfileTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser', 
            password='password123', 
            email='test@example.com',
            storage_quota_gb=10
        )
        self.client.force_authenticate(user=self.user)
        self.url = reverse('user-profile')

    def test_get_profile(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertEqual(response.data['storage_quota_gb'], 10)
        self.assertEqual(response.data['storage_used'], 0)

    def test_storage_used_calculation(self):
        # Create a file with size 1024 bytes
        File.objects.create(user=self.user, name="test.txt", size=1024)
        
        response = self.client.get(self.url)
        self.assertEqual(response.data['storage_used'], 1024)

    def test_update_profile(self):
        data = {'first_name': 'Test', 'last_name': 'User'}
        response = self.client.patch(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Test')
        self.assertEqual(self.user.last_name, 'User')
