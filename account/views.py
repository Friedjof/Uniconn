import re

from django.shortcuts import render, redirect
from django.views.generic import TemplateView
from django.contrib.auth import authenticate, login, logout

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .forms import RegisterForm, LoginForm, VerifyForm, VerifyEmailForm, ThemeForm
from .models import CustomUser, UserRole, EmailVerification, UserThemes
from .mixins import (
    GuestOrUnauthenticatedMixin, 
    AuthenticationRequiredMixin, 
    EmailVerificationRequiredMixin,
    RoomRequiredMixin
)
from room.models import Room


def index_view(request):
    if not request.user.is_authenticated:
        return redirect('account:login')
    return redirect('account:login')


def logout_view(request):
    if request.user.is_authenticated:
        logout(request)
    return redirect('account:login')


@api_view(['POST'])
def set_theme(request):
    theme = request.data.get('theme')
    if theme and UserThemes.has_value(theme):
        if request.user.is_authenticated:
            user: CustomUser = CustomUser.objects.get(id=request.user.id)
            user.theme = UserThemes.to_int(theme)
            user.save()
            return Response({'message': 'Theme updated successfully', 'isDark': UserThemes.is_dark(UserThemes.to_int(theme))}, status=status.HTTP_200_OK)
        else:
            request.session['theme'] = theme
            return Response({'message': 'Theme saved in session', 'isDark': UserThemes.is_dark(UserThemes.to_int(theme))}, status=status.HTTP_200_OK)
    return Response({'error': 'Invalid theme'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def get_theme(request):
    theme = "classic"
    if request.user.is_authenticated:
        user: CustomUser = CustomUser.objects.get(id=request.user.id)
        theme = UserThemes(user.theme).label
    else:
        theme = request.session.get('theme', 'classic')
    return Response({'theme': theme, 'isDark': UserThemes.is_dark(UserThemes.to_int(theme))}, status=status.HTTP_200_OK)


class LoginView(GuestOrUnauthenticatedMixin, TemplateView):
    template_name = 'login.html'

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


class RegisterView(GuestOrUnauthenticatedMixin, TemplateView):
    template_name = 'register.html'

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


class VerifyEmailView(AuthenticationRequiredMixin, TemplateView):
    template_name = 'verify_email.html'

    def dispatch(self, request, *args, **kwargs):
        # Erst Authentifizierung prüfen (durch Mixin)
        if not request.user.is_authenticated:
            return redirect('account:login')
        
        user: CustomUser = CustomUser.objects.get(id=request.user.id)
        
        # Check for verification code in URL first (before checking if already verified)
        verification_code = request.GET.get('code')
        if verification_code and re.match(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', verification_code):
            try:
                email_verification = EmailVerification.objects.get(verification_code=verification_code)
                if email_verification.verify_user(user, verification_code):
                    return redirect('room:select_room')
                else:
                    return redirect('account:email_verification')
            except EmailVerification.DoesNotExist:
                return redirect('account:email_verification')
        
        # If email is already verified, redirect based on current status
        if user.email_is_verified():
            if not Room.objects.filter(tenants=request.user).exists():
                return redirect('room:select_room')
            elif user.tenant_is_verified():
                return redirect('homepage:index')
            else:
                return redirect('account:verify')

        return super().dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form'] = VerifyEmailForm()
        return context

    def post(self, request, *args, **kwargs):
        form = VerifyEmailForm(self.request.POST)
        if form.is_valid():
            email_code = form.cleaned_data.get('code')
            user: CustomUser = CustomUser.objects.get(id=self.request.user.id)
            try:
                email_verification = EmailVerification.objects.get(verification_code=email_code)
                if email_verification.verify_user(user, email_code):
                    return redirect('room:select_room')
                else:
                    form.add_error('code', 'Invalid verification code')
            except EmailVerification.DoesNotExist:
                form.add_error('code', 'Invalid verification code')

        return render(self.request, self.template_name, {'form': form})


class VerifyView(RoomRequiredMixin, TemplateView):
    template_name = 'verify.html'

    def dispatch(self, request, *args, **kwargs):
        # Erst die Basis-Validierungen (Auth, Email, Room) durch Mixin
        response = super().dispatch(request, *args, **kwargs)
        if response:
            return response
        
        user: CustomUser = CustomUser.objects.get(id=request.user.id)
        if user.tenant_is_verified():
            return redirect('homepage:index')
        
        return super(RoomRequiredMixin, self).dispatch(request, *args, **kwargs)

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
