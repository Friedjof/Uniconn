from django.shortcuts import render, redirect
from django.views.generic import TemplateView

from account.models import CustomUser, UserRole
from account.mixins import FullVerificationRequiredMixin


class HomePageView(FullVerificationRequiredMixin, TemplateView):
    template_name = 'homepage.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context
