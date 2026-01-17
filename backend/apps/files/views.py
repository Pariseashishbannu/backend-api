from django.conf import settings
from .utils import get_storage_stats
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import ValidationError
from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Count
from .models import File
from .serializers import FileSerializer
import mimetypes

class FileListCreateView(generics.ListCreateAPIView):
    serializer_class = FileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self): # Modified for Admin Access
        user = self.request.user
        
        # Admin Override
        if user.is_superuser and self.request.query_params.get('admin_mode') == 'true':
            queryset = File.objects.all().order_by('-is_folder', '-created_at')
        else:
            queryset = File.objects.filter(user=user).order_by('-is_folder', '-created_at')
        
        # Filter by Type
        file_type = self.request.query_params.get('type')
        if file_type:
            queryset = queryset.filter(file_type=file_type.upper())

        # Filter by Favorite
        if self.request.query_params.get('favorite') == 'true':
            queryset = queryset.filter(is_favorite=True)
            return queryset 
        
        # Filter by Category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category.upper())
        
        # Filter by Parent (Folder Hierarchy)
        if not file_type or file_type == 'FILE':
             parent_id = self.request.query_params.get('folder')
             if parent_id == 'root' or not parent_id:
                 queryset = queryset.filter(parent__isnull=True)
             else:
                 queryset = queryset.filter(parent__id=parent_id)

        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        
        # Check if creating a folder
        is_folder = self.request.data.get('is_folder')
        if is_folder == 'true' or is_folder is True:
            parent_id = self.request.data.get('parent')
            name = self.request.data.get('name')
            serializer.save(
                user=user,
                name=name,
                is_folder=True,
                size=0,
                file_type='FILE', # Folders live in Files view
                parent_id=parent_id if parent_id != 'root' else None
            )
            return

        # Normal File Upload
        uploaded_file = self.request.data.get('file')
        parent_id = self.request.data.get('parent')
        
        name = uploaded_file.name
        size = uploaded_file.size

        # Check Quota
        quota_bytes = user.storage_quota_gb * 1024 * 1024 * 1024
        current_usage = File.objects.filter(user=user).aggregate(total=Sum('size'))['total'] or 0
        
        if current_usage + size > quota_bytes:
            raise ValidationError({"detail": f"Storage quota exceeded."})

        mime_type = mimetypes.guess_type(name)[0] or 'application/octet-stream'
        
        # Auto-Categorization Logic
        file_type = 'FILE'
        category = self.request.data.get('category', 'OTHER') # Default to OTHER
        metadata = self.request.data.get('metadata') # Expecting JSON string or dict

        if mime_type.startswith('image/'):
            file_type = 'PHOTO'
            category = 'PHOTO' # Auto categorize photos
            parent_id = None 
        elif mime_type.startswith('video/'):
            file_type = 'VIDEO'
            category = 'VIDEO'

        # Parse metadata if it's sent as a string (often happens with FormData)
        if isinstance(metadata, str):
            import json
            try:
                metadata = json.loads(metadata)
            except:
                metadata = {}
        
        if metadata is None:
            metadata = {}

        # Check for existing file collision
        from .models import FileVersion, File
        from django.core.files.base import ContentFile
        
        parent_uuid = parent_id if parent_id and parent_id != 'root' else None
        
        # Only check collision for FILES, not folders (folders allow duplicates? or handle separately. Logic above handles folders)
        # The logic above returns if is_folder is true. So we are only handling files here.
        
        existing_file = File.objects.filter(user=user, parent_id=parent_uuid, name=name, is_folder=False).first()
        
        if existing_file:
             # --- VERSIONING LOGIC ---
             try:
                 # Check if physical file exists before archiving
                 if existing_file.file:
                     # Calculate next version number
                     last_version = existing_file.versions.first() # Meta ordering is -version_number
                     next_version_num = (last_version.version_number + 1) if last_version else 1
                     
                     # Create Archive
                     # We read the file content to save a copy in versions storage
                     # Optim usage: If storage supports copy, use that. But generic approach: read/write.
                     with existing_file.file.open('rb') as f:
                        content = f.read()
                        fv = FileVersion(
                            file_item=existing_file,
                            version_number=next_version_num,
                            size=existing_file.size
                        )
                        # Save content to new path (upload_to handles path generation)
                        # We use existing name, path gen will prefix with 'versions/...'
                        fv.file.save(existing_file.name, ContentFile(content))
                        fv.save()
             except Exception as e:
                 print(f"Error creating version archive: {e}")
                 # Proceed with update anyway? Yes, improved UX over failure.
            
             # Set instance to trigger UPDATE instead of CREATE
             serializer.instance = existing_file

        serializer.save(
            user=user,
            name=name,
            size=size,
            mime_type=mime_type,
            file_type=file_type,
            category=category,
            metadata=metadata,
            parent_id=parent_id if parent_id and parent_id != 'root' else None
        )

class FileDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return File.objects.filter(user=self.request.user)

class FileDownloadView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        file_instance = get_object_or_404(File, pk=pk, user=request.user)
        
        variant = request.query_params.get('variant')
        file_handle = file_instance.file
        filename = file_instance.name

        if variant == 'thumbnail':
            if file_instance.thumbnail:
                file_handle = file_instance.thumbnail
                filename = f"thumb_{filename}"
            else:
                 # Fallback to original if no thumbnail (or 404? Fallback is safer for UI)
                 pass

        # Open the file for streaming
        try:
            # as_attachment=True forces download
            if not file_handle:
                raise FileNotFoundError
                
            response = FileResponse(file_handle.open('rb'), as_attachment=True, filename=filename)
            return response
        except (FileNotFoundError, ValueError):
            # ValueError can happen if field is empty
            raise Http404("File not found on server")

class FileStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user_files = File.objects.filter(user=request.user)
        
        # Aggregate stats
        stats = user_files.aggregate(
            total_storage=Sum('size'),
            total_files=Count('id')
        )
        
        # Get recent uploads
        recent = user_files.order_by('-created_at')[:5]
        recent_serializer = FileSerializer(recent, many=True)
        
        # Usage by category
        usage_by_category = user_files.values('category').annotate(
            total_size=Sum('size'),
            count=Count('id')
        )
        
        return Response({
            'total_storage': stats['total_storage'] or 0,
            'total_files': stats['total_files'] or 0,
            'recent_uploads': recent_serializer.data,
            'usage_by_category': usage_by_category
        })

class StorageStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Physical Disk Stats (Host)
        # Use /data if available, else current directory for fallback
        disk_path = "/data" 
        disk_stats = get_storage_stats(disk_path)

        # User Quota Stats
        user = request.user
        user_used_bytes = File.objects.filter(user=user).aggregate(total=Sum('size'))['total'] or 0
        user_quota_bytes = user.storage_quota_gb * 1024 * 1024 * 1024
        
        return Response({
            "disk": disk_stats,
            "quota": {
                "total_gb": user.storage_quota_gb,
                "used_bytes": user_used_bytes,
                "remaining_bytes": max(0, user_quota_bytes - user_used_bytes),
                "used_percent": round((user_used_bytes / user_quota_bytes) * 100, 2) if user_quota_bytes > 0 else 0
            }
        })

# --- Chunked Upload Views ---
from .models import ChunkedUpload
import os

class ChunkedUploadInitView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        filename = request.data.get('filename')
        file_size = request.data.get('file_size') # Total size
        mime_type = request.data.get('mime_type')
        
        if not filename or not file_size:
            raise ValidationError("filename and file_size are required")
            
        upload = ChunkedUpload.objects.create(
            user=request.user,
            filename=filename,
            file_size=file_size,
            mime_type=mime_type,
            status='INIT'
        )
        
        # Ensure temp dir exists
        temp_dir = os.path.join(settings.MEDIA_ROOT, 'chunk_uploads', str(upload.upload_id))
        os.makedirs(temp_dir, exist_ok=True)
        
        return Response({'upload_id': upload.upload_id})

