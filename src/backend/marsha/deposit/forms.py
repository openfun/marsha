"""Marsha forms module."""
from django.forms import ModelForm

from marsha.deposit import models


class FileDepositoryForm(ModelForm):
    """Form to create or update file_depositories."""

    class Meta:
        """Meta for FileDepositoryForm."""

        model = models.FileDepository
        fields = ["description", "lti_id", "playlist", "title"]
