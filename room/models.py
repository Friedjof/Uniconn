import uuid

from django.db import models

from account.models import CustomUser


# Create your models here.
class Room(models.Model):
    room_id = models.UUIDField(default=uuid.uuid4, editable=False)
    room_name = models.CharField(max_length=255)
    room_description = models.TextField()
    tenants = models.ManyToManyField(CustomUser, related_name='rooms')
