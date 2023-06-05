"""Marsha forms module."""
from parler.forms import TranslatableModelForm

from . import models


class MarkdownDocumentForm(TranslatableModelForm):
    """Form to create or update documents."""

    class Meta:
        """Meta for DocumentForm."""

        model = models.MarkdownDocument
        fields = ["is_public", "lti_id", "playlist", "title", "created_by"]
