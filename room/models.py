import uuid

from django.db import models
from django.db.models import QuerySet

from account.models import CustomUser


class Room(models.Model):
    room_id = models.UUIDField(default=uuid.uuid4, editable=False)
    room_name = models.CharField(max_length=255)
    room_description = models.TextField(blank=True, null=True)
    tenants = models.ManyToManyField(CustomUser, related_name='rooms', blank=True)

    def get_tenants(self):
        return self.tenants.all()

    def __str__(self) -> str:
        return self.room_name
