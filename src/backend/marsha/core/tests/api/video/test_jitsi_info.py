"""Test endpoint to fetch jitsi info for a specific video."""
from django.test import TestCase, override_settings

import jwt

from marsha.core.defaults import JITSI, RAW, RUNNING
from marsha.core.factories import (
    OrganizationAccessFactory,
    PlaylistAccessFactory,
    PlaylistFactory,
    UserFactory,
    VideoFactory,
)
from marsha.core.models.account import ADMINISTRATOR, STUDENT
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)


class VideoJitsiInfoTest(TestCase):
    """Test video jitsi info endpoint."""

    def test_jitsi_info_anonymous(self):
        """An anonymous user can not fetch jitsi info."""

        video = VideoFactory(live_state=RUNNING, live_type=JITSI)

        response = self.client.get(f"/api/videos/{video.id}/jitsi/")
        self.assertEqual(response.status_code, 401)

    def test_jitsi_info_for_a_student(self):
        """A student user can not fetch jitsi info."""
        video = VideoFactory(live_state=RUNNING, live_type=JITSI)
        jwt_token = StudentLtiTokenFactory(playlist=video.playlist)

        response = self.client.get(
            f"/api/videos/{video.id}/jitsi/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_jitsi_info_for_an_admin(self):
        """
        An instructor or an adminstrator with a resource token should be able to fetch jitsi info.
        """
        video = VideoFactory(live_state=RUNNING, live_type=JITSI)
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)

        response = self.client.get(
            f"/api/videos/{video.id}/jitsi/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        content = response.json()

        self.assertNotIn("token", content)
        self.assertEqual(
            content,
            {
                "config_overwrite": {},
                "domain": "meet.jit.si",
                "external_api_url": "https://meet.jit.si/external_api.js",
                "interface_config_overwrite": {},
                "room_name": str(video.id),
            },
        )

    @override_settings(JITSI_JWT_APP_ID="marsha")
    @override_settings(JITSI_JWT_APP_SECRET="secret")
    def test_jitsi_info_for_an_admin_moderator_not_specified(self):
        """
        An instructor or an adminstrator with a resource token should be able to fetch jitsi info.
        When the moderator query string is not specified, the False value should be used.
        """
        video = VideoFactory(live_state=RUNNING, live_type=JITSI)
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)

        response = self.client.get(
            f"/api/videos/{video.id}/jitsi/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        content = response.json()

        self.assertIn("token", content)
        token = content.pop("token")
        self.assertEqual(
            content,
            {
                "config_overwrite": {},
                "domain": "meet.jit.si",
                "external_api_url": "https://meet.jit.si/external_api.js",
                "interface_config_overwrite": {},
                "room_name": str(video.id),
            },
        )

        decoded_token = jwt.decode(
            token, key="secret", options={"verify_signature": False}
        )
        self.assertFalse(decoded_token["moderator"])
        self.assertEqual(
            decoded_token["context"]["user"],
            {
                "affiliation": "member",
            },
        )

    @override_settings(JITSI_JWT_APP_ID="marsha")
    @override_settings(JITSI_JWT_APP_SECRET="secret")
    def test_jitsi_info_admin_user_moderator_false_specified(self):
        """
        An instructor or an adminstrator with a resource token should be able to fetch jitsi info.
        When the moderator query string is specified and set to False, the token parameter should
        not be in the response.
        """
        video = VideoFactory(live_state=RUNNING, live_type=JITSI)
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)

        response = self.client.get(
            f"/api/videos/{video.id}/jitsi/?moderator=false",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        content = response.json()

        self.assertIn("token", content)
        token = content.pop("token")
        self.assertEqual(
            content,
            {
                "config_overwrite": {},
                "domain": "meet.jit.si",
                "external_api_url": "https://meet.jit.si/external_api.js",
                "interface_config_overwrite": {},
                "room_name": str(video.id),
            },
        )

        decoded_token = jwt.decode(
            token, key="secret", options={"verify_signature": False}
        )
        self.assertFalse(decoded_token["moderator"])
        self.assertEqual(
            decoded_token["context"]["user"],
            {
                "affiliation": "member",
            },
        )

    @override_settings(JITSI_JWT_APP_ID="marsha")
    @override_settings(JITSI_JWT_APP_SECRET="secret")
    def test_jitsi_info_admin_user_moderator_true_specified(self):
        """
        An instructor or an adminstrator with a resource token should be able to fetch jitsi info.
        When the moderator query string is specified and set to True, the token parameter should
        be in the response.
        """
        video = VideoFactory(live_state=RUNNING, live_type=JITSI)
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)

        response = self.client.get(
            f"/api/videos/{video.id}/jitsi/?moderator=true",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        content = response.json()

        self.assertIn("token", content)
        token = content.pop("token")
        self.assertEqual(
            content,
            {
                "config_overwrite": {},
                "domain": "meet.jit.si",
                "external_api_url": "https://meet.jit.si/external_api.js",
                "interface_config_overwrite": {},
                "room_name": str(video.id),
            },
        )

        decoded_token = jwt.decode(
            token, key="secret", options={"verify_signature": False}
        )
        self.assertTrue(decoded_token["moderator"])
        self.assertEqual(
            decoded_token["context"]["user"],
            {
                "affiliation": "owner",
            },
        )

    def test_jitsi_info_playlist_admin(self):
        """
        An administrator playlist can access to the jitsi info endpoint
        """

        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        video = VideoFactory(
            live_state=RUNNING, live_type=JITSI, playlist=playlist_access.playlist
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        response = self.client.get(
            f"/api/videos/{video.id}/jitsi/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        content = response.json()

        self.assertNotIn("token", content)
        self.assertEqual(
            content,
            {
                "config_overwrite": {},
                "domain": "meet.jit.si",
                "external_api_url": "https://meet.jit.si/external_api.js",
                "interface_config_overwrite": {},
                "room_name": str(video.id),
            },
        )

    def test_jisti_info_orga_admin(self):
        """
        An organization admin can access to the jitsi info endpoint
        """
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist = PlaylistFactory(organization=organization_access.organization)

        video = VideoFactory(live_state=RUNNING, live_type=JITSI, playlist=playlist)

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.get(
            f"/api/videos/{video.id}/jitsi/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        content = response.json()

        self.assertNotIn("token", content)
        self.assertEqual(
            content,
            {
                "config_overwrite": {},
                "domain": "meet.jit.si",
                "external_api_url": "https://meet.jit.si/external_api.js",
                "interface_config_overwrite": {},
                "room_name": str(video.id),
            },
        )

    def test_jisti_info_user_not_admin_can_not_access_jitsi_info(self):
        """
        A user with student role can not access to the jitsi info endpoint
        """
        user = UserFactory()
        playlist_access = PlaylistAccessFactory(user=user, role=STUDENT)
        video = VideoFactory(
            live_state=RUNNING, live_type=JITSI, playlist=playlist_access.playlist
        )

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/videos/{video.id}/jitsi/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_jitsi_info_on_non_live_video(self):
        """
        Fetching jitsi info on a video that is not a live should fail.
        """

        video = VideoFactory(live_state=None, live_type=None)
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)

        response = self.client.get(
            f"/api/videos/{video.id}/jitsi/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)

    def test_jitsi_info_on_live_not_jitsi(self):
        """
        Fetching jitsi info on a live that is not jitsi type should fail.
        """

        video = VideoFactory(live_state=RUNNING, live_type=RAW)
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)

        response = self.client.get(
            f"/api/videos/{video.id}/jitsi/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
