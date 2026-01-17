from django.urls import path
from .views import SecretListCreateView, SecretDetailView

urlpatterns = [
    path('', SecretListCreateView.as_view(), name='secret-list-create'),
    path('<uuid:pk>/', SecretDetailView.as_view(), name='secret-detail'),
]
