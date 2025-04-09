from django.contrib import admin
from .models import Room


class RoomAdmin(admin.ModelAdmin):
    list_display = ('room_name', 'room_description', 'get_tenants')
    search_fields = ('room_name',)
    list_filter = ('tenants',)
    ordering = ('room_name',)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.prefetch_related('tenants')

    def get_tenants(self, obj):
        return ", ".join([tenant.username for tenant in obj.get_tenants()])

    get_tenants.short_description = 'Tenants'


admin.site.register(Room, RoomAdmin)
