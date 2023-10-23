"""Marsha forms module."""
from django.core.exceptions import ValidationError
from django.forms import CharField, ModelForm

from marsha.core import models
from marsha.core.defaults import INITIALIZED


class DocumentForm(ModelForm):
    """Form to create or update documents."""

    class Meta:
        """Meta for DocumentForm."""

        model = models.Document
        fields = ["description", "is_public", "lti_id", "playlist", "title"]


class VideoForm(ModelForm):
    """Form to create or update videos."""

    upload_state = CharField(
        max_length=20,
        required=False,
    )

    class Meta:
        """Meta for VideoForm."""

        model = models.Video
        fields = [
            "description",
            "is_public",
            "lti_id",
            "playlist",
            "title",
            "upload_state",
            "license",
        ]

    def clean_upload_state(self):
        """Check upload_state valid value."""
        upload_state = self.cleaned_data["upload_state"]

        if upload_state and upload_state != INITIALIZED:
            raise ValidationError(f"{INITIALIZED} is the only accepted value")

        return upload_state
