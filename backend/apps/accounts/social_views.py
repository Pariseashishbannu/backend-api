from rest_framework import views, status, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import SocialLoginSerializer
import requests
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

User = get_user_model()

class SocialLoginView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SocialLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token = serializer.validated_data['token']
        provider = serializer.validated_data['provider']
        
        email = None
        first_name = ""
        last_name = ""
        
        try:
            if provider == 'google':
                # Verify Google Token
                # Note: In production, pass CLIENT_ID as second argument
                id_info = id_token.verify_oauth2_token(token, google_requests.Request())
                email = id_info.get('email')
                first_name = id_info.get('given_name', '')
                last_name = id_info.get('family_name', '')
                
            elif provider == 'apple':
                # Placeholder for Apple Token Verification
                # Takes more setup (public keys, audience check)
                # For prototype, we might assume it's valid or decode purely payload if not verifying signature locally
                # WARNING: INSECURE FOR PRODUCTION. Must verify against Apple's keys.
                import jwt
                decoded = jwt.decode(token, options={"verify_signature": False})
                email = decoded.get('email')
                # Apple only sends name on first login, logic needs to handle that or receive it separately
                
            if not email:
                return Response({'error': 'Invalid token: Email not found'}, status=status.HTTP_400_BAD_REQUEST)

            # Get or Create User
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email, # Fallback username
                    'first_name': first_name,
                    'last_name': last_name
                }
            )
            
            # Generate JWT
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'email': user.email,
                    'name': f"{user.first_name} {user.last_name}".strip() or user.username
                }
            })

        except ValueError as e:
             return Response({'error': f'Invalid token: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
             return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
