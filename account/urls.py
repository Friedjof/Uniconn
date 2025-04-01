from django.urls import path
from .views import index_view, LoginView, RegisterView, VerifyView

urlpatterns = [
    path('', index_view, name='index'),
    path('login/', LoginView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('verify/', VerifyView.as_view(), name='verify'),
]
