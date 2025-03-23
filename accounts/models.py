from django.contrib.auth.models import AbstractUser
from django.db import models

# Create your models here.
class CustomUser(AbstractUser):
    is_verified = models.BooleanField(default=False)
    verification_code = models.CharField()
