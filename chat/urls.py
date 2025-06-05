from django.urls import path
from . import views

app_name = 'chat'

urlpatterns = [
    path('', views.ChatView.as_view(), name='index'),
    path('<uuid:chat_id>/', views.ChatView.as_view(), name='chat_detail'),
    path('start/', views.start_chat, name='start_chat'),
    path('send/', views.send_message, name='send_message'),
    path('messages/<uuid:chat_id>/', views.get_messages, name='get_messages'),
]
