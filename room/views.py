from django.shortcuts import render, redirect
from django.views.generic import TemplateView

from .forms import RoomForm
from .models import Room
from account.mixins import NoRoomRequiredMixin


class SelectRoomView(NoRoomRequiredMixin, TemplateView):
    template_name = 'select.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form'] = RoomForm()
        return context

    def get(self, request, *args, **kwargs):
        form = RoomForm()
        return render(request, self.template_name, {'form': form})

    def post(self, request, *args, **kwargs):
        form = RoomForm(request.POST)
        print("Form data:", request.POST)
        
        if form.is_valid():
            room = form.cleaned_data.get('room_name')
            print("Selected room:", room)
            
            if room:
                print("Adding user to room:", room.id)
                room.add_tenant(request.user)
                print("User added successfully")
                request.session['room_id'] = room.id
                print("Session room_id set to:", room.id)
                return redirect('account:verify')
            else:
                form.add_error('room_name', 'Bitte wählen Sie einen Raum aus.')
        else:
            print("Form errors:", form.errors)
        
        return render(request, self.template_name, {'form': form})
