"""Tests for the models in the ``core`` app of the Marsha project."""

from django.core.exceptions import ValidationError
from django.test import TestCase

from marsha.core.factories import LivePairingFactory
from marsha.core.models import LivePairing


class LivePairingModelsTestCase(TestCase):
    """Test our intentions about the LivePairing model."""

    def test_models_live_pairing_str(self):
        """The str method should display the title of the video."""
        live_pairing = LivePairingFactory(video__title="j'espère")
        self.assertEqual(str(live_pairing), "j'espère")

    def test_models_live_pairing_deleted(self):
        """A LivePairing should be hard deleted."""
        live_pairing = LivePairingFactory()

        live_pairing.delete()
        with self.assertRaises(LivePairing.DoesNotExist):
            live_pairing.refresh_from_db()

    def test_models_live_pairing_secret_uniqueness(self):
        """A LivePairing secret should be unique."""
        LivePairingFactory(secret="123456")

        with self.assertRaises(ValidationError) as context:
            LivePairingFactory(secret="123456")
        self.assertEqual(
            {"secret": ["Live pairing with this Secret already exists."]},
            context.exception.message_dict,
        )

    def test_models_live_pairing_secret_generator(self):
        """The secret_generator should return a 6 digit string.

        The secret should not exist in existing_secrets parameter."""
        # Generate a list of all 6 digits strings
        existing_secrets = list(str(i).zfill(6) for i in range(0, 1000000))
        # Remove one from the list
        existing_secrets.remove("123456")

        # Ensure removed secret has been found and used
        secret = LivePairing.secret_generator(existing_secrets)
        self.assertEqual(secret, "123456")
