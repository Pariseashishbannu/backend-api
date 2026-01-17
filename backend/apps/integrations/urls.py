from django.urls import path
from .views import (
    ICloudLoginView,
    ICloud2FAView,
    ICloud2FAView,
    GoogleAuthURLView,
    GoogleAuthCallbackView,
    ICloudPhotosView,
    ICloudImportView
)

urlpatterns = [
    path('icloud/login/', ICloudLoginView.as_view(), name='icloud-login'),
    path('icloud/verify-2fa/', ICloud2FAView.as_view(), name='icloud-2fa'),
    path('google/auth-url/', GoogleAuthURLView.as_view(), name='google-auth-url'),
    path('google/callback/', GoogleAuthCallbackView.as_view(), name='google-callback'),
    path('icloud/photos/', ICloudPhotosView.as_view(), name='icloud-photos'),
    path('icloud/import/', ICloudImportView.as_view(), name='icloud-import'),
]
