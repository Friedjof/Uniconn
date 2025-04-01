from django.shortcuts import render, redirect
from django.views.generic import TemplateView

from .forms import RegisterForm, LoginForm, VerifyForm


def index_view(request):
    if not request.user.is_authenticated:
        return redirect('account:login')
    return redirect('account:login')

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
