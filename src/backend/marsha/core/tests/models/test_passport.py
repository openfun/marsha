"""Tests for the models in the ``core`` app of the Marsha project."""
from django.core.exceptions import ValidationError
from django.test import TestCase

from safedelete.models import HARD_DELETE

from marsha.core.factories import (
    ConsumerSiteFactory,
    ConsumerSiteLTIPassportFactory,
    PlaylistFactory,
    PlaylistLTIPassportFactory,
)
from marsha.core.models import LTIPassport


class LTIPassportModelsTestCase(TestCase):
    """Test our intentions about the passport model."""

    def test_models_lti_passport_str(self):
        """The str method should display oauth consumer key, scope and soft deletion."""
        cs_passport = ConsumerSiteLTIPassportFactory(oauth_consumer_key="clé_cs")
        self.assertEqual(str(cs_passport), "clé_cs [cs]")

        pl_passport = PlaylistLTIPassportFactory(oauth_consumer_key="clé_pl")
        self.assertEqual(str(pl_passport), "clé_pl [pl]")

        pl_passport.delete()
        self.assertEqual(str(pl_passport), "clé_pl [pl][deleted]")

    def test_models_lti_passport_fields_playlist_or_consumer_site_required(self):
        """Creating an LTIPassport requires either a consumer site or a playlist."""
        with self.assertRaises(ValidationError) as context:
            LTIPassport.objects.create()
        self.assertEqual(
            context.exception.messages,
            ["You must set either a Consumer Site or a Playlist."],
        )

    def test_models_lti_passport_fields_playlist(self):
        """It should be possible to create an LTIPassport with just a playlist.

        The "oauth_consumer_key" and "shared_secret" fields are auto-generated,
        The "is_enabled" flag defaults to True.
        """
        playlist = PlaylistFactory()
        lti_passport = LTIPassport.objects.create(playlist=playlist)
        self.assertIsNone(lti_passport.consumer_site)
        self.assertEqual(len(lti_passport.oauth_consumer_key), 20)
        self.assertEqual(len(lti_passport.shared_secret), 40)
        self.assertTrue(lti_passport.is_enabled)

    def test_models_lti_passport_fields_consumer_site(self):
        """It should be possible to create an LTIPassport with just a consumer site.

        The "oauth_consumer_key" and "shared_secret" fields are auto-generated,
        The "is_enabled" flag defaults to True.
        """
        consumer_site = ConsumerSiteFactory()
        lti_passport = LTIPassport.objects.create(consumer_site=consumer_site)
        self.assertIsNone(lti_passport.playlist)
        self.assertEqual(len(lti_passport.oauth_consumer_key), 20)
        self.assertEqual(len(lti_passport.shared_secret), 40)
        self.assertTrue(lti_passport.is_enabled)

    def test_models_lti_passport_fields_playlist_and_consumer_site_both(self):
        """Creating an LTIPassport with both playlist and consumer site should raise an error."""
        consumer_site = ConsumerSiteFactory()
        playlist = PlaylistFactory()
        with self.assertRaises(ValidationError) as context:
            LTIPassport.objects.create(consumer_site=consumer_site, playlist=playlist)
        self.assertEqual(
            context.exception.messages,
            ["You should set either a Consumer Site or a Playlist, but not both."],
        )

    def test_models_lti_passport_fields_oauth_consumer_key_unique(self):
        """The "oauth_consumer_key" field should be unique."""
        lti_passport = ConsumerSiteLTIPassportFactory()

        with self.assertRaises(ValidationError) as context:
            ConsumerSiteLTIPassportFactory(
                oauth_consumer_key=lti_passport.oauth_consumer_key
            )
        self.assertEqual(
            context.exception.messages,
            ["LTI passport with this Oauth consumer key already exists."],
        )

    def test_models_lti_passport_fields_oauth_consumer_key_unique_deleted(self):
        """The "oauth_consumer_key" field should even be unique including the deleted instances."""
        lti_passport = ConsumerSiteLTIPassportFactory()
        oauth_consumer_key = lti_passport.oauth_consumer_key
        lti_passport.delete()
        self.assertIsNotNone(
            LTIPassport.objects.all_with_deleted().get(pk=lti_passport.pk).deleted
        )

        with self.assertRaises(ValidationError) as context:
            ConsumerSiteLTIPassportFactory(oauth_consumer_key=oauth_consumer_key)
        self.assertEqual(
            context.exception.messages,
            ["LTI passport with this Oauth consumer key already exists."],
        )

    def test_models_lti_passport_fields_consumer_site_hard_delete(self):
        """The LTIPassport should not be deleted if the related consumer site is hard deleted."""
        lti_passport = ConsumerSiteLTIPassportFactory()
        lti_passport.consumer_site.delete(force_policy=HARD_DELETE)
        lti_passport = LTIPassport.objects.get(pk=lti_passport.pk)
        self.assertIsNone(lti_passport.consumer_site)

    def test_models_lti_passport_fields_playlist_hard_delete(self):
        """The LTIPassport should not be deleted if the related consumer site is hard deleted."""
        lti_passport = PlaylistLTIPassportFactory()
        lti_passport.playlist.delete(force_policy=HARD_DELETE)
        lti_passport = LTIPassport.objects.get(pk=lti_passport.pk)
        self.assertIsNone(lti_passport.playlist)
