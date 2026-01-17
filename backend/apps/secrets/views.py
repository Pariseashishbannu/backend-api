from rest_framework import generics, permissions
from .models import Secret
from .serializers import SecretSerializer

class SecretListCreateView(generics.ListCreateAPIView):
    serializer_class = SecretSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Secret.objects.filter(user=self.request.user)

class SecretDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SecretSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Secret.objects.filter(user=self.request.user)
