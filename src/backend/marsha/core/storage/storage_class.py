"""Class storage for the marsha app."""
from django.core.files.storage import storages
from django.utils.functional import LazyObject


class ConfiguredVideoStorage(LazyObject):
    """Lazy object for the video storage."""

    def _setup(self):
        """Setup the video storage."""
        self._wrapped = storages["videos"]


video_storage = ConfiguredVideoStorage()
