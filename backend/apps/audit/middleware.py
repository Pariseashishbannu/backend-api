from .models import AuditLog
import json

class AuditMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if request.user.is_authenticated and request.path.startswith('/api/v1/') and request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            # Log the action
            try:
                ip = self.get_client_ip(request)
                action = f"{request.method} {request.path}"
                # Avoid logging sensitive body data securely, maybe just log metadata
                # For now, simplistic logging
                
                AuditLog.objects.create(
                    user=request.user,
                    action=action,
                    ip_address=ip,
                    details={'status_code': response.status_code}
                )
            except Exception as e:
                # Fail silently to avoid breaking the request
                print(f"Audit log error: {e}")

        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
