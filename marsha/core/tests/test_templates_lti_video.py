"""Test the LTI interconnection with Open edX."""

from django.shortcuts import render
from django.test import RequestFactory, TestCase


# We don't enforce arguments documentation in tests
# pylint: disable=missing-param-doc,missing-type-doc,unused-argument


class VideoLTITemplatesTestCase(TestCase):
    """Test the LTI provider endpoint to upload and view videos."""

    def test_lti_video_launch_request_render_context(self):
        """The context should be rendered to html on the launch request page."""
        request = RequestFactory().get("/")

        policy = {"a": 1, "b": 2}
        response = render(
            request,
            "core/lti_video.html",
            {
                "policy": policy,
                "state": "s",
                "resource_link_id": "rli",
                "jwt_token": "jwt",
            },
        )
        self.assertContains(
            response,
            (
                '<div class="marsha-frontend-data" data-jwt="jwt"'
                'data-resource-link-id="rli" data-state="s"></div>'
            ),
            html=True,
        )
        self.assertContains(
            response,
            '<div class="marsha-frontend-data" id="policy" data-a="1" data-b="2"></div>',
            html=True,
        )
