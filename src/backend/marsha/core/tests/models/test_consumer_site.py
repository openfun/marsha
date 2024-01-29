"""Tests for the models in the ``core`` app of the Marsha project."""

from django.core.exceptions import ValidationError
from django.test import TestCase

from marsha.core.factories import ConsumerSiteFactory


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


class ConsumerSiteModelsTestCase(TestCase):
    """Test our intentions about the ConsumerSite model."""

    def test_models_consumer_site_str(self):
        """The str method should display the name of the site and its eventual soft deletion."""
        consumer_site = ConsumerSiteFactory(name="là-bas", domain="marsha.education")
        self.assertEqual(str(consumer_site), "là-bas (marsha.education)")

        consumer_site.delete()
        self.assertEqual(str(consumer_site), "là-bas (marsha.education) [deleted]")

    def test_models_consumer_site_fields_name_max_length(self):
        """The name field should be limited to 50 characters."""
        ConsumerSiteFactory(name="a" * 50)
        with self.assertRaises(ValidationError) as context:
            ConsumerSiteFactory(name="a" * 51)
        self.assertEqual(
            context.exception.messages,
            ["Ensure this value has at most 50 characters (it has 51)."],
        )

    def test_models_consumer_site_fields_domain_max_length(self):
        """The domain field should be limited to 100 characters."""
        ConsumerSiteFactory(domain="a" * 100)
        with self.assertRaises(ValidationError) as context:
            ConsumerSiteFactory(domain="a" * 101)
        self.assertEqual(
            context.exception.messages,
            ["Ensure this value has at most 100 characters (it has 101)."],
        )

    def test_models_consumer_site_fields_domain_validator(self):
        """The domain field should not allow tabs or spaces."""
        for domain in ["a ", "a  "]:
            with self.assertRaises(ValidationError) as context:
                ConsumerSiteFactory(domain=domain)
            self.assertEqual(
                context.exception.messages,
                ["The domain name cannot contain any spaces or tabs."],
            )
