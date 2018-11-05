"""Tests for the models in the ``core`` app of the Marsha project."""
from django.db import IntegrityError
from django.test import TestCase

from safedelete.models import HARD_DELETE

from ..factories import ConsumerSiteLTIPassportFactory, PlaylistLTIPassportFactory
from ..models import LTIPassport


# We don't enforce arguments documentation in tests
# pylint: disable=missing-param-doc,missing-type-doc,unused-argument


class LTIPassportModelsTestCase(TestCase):
    """Test our intentions about the passport model."""

    def test_models_lti_passport_fields_nothing_required(self):
        """The LTIPassport model can be instantiated without setting any field.

        In particular:
        - the "consumer_site" and "playlist" foreign keys are not required,
        - the "oauth_consumer_key" and "shared_secret" fields are auto-generated,
        - the "is_enabled" flag defaults to True.
        """
        lti_passport = LTIPassport.objects.create()
        self.assertIsNone(lti_passport.consumer_site)
        self.assertIsNone(lti_passport.playlist)
        self.assertEqual(len(lti_passport.oauth_consumer_key), 20)
        self.assertEqual(len(lti_passport.shared_secret), 40)
        self.assertTrue(lti_passport.is_enabled)

    def test_models_lti_passport_fields_oauth_consumer_key_unique(self):
        """The "oauth_consumer_key" field should be unique."""
        lti_passport = LTIPassport.objects.create()

        with self.assertRaises(IntegrityError):
            LTIPassport.objects.create(
                oauth_consumer_key=lti_passport.oauth_consumer_key
            )

    def test_models_lti_passport_fields_oauth_consumer_key_unique_deleted(self):
        """The "oauth_consumer_key" field should even be unique including the deleted instances."""
        lti_passport = LTIPassport.objects.create()
        oauth_consumer_key = lti_passport.oauth_consumer_key
        lti_passport.delete()
        self.assertIsNotNone(
            LTIPassport.objects.all_with_deleted().get(pk=lti_passport.pk).deleted
        )

        with self.assertRaises(IntegrityError):
            LTIPassport.objects.create(oauth_consumer_key=oauth_consumer_key)

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
