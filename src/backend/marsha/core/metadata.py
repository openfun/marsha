"""This module holds custom metadata class dedicated to Marsha."""
from django.conf import settings

from rest_framework.metadata import SimpleMetadata


class VideoMetadata(SimpleMetadata):
    """Metadata class dedicated to video model."""

    def determine_metadata(self, request, view):
        """Adds live info in video metadata."""
        metadata = super().determine_metadata(request, view)
        metadata["live"] = {
            "segment_duration_seconds": settings.LIVE_SEGMENT_DURATION_SECONDS
        }
        metadata["vod"] = {"upload_max_size_bytes": settings.VIDEO_SOURCE_MAX_SIZE}

        return metadata
