import re
import typing

from django import forms
from django.conf import settings

from .models import CustomUser


class RegisterForm(forms.Form):
    username = forms.CharField(
        max_length=100,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Username'})
    )
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'E-Mail'})
    )
    password = forms.CharField(
        max_length=100,
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Password'})
    )
    confirm_password = forms.CharField(
        max_length=100,
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Confirm Password'})
    )
    terms_of_service = forms.BooleanField(
        required=True,
        label='I agree to the',
        label_suffix='',
        widget=forms.CheckboxInput(attrs={'class': 'form-check-input'})
    )
    privacy_policy = forms.BooleanField(
        required=True,
        label='I agree to the',
        label_suffix='',
        widget=forms.CheckboxInput(attrs={'class': 'form-check-input'})
    )

    def clean_password(self):
        password = self.cleaned_data.get('password')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            raise forms.ValidationError('Password must contain at least one special character.')
        if not re.search(r'[A-Z]', password):
            raise forms.ValidationError('Password must contain at least one uppercase letter.')
        if not re.search(r'[0-9]', password):
            raise forms.ValidationError('Password must contain at least one digit.')
        if len(password) < settings.MIN_PASSWORD_LENGTH:
            raise forms.ValidationError('Password must be at least 16 characters long.')
        return password

    def clean_username(self):
        username = self.cleaned_data.get('username')
        if not re.match(r'^[a-zA-Z0-9_.-]+$', username):
            raise forms.ValidationError('Username can only contain letters, numbers, underscores, and hyphens.')
        if CustomUser.objects.filter(username=username).exists():
            raise forms.ValidationError('Username already exists.')
        return username

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if not re.match(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$', email):
            raise forms.ValidationError('Invalid email address.')
        if CustomUser.objects.filter(email=email).exists():
            raise forms.ValidationError('This email address is already registered.')
        return email

    def clean_terms_of_service(self):
        terms_of_service = self.cleaned_data.get('terms_of_service')
        if not terms_of_service:
            raise forms.ValidationError('You must agree to the terms of service.')
        return terms_of_service

    def clean_privacy_policy(self):
        privacy_policy = self.cleaned_data.get('privacy_policy')
        if not privacy_policy:
            raise forms.ValidationError('You must agree to the privacy policy.')
        return privacy_policy

    def clean(self):
        cleaned_data = super().clean()
        password = self.cleaned_data.get('password')
        confirm_password = self.cleaned_data.get('confirm_password')
        if password and confirm_password and password != confirm_password:
            raise forms.ValidationError('Passwords do not match.')
        return cleaned_data

    def save(self, commit=True) -> CustomUser:
        user = CustomUser(
            username=self.cleaned_data['username'],
            email=self.cleaned_data['email']
        )
        user.set_password(self.cleaned_data['password'])
        if commit:
            user.save()
        return user


class LoginForm(forms.Form):
    email_or_username = forms.CharField(
        max_length=100,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'E-Mail or Username'})
    )

    password = forms.CharField(
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Password'})
    )

    def clean_email_or_username(self):
        email_or_username = self.cleaned_data.get('email_or_username')
        if not CustomUser.objects.filter(username=email_or_username).exists() and not CustomUser.objects.filter(email=email_or_username).exists():
            raise forms.ValidationError('Username or email address does not exist.')
        return email_or_username

    def clean(self):
        cleaned_data = super().clean()
        user: CustomUser = CustomUser.objects.filter(
            username=cleaned_data.get('email_or_username')
        ).first() or CustomUser.objects.filter(
            email=cleaned_data.get('email_or_username')
        ).first()
        if user and not user.check_password(cleaned_data.get('password')):
            raise forms.ValidationError('Incorrect password.')
        if user and not user.is_active:
            raise forms.ValidationError('This account is inactive.')
        return cleaned_data

    def get_user(self) -> typing.Optional[CustomUser]:
        email_or_username = self.cleaned_data.get('email_or_username')
        user = CustomUser.objects.filter(username=email_or_username).first() or CustomUser.objects.filter(email=email_or_username).first()
        if user:
            return user
        return None


class VerifyForm(forms.Form):
    code = forms.CharField(max_length=10, widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Verification Code'}))


class VerifyEmailForm(forms.Form):
    code = forms.UUIDField(widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Verification Code'}))

    def clean_code(self):
        code = self.cleaned_data.get('code')
        if not re.match(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', str(code)):
            raise forms.ValidationError('Invalid verification code format.')
        return code
