from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from .models import File
from .serializers import FileSerializer
import mimetypes

class FileListCreateView(generics.ListCreateAPIView):
    serializer_class = FileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):

        return File.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Extract metadata from the uploaded file
        uploaded_file = self.request.data.get('file')
        
        name = uploaded_file.name
        size = uploaded_file.size
        mime_type = mimetypes.guess_type(name)[0] or 'application/octet-stream'

        serializer.save(
            user=self.request.user,
            name=name,
            size=size,
            mime_type=mime_type
        )



class FileDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = FileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return File.objects.filter(user=self.request.user)

class FileDownloadView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        file_instance = get_object_or_404(File, pk=pk, user=request.user)
        
        # Open the file for streaming
        try:
            # as_attachment=True forces download
            response = FileResponse(file_instance.file.open('rb'), as_attachment=True, filename=file_instance.name)
            return response
        except FileNotFoundError:
            raise Http404("File not found on server")
