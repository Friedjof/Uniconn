from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'verification_code', 'role')
    list_filter = ('role',)
    ordering = ('username',)
    search_fields = ('username', 'email')
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Persönliche Informationen', {'fields': ('first_name', 'last_name', 'email')}),
        ('Berechtigungen', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Wichtige Daten', {'fields': ('last_login', 'date_joined')}),
        ('Zusätzliche Informationen', {'fields': ('verification_code', 'role')}),
    )

admin.site.register(CustomUser, CustomUserAdmin)
