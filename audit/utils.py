from .models import AccessLog

def log_access(user, action, request=None, details=''):
    ip = None
    if request:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
    
    AccessLog.objects.create(
        user=user if user.is_authenticated else None,
        action=action,
        ip_address=ip,
        details=details
    )
