from django.shortcuts import render, redirect
from django.views.generic import TemplateView

from account.models import CustomUser, UserRole
from django.contrib.auth import get_user_model
from django.db.models import Q
from account.mixins import FullVerificationRequiredMixin


class HomePageView(FullVerificationRequiredMixin, TemplateView):
    template_name = 'homepage.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context


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
        return context
    
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
        # Implement chat search logic
        return []
    
    def _search_rooms(self, query):
        """Search for rooms matching the query"""
        # Implement room search logic
        return []
