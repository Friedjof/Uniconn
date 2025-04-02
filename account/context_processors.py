from django.conf import settings

def min_password_length(request):
    return {
        'min_password_length': settings.MIN_PASSWORD_LENGTH,
    }
