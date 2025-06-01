from django.shortcuts import redirect
from django.contrib.auth.mixins import AccessMixin
from .models import CustomUser
from room.models import Room


class AuthenticationRequiredMixin(AccessMixin):
    """Mixin that ensures user is authenticated."""
    
    def dispatch(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('account:login')
        return super().dispatch(request, *args, **kwargs)


class EmailVerificationRequiredMixin(AccessMixin):
    """Mixin that ensures user's email is verified."""
    
    def dispatch(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('account:login')
        
        user: CustomUser = CustomUser.objects.get(id=request.user.id)
        if user.email_is_verified():
            return redirect('room:select_room')
        
        return super().dispatch(request, *args, **kwargs)


class TenantVerificationRequiredMixin(AccessMixin):
    """Mixin that ensures user is tenant verified."""
    
    def dispatch(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('account:login')
        
        user: CustomUser = CustomUser.objects.get(id=request.user.id)
        if not user.email_is_verified():
            return redirect('account:email_verification')
        
        if not user.tenant_is_verified():
            return redirect('account:verify')
        
        return super().dispatch(request, *args, **kwargs)


class RoomRequiredMixin(AccessMixin):
    """Mixin that ensures user has a room assigned."""
    
    def dispatch(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('account:login')
        
        user: CustomUser = CustomUser.objects.get(id=request.user.id)
        if not user.email_is_verified():
            return redirect('account:email_verification')
        
        if not Room.objects.filter(tenants=request.user).exists():
            return redirect('room:select_room')
        
        if user.tenant_is_verified():
            return redirect('homepage:index')
        
        return super().dispatch(request, *args, **kwargs)


class FullVerificationRequiredMixin(AccessMixin):
    """Mixin that ensures user is fully verified (authenticated, email verified, tenant verified)."""
    
    def dispatch(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('account:login')
        
        user: CustomUser = CustomUser.objects.get(id=request.user.id)
        if not user.email_is_verified():
            return redirect('account:email_verification')
        
        if not Room.objects.filter(tenants=request.user).exists():
            return redirect('room:select_room')
        
        if not user.tenant_is_verified():
            return redirect('account:verify')
        
        return super().dispatch(request, *args, **kwargs)


class NoRoomRequiredMixin(AccessMixin):
    """Mixin that ensures user does NOT have a room (for room selection)."""
    
    def dispatch(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('account:login')
        
        user: CustomUser = CustomUser.objects.get(id=request.user.id)
        if not user.email_is_verified():
            return redirect('account:email_verification')
        
        # If user already has a room, redirect based on verification status
        if Room.objects.filter(tenants=request.user).exists():
            if user.tenant_is_verified():
                return redirect('homepage:index')
            else:
                return redirect('account:verify')
        
        return super().dispatch(request, *args, **kwargs)


class GuestOrUnauthenticatedMixin(AccessMixin):
    """Mixin that redirects authenticated and verified users away."""
    
    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            user: CustomUser = CustomUser.objects.get(id=request.user.id)
            
            # Check email verification first
            if not user.email_is_verified():
                return redirect('account:email_verification')
            
            # Check room assignment
            if not Room.objects.filter(tenants=request.user).exists():
                return redirect('room:select_room')
            
            # Check tenant verification
            if not user.tenant_is_verified():
                return redirect('account:verify')
            
            # User is fully verified, redirect to homepage
            return redirect('homepage:index')
        
        return super().dispatch(request, *args, **kwargs)
