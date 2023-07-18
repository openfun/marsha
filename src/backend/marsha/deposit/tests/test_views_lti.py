"""Test the file LTI view."""
import html
import json
import random
import re
from unittest import mock
import uuid

from django.test import TestCase, override_settings

from marsha.core.factories import (
    ConsumerSiteAccessFactory,
    ConsumerSiteLTIPassportFactory,
    OrganizationAccessFactory,
    PlaylistAccessFactory,
    PlaylistFactory,
    UserFactory,
)
from marsha.core.lti import LTI
from marsha.core.simple_jwt.tokens import ResourceAccessToken
from marsha.core.tests.testing_utils import reload_urlconf
from marsha.core.tests.views.test_lti_base import BaseLTIViewForPortabilityTestCase
from marsha.core.utils.lti_select_utils import get_lti_select_resources

from ...core.models import ADMINISTRATOR
from ..factories import FileDepositoryFactory


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(DEPOSIT_ENABLED=True)
class FileDepositoryLTIViewTestCase(TestCase):
    """Test case for the file LTI view."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        get_lti_select_resources.cache_clear()

        # Force URLs reload to use DEPOSIT_ENABLED
        reload_urlconf()

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_file_depository_student(
        self, mock_get_consumer_site, mock_verify
    ):
        """Validate the response returned for a student request."""
        passport = ConsumerSiteLTIPassportFactory()
        file_depository = FileDepositoryFactory(
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__consumer_site=passport.consumer_site,
        )
        data = {
            "resource_link_id": file_depository.lti_id,
            "context_id": file_depository.playlist.lti_id,
            "roles": ["student"],
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
            "launch_presentation_locale": "fr",
        }

        mock_get_consumer_site.return_value = passport.consumer_site

        response = self.client.post(f"/lti/deposits/{file_depository.id}", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(html.unescape(match.group(1)))
        jwt_token = ResourceAccessToken(context.get("jwt"))
        self.assertEqual(context.get("state"), "success")
        self.assertIsNotNone(context.get("resource"))
        self.assertEqual(context.get("modelName"), "filedepositories")
        self.assertEqual(
            jwt_token.payload["user"],
            {
                "email": None,
                "username": "jane_doe",
                "user_fullname": None,
                "id": "56255f3807599c377bf0e5bf072359fd",
            },
        )
        self.assertTrue(context.get("flags").get("deposit"))

        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_file_depository_student_legacy(
        self, mock_get_consumer_site, mock_verify
    ):
        """Validate the response returned for a student request using the legacy
        /lti/filedepositories"""
        passport = ConsumerSiteLTIPassportFactory()
        file_depository = FileDepositoryFactory(
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__consumer_site=passport.consumer_site,
        )
        data = {
            "resource_link_id": file_depository.lti_id,
            "context_id": file_depository.playlist.lti_id,
            "roles": ["student"],
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
            "launch_presentation_locale": "fr",
        }

        mock_get_consumer_site.return_value = passport.consumer_site

        response = self.client.post(f"/lti/filedepositories/{file_depository.id}", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(html.unescape(match.group(1)))
        jwt_token = ResourceAccessToken(context.get("jwt"))
        self.assertEqual(context.get("state"), "success")
        self.assertIsNotNone(context.get("resource"))
        self.assertEqual(context.get("modelName"), "filedepositories")
        self.assertEqual(
            jwt_token.payload["user"],
            {
                "email": None,
                "username": "jane_doe",
                "user_fullname": None,
                "id": "56255f3807599c377bf0e5bf072359fd",
            },
        )
        self.assertTrue(context.get("flags").get("deposit"))

        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_file_depository_instructor_no_file_depository(
        self, mock_get_consumer_site, mock_verify
    ):
        """Validate the response returned for an instructor request when there is no file."""
        passport = ConsumerSiteLTIPassportFactory()
        data = {
            "resource_link_id": "example.com-123",
            "context_id": "course-v1:ufr+mathematics+00001",
            "roles": "instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
        }
        mock_get_consumer_site.return_value = passport.consumer_site

        response = self.client.post(f"/lti/deposits/{uuid.uuid4()}", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(html.unescape(match.group(1)))
        self.assertIsNotNone(context.get("jwt"))
        self.assertEqual(context.get("state"), "success")
        self.assertIsNotNone(context.get("resource"))
        self.assertEqual(context.get("modelName"), "filedepositories")

        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_file_depository_instructor_same_playlist(
        self, mock_get_consumer_site, mock_verify
    ):
        """Validate the format of the response returned by the view for an instructor request."""
        passport = ConsumerSiteLTIPassportFactory()
        file_depository = FileDepositoryFactory(
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__consumer_site=passport.consumer_site,
        )
        data = {
            "resource_link_id": file_depository.lti_id,
            "context_id": file_depository.playlist.lti_id,
            "roles": random.choice(["instructor", "administrator"]),
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
            "launch_presentation_locale": "fr",
        }

        mock_get_consumer_site.return_value = passport.consumer_site

        response = self.client.post(f"/lti/deposits/{file_depository.pk}", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(html.unescape(match.group(1)))
        jwt_token = ResourceAccessToken(context.get("jwt"))
        self.assertEqual(
            jwt_token.payload["resource_id"], str(file_depository.playlist.id)
        )
        self.assertEqual(
            jwt_token.payload["user"],
            {
                "email": None,
                "username": "jane_doe",
                "user_fullname": None,
                "id": "56255f3807599c377bf0e5bf072359fd",
            },
        )
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "fr_FR")
        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": True, "can_update": True},
        )
        self.assertEqual(context.get("state"), "success")
        self.assertIsNotNone(context.get("resource"))
        self.assertEqual(
            {
                "id": str(file_depository.id),
                "lti_id": str(file_depository.lti_id),
                "playlist": {
                    "id": str(file_depository.playlist_id),
                    "lti_id": str(file_depository.playlist.lti_id),
                    "title": file_depository.playlist.title,
                },
                "title": file_depository.title,
                "description": file_depository.description,
            },
            context.get("resource"),
        )
        self.assertEqual(context.get("modelName"), "filedepositories")
        self.assertEqual(context.get("appName"), "deposit")
        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    def test_views_lti_file_depository_get_request(
        self,
    ):
        """LTI GET request should not be allowed."""
        passport = ConsumerSiteLTIPassportFactory()
        file_depository = FileDepositoryFactory(
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__consumer_site=passport.consumer_site,
        )

        response = self.client.get(f"/lti/deposits/{file_depository.id}")

        self.assertEqual(response.status_code, 405)


class FileDepositoryLTIViewForPortabilityTestCase(BaseLTIViewForPortabilityTestCase):
    """Test the file_depository LTI view for portability."""

    expected_context_model_name = "filedepositories"  # resource.RESOURCE_NAME

    def _get_lti_view_url(self, resource):
        """Return the LTI view URL for the provided file depository."""
        return f"/lti/filedepositories/{resource.pk}"

    def test_views_lti_file_deposit_portability_for_playlist_without_owner(
        self,
    ):
        """
        Assert the application data does not provide portability information
        when playlist has no known owner
        and the authenticated user is an administrator or a teacher or a student.
        """
        file_depository = FileDepositoryFactory()

        self.assertLTIViewReturnsNoResourceForStudent(file_depository)
        self.assertLTIViewReturnsErrorForAdminOrInstructor(file_depository)

    def test_views_lti_file_deposit_portability_for_playlist_with_owner(self):
        """
        Assert the application data provides portability information
        when playlist has a creator
        and the authenticated user is an administrator or a teacher but not a student.
        """
        playlist_with_owner = PlaylistFactory(
            created_by=UserFactory(),
        )
        file_depository = FileDepositoryFactory(playlist=playlist_with_owner)

        self.assertLTIViewReturnsNoResourceForStudent(file_depository)
        self.assertLTIViewReturnsPortabilityContextForAdminOrInstructor(file_depository)

    def test_views_lti_file_deposit_portability_for_playlist_with_admin(self):
        """
        Assert the application data provides portability information
        when playlist has an administrator
        and the authenticated user is an administrator or a teacher but not a student.
        """
        playlist_access_admin = PlaylistAccessFactory(
            role=ADMINISTRATOR,
        )
        playlist_with_admin = playlist_access_admin.playlist
        file_depository = FileDepositoryFactory(playlist=playlist_with_admin)

        self.assertLTIViewReturnsNoResourceForStudent(file_depository)
        self.assertLTIViewReturnsPortabilityContextForAdminOrInstructor(file_depository)

    def test_views_lti_file_deposit_portability_for_playlist_with_organization_admin(
        self,
    ):
        """
        Assert the application data provides portability information
        when playlist's organization has an administrator
        and the authenticated user is an administrator or a teacher but not a student.
        """
        organization_access_admin = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist_with_organization_admin = PlaylistFactory(
            organization=organization_access_admin.organization,
        )
        file_depository = FileDepositoryFactory(
            playlist=playlist_with_organization_admin
        )

        self.assertLTIViewReturnsNoResourceForStudent(file_depository)
        self.assertLTIViewReturnsPortabilityContextForAdminOrInstructor(file_depository)

    def test_views_lti_file_deposit_portability_for_playlist_with_consumer_site_admin(
        self,
    ):
        """
        Assert the application data provides portability information
        when playlist's consumer site has an administrator
        and the authenticated user is an administrator or a teacher but not a student.
        """
        consumer_site_access_admin = ConsumerSiteAccessFactory(
            role=ADMINISTRATOR,
        )
        playlist_with_consumer_site_admin = PlaylistFactory(
            consumer_site=consumer_site_access_admin.consumer_site,
        )
        file_depository = FileDepositoryFactory(
            playlist=playlist_with_consumer_site_admin
        )

        self.assertLTIViewReturnsNoResourceForStudent(file_depository)
        self.assertLTIViewReturnsPortabilityContextForAdminOrInstructor(file_depository)
