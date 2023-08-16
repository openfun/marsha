"""Tests for the PortabilityRequest create API."""
import json
from uuid import uuid4

from django.test import TestCase

from marsha.core.factories import (
    ConsumerSiteFactory,
    LtiUserAssociationFactory,
    PlaylistFactory,
    UploadedVideoFactory,
    UserFactory,
)
from marsha.core.models import PortabilityRequest
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)


class PortabilityRequestCreateAPITest(TestCase):
    """Testcase for the PortabilityRequest create API."""

    maxDiff = None

    def assertCreatePostFails(self, jwt_token, data, expected_json, expected_count=0):
        """Assert the POST request for portability request create fails."""
        response = self.client.post(
            "/api/portability-requests/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
            data=json.dumps(data),
        )

        self.assertEqual(response.status_code, 400)  # Bad Request
        self.assertEqual(PortabilityRequest.objects.count(), expected_count)
        self.assertEqual(
            response.json(),
            expected_json,
        )

    def test_create_portability_request_by_anonymous_user(self):
        """Anonymous users cannot create portability request."""
        video = UploadedVideoFactory()

        self.assertEqual(PortabilityRequest.objects.count(), 0)

        response = self.client.post(
            "/api/portability-requests/",
            content_type="application/json",
            data=json.dumps(
                {
                    "for_playlist": str(video.playlist_id),
                    "from_playlist": None,  # not mandatory for 401 test
                    "from_lti_consumer_site": None,  # not mandatory for 401 test
                    "from_lti_user_id": None,  # not mandatory for 401 test
                }
            ),
        )

        self.assertEqual(response.status_code, 401)  # Unauthorized
        self.assertEqual(PortabilityRequest.objects.count(), 0)

    def test_create_api_portability_request_from_site_user(self):
        """
        A user from the marsha standalone site should not be able to create
        a portability request.
        """

        video = UploadedVideoFactory()
        jwt_token = UserAccessTokenFactory()

        response = self.client.post(
            "/api/portability-requests/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
            data=json.dumps(
                {
                    "for_playlist": str(video.playlist_id),
                    "from_playlist": None,  # not mandatory for 403 test
                    "from_lti_consumer_site": None,  # not mandatory for 403 test
                    "from_lti_user_id": None,  # not mandatory for 403 test
                }
            ),
        )
        self.assertEqual(response.status_code, 403)  # Forbidden
        self.assertEqual(PortabilityRequest.objects.count(), 0)

    def test_create_api_portability_request_student(self):
        """
        A student should not be able to create a portability request.
        """

        video = UploadedVideoFactory()
        jwt_token = StudentLtiTokenFactory(resource=video.playlist)

        response = self.client.post(
            "/api/portability-requests/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
            data=json.dumps(
                {
                    "for_playlist": str(video.playlist_id),
                    "from_playlist": None,  # not mandatory for 403 test
                    "from_lti_consumer_site": None,  # not mandatory for 403 test
                    "from_lti_user_id": None,  # not mandatory for 403 test
                }
            ),
        )

        self.assertEqual(response.status_code, 403)  # Forbidden
        self.assertEqual(PortabilityRequest.objects.count(), 0)

    def test_create_api_portability_request_instructor_no_playlist(self):
        """
        An instructor should not be able to create a portability request
        when he has no access to the requesting playlist.
        """
        video = UploadedVideoFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=video.playlist)

        response = self.client.post(
            "/api/portability-requests/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
            data=json.dumps(
                {
                    "for_playlist": str(video.playlist_id),
                    "from_playlist": None,  # not mandatory for 403 test
                    "from_lti_consumer_site": None,  # not mandatory for 403 test
                    "from_lti_user_id": None,  # not mandatory for 403 test
                }
            ),
        )

        self.assertEqual(response.status_code, 403)  # Forbidden
        self.assertEqual(PortabilityRequest.objects.count(), 0)

    def test_create_api_portability_request_instructor_with_playlist(self):
        """
        An instructor should be able to create a portability request
        for his own playlist.
        """
        video = UploadedVideoFactory()

        consumer_site = ConsumerSiteFactory()
        destination_playlist = PlaylistFactory()
        lti_user_id = uuid4()
        jwt_token = InstructorOrAdminLtiTokenFactory(
            consumer_site=str(consumer_site.pk),
            port_to_playlist_id=str(destination_playlist.pk),
            resource=video.playlist,
            user__id=str(lti_user_id),
        )

        valid_data = {
            "for_playlist": str(video.playlist_id),
            "from_playlist": str(destination_playlist.pk),
            "from_lti_consumer_site": str(consumer_site.pk),
            "from_lti_user_id": str(lti_user_id),
        }

        response = self.client.post(
            "/api/portability-requests/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
            data=json.dumps(valid_data),
        )

        self.assertEqual(response.status_code, 201)  # Created
        self.assertEqual(PortabilityRequest.objects.count(), 1)
        portability_request = PortabilityRequest.objects.get()
        self.assertEqual(
            response.json(),
            {
                "created_on": portability_request.created_on.isoformat().replace(
                    "+00:00", "Z"
                ),
                "id": str(portability_request.pk),
                "for_playlist": {
                    "id": str(video.playlist.pk),  # important
                    "title": video.playlist.title,
                    "lti_id": video.playlist.lti_id,
                },
                "from_playlist": {
                    "id": str(destination_playlist.pk),  # important
                    "title": destination_playlist.title,
                    "lti_id": destination_playlist.lti_id,
                },
                "from_lti_consumer_site": {
                    "id": str(consumer_site.pk),
                    "domain": consumer_site.domain,
                    "name": consumer_site.name,
                },
                "from_lti_user_id": str(lti_user_id),
                "from_user": None,
                "state": "pending",
                "updated_by_user": None,
            },
        )

        # If the same data are POSTed again it fails
        self.assertCreatePostFails(
            jwt_token,
            valid_data,
            {
                "non_field_errors": [
                    "The fields for_playlist, from_playlist must make a unique set.",
                ],
            },
            expected_count=1,
        )

    def test_create_api_portability_request_instructor_with_associated_user(self):
        """
        An instructor should be able to create a portability request
        for his own playlist and the existing LTI user association must
        be used to fill the `from_user` field.
        """
        video = UploadedVideoFactory()

        consumer_site = ConsumerSiteFactory()
        destination_playlist = PlaylistFactory()
        lti_user_id = uuid4()
        jwt_token = InstructorOrAdminLtiTokenFactory(
            consumer_site=str(consumer_site.pk),
            port_to_playlist_id=str(destination_playlist.pk),
            resource=video.playlist,
            user__id=str(lti_user_id),
        )

        lti_user_association = LtiUserAssociationFactory(
            consumer_site=consumer_site,
            lti_user_id=str(lti_user_id).upper(),
        )

        valid_data = {
            "for_playlist": str(video.playlist_id),
            "from_playlist": str(destination_playlist.pk),
            "from_lti_consumer_site": str(consumer_site.pk),
            "from_lti_user_id": str(lti_user_id),
        }

        response = self.client.post(
            "/api/portability-requests/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
            data=json.dumps(valid_data),
        )

        self.assertEqual(response.status_code, 201)  # Created
        self.assertEqual(PortabilityRequest.objects.count(), 1)
        portability_request = PortabilityRequest.objects.get()
        self.assertEqual(
            response.json(),
            {
                "created_on": portability_request.created_on.isoformat().replace(
                    "+00:00", "Z"
                ),
                "id": str(portability_request.pk),
                "for_playlist": {
                    "id": str(video.playlist.pk),  # important
                    "title": video.playlist.title,
                    "lti_id": video.playlist.lti_id,
                },
                "from_playlist": {
                    "id": str(destination_playlist.pk),  # important
                    "title": destination_playlist.title,
                    "lti_id": destination_playlist.lti_id,
                },
                "from_lti_consumer_site": {
                    "id": str(consumer_site.pk),
                    "domain": consumer_site.domain,
                    "name": consumer_site.name,
                },
                "from_lti_user_id": str(lti_user_id),
                "from_user": {
                    "date_joined": lti_user_association.user.date_joined.strftime(
                        "%Y-%m-%dT%H:%M:%S.%fZ",
                    ),
                    "email": lti_user_association.user.email,
                    "full_name": "",
                    "id": str(lti_user_association.user.id),
                    "is_staff": False,
                    "is_superuser": False,
                    "organization_accesses": [],
                },
                "state": "pending",
                "updated_by_user": None,
            },
        )

    def test_create_api_portability_request_instructor_with_playlist_errors(self):
        """
        An instructor should not be able to create a portability request
        for his own playlist when posted data are different from ones in the JWT.
        """
        video = UploadedVideoFactory()

        consumer_site = ConsumerSiteFactory()
        destination_playlist = PlaylistFactory()
        lti_user_id = uuid4()
        jwt_token = InstructorOrAdminLtiTokenFactory(
            consumer_site=str(consumer_site.pk),
            port_to_playlist_id=str(destination_playlist.pk),
            resource=video.playlist,
            user__id=str(lti_user_id),
        )

        valid_data = {
            "for_playlist": str(video.playlist_id),
            "from_playlist": str(destination_playlist.pk),
            "from_lti_consumer_site": str(consumer_site.pk),
            "from_lti_user_id": str(lti_user_id),
        }

        # Test bad "from_playlist"
        other_playlist_not_related_to_jwt = PlaylistFactory()
        wrong_from_playlist_data = valid_data | {
            "from_playlist": str(other_playlist_not_related_to_jwt.pk),
        }
        self.assertCreatePostFails(
            jwt_token,
            wrong_from_playlist_data,
            ["Unexpected playlist"],
        )

        # Test bad "from_lti_consumer_site"
        other_consumer_site_not_related_to_jwt = ConsumerSiteFactory()
        wrong_from_lti_consumer_site_data = valid_data | {
            "from_lti_consumer_site": str(other_consumer_site_not_related_to_jwt.pk),
        }
        self.assertCreatePostFails(
            jwt_token,
            wrong_from_lti_consumer_site_data,
            ["Unexpected consumer site"],
        )

        # Test bad "from_lti_user_id"
        other_lti_user_id_not_related_to_jwt = uuid4()
        wrong_from_lti_user_id_data = valid_data | {
            "from_lti_user_id": str(other_lti_user_id_not_related_to_jwt),
        }
        self.assertCreatePostFails(
            jwt_token,
            wrong_from_lti_user_id_data,
            ["Unexpected user id"],
        )

        # Test provided `from_user` field
        wrong_from_user_data = valid_data | {
            "from_user": str(UserFactory().pk),
        }
        self.assertCreatePostFails(
            jwt_token,
            wrong_from_user_data,
            ["Unexpected provided user"],
        )
