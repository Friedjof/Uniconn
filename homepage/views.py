from django.shortcuts import render, redirect
from django.views.generic import TemplateView

from account.models import CustomUser, UserRole


class HomePageView(TemplateView):
    template_name = 'homepage.html'

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
        return context
