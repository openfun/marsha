"""This module holds custom metadata class dedicated to Marsha."""
from django.conf import settings

from rest_framework.metadata import SimpleMetadata


class MarkdownImageMetadata(SimpleMetadata):
    """Metadata class dedicated to video model."""

    def determine_metadata(self, request, view):
        """Adds live info in video metadata."""
        metadata = super().determine_metadata(request, view)
        metadata["upload_max_size_bytes"] = settings.MARKDOWN_IMAGE_SOURCE_MAX_SIZE

        return metadata
