from django.urls import path

from .views import SelectRoomView


urlpatterns = [
    path('select/', SelectRoomView.as_view(), name='select_room'),
]
