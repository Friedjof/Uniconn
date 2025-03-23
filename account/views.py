from django.shortcuts import render
from django.views.generic import TemplateView

from .forms import RegisterForm, LoginForm, VerifyForm


# Create your views here.
class LoginView(TemplateView):
    template_name = 'login.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form'] = LoginForm()
        return context

class RegisterView(TemplateView):
    template_name = 'register.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form'] = RegisterForm()
        return context

class VerifyView(TemplateView):
    template_name = 'verify.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form'] = VerifyForm()
        return context
