"""Test suite for Marsha's settings."""
from unittest import mock

from django.test import TestCase

from marsha.settings import get_release


# pylint: disable=unused-argument
class SettingsTestCase(TestCase):
    """Battle test the settings.get_release function."""

    @mock.patch("builtins.open", side_effect=FileNotFoundError)
    def test_returns_default_without_version_file(self, *args):
        """No version.json file exists, get_release() returns a default value."""
        self.assertEqual(get_release(), "NA")

    @mock.patch("builtins.open", mock.mock_open(read_data="""{"version": "1.0.1"}"""))
    def test_get_release_from_a_valid_version_file(self, *args):
        """Get release from the version.json file."""
        self.assertEqual(get_release(), "1.0.1")

    @mock.patch("builtins.open", mock.mock_open(read_data="""{"foo": "3ba84e7"}"""))
    def test_get_release_from_an_invalid_version_file(self, *args):
        """Attempt (and fail) to get release from a broken version.json file."""
        with self.assertRaises(KeyError):
            get_release()
