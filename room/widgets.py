from django_select2 import forms as s2forms


class RoomWidget(s2forms.ModelSelect2MultipleWidget):
    search_fields = [
        'room_name__icontains',
    ]
