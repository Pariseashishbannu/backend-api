from django.urls import path
from .views import UserProfileView, RegisterView
from .social_views import SocialLoginView

urlpatterns = [
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('register/', RegisterView.as_view(), name='register'),
    path('social/', SocialLoginView.as_view(), name='social-login'),
]
