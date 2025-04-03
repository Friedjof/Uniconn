from django.conf import settings

from .models import UserThemes, CustomUser

def min_password_length(request):
    return {
        'min_password_length': settings.MIN_PASSWORD_LENGTH,
    }

def user_theme(request):
    if request.user.is_authenticated:
        user = CustomUser.objects.get(id=request.user.id)
        theme = UserThemes(user.theme).label
    else:
        theme = UserThemes.CLASSIC.label
    return {
        'user_theme': theme
    }
