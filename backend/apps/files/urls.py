from django.urls import path
from .views import FileListCreateView, FileDetailView, FileDownloadView

urlpatterns = [
    path('', FileListCreateView.as_view(), name='file-list-create'),
    path('<uuid:pk>/', FileDetailView.as_view(), name='file-detail'),
    path('<uuid:pk>/download/', FileDownloadView.as_view(), name='file-download'),
]
