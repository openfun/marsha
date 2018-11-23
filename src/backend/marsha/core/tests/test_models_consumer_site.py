"""Tests for the models in the ``core`` app of the Marsha project."""
from django.test import TestCase

from ..factories import ConsumerSiteFactory


# We don't enforce arguments documentation in tests
# pylint: disable=missing-param-doc,missing-type-doc,unused-argument


class ConsumerSiteModelsTestCase(TestCase):
    """Test our intentions about the ConsumerSite model."""

    def test_models_consumer_site_str(self):
        """The str method should display the name of the site and its eventual soft deletion."""
        consumer_site = ConsumerSiteFactory(name="là-bas", domain="marsha.education")
        self.assertEqual(str(consumer_site), "là-bas (marsha.education)")

        consumer_site.delete()
        self.assertEqual(str(consumer_site), "là-bas (marsha.education) [deleted]")
