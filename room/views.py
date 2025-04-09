from django.shortcuts import render, redirect
from django.views.generic import TemplateView

from .forms import RoomForm


class SelectRoomView(TemplateView):
    template_name = 'select.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form'] = RoomForm()
        return context

    def post(self, request, *args, **kwargs):
        form = RoomForm(request.POST)
        if form.is_valid():
            print(form.cleaned_data)
        return redirect('room:select_room')
