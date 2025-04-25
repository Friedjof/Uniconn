from django.contrib import admin
from .models import Room
from import_export import resources
from import_export.admin import ImportExportModelAdmin

# Register your models here.
class RoomResource(resources.ModelResource):
    class Meta:
        model = Room
        fields = ('room_id', 'room_name', 'room_description', 'tenants')
        export_order = fields
        import_id_fields = ('room_id',)

@admin.register(Room)
class RoomAdmin(ImportExportModelAdmin):
    resource_class = RoomResource

    list_display = ('room_id', 'room_name', 'room_description', 'get_tenants')
    search_fields = ('room_name', 'room_description')
    list_filter = ('room_name',)
    ordering = ('room_name',)
    
    def get_tenants(self, obj):
        return ", ".join([tenant.username for tenant in obj.tenants.all()])
    
    get_tenants.short_description = 'Tenants'

