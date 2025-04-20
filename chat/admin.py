from django.contrib import admin
from .models import Chat, Message
from import_export import resources
from import_export.admin import ImportExportModelAdmin

# Register your models here.
class MessageResource(resources.ModelResource):
    class Meta:
        model = Message
        fields = ('message_id', 'chat', 'sender', 'content', 'timestamp', 'status')
        export_order = fields
        import_id_fields = ('message_id',)

@admin.register(Message)
class MessageAdmin(ImportExportModelAdmin):
    resource_class = MessageResource

    list_display = ('message_id', 'chat', 'sender', 'content', 'timestamp', 'status')
    list_filter = ('status',)
    search_fields = ('message_id', 'chat__chat_id', 'sender__username', 'content')
    ordering = ('timestamp',)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('chat', 'sender')



class ChatResource(resources.ModelResource):
    class Meta:
        model = Chat
        fields = ('chat_id', 'status')
        export_order = fields
        import_id_fields = ('chat_id',)


@admin.register(Chat)
class ChatAdmin(ImportExportModelAdmin):
    resource_class = ChatResource

    list_display = ('chat_id', 'status', 'get_users')
    list_filter = ('status',)
    search_fields = ('chat_id',)
    
    def get_users(self, obj):
        return ", ".join([user.username for user in obj.users.all()])
    
    get_users.short_description = 'Users'

