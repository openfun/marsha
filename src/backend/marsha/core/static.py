"""Customizing Django storage backends to enable blue/green deployments."""
from collections import OrderedDict
import re

from django.conf import settings
from django.contrib.staticfiles.storage import ManifestStaticFilesStorage

from whitenoise.storage import CompressedStaticFilesMixin


STATIC_POSTPROCESS_IGNORE_REGEX = re.compile(
    getattr(settings, "STATIC_POSTPROCESS_IGNORE_REGEX", "^$")
)

STATIC_POSTPROCESS_MAP_IGNORE_REGEX = re.compile(
    getattr(settings, "STATIC_POSTPROCESS_MAP_IGNORE_REGEX", "^$")
)


class MarshaCompressedManifestStaticFilesStorage(
    CompressedStaticFilesMixin, ManifestStaticFilesStorage
):
    """Custom staticfile storage.

    Custom staticfile storage allowing us to not post process multiple times
    all the webpack build. We want to ignore it and just compress all js files
    but ignore map files
    """

    # pylint: disable=arguments-differ,unused-argument
    def post_process(self, paths, dry_run=False, **options):
        """Remove paths from file to post process.

        All js and map files generated by webpack should be removed from the
        paths variable to not be post-processed and then only js files are compressed,
        not map files.
        """
        filtered_paths = OrderedDict()
        to_compress = []
        for path in paths:
            if not STATIC_POSTPROCESS_IGNORE_REGEX.match(path):
                filtered_paths[path] = paths[path]
            elif not STATIC_POSTPROCESS_MAP_IGNORE_REGEX.match(path):
                # do not compress map files
                to_compress.append((path, None, False))

        # static files without webpack build are post-processed
        yield from super().post_process(filtered_paths, dry_run=dry_run, **options)
        if not dry_run:
            # static files built from webpack are just compressed
            yield from super().post_process_with_compression(to_compress)
