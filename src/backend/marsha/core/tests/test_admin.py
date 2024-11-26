"""Tests for the admin helpers in the ``core`` app of the Marsha project."""

from django.db import models
from django.test import TestCase
from django.urls import NoReverseMatch

from marsha.core.admin import display_human_duration, display_human_size, link_field
from marsha.core.factories import (
    ConsumerSiteLTIPassportFactory,
    PlaylistLTIPassportFactory,
)
from marsha.core.models import BaseModel


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


class AdminTestCase(TestCase):
    """Test all admin helpers."""

    def test_link_field_no_linked_object(self):
        """Assert `link_field` works properly when no instance is linked."""

        lti_passport_no_playlist = ConsumerSiteLTIPassportFactory()
        self.assertEqual(link_field("playlist")(lti_passport_no_playlist), "-")

    def test_link_field_same_application(self):
        """Assert `link_field` works properly for models inside the same application."""

        # LTIPassport is in the same application as its linked playlist
        lti_passport = PlaylistLTIPassportFactory()
        playlist = lti_passport.playlist

        self.assertEqual(
            link_field("playlist")(lti_passport),
            f'<a href="/admin/core/playlist/{playlist.pk}/change/">{str(playlist)}</a>',
        )

    def test_link_field_different_applications(self):
        """Assert `link_field` works properly for models in two different applications.

        Note: Can't easily mock Django URL resolver, so rely on the raised exception instead.
        """

        class AModel(BaseModel):  # pylint: disable=missing-class-docstring
            class Meta:
                app_label = "one_app"

        class BModel(BaseModel):  # pylint: disable=missing-class-docstring
            linked_object = models.ForeignKey(
                to=AModel,
                null=True,
                blank=True,
                on_delete=models.SET_NULL,
            )

            class Meta:
                app_label = "another_app"

        # Assert the admin URL for the AModel is properly reversed
        instance_with_linked_object = BModel(linked_object=AModel())
        with self.assertRaises(NoReverseMatch) as exc_context_mgr:
            link_field("linked_object")(instance_with_linked_object)
        reverse_exception = exc_context_mgr.exception
        self.assertIn("one_app_amodel_change", str(reverse_exception))

    def test_display_human_duration(self):
        """Assert `display_human_duration` works properly."""

        self.assertEqual(display_human_duration(0), "0:00:00")
        self.assertEqual(display_human_duration(1), "0:00:01")
        self.assertEqual(display_human_duration(60), "0:01:00")
        self.assertEqual(display_human_duration(61), "0:01:01")
        self.assertEqual(display_human_duration(3600), "1:00:00")
        self.assertEqual(display_human_duration(3661), "1:01:01")
        self.assertEqual(display_human_duration(7500), "2:05:00")
        self.assertEqual(display_human_duration(None), "-")

    def test_display_human_size(self):
        """Assert `display_human_size` works properly."""

        self.assertEqual(display_human_size(0), "0.00 B")
        self.assertEqual(display_human_size(1), "1.00 B")
        self.assertEqual(display_human_size(1024), "1.00 KB")
        self.assertEqual(display_human_size(1024**2), "1.00 MB")
        self.assertEqual(display_human_size(1024**3), "1.00 GB")
        self.assertEqual(display_human_size(1024**4), "1.00 TB")
        self.assertEqual(display_human_size(1024**5), "1.00 PB")
        self.assertEqual(display_human_size(None), "-")
