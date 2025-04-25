from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from import_export import resources
from import_export.admin import ImportExportModelAdmin

from .models import CustomUser, EmailVerification


class CustomUserResource(resources.ModelResource):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role', 
                  'is_active', 'is_staff', 'is_superuser', 'date_joined', 'last_login', 'theme')
        export_order = fields


class CustomUserAdmin(UserAdmin, ImportExportModelAdmin):
    resource_class = CustomUserResource

    list_display = ('username', 'email', 'role', 'verification_code', 'tenant_is_verified', 'email_is_verified')
    list_filter = ('role',)
    ordering = ('username',)
    search_fields = ('username', 'email')
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Persönliche Informationen', {'fields': ('first_name', 'last_name', 'email')}),
        ('Berechtigungen', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Wichtige Daten', {'fields': ('last_login', 'date_joined')}),
        ('Zusätzliche Informationen', {'fields': ('role', 'verification_code', 'theme')}),
    )
    readonly_fields = ('verification_code',)


    def email_is_verified(self, obj):
        return obj.email_is_verified()

    def tenant_is_verified(self, obj):
        return obj.tenant_is_verified()

    email_is_verified.boolean = True
    tenant_is_verified.boolean = True
    email_is_verified.short_description = 'Email Verified'
    tenant_is_verified.short_description = 'Tenant Verified'

admin.site.register(CustomUser, CustomUserAdmin)

class EmailVerificationResource(resources.ModelResource):
    class Meta:
        model = EmailVerification
        fields = ('id', 'user__username', 'user__email', 'verification_code', 'verified', 'created_at')
        export_order = fields
        import_id_fields = ('user__username',)

# Register the EmailVerification model with the admin site
class EmailVerificationAdmin(ImportExportModelAdmin):
    resource_class = EmailVerificationResource

    list_display = ('user', 'verification_code', 'verified', 'created_at')
    search_fields = ('user__username', 'user__email', 'verification_code')
    list_filter = ('verified',)
    ordering = ('-created_at',)

    def user_email(self, obj):
        return obj.user.email

    user_email.short_description = 'User Email'

admin.site.register(EmailVerification, EmailVerificationAdmin)
