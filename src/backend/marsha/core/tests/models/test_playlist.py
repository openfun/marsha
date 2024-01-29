"""Tests for the models in the ``core`` app of the Marsha project."""

from django.db import transaction
from django.db.utils import IntegrityError
from django.test import TestCase

from safedelete.models import SOFT_DELETE_CASCADE

from marsha.core.factories import (
    ConsumerSiteFactory,
    OrganizationFactory,
    PlaylistFactory,
)


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
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                PlaylistFactory(
                    lti_id=playlist.lti_id, consumer_site=playlist.consumer_site
                )

        # Soft deleted playlists should not count for unicity
        playlist.delete(force_policy=SOFT_DELETE_CASCADE)
        PlaylistFactory(lti_id=playlist.lti_id, consumer_site=playlist.consumer_site)

    def test_modules_playlist_organization_consumer_site_lti_id_check_integrity(self):
        """Playlist consumer_site_or_organization_check_idx constraint."""
        consumer_site = ConsumerSiteFactory()
        organization = OrganizationFactory()
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                # All parameters set to None is not allowed
                PlaylistFactory(consumer_site=None, organization=None, lti_id=None)

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                # Defining consumer_site without a lti_id is not allowed
                PlaylistFactory(
                    consumer_site=consumer_site, organization=None, lti_id=None
                )

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                # Defining the lti_id without a consumer_site is not allowed
                PlaylistFactory(consumer_site=None, organization=None, lti_id="foo")

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                # Defining an organization with a lti_id is not allowed
                PlaylistFactory(
                    consumer_site=None, organization=organization, lti_id="foo"
                )

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                # Defining an organization with a consumer_site is not allowed
                PlaylistFactory(
                    consumer_site=consumer_site, organization=organization, lti_id=None
                )

        # Defining consumer_site, lti_id and organization is allowed
        PlaylistFactory(
            organization=organization,
            consumer_site=consumer_site,
            lti_id="an other lti id",
        )
        # Defining both consumer_site and lti_id is allowed
        PlaylistFactory(
            consumer_site=consumer_site,
            lti_id="allowed with consumer site",
            organization=None,
        )

        # Defining an organization without consumer_site and lti_id is allowed
        PlaylistFactory(organization=organization, consumer_site=None, lti_id=None)

        # Having multiple playlist without lti_id and consumer_site but with an
        # organization is allowed
        PlaylistFactory.create_batch(
            4, organization=organization, consumer_site=None, lti_id=None
        )