class ChunkedUploadChunkView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, upload_id):
        upload = get_object_or_404(ChunkedUpload, upload_id=upload_id, user=request.user)
        
        chunk = request.FILES.get('file')
        chunk_index = request.data.get('chunk_index') # 0-based index
        
        if not chunk or chunk_index is None:
             raise ValidationError("file and chunk_index are required")
             
        # Save chunk
        temp_dir = os.path.join(settings.MEDIA_ROOT, 'chunk_uploads', str(upload_id))
        chunk_path = os.path.join(temp_dir, str(chunk_index))
        
        with open(chunk_path, 'wb+') as destination:
            for c in chunk.chunks():
                destination.write(c)
                
        return Response({'status': 'received'})

class ChunkedUploadCompleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, upload_id):
        upload = get_object_or_404(ChunkedUpload, upload_id=upload_id, user=request.user)
        
        # Assemble
        temp_dir = os.path.join(settings.MEDIA_ROOT, 'chunk_uploads', str(upload_id))
        if not os.path.exists(temp_dir):
            raise ValidationError("Upload session not found or expired")
            
        chunks = sorted([int(f) for f in os.listdir(temp_dir)])
        if not chunks:
             raise ValidationError("No chunks found")
             
        # Create final file
        from django.core.files.base import ContentFile
        
        # We need to reuse the File creation logic (with versioning! and quota!)
        # So we can fake a request to FileListCreateView or just reuse the logic.
        # Reusing logic is better.
        
        # 1. Assemble to a single temp file
        final_temp_path = os.path.join(temp_dir, 'final_assembly')
        with open(final_temp_path, 'wb') as final_file:
            for i in chunks:
                chunk_path = os.path.join(temp_dir, str(i))
                with open(chunk_path, 'rb') as cf:
                    final_file.write(cf.read())
        
        # 2. Check Quota (again)
        # ... logic reused ...
        
        # 3. Create File Object
        file_obj = None
        with open(final_temp_path, 'rb') as f:
             # Create a valid Django File object
             content = ContentFile(f.read(), name=upload.filename)
             
             # Re-use serialization logic to handle versioning/collisions properly?
             # Or just manual creation.
             # Let's verify collision
             
             # Call helper or inline logic
             # Inline logic for MVP to ensure it works
             
             # Metadata Handling
             metadata = request.data.get('metadata')
             if isinstance(metadata, str):
                 import json
                 try:
                     metadata = json.loads(metadata)
                 except:
                     metadata = {}
             
             file_instance = File(
                 user=request.user,
                 name=upload.filename,
                 size=upload.file_size,
                 mime_type=upload.mime_type,
                 metadata=metadata or {}, 
             )
             
             # Categorization logic (re-use?)
             if upload.mime_type and upload.mime_type.startswith('image/'):
                 file_instance.file_type = 'PHOTO'
                 file_instance.category = 'PHOTO'
             elif upload.mime_type and upload.mime_type.startswith('video/'):
                 file_instance.file_type = 'VIDEO'
                 file_instance.category = 'VIDEO'
                 
             # Parent ID
             parent_id = request.data.get('parent_id')
             if parent_id and parent_id != 'root':
                 file_instance.parent_id = parent_id
             
             # VERSIONING HANDLER
             existing = File.objects.filter(user=request.user, parent_id=file_instance.parent_id, name=upload.filename, is_folder=False).first()
             if existing:
                  from .models import FileVersion
                  # Archive logic
                  if existing.file:
                      last_v = existing.versions.first()
                      next_v = (last_v.version_number + 1) if last_v else 1
                      with existing.file.open('rb') as old_f:
                           fv = FileVersion(
                               file_item=existing,
                               version_number=next_v,
                               size=existing.size
                           )
                           fv.file.save(existing.name, ContentFile(old_f.read()))
                           fv.save()
                  file_instance = existing # Update existing
                  file_instance.size = upload.file_size
                  file_instance.mime_type = upload.mime_type
                  if metadata:
                      file_instance.metadata = metadata
                  
             
             # Save main file
             file_instance.file.save(upload.filename, content)
             file_instance.save()
             file_obj = file_instance

        # Cleanup
        import shutil
        shutil.rmtree(temp_dir)
        
        upload.status = 'COMPLETED'
        upload.completed_file = file_obj
        upload.save()
        
        return Response(FileSerializer(file_obj).data)