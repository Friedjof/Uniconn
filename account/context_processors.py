from django.conf import settings

def min_password_length(request):
    return {
        'min_password_length': settings.MIN_PASSWORD_LENGTH,
    }

def recapture_enabled(request):
    return {
        'recapture_enabled': settings.RECAPTURE_ENABLED,
    }