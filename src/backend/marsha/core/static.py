"""Customizing Django storage backends to enable blue/green deployments."""
import re

from django.conf import settings

from whitenoise.compress import Compressor
from whitenoise.storage import CompressedManifestStaticFilesStorage


STATIC_POSTPROCESS_IGNORE_REGEX = re.compile(
    getattr(settings, "STATIC_POSTPROCESS_IGNORE_REGEX", "^$")
)

STATIC_POSTPROCESS_MAP_IGNORE_REGEX = re.compile(
    getattr(settings, "STATIC_POSTPROCESS_MAP_IGNORE_REGEX", "^$")
)


class MarshaCompressedManifestStaticFilesStorage(CompressedManifestStaticFilesStorage):
    """Custom staticfile storage.

    Custom staticfile storage allowing us to not post process multiple times
    all the webpack build. We want to ignore it and just compress all js files
    but ignore map files
    """

    def hashed_name(self, *args, **kwargs):
        """Exclude files from getting a hashed name."""
        path = args[0]
        if STATIC_POSTPROCESS_IGNORE_REGEX.match(path):
            return path
        return super().hashed_name(*args, **kwargs)

    def create_compressor(self, **kwargs):
        """Use custom compressor with verbose output."""
        kwargs["quiet"] = True
        return MarshaCompressor(**kwargs)


class MarshaCompressor(Compressor):
    """Custom compressor to exclude map files from compression."""

    def should_compress(self, filename):
        """Do not compress map files."""
        if STATIC_POSTPROCESS_MAP_IGNORE_REGEX.match(filename):
            return False
        return super().should_compress(filename)
