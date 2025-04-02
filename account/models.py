from django.contrib.auth.models import AbstractUser
from django.db import models

from .utils import gen_verification_code


class UserRole(models.IntegerChoices):
    INACTIVE = 1, "Inactive"
    GUEST = 2, "Guest"
    USER = 3, "User"
    VERIFIED = 4, "Verified"
    MODERATOR = 5, "Moderator"
    ADMIN = 6, "Admin"


class CustomUser(AbstractUser):
    role = models.IntegerField(
        choices=UserRole.choices,
        default=UserRole.USER,
    )

    verification_code = models.CharField(
        max_length=10,
        default=gen_verification_code,
        blank=True,
    )
