import typing
import uuid
import logging

from django.contrib.auth.models import AbstractUser
from django.core.mail import send_mail
from django.db import models
from django.conf import settings

from .utils import gen_verification_code

logger = logging.getLogger('django')


class UserRole(models.IntegerChoices):
    INACTIVE = 1, "Inactive"
    GUEST = 2, "Guest"
    USER = 3, "User"
    VERIFIED = 4, "Verified"
    MODERATOR = 5, "Moderator"
    ADMIN = 6, "Admin"


class UserThemes(models.IntegerChoices):
    ROSE_QUARTZ = 1, "rose-quartz"
    ARCTIC_BLUE = 2, "arctic-blue"
    COOL_LAVENDER = 3, "cool-lavender"
    PASTEL_MINT = 4, "pastel-mint"
    LINEN_LIGHT = 5, "linen-light"
    CLASSIC_DARK = 6, "classic-dark"
    MIDNIGHT_BLUE = 7, "midnight-blue"
    CHARCOAL = 8, "charcoal"
    GRAPHITE = 9, "graphite"
    DUSK_MODE = 10, "dusk-mode"
    CLASSIC = 11, "classic"

    @classmethod
    def has_value(cls, value):
        return value in cls.get_choices()

    @classmethod
    def get_choices(cls) -> typing.List[str]:
        return [choice[1] for choice in cls.choices]

    @classmethod
    def to_int(cls, value: str) -> typing.Optional[int]:
        for choice in cls.choices:
            if choice[1] == value:
                return choice[0]
        return None

    @classmethod
    def is_dark(cls, value: int) -> bool:
        return 6 <= value <= 10


class CustomUser(AbstractUser):
    role = models.IntegerField(
        choices=UserRole.choices,
        default=UserRole.USER,
    )

    verification_code = models.CharField(
        max_length=10,
        default=gen_verification_code,
        blank=True,
        editable=False,
    )

    theme = models.IntegerField(
        choices=UserThemes.choices,
        default=UserThemes.CLASSIC,
    )

    def email_is_verified(self) -> bool:
        return EmailVerification.objects.filter(user=self, verified=True).exists()

    def tenant_is_verified(self) -> bool:
        return self.role >= UserRole.VERIFIED


class EmailVerification(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    verification_code = models.UUIDField(default=uuid.uuid4, editable=False)
    verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def verify_user(self, user: CustomUser, code: str) -> bool:
        if self.user == user and str(self.verification_code) == str(code):
            self.verified = True
            self.save()
            return True
        return False

    def send_verification_email(self):
        if settings.EMAIL_HOST is None or settings.EMAIL_HOST == '':
            logger.warning('Cannot send email, EMAIL_HOST is not set.')
        subject = "Verify your email address"
        message = f"Click this link to verify your email:\n{'https' if settings.TLS_ACTIVE else 'http'}://{settings.ALLOWED_HOSTS[0]}{':8000' if settings.DEBUG else ''}/account/email-verification/?code={self.verification_code}\nOr copy and paste this code: {self.verification_code}"
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [self.user.email]
        send_mail(subject, message, from_email, recipient_list)

    def __str__(self):
        return f"<EmailVerification: {self.user.username} - {self.verification_code} - {'Verified' if self.verified else 'Not Verified'}>"
