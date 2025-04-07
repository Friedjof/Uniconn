from django.urls import path

from .views import index_view, logout_view, set_theme, get_theme, LoginView, RegisterView, VerifyView, VerifyEmailView, ProfileView


urlpatterns = [
    path('', index_view, name='templates'),
    path('login/', LoginView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('verify/', VerifyView.as_view(), name='verify'),
    path('logout/', logout_view, name='logout'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('email-verification/', VerifyEmailView.as_view(), name='email_verification'),
    path('set/theme/', set_theme, name='set_theme'),
    path('get/theme/', get_theme, name='get_theme'),
]