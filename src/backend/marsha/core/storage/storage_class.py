"""Class storage for the marsha app."""

from django.core.files.storage import storages
from django.utils.functional import LazyObject


class ConfiguredFileStorage(LazyObject):
    """Lazy object for the file storage."""

    def _setup(self):
        """Setup the file storage."""
        self._wrapped = storages["files"]


file_storage = ConfiguredFileStorage()
