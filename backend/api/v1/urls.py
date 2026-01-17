from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from apps.accounts.views import RegisterView

urlpatterns = [
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('files/', include('apps.files.urls')),
    path('secrets/', include('apps.secrets.urls')),
    path('audit/', include('apps.audit.urls')),
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('integrations/', include('apps.integrations.urls')),
]

