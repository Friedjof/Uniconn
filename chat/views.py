from django.shortcuts import render, get_object_or_404, redirect
from django.views.generic import TemplateView
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.http import JsonResponse
from django.db.models import Q, Max
from django.contrib.auth import get_user_model

from account.mixins import FullVerificationRequiredMixin
from .models import Chat, Message
from account.models import CustomUser

User = get_user_model()


@method_decorator(login_required, name='dispatch')
class ChatView(FullVerificationRequiredMixin, TemplateView):
    template_name = 'chat/chat.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # Alle Chats des aktuellen Benutzers mit der letzten Nachricht
        user_chats = Chat.objects.filter(
            users=self.request.user,
            status=Chat.Status.ACTIVE
        ).annotate(
            last_message_time=Max('messages__timestamp')
        ).order_by('-last_message_time')
        
        # Chat-Liste mit zusätzlichen Informationen aufbereiten
        chat_list = []
        for chat in user_chats:
            other_users = chat.users.exclude(id=self.request.user.id)
            last_message = chat.messages.order_by('-timestamp').first()
            
            chat_data = {
                'chat': chat,
                'other_users': other_users,
                'last_message': last_message,
                'unread_count': chat.messages.filter(
                    status__in=[Message.Status.SENT, Message.Status.DELIVERED]
                ).exclude(sender=self.request.user).count()
            }
            chat_list.append(chat_data)
        
        context['chat_list'] = chat_list
        context['active_chat_id'] = self.kwargs.get('chat_id')
        
        # Wenn ein spezifischer Chat ausgewählt ist
        if context['active_chat_id']:
            try:
                active_chat = Chat.objects.get(
                    chat_id=context['active_chat_id'],
                    users=self.request.user
                )
                context['active_chat'] = active_chat
                context['chat_messages'] = active_chat.messages.order_by('timestamp')
                context['other_users_in_chat'] = active_chat.users.exclude(id=self.request.user.id)
                
                # Nachrichten als gelesen markieren
                active_chat.messages.exclude(sender=self.request.user).update(
                    status=Message.Status.READ
                )
                
            except Chat.DoesNotExist:
                context['active_chat'] = None
        
        # Alle verifizierten Benutzer für neue Chats
        from account.models import UserRole
        context['available_users'] = User.objects.filter(
            is_active=True,
            role__gte=UserRole.VERIFIED
        ).exclude(id=self.request.user.id)
        
        return context


@login_required
def start_chat(request):
    """Neuen Chat starten oder zu existierendem Chat weiterleiten"""
    if request.method == 'POST':
        user_id = request.POST.get('user_id')
        if not user_id:
            return JsonResponse({'error': 'Benutzer-ID erforderlich'}, status=400)
        
        try:
            other_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return JsonResponse({'error': 'Benutzer nicht gefunden'}, status=404)
        
        # Überprüfen, ob bereits ein Chat zwischen den Benutzern existiert
        existing_chat = Chat.objects.filter(
            users=request.user,
            status=Chat.Status.ACTIVE
        ).filter(
            users=other_user
        ).first()
        
        if existing_chat:
            return JsonResponse({
                'success': True,
                'chat_id': str(existing_chat.chat_id),
                'redirect_url': f'/chat/{existing_chat.chat_id}/'
            })
        
        # Neuen Chat erstellen
        new_chat = Chat.objects.create()
        new_chat.users.add(request.user, other_user)
        
        return JsonResponse({
            'success': True,
            'chat_id': str(new_chat.chat_id),
            'redirect_url': f'/chat/{new_chat.chat_id}/'
        })
    
    return JsonResponse({'error': 'Nur POST-Requests erlaubt'}, status=405)


@login_required
def send_message(request):
    """Nachricht senden (AJAX)"""
    if request.method == 'POST':
        chat_id = request.POST.get('chat_id')
        content = request.POST.get('content', '').strip()
        
        if not chat_id or not content:
            return JsonResponse({'error': 'Chat-ID und Inhalt erforderlich'}, status=400)
        
        try:
            chat = Chat.objects.get(chat_id=chat_id, users=request.user)
        except Chat.DoesNotExist:
            return JsonResponse({'error': 'Chat nicht gefunden'}, status=404)
        
        # Nachricht erstellen
        message = Message.objects.create(
            chat=chat,
            sender=request.user,
            content=content
        )
        
        return JsonResponse({
            'success': True,
            'message_id': str(message.message_id),
            'message': {
                'id': str(message.message_id),
                'content': message.content,
                'timestamp': message.timestamp.isoformat(),
                'sender_name': message.sender.username,
                'sender_id': message.sender.id,
                'status': message.status
            }
        })
    
    return JsonResponse({'error': 'Nur POST-Requests erlaubt'}, status=405)


@login_required
def get_messages(request, chat_id):
    """Nachrichten für einen Chat abrufen (AJAX)"""
    try:
        chat = Chat.objects.get(chat_id=chat_id, users=request.user)
    except Chat.DoesNotExist:
        return JsonResponse({'error': 'Chat nicht gefunden'}, status=404)
    
    messages = chat.messages.order_by('timestamp')
    messages_data = []
    
    for message in messages:
        messages_data.append({
            'id': str(message.message_id),
            'content': message.content,
            'timestamp': message.timestamp.isoformat(),
            'sender_name': message.sender.username,
            'sender_id': message.sender.id,
            'status': message.status,
            'is_own': message.sender == request.user
        })
    
    return JsonResponse({
        'success': True,
        'messages': messages_data
    })


# Create your views here.
