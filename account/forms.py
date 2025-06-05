import re
import typing

from django import forms
from django.conf import settings
from django.utils.translation import gettext_lazy as _

from .models import CustomUser, UserThemes


class RegisterForm(forms.Form):
    username = forms.CharField(
        max_length=100,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': _('Username')})
    )
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={'class': 'form-control', 'placeholder': _('E-Mail')})
    )
    password = forms.CharField(
        max_length=100,
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': _('Password')})
    )
    confirm_password = forms.CharField(
        max_length=100,
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': _('Confirm Password')})
    )
    terms_of_service = forms.BooleanField(
        required=True,
        label=_('I agree to the'),
        label_suffix='',
        widget=forms.CheckboxInput(attrs={'class': 'form-check-input'})
    )
    privacy_policy = forms.BooleanField(
        required=True,
        label=_('I agree to the'),
        label_suffix='',
        widget=forms.CheckboxInput(attrs={'class': 'form-check-input'})
    )

    def clean_password(self):
        password = self.cleaned_data.get('password')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            raise forms.ValidationError(_('Password must contain at least one special character.'))
        if not re.search(r'[A-Z]', password):
            raise forms.ValidationError(_('Password must contain at least one uppercase letter.'))
        if not re.search(r'[0-9]', password):
            raise forms.ValidationError(_('Password must contain at least one digit.'))
        if len(password) < settings.MIN_PASSWORD_LENGTH:
            raise forms.ValidationError(_('Password must be at least 16 characters long.'))
        return password

    def clean_username(self):
        username = self.cleaned_data.get('username')
        if not re.match(r'^[a-zA-Z0-9_.-]+$', username):
            raise forms.ValidationError(_('Username can only contain letters, numbers, underscores, and hyphens.'))
        if CustomUser.objects.filter(username=username).exists():
            raise forms.ValidationError(_('Username already exists.'))
        return username

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if not re.match(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$', email):
            raise forms.ValidationError(_('Invalid email address.'))
        if CustomUser.objects.filter(email=email).exists():
            raise forms.ValidationError(_('This email address is already registered.'))
        return email

    def clean_terms_of_service(self):
        terms_of_service = self.cleaned_data.get('terms_of_service')
        if not terms_of_service:
            raise forms.ValidationError(_('You must agree to the terms of service.'))
        return terms_of_service

    def clean_privacy_policy(self):
        privacy_policy = self.cleaned_data.get('privacy_policy')
        if not privacy_policy:
            raise forms.ValidationError(_('You must agree to the privacy policy.'))
        return privacy_policy

    def clean(self):
        cleaned_data = super().clean()
        password = self.cleaned_data.get('password')
        confirm_password = self.cleaned_data.get('confirm_password')
        if password and confirm_password and password != confirm_password:
            raise forms.ValidationError(_('Passwords do not match.'))
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
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': _('E-Mail or Username')})
    )

    password = forms.CharField(
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': _('Password')})
    )

    def clean_email_or_username(self):
        email_or_username = self.cleaned_data.get('email_or_username')
        if not CustomUser.objects.filter(username=email_or_username).exists() and not CustomUser.objects.filter(email=email_or_username).exists():
            raise forms.ValidationError(_('Username or email address does not exist.'))
        return email_or_username

    def clean(self):
        cleaned_data = super().clean()
        user: CustomUser = CustomUser.objects.filter(
            username=cleaned_data.get('email_or_username')
        ).first() or CustomUser.objects.filter(
            email=cleaned_data.get('email_or_username')
        ).first()
        if user and not user.check_password(cleaned_data.get('password')):
            raise forms.ValidationError(_('Incorrect password.'))
        if user and not user.is_active:
            raise forms.ValidationError(_('This account is inactive.'))
        return cleaned_data

    def get_user(self) -> typing.Optional[CustomUser]:
        email_or_username = self.cleaned_data.get('email_or_username')
        user = CustomUser.objects.filter(username=email_or_username).first() or CustomUser.objects.filter(email=email_or_username).first()
        if user:
            return user
        return None


class VerifyForm(forms.Form):
    code = forms.CharField(max_length=10, widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': _('Verification Code')}))


class VerifyEmailForm(forms.Form):
    code = forms.UUIDField(widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': _('Verification Code')}))


class ThemeForm(forms.Form):
    theme = forms.ChoiceField(
        choices=UserThemes.choices,
        widget=forms.Select(attrs={'class': 'form-select'})
    )

    def clean_theme(self):
        theme = self.cleaned_data.get('theme')
        if not UserThemes.has_value(theme):
            raise forms.ValidationError(_('Invalid theme selected.'))
        return theme


class ProfileForm(forms.ModelForm):
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={'class': 'form-control', 'readonly': True}),
        disabled=True
    )
    
    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'first_name', 'last_name', 'bio']
        widgets = {
            'username': forms.TextInput(attrs={'class': 'form-control'}),
            'first_name': forms.TextInput(attrs={'class': 'form-control'}),
            'last_name': forms.TextInput(attrs={'class': 'form-control'}),
            'bio': forms.Textarea(attrs={'class': 'form-control', 'rows': 4, 'placeholder': _('Tell us about yourself...')}),
        }

    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        # Make email field read-only
        self.fields['email'].widget.attrs.update({'readonly': True})
        self.fields['email'].disabled = True

    def clean_username(self):
        username = self.cleaned_data.get('username')
        if not re.match(r'^[a-zA-Z0-9_.-]+$', username):
            raise forms.ValidationError(_('Username can only contain letters, numbers, underscores, and hyphens.'))
        if CustomUser.objects.filter(username=username).exclude(pk=self.user.pk).exists():
            raise forms.ValidationError(_('Username already exists.'))
        return username

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if not re.match(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$', email):
            raise forms.ValidationError(_('Invalid email address.'))
        if CustomUser.objects.filter(email=email).exclude(pk=self.user.pk).exists():
            raise forms.ValidationError(_('This email address is already in use.'))
        return email


class PasswordChangeForm(forms.Form):
    current_password = forms.CharField(
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': _('Current Password')})
    )
    new_password = forms.CharField(
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': _('New Password')})
    )
    confirm_password = forms.CharField(
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': _('Confirm New Password')})
    )

    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)

    def clean_current_password(self):
        current_password = self.cleaned_data.get('current_password')
        if self.user and not self.user.check_password(current_password):
            raise forms.ValidationError(_('Current password is incorrect.'))
        return current_password

    def clean_new_password(self):
        new_password = self.cleaned_data.get('new_password')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', new_password):
            raise forms.ValidationError(_('Password must contain at least one special character.'))
        if not re.search(r'[A-Z]', new_password):
            raise forms.ValidationError(_('Password must contain at least one uppercase letter.'))
        if not re.search(r'[0-9]', new_password):
            raise forms.ValidationError(_('Password must contain at least one digit.'))
        if len(new_password) < settings.MIN_PASSWORD_LENGTH:
            raise forms.ValidationError(_('Password must be at least 16 characters long.'))
        return new_password

    def clean(self):
        cleaned_data = super().clean()
        new_password = self.cleaned_data.get('new_password')
        confirm_password = self.cleaned_data.get('confirm_password')
        if new_password and confirm_password and new_password != confirm_password:
            raise forms.ValidationError(_('Passwords do not match.'))
        return cleaned_data
