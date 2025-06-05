import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.utils import timezone
from .models import Chat, Message
from account.models import CustomUser


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.chat_id = self.scope['url_route']['kwargs']['chat_id']
        self.chat_group_name = f'chat_{self.chat_id}'
        
        # Check if user is authenticated
        user = self.scope["user"]
        if isinstance(user, AnonymousUser):
            await self.close()
            return
        
        # Check if user has access to this chat
        has_access = await self.check_chat_access(user, self.chat_id)
        if not has_access:
            await self.close()
            return
        
        # Join chat group
        await self.channel_layer.group_add(
            self.chat_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        # Leave chat group
        await self.channel_layer.group_discard(
            self.chat_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')
            
            if message_type == 'chat_message':
                message = text_data_json['message']
                user = self.scope["user"]
                
                # Save message to database
                saved_message = await self.save_message(user, self.chat_id, message)
                
                if saved_message:
                    # Send message to chat group
                    await self.channel_layer.group_send(
                        self.chat_group_name,
                        {
                            'type': 'chat_message',
                            'message': message,
                            'user_id': user.id,
                            'username': user.username,
                            'timestamp': saved_message.timestamp.isoformat(),
                            'message_id': str(saved_message.message_id)
                        }
                    )
            
            elif message_type == 'typing':
                user = self.scope["user"]
                is_typing = text_data_json.get('is_typing', False)
                
                # Send typing indicator to chat group (excluding sender)
                await self.channel_layer.group_send(
                    self.chat_group_name,
                    {
                        'type': 'typing_indicator',
                        'user_id': user.id,
                        'username': user.username,
                        'is_typing': is_typing
                    }
                )
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'error': 'Invalid JSON'
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                'error': str(e)
            }))
    
    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message'],
            'user_id': event['user_id'],
            'username': event['username'],
            'timestamp': event['timestamp'],
            'message_id': event['message_id']
        }))
    
    async def typing_indicator(self, event):
        # Don't send typing indicator to the user who is typing
        if event['user_id'] != self.scope["user"].id:
            await self.send(text_data=json.dumps({
                'type': 'typing_indicator',
                'user_id': event['user_id'],
                'username': event['username'],
                'is_typing': event['is_typing']
            }))
    
    @database_sync_to_async
    def check_chat_access(self, user, chat_id):
        """Check if user has access to the chat"""
        try:
            chat = Chat.objects.get(chat_id=chat_id)
            return user in chat.users.all()
        except Chat.DoesNotExist:
            return False
    
    @database_sync_to_async
    def save_message(self, user, chat_id, content):
        """Save message to database"""
        try:
            chat = Chat.objects.get(chat_id=chat_id)
            # Verify user has access to this chat
            if user not in chat.users.all():
                return None
            
            message = Message.objects.create(
                chat=chat,
                sender=user,
                content=content
            )
            return message
        except Chat.DoesNotExist:
            return None
        except Exception:
            return None
