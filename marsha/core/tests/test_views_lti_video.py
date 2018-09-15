"""Test the LTI interconnection with Open edX."""
from unittest import mock

from django.test import RequestFactory, TestCase

from rest_framework_simplejwt.state import token_backend

from ..factories import VideoFactory
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
        """Validate the context returned for an instructor request."""
        video = VideoFactory(
            lti_id="123",
            playlist__lti_id="abc",
            playlist__consumer_site__name="example.com",
        )
        view = VideoLTIView()
        view.request = self.factory.post(
            "/",
            {
                "resource_link_id": "123",
                "roles": "instructor",
                "context_id": "abc",
                "tool_consumer_instance_guid": "example.com",
            },
        )

        context = view.get_context_data()

        jwt_token = context.pop("jwt_token")
        decoded_token = token_backend.decode(jwt_token)
        self.assertEqual(decoded_token["video_id"], str(video.id))

        self.assertEqual(set(context.keys()), {"state", "video"})
        self.assertEqual(context["state"], "instructor")
        self.assertEqual(context["video"]["id"], str(video.id))
        self.assertEqual(context["video"]["title"], str(video.title))
        self.assertEqual(context["video"]["description"], str(video.description))
        self.assertIsNone(context["video"]["urls"])

    @mock.patch.object(LTI, "verify", return_value=True)
    def test_views_video_lti_student(self, mock_initialize):
        """Validate the context returned for a student request."""
        video = VideoFactory(
            lti_id="123",
            playlist__lti_id="abc",
            playlist__consumer_site__name="example.com",
        )
        view = VideoLTIView()
        view.request = self.factory.post(
            "/",
            {
                "resource_link_id": "123",
                "roles": "student",
                "context_id": "abc",
                "tool_consumer_instance_guid": "example.com",
            },
        )
        context = view.get_context_data()
        self.assertEqual(set(context.keys()), {"state", "video"})
        self.assertEqual(context["state"], "student")
        self.assertEqual(context["video"]["id"], str(video.id))
        self.assertEqual(context["video"]["title"], str(video.title))
        self.assertEqual(context["video"]["description"], str(video.description))
        self.assertIsNone(context["video"]["urls"])
