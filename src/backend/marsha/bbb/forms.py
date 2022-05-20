"""Marsha forms module."""
from django.forms import ModelForm

from . import models


class MeetingForm(ModelForm):
    """Form to create or update meetings."""

    class Meta:
        """Meta for MeetingForm."""

        model = models.Meeting
        fields = ["description", "lti_id", "playlist", "title"]
