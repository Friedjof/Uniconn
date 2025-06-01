from django import forms
from django.utils.translation import gettext_lazy as _

from django_select2.forms import ModelSelect2Widget
from .models import Room


class RoomForm(forms.Form):
    room_name = forms.ModelChoiceField(
        queryset=Room.objects.all(),
        required=True,  # Made required since we need a room selection
        label=_("Raum"),
        widget=ModelSelect2Widget(
            model=Room,
            search_fields=['room_name__icontains'],
            attrs={
                "data-minimum-input-length": 0,
                "data-placeholder": _("Raum auswählen"),
                "data-close-on-select": "true",  # Close on select since it's single choice
                "class": "form-control",
            }
        )
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Queryset erneut abrufen, um sicherzustellen, dass es aktuell ist
        self.fields['room_name'].queryset = Room.objects.all()
