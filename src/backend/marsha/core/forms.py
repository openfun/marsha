"""Marsha forms module."""
from django.forms import ModelForm

from . import models


class VideoForm(ModelForm):
    """Form to create or update videos."""

    class Meta:
        """Meta for VideoForm."""

        model = models.Video
        fields = ["description", "is_public", "lti_id", "playlist", "title"]
