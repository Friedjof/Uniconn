from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'verification_code', 'role')
    list_filter = ('role',)
    ordering = ('username',)
    search_fields = ('username', 'email')

admin.site.register(CustomUser, CustomUserAdmin)