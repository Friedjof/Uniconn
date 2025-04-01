from django.contrib.auth.models import AbstractUser
from django.db import models

from .utils import gen_verification_code


# Create your models here.
class CustomUser(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        MODERATOR = "moderator", "Moderator"
        VERIFIED = "verified", "Verified"
        USER = "user", "User"
        GUEST = "guest", "Guest"
        INACTIVE = "inactive", "Inactive"

    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.USER,
    )

    verification_code = models.CharField(
        max_length=10,
        default=gen_verification_code,
        blank=True,
    )
