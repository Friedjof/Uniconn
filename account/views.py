import re

from django.shortcuts import render, redirect
from django.views.generic import TemplateView
from django.contrib.auth import authenticate, login, logout
from django.db import models

from .forms import RegisterForm, LoginForm, VerifyForm, VerifyEmailForm
from .models import CustomUser, UserRole, EmailVerification


def index_view(request):
    if not request.user.is_authenticated:
        return redirect('account:login')
    return redirect('account:login')


def logout_view(request):
    if request.user.is_authenticated:
        logout(request)
    return redirect('account:login')


class LoginView(TemplateView):
    template_name = 'login.html'

    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            user: CustomUser = CustomUser.objects.get(id=request.user.id)
            if not user.email_is_verified():
                return redirect('account:email_verification')
            if not user.tenant_is_verified():
                return redirect('account:verify')
            return redirect('homepage:index')
        return super().dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form'] = LoginForm()
        return context

    def post(self, request, *args, **kwargs):
        form = LoginForm(request.POST)
        if form.is_valid():
            user = form.get_user()
            if user:
                login(request, user)
                if not user.email_is_verified():
                    return redirect('account:email_verification')
                if not user.tenant_is_verified():
                   return redirect('account:verify')
                return redirect('homepage:index')
            else:
                form.add_error('email_or_username', 'Invalid email, username or password')
        return render(request, self.template_name, {'form': form})


class RegisterView(TemplateView):
    template_name = 'register.html'

    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            user: CustomUser = CustomUser.objects.get(id=request.user.id)
            if not user.email_is_verified():
                return redirect('account:email_verification')
            if not user.tenant_is_verified():
                return redirect('account:verify')
            return redirect('homepage:index')
        return super().dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form'] = RegisterForm()
        return context

    def post(self, request, *args, **kwargs):
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.role = UserRole.USER
            user.save()
            login(request, user)
            email_verification, _ = EmailVerification.objects.get_or_create(user=user)
            email_verification.send_verification_email()
            return redirect('account:email_verification')
        return render(request, self.template_name, {'form': form})


class VerifyEmailView(TemplateView):
    template_name = 'verify_email.html'

    def dispatch(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('account:login')
        user: CustomUser = CustomUser.objects.get(id=request.user.id)
        if user.email_is_verified() and user.tenant_is_verified():
            return redirect('homepage:index')
        if not user.tenant_is_verified() and user.email_is_verified():
            return redirect('account:verify')

        verification_code = request.GET.get('code')
        if verification_code and re.match(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', verification_code):
            try:
                email_verification = EmailVerification.objects.get(verification_code=verification_code)
                if email_verification.verify_user(user, verification_code):
                    return redirect('homepage:index')
                else:
                    return redirect('account:email_verification')
            except EmailVerification.DoesNotExist:
                return redirect('account:email_verification')

        return super().dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form'] = VerifyEmailForm()
        return context


class VerifyView(TemplateView):
    template_name = 'verify.html'

    def dispatch(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('account:login')
        user: CustomUser = CustomUser.objects.get(id=request.user.id)
        if not user.email_is_verified():
            return redirect('account:email_verification')
        if user.tenant_is_verified():
            return redirect('homepage:index')
        return super().dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form'] = VerifyForm()
        return context

    def post(self, request, *args, **kwargs):
        form = VerifyForm(request.POST)
        if form.is_valid():
            tenant_code = form.cleaned_data.get('code')
            user: CustomUser = CustomUser.objects.get(id=request.user.id)
            if user.verification_code == tenant_code:
                user.role = UserRole.VERIFIED
                user.save()
                return redirect('homepage:index')
            else:
                form.add_error('code', 'Invalid verification code')

        return render(request, self.template_name, {'form': form})
