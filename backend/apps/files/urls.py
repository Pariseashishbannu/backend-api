from django.urls import path
from .views import FileListCreateView, FileDetailView, FileDownloadView, FileStatsView, StorageStatsView, ChunkedUploadInitView, ChunkedUploadChunkView, ChunkedUploadCompleteView

urlpatterns = [
    path('', FileListCreateView.as_view(), name='file-list-create'),
    path('<uuid:pk>/', FileDetailView.as_view(), name='file-detail'),
    path('<uuid:pk>/download/', FileDownloadView.as_view(), name='file-download'),
    path('stats/', FileStatsView.as_view(), name='file-stats'),
    path('storage/stats/', StorageStatsView.as_view(), name='storage-stats'),
    
    # Chunked Uploads
    path('upload/init/', ChunkedUploadInitView.as_view(), name='upload-init'),
    path('upload/chunk/<uuid:upload_id>/', ChunkedUploadChunkView.as_view(), name='upload-chunk'),
    path('upload/complete/<uuid:upload_id>/', ChunkedUploadCompleteView.as_view(), name='upload-complete'),
]
