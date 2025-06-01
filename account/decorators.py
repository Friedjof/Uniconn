from functools import wraps
from django.shortcuts import redirect
from .models import CustomUser
from room.models import Room


def authentication_required(view_func):
    """Decorator für Function-Based Views - Authentifizierung erforderlich."""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('account:login')
        return view_func(request, *args, **kwargs)
    return wrapper


def email_verification_required(view_func):
    """Decorator für Function-Based Views - E-Mail-Verifizierung erforderlich."""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('account:login')
        
        user: CustomUser = CustomUser.objects.get(id=request.user.id)
        if not user.email_is_verified():
            return redirect('account:email_verification')
        
        return view_func(request, *args, **kwargs)
    return wrapper


def full_verification_required(view_func):
    """Decorator für Function-Based Views - Vollständige Verifizierung erforderlich."""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('account:login')
        
        user: CustomUser = CustomUser.objects.get(id=request.user.id)
        if not user.email_is_verified():
            return redirect('account:email_verification')
        
        if not Room.objects.filter(tenants=request.user).exists():
            return redirect('room:select_room')
        
        if not user.tenant_is_verified():
            return redirect('account:verify')
        
        return view_func(request, *args, **kwargs)
    return wrapper


def guest_or_unauthenticated_required(view_func):
    """Decorator für Function-Based Views - Nur für Gäste/nicht authentifizierte Benutzer."""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if request.user.is_authenticated:
            user: CustomUser = CustomUser.objects.get(id=request.user.id)
            if not user.email_is_verified():
                return redirect('account:email_verification')
            if not Room.objects.filter(tenants=request.user).exists():
                return redirect('room:select_room')
            if not user.tenant_is_verified():
                return redirect('account:verify')
            return redirect('homepage:index')
        
        return view_func(request, *args, **kwargs)
    return wrapper
