from rest_framework import views, status, permissions
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from .serializers import (
    ICloudLoginSerializer, 
    ICloud2FASerializer,
    GoogleAuthURLSerializer,
    GoogleAuthCallbackSerializer
)
from .services import ICloudManager, GooglePhotosManager, ICLOUD_SESSION_STORE
from .models import IntegrationCredential

class ICloudLoginView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ICloudLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        try:
            result = ICloudManager.login(request.user.id, data['apple_id'], data['password'])
            
            if result['requires_2fa']:
                return Response({
                    'status': '2fa_required',
                    'message': 'Please enter the 2FA code sent to your devices.'
                }, status=status.HTTP_200_OK)
            else:
                # Login successful without 2FA (rare, but possible for trusted sessions)
                # Save credential
                IntegrationCredential.objects.update_or_create(
                    user=request.user,
                    provider='icloud',
                    defaults={'is_active': True}
                )
                return Response({'status': 'connected'}, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ICloud2FAView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ICloud2FASerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        code = serializer.validated_data['code']
        try:
            api = ICloudManager.verify_2fa(request.user.id, code)
            
            # Save credential (pseudo)
            IntegrationCredential.objects.update_or_create(
                user=request.user,
                provider='icloud',
                defaults={'is_active': True}
            )
            return Response({'status': 'connected'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class GoogleAuthURLView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Generate OAuth URL
        # For layout demo:
        url = "https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=MOCK_CLIENT_ID&redirect_uri=http://localhost:3000/dashboard/import/google-callback&scope=https://www.googleapis.com/auth/photoslibrary.readonly"
        return Response({'url': url})

class GoogleAuthCallbackView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = GoogleAuthCallbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Determine success mock
        IntegrationCredential.objects.update_or_create(
            user=request.user,
            provider='google',
            defaults={'is_active': True}
        )
        return Response({'status': 'connected'})

class ICloudPhotosView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            photos = ICloudManager.scan_photos(request.user.id)
            return Response({'photos': photos})
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': 'Failed to scan photos', 'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ICloudImportView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        photo_ids = request.data.get('photo_ids', [])
        if not photo_ids:
            return Response({'error': 'No photos selected'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            count = ICloudManager.import_photos(request.user.id, photo_ids)
            return Response({'status': 'success', 'imported_count': count})
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': 'Import failed', 'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
