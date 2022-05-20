"""Marsha forms module."""
from django.forms import ModelForm

from . import models


class DocumentForm(ModelForm):
    """Form to create or update documents."""

    class Meta:
        """Meta for DocumentForm."""

        model = models.Document
        fields = ["description", "is_public", "lti_id", "playlist", "title"]


class VideoForm(ModelForm):
    """Form to create or update videos."""

    class Meta:
        """Meta for VideoForm."""

        model = models.Video
        fields = ["description", "is_public", "lti_id", "playlist", "title"]
