"""Tests for the models in the ``core`` app of the Marsha project."""
from django.test import TestCase

from ..factories import PlaylistFactory


# We don't enforce arguments documentation in tests
# pylint: disable=missing-param-doc,missing-type-doc,unused-argument


class PlaylistModelsTestCase(TestCase):
    """Test our intentions about the Playlist model."""

    def test_models_playlist_str(self):
        """The str method should display the playlist title and its eventual soft deletion."""
        playlist = PlaylistFactory(title="ça joue")
        self.assertEqual(str(playlist), "ça joue")

        playlist.delete()
        self.assertEqual(str(playlist), "ça joue [deleted]")
