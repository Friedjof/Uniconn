from django.shortcuts import render, redirect
from django.views.generic import TemplateView
from django.db.models import Count, Exists, OuterRef

from account.models import CustomUser, UserRole, EmailVerification
from django.contrib.auth import get_user_model
from django.db.models import Q
from account.mixins import FullVerificationRequiredMixin
from room.models import Room
from chat.models import Chat


class HomePageView(FullVerificationRequiredMixin, TemplateView):
    template_name = 'homepage.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Add platform statistics to homepage
        context['stats'] = self._get_platform_stats()
        return context

    def _get_platform_stats(self):
        """Get platform-wide statistics"""
        User = get_user_model()
        
        # Get user counts by role
        total_users = User.objects.filter(is_active=True).count()
        
        # Count verified users using the EmailVerification relationship
        verified_users = User.objects.filter(
            is_active=True,
            role__in=[UserRole.VERIFIED, UserRole.ADMIN],
            emailverification__verified=True
        ).distinct().count()
        
        # Get room statistics
        total_rooms = Room.objects.count()
        occupied_rooms = Room.objects.annotate(
            tenant_count=Count('tenants')
        ).filter(tenant_count__gt=0).count()
        
        # Get chat statistics
        active_chats = Chat.objects.filter(status=Chat.Status.ACTIVE).count()
        
        # Calculate verification rate
        verification_rate = round((verified_users / total_users * 100) if total_users > 0 else 0, 1)
        
        return {
            'total_users': total_users,
            'verified_users': verified_users,
            'total_rooms': total_rooms,
            'occupied_rooms': occupied_rooms,
            'active_chats': active_chats,
            'verification_rate': verification_rate,
        }


class SearchResultsView(TemplateView):
    template_name = 'homepage/search_results.html'

    def dispatch(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('account:login')
        user: CustomUser = CustomUser.objects.get(id=request.user.id)
        if not user.email_is_verified():
            return redirect('account:email_verification')
        if not user.tenant_is_verified():
            return redirect('account:verify')
        return super().dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        query = self.request.GET.get('q', '')
        search_chats = self.request.GET.get('search_chats', False)
        search_rooms = self.request.GET.get('search_rooms', False)
        search_users = self.request.GET.get('search_users', False)
        
        # Get platform statistics
        stats = self._get_platform_stats()
        
        results = {
            'query': query,
            'chats': [],
            'rooms': [],
            'users': [],
        }
        
        if query:
            # Search users
            if search_users:
                results['users'] = self._search_users(query)
                
            # Search chats
            if search_chats:
                results['chats'] = self._search_chats(query)
                
            # Search rooms
            if search_rooms:
                results['rooms'] = self._search_rooms(query)
                
        context['results'] = results
        context['stats'] = stats
        return context
    
    def _get_platform_stats(self):
        """Get platform-wide statistics"""
        User = get_user_model()
        
        # Get user counts by role
        total_users = User.objects.filter(is_active=True).count()
        
        # Count verified users using the EmailVerification relationship
        verified_users = User.objects.filter(
            is_active=True,
            role__in=[UserRole.VERIFIED, UserRole.ADMIN],
            emailverification__verified=True
        ).distinct().count()
        
        # Get room statistics
        total_rooms = Room.objects.count()
        occupied_rooms = Room.objects.annotate(
            tenant_count=Count('tenants')
        ).filter(tenant_count__gt=0).count()
        
        # Get chat statistics
        active_chats = Chat.objects.filter(status=Chat.Status.ACTIVE).count()
        
        # Calculate verification rate
        verification_rate = round((verified_users / total_users * 100) if total_users > 0 else 0, 1)
        
        return {
            'total_users': total_users,
            'verified_users': verified_users,
            'total_rooms': total_rooms,
            'occupied_rooms': occupied_rooms,
            'active_chats': active_chats,
            'verification_rate': verification_rate,
        }
    
    def _search_users(self, query):
        """Search for users matching the query"""
        User = get_user_model()
        return User.objects.filter(
            Q(username__icontains=query) | 
            Q(first_name__icontains=query) | 
            Q(last_name__icontains=query)
        )[:10]  # Limit results
    
    def _search_chats(self, query):
        """Search for chats matching the query"""
        # Search chats that the user is part of
        user_chats = Chat.objects.filter(
            users=self.request.user,
            status=Chat.Status.ACTIVE
        )
        # For now, return empty list as we don't have a title field
        # In the future, we could search by participant names or add a title field
        return []
    
    def _search_rooms(self, query):
        """Search for rooms matching the query"""
        return Room.objects.filter(
            Q(room_name__icontains=query) | 
            Q(room_description__icontains=query)
        )[:10]  # Limit results
