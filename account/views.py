from django.shortcuts import render, redirect
from django.views.generic import TemplateView
from django.contrib.auth import authenticate, login, logout
from django.db import models

from .forms import RegisterForm, LoginForm, VerifyForm
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
            if user.role <= UserRole.USER:
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
            login_form_user: CustomUser = CustomUser.objects.filter(
                models.Q(username=form.cleaned_data.get('email_or_username')) |
                models.Q(email=form.cleaned_data.get('email_or_username'))
            ).first()

            user = authenticate(
                request,
                username=login_form_user.username,
                password=form.cleaned_data.get('password')
            )
            if user is not None:
                login(request, user)
                return redirect('account:verify')
            else:
                form.add_error('email_or_username', 'Invalid username or password')
        return render(request, self.template_name, {'form': form})


class RegisterView(TemplateView):
    template_name = 'register.html'

    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            user: CustomUser = CustomUser.objects.get(id=request.user.id)
            if user.role <= UserRole.USER:
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
            return redirect('account:verify')
        return render(request, self.template_name, {'form': form})


class VerifyEmailView(TemplateView):
    template_name = 'verify_email.html'

    def dispatch(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('account:login')
        user: CustomUser = CustomUser.objects.get(id=request.user.id)
        if user.role > UserRole.USER:
            return redirect('homepage:index')
        return super().dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form'] = VerifyForm()
        return context


class VerifyView(TemplateView):
    template_name = 'verify.html'

    def dispatch(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('account:login')
        user: CustomUser = CustomUser.objects.get(id=request.user.id)
        if user.role > UserRole.USER:
            return redirect('homepage:index')
        return super().dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form'] = VerifyForm()
        return context
