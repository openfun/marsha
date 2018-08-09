"""Test the LTI interconnection with Open edX."""
from datetime import datetime
from unittest import mock

from django.test import RequestFactory, TestCase

from ..lti import LTI
from ..views import VideoLTIView


# We don't enforce arguments documentation in tests
# pylint: disable=missing-param-doc,missing-type-doc,unused-argument


class ViewsTestCase(TestCase):
    """Test the views in the ``core`` app of the Marsha project."""

    def setUp(self):
        """Override the setUp method to instanciate and serve a request factory."""
        super().setUp()
        self.factory = RequestFactory()

    @mock.patch.object(LTI, "verify", return_value=True)
    def test_views_video_lti_instructor(self, mock_initialize):
        """."""
        view = VideoLTIView()
        view.request = self.factory.post(
            "/", {"resource_link_id": "123", "roles": "instructor"}
        )
        with mock.patch(
            "rest_framework_simplejwt.tokens.aware_utcnow",
            return_value=datetime(2015, 5, 5),
        ):
            context = view.get_context_data()
        self.assertEqual(
            context,
            {
                "jwt_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNz"
                "IiwiZXhwIjoxNDMwODcwNDAwLCJqdGkiOiIxMjMifQ.mePJBhus9BIP9NrspCeVvxuu3EItD23YKlO"
                "ZRmBSpew",
                "state": "instructor",
                "resource_link_id": "123",
            },
        )

    @mock.patch.object(LTI, "verify", return_value=True)
    def test_views_video_lti_student(self, mock_initialize):
        """."""
        view = VideoLTIView()
        view.request = self.factory.post(
            "/", {"resource_link_id": "123", "roles": "student"}
        )
        context = view.get_context_data()
        self.assertEqual(context, {"state": "student", "resource_link_id": "123"})
