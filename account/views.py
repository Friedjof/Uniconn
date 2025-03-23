from django.shortcuts import render
from django.views.generic import TemplateView

from .forms import RegisterForm, LoginForm, VerifyForm


# Create your views here.
class LoginView(TemplateView):
    template_name = 'account/login.html'

class RegisterView(TemplateView):
    template_name = 'account/register.html'

class VerifyView(TemplateView):
    template_name = 'account/verify.html'
