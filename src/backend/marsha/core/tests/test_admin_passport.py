"""Tests for the models in the ``core`` app of the Marsha project."""
from django.test import TestCase
from django.urls import reverse
from django.utils.html import escape

from marsha.core.factories import PlaylistLTIPassportFactory, UserFactory


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


class LTIPassportAdminTestCase(TestCase):
    """Test our intentions about the passport model admin form."""

    def test_admin_lti_passport_fields_read_only(self):
        """Model fields "oauth_consumer_key" and "shared_secret" should be read only."""
        lti_passport = PlaylistLTIPassportFactory()
        user = UserFactory(is_staff=True, is_superuser=True)
        self.client.login(username=user.username, password="password")
        response = self.client.get(
            reverse("admin:core_ltipassport_change", args=[lti_passport.id])
        )
        self.assertContains(
            response,
            f"""<div class="readonly">{lti_passport.oauth_consumer_key}</div>""",
        )
        self.assertContains(
            response,
            f"""<div class="readonly">{escape(lti_passport.shared_secret)}</div>""",
        )
