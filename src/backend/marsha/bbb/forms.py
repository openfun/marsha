"""Marsha forms module."""
from django.forms import ModelForm

from marsha.bbb import models


class ClassroomForm(ModelForm):
    """Form to create or update classrooms."""

    class Meta:
        """Meta for ClassroomForm."""

        model = models.Classroom
        fields = ["description", "lti_id", "playlist", "title"]
