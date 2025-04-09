from django import forms
from django.utils.translation import gettext_lazy as _

from django_select2.forms import ModelSelect2Widget
from .models import Room


class RoomForm(forms.Form):
    room_name = forms.ModelMultipleChoiceField(
        queryset=Room.objects.all(),
        required=False,  # Optional: falls nicht erforderlich
        label=_("Räume"),
        widget=ModelSelect2Widget(
            model=Room,
            search_fields=['room_name__icontains'],
            attrs={
                "data-minimum-input-length": 0,
                "data-placeholder": _("Raum auswählen"),
                "data-close-on-select": "false",
                "class": "form-control",
            }
        )
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Queryset erneut abrufen, um sicherzustellen, dass es aktuell ist
        self.fields['room_name'].queryset = Room.objects.all()
        # Debug-Ausgabe
        print(f"Anzahl der Räume: {Room.objects.count()}")
