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
        theme = request.session.get('theme')
    return {
        'user_theme': theme
    }

def user_theme_is_dark(request):
    if request.user.is_authenticated:
        user = CustomUser.objects.get(id=request.user.id)
        is_dark = UserThemes.is_dark(user.theme)
    else:
        theme = request.session.get('theme', 'classic')
        is_dark = UserThemes.is_dark(UserThemes.to_int(theme))
    return {
        'is_dark': is_dark
    }
