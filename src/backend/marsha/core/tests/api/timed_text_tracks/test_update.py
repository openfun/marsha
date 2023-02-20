"""Tests for the TimedTextTrack update API of the Marsha project."""
import json

from django.test import TestCase

from marsha.core import factories, models
from marsha.core.factories import TimedTextTrackFactory, VideoFactory
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    UserAccessTokenFactory,
)


class TimedTextTrackUpdateAPITest(TestCase):
    """Test the update API of the timed text track object."""

    maxDiff = None

    def test_api_timed_text_track_update_detail_anonymous(self):
        """Anonymous users should not be allowed to update a timed_text_track through the API."""
        timed_text_track = TimedTextTrackFactory(language="fr")
        data = {"language": "en", "size": 10}
        response = self.client.put(
            f"/api/timedtexttracks/{timed_text_track.id}/",
            json.dumps(data),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)
        timed_text_track.refresh_from_db()
        self.assertEqual(timed_text_track.language, "fr")

    def test_api_timed_text_track_update_detail_token_user_language(self):
        """Token users should be able to update the language of their timed_text_track."""
        timed_text_track = TimedTextTrackFactory(language="fr")
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=timed_text_track.video)

        response = self.client.get(
            f"/api/timedtexttracks/{timed_text_track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        data = json.loads(response.content)
        data["language"] = "en"
        response = self.client.put(
            f"/api/timedtexttracks/{timed_text_track.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        timed_text_track.refresh_from_db()
        self.assertEqual(timed_text_track.language, "en")

    def test_api_timed_text_track_update_detail_token_user_closed_captioning(self):
        """Token users should be able to update the mode flag through the API."""
        timed_text_track = TimedTextTrackFactory(mode="cc")
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=timed_text_track.video)

        response = self.client.get(
            f"/api/timedtexttracks/{timed_text_track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        data = json.loads(response.content)
        data["mode"] = "ts"
        response = self.client.put(
            f"/api/timedtexttracks/{timed_text_track.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        timed_text_track.refresh_from_db()
        self.assertEqual(timed_text_track.mode, "ts")

    def test_api_timed_text_track_update_detail_token_user_active_stamp(self):
        """Token users trying to update "active_stamp" through the API should be ignored."""
        timed_text_track = TimedTextTrackFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=timed_text_track.video)

        response = self.client.get(
            f"/api/timedtexttracks/{timed_text_track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        data = json.loads(response.content)
        self.assertIsNone(data["active_stamp"])
        data["active_stamp"] = "1533686400"

        response = self.client.put(
            f"/api/timedtexttracks/{timed_text_track.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        timed_text_track.refresh_from_db()
        self.assertIsNone(timed_text_track.uploaded_on)

    def test_api_timed_text_track_update_detail_token_user_upload_state(self):
        """Token users trying to update "upload_state" through the API should be ignored."""
        timed_text_track = TimedTextTrackFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=timed_text_track.video)

        response = self.client.get(
            f"/api/timedtexttracks/{timed_text_track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        data = json.loads(response.content)
        self.assertEqual(data["upload_state"], "pending")
        data["upload_state"] = "ready"

        response = self.client.put(
            f"/api/timedtexttracks/{timed_text_track.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        timed_text_track.refresh_from_db()
        self.assertEqual(timed_text_track.upload_state, "pending")

    def test_api_timed_text_track_update_instructor_in_read_only(self):
        """Instructor should not be able to update a timed text track in read_only mode."""
        timed_text_track = TimedTextTrackFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=timed_text_track.video,
            permissions__can_update=False,
        )

        response = self.client.put(
            f"/api/timedtexttracks/{timed_text_track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_timed_text_track_update_by_user_with_no_access(self):
        """
        Token user without any access updates a single timed text track.

        A user with a user token, without any specific access, cannot update
        a single timed text track.
        """
        track = factories.TimedTextTrackFactory(language="fr")

        jwt_token = UserAccessTokenFactory()

        response = self.client.get(
            f"/api/timedtexttracks/{track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        data = json.loads(response.content)
        data["language"] = "en"

        response = self.client.put(
            f"/api/timedtexttracks/{track.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        track.refresh_from_db()
        self.assertEqual(track.language, "fr")

    def test_api_timed_text_track_update_by_video_playlist_instructor(self):
        """
        Playlist instructor token user updates a timed text track.

        A user with a user token, who is a playlist instructor, can update
        a timed text track for a video that belongs to that playlist.
        """
        user = factories.UserFactory()
        # A playlist where the user is an instructor, with a video
        playlist = factories.PlaylistFactory()
        video = factories.VideoFactory(playlist=playlist)
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.INSTRUCTOR
        )
        track = factories.TimedTextTrackFactory(language="fr", video=video)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/timedtexttracks/{track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        data = response.json()
        data["language"] = "en"

        response = self.client.put(
            f"/api/timedtexttracks/{track.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        track.refresh_from_db()
        self.assertEqual(track.language, "en")

    def test_api_timed_text_track_update_by_video_playlist_admin(self):
        """
        Playlist administrator token user updates a timed text track.

        A user with a user token, who is a playlist administrator, can update
        a timed text track for a video that belongs to that playlist.
        """
        user = factories.UserFactory()
        # A playlist where the user is an administrator, with a video
        playlist = factories.PlaylistFactory()
        video = factories.VideoFactory(playlist=playlist)
        factories.PlaylistAccessFactory(
            user=user, playlist=playlist, role=models.ADMINISTRATOR
        )
        track = factories.TimedTextTrackFactory(language="fr", video=video)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/timedtexttracks/{track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        data = response.json()
        data["language"] = "en"

        response = self.client.put(
            f"/api/timedtexttracks/{track.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        track.refresh_from_db()
        self.assertEqual(track.language, "en")

    def test_api_timed_text_track_update_by_video_organization_instructor(self):
        """
        Organization instructor token user updates a timed text track.

        A user with a user token, who is an organization instructor, cannot update
        a timed text track for a video that belongs to that organization.
        """
        user = factories.UserFactory()
        # An organization where the user is an instructor, with a video
        organization = factories.OrganizationFactory()
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist)
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.INSTRUCTOR
        )
        track = factories.TimedTextTrackFactory(language="fr", video=video)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/timedtexttracks/{track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        data = json.loads(response.content)
        data["language"] = "en"

        response = self.client.put(
            f"/api/timedtexttracks/{track.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        track.refresh_from_db()
        self.assertEqual(track.language, "fr")

    def test_api_timed_text_track_update_by_video_organization_admin(self):
        """
        Organization administrator token user updates a timed text track.

        A user with a user token, who is an organization administrator, can update
        a timed text track for a video that belongs to that organization.
        """
        user = factories.UserFactory()
        # An organization where the user is an administrator, with a video
        organization = factories.OrganizationFactory()
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist)
        factories.OrganizationAccessFactory(
            user=user, organization=organization, role=models.ADMINISTRATOR
        )
        track = factories.TimedTextTrackFactory(language="fr", video=video)

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/timedtexttracks/{track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        data = json.loads(response.content)
        data["language"] = "en"

        response = self.client.put(
            f"/api/timedtexttracks/{track.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        track.refresh_from_db()
        self.assertEqual(track.language, "en")

    def test_api_timed_text_track_patch_detail_token_user_stamp_and_state(self):
        """Token users should not be able to patch upload state and active stamp.

        These 2 fields can only be updated by AWS via the separate update-state API endpoint.
        """
        timed_text_track = TimedTextTrackFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=timed_text_track.video)
        self.assertEqual(timed_text_track.upload_state, "pending")
        self.assertIsNone(timed_text_track.uploaded_on)

        data = {"active_stamp": "1533686400", "upload_state": "ready"}

        response = self.client.patch(
            f"/api/timedtexttracks/{timed_text_track.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        timed_text_track.refresh_from_db()
        self.assertIsNone(timed_text_track.uploaded_on)
        self.assertEqual(timed_text_track.upload_state, "pending")

    def test_api_timed_text_track_update_detail_token_id(self):
        """Token users trying to update the ID of a timed text track they own should be ignored."""
        timed_text_track = TimedTextTrackFactory()
        original_id = timed_text_track.id
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=timed_text_track.video)

        response = self.client.get(
            f"/api/timedtexttracks/{timed_text_track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        data = json.loads(response.content)
        data["id"] = "my new id"

        response = self.client.put(
            f"/api/timedtexttracks/{timed_text_track.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        timed_text_track.refresh_from_db()
        self.assertEqual(timed_text_track.id, original_id)

    def test_api_timed_text_track_update_detail_token_video(self):
        """Token users trying to update the video of a timed text track should be ignored."""
        timed_text_track = TimedTextTrackFactory()
        original_video = timed_text_track.video
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=timed_text_track.video)

        response = self.client.get(
            f"/api/timedtexttracks/{timed_text_track.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        data = json.loads(response.content)
        data["video"] = str(VideoFactory().id)

        response = self.client.put(
            f"/api/timedtexttracks/{timed_text_track.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        timed_text_track.refresh_from_db()
        self.assertEqual(timed_text_track.video, original_video)

    def test_api_timed_text_track_update_detail_token_user_other_video(self):
        """Token users are not allowed to update a timed text track related to another video."""
        other_video = VideoFactory()
        timed_text_track_update = TimedTextTrackFactory(language="en")
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=other_video)

        data = {"language": "fr", "size": 10}
        response = self.client.put(
            f"/api/timedtexttracks/{timed_text_track_update.id}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        timed_text_track_update.refresh_from_db()
        self.assertEqual(timed_text_track_update.language, "en")
