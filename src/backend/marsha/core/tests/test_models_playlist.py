"""Tests for the models in the ``core`` app of the Marsha project."""
from django.core.exceptions import ValidationError
from django.test import TestCase

from safedelete.models import SOFT_DELETE_CASCADE

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

    def test_models_playlist_fields_lti_id_unique(self):
        """Playlists should be unique for a given duo: lti_id/playlist."""
        playlist = PlaylistFactory()

        # A playlist with a different lti_id and the same consumer site can still be created
        PlaylistFactory(consumer_site=playlist.consumer_site)

        # A playlist for a different consumer site and the same lti_id can still be created
        PlaylistFactory(lti_id=playlist.lti_id)

        # Trying to create a playlist with the same duo lti_id/consumer site should raise a
        # database error
        with self.assertRaises(ValidationError) as context:
            PlaylistFactory(
                lti_id=playlist.lti_id, consumer_site=playlist.consumer_site
            )
        self.assertEqual(
            context.exception.messages,
            ["Playlist with this Lti id and Consumer site already exists."],
        )

        # Soft deleted playlists should not count for unicity
        playlist.delete(force_policy=SOFT_DELETE_CASCADE)
        PlaylistFactory(lti_id=playlist.lti_id, consumer_site=playlist.consumer_site)
