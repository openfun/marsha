"""Test suite for Marsha's collectstatic command."""

import os
import tempfile

from django.conf import settings
from django.core.management import call_command
from django.test import TestCase, override_settings


DEBUG = False
TEST_FILE_PATH = os.path.join(os.path.dirname(__file__), "test_files")
TEMP = tempfile.mkdtemp()


def _list_files(start_path):
    """Print a tree of files in a directory."""
    for root, _, files in os.walk(start_path):
        level = root.replace(start_path, "").count(os.sep)
        indent = " " * 4 * level
        print(f"{indent}{os.path.basename(root)}/")
        sub_indent = " " * 4 * (level + 1)
        for file in sorted(files):
            print(sub_indent + file)


included_files = [
    "js/index.js",
    "js/index.js.br",
    "js/index.3fa8bf9a8082.js",
    "js/index.3fa8bf9a8082.js.br",
    "js/build/index.js",
    "js/build/index.js.map",
    "js/build/index.d41d8cd98f00.js",
    "js/build/index.js.d41d8cd98f00.map",
    "js/build/site/static/js/main.a235b98c.js",
    "js/build/site/static/js/main.a235b98c.js.br",
    "js/build/site/static/js/main.a235b98c.js.map",
    (
        "js/build/lti_site/"
        "vendors-node_modules_grommet-icons_index_js.cbf443f52b931567ba45.index.js"
    ),
    (
        "js/build/lti_site/"
        "vendors-node_modules_grommet-icons_index_js.cbf443f52b931567ba45.index.js.br"
    ),
    (
        "js/build/lti_site/"
        "vendors-node_modules_grommet-icons_index_js.cbf443f52b931567ba45.index.js.gz"
    ),
]

excluded_files = [
    "js/build/site/static/js/main.a235b98c.3fa8bf9a8082.js",
    "js/build/site/static/js/main.a235b98c.3fa8bf9a8082.js.br",
    "js/build/site/static/js/main.a235b98c.js.map.br",
    "js/build/site/static/js/main.a235b98c.js.map.gz",
    "js/build/site/static/js/main.a235b98c.js.e0dcef76319e.map",
    "js/build/site/static/js/main.a235b98c.js.e0dcef76319e.map.br",
    "js/build/site/static/js/main.a235b98c.js.e0dcef76319e.map.gz",
    (
        "js/build/lti_site/"
        "vendors-node_modules_grommet-icons_index_js.cbf443f52b931567ba45.index.2233822e528d.js"
    ),
    (
        "js/build/lti_site/"
        "vendors-node_modules_grommet-icons_index_js.cbf443f52b931567ba45.index.2233822e528d.js.br"
    ),
    (
        "js/build/lti_site/"
        "vendors-node_modules_grommet-icons_index_js.cbf443f52b931567ba45.index.2233822e528d.js.gz"
    ),
]


@override_settings(
    INSTALLED_APPS=[
        "django.contrib.staticfiles",
    ],
    STATICFILES_DIRS=[TEST_FILE_PATH],
    STATIC_ROOT=TEMP,
    STATIC_POSTPROCESS_IGNORE_REGEX=r"^js\/build\/.*[0-9]*\..*\.js(\.map)?$",
    STATIC_POSTPROCESS_MAP_IGNORE_REGEX=r"^js\/build\/.*[0-9]*\..*\.js\.map$",
)
class TestMarshaCompressedManifestStaticFilesStorage(TestCase):
    """Test suite for Marsha's collectstatic command."""

    @override_settings(
        STORAGES={
            "staticfiles": {
                "BACKEND": "marsha.core.static.MarshaCompressedManifestStaticFilesStorage",
            }
        }
    )
    def test_collectstatic_marsha(self):
        """Files are excluded correctly"""
        call_command("collectstatic", verbosity=0, interactive=False)

        if DEBUG:
            _list_files(settings.STATIC_ROOT)

        for file in included_files:
            path = os.path.join(settings.STATIC_ROOT, file)
            self.assertTrue(os.path.exists(path), f"{path} does not exist")

        for file in excluded_files:
            path = os.path.join(settings.STATIC_ROOT, file)
            self.assertFalse(os.path.exists(path), f"{path} exists")

    @override_settings(
        STORAGES={
            "staticfiles": {
                "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
            }
        }
    )
    def test_collectstatic_whitenoise(self):
        """All files are included
        This test checks that excluded files might exist
        """
        call_command("collectstatic", verbosity=0, interactive=False)

        if DEBUG:
            _list_files(settings.STATIC_ROOT)

        for file in included_files + excluded_files:
            path = os.path.join(settings.STATIC_ROOT, file)
            self.assertTrue(os.path.exists(path), f"{path} does not exist")
