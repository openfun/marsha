"""Tests for the models in the ``core`` app of the Marsha project."""

from django.test import TestCase

from marsha.core.factories import SiteConfigFactory


class SiteConfigModelsTestCase(TestCase):
    """Test our intentions about the SiteConfig model."""

    def test_models_marsha_site_str(self):
        """The str method should display the site name"""
        site = SiteConfigFactory(site__name="Marsha site")
        self.assertEqual(str(site), "Config associated to: Marsha site")
