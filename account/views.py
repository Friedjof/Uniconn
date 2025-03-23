from django.shortcuts import render
from django.views.generic import TemplateView

from .forms import RegisterForm, LoginForm, VerifyForm


# Create your views here.
class LoginView(TemplateView):
    template_name = 'login.html'

class RegisterView(TemplateView):
    template_name = 'register.html'

class VerifyView(TemplateView):
    template_name = 'verify.html'
