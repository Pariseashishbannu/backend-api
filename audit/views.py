from rest_framework import generics, permissions
from .models import AccessLog
from .serializers import AuditLogSerializer

class AuditLogListView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users can see their own logs
        return AccessLog.objects.filter(user=self.request.user).order_by('-timestamp')
