"""Tests for the livesession display_name API."""
import uuid

from marsha.core.factories import (
    AnonymousLiveSessionFactory,
    ConsumerSiteAccessFactory,
    LiveSessionFactory,
    OrganizationAccessFactory,
    OrganizationFactory,
    PlaylistAccessFactory,
    UserFactory,
    VideoFactory,
    WebinarVideoFactory,
)
from marsha.core.models import ADMINISTRATOR, INSTRUCTOR, STUDENT, LiveSession
from marsha.core.simple_jwt.factories import (
    LiveSessionLtiTokenFactory,
    LTIPlaylistAccessTokenFactory,
    PlaylistAccessTokenFactory,
    UserAccessTokenFactory,
)
from marsha.core.tests.api.live_sessions.base import LiveSessionApiTestCase


class LiveSessionDisplayNameApiTest(LiveSessionApiTestCase):
    """Test the display_name API of the liveSession object."""

    def _put_url(self, video):
        """Return the url to use in tests."""
        return f"/api/videos/{video.pk}/livesessions/display_name/"

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.organization = OrganizationFactory()
        cls.live = WebinarVideoFactory(playlist__organization=cls.organization)

    def assert_user_cannot_set_display_name(self, user, video):
        """Assert a user cannot set display name with a PUT request."""
        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.put(
            self._put_url(video),
            {"display_name": "Antoine"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def assert_user_can_set_display_name(self, user, video):
        """Assert a user can set display name with a PUT request."""
        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.put(
            self._put_url(video),
            {"display_name": "Antoine"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)

        response_data = response.json()
        self.assertEqual(
            response_data["display_name"],
            "Antoine",
        )

    def test_set_display_name_by_anonymous_user(self):
        """Anonymous users cannot set display name."""
        response = self.client.put(
            self._put_url(self.live),
            {"display_name": "Antoine"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)

    def test_set_display_name_by_random_logged_in_user(self):
        """
        Random logged-in users.

        Cannot set display name for playlist they have no role in.
        """
        user = UserFactory()

        self.assert_user_cannot_set_display_name(user, self.live)

    def test_set_display_name_by_organization_student(self):
        """Organization students cannot set display name."""
        organization_access = OrganizationAccessFactory(
            role=STUDENT,
            organization=self.organization,
        )

        self.assert_user_cannot_set_display_name(organization_access.user, self.live)

    def test_set_display_name_by_organization_instructor(self):
        """Organization instructors cannot set display name."""
        organization_access = OrganizationAccessFactory(
            role=INSTRUCTOR,
            organization=self.organization,
        )

        self.assert_user_cannot_set_display_name(organization_access.user, self.live)

    def test_set_display_name_by_organization_administrator(self):
        """Organization administrators can set display name."""
        organization_access = OrganizationAccessFactory(
            role=ADMINISTRATOR,
            organization=self.organization,
        )

        self.assert_user_can_set_display_name(organization_access.user, self.live)

    def test_set_display_name_by_consumer_site_any_role(self):
        """Consumer site roles cannot set display name."""
        consumer_site_access = ConsumerSiteAccessFactory(
            consumer_site=self.live.playlist.consumer_site,
        )

        self.assert_user_cannot_set_display_name(consumer_site_access.user, self.live)

    def test_set_display_name_by_playlist_student(self):
        """Playlist students can set display name."""
        playlist_access = PlaylistAccessFactory(
            role=STUDENT,
            playlist=self.live.playlist,
        )

        self.assert_user_can_set_display_name(playlist_access.user, self.live)

    def test_set_display_name_by_playlist_instructor(self):
        """Playlist instructors can set display name."""
        playlist_access = PlaylistAccessFactory(
            role=INSTRUCTOR,
            playlist=self.live.playlist,
        )

        self.assert_user_can_set_display_name(playlist_access.user, self.live)

    def test_set_display_name_by_playlist_administrator(self):
        """Playlist administrators can set display name."""
        playlist_access = PlaylistAccessFactory(
            role=ADMINISTRATOR,
            playlist=self.live.playlist,
        )

        self.assert_user_can_set_display_name(playlist_access.user, self.live)

    def test_api_livesession_put_username_public_no_anonymous(
        self,
    ):
        """Field anonymous_id is mandatory when the JWT token is a public one."""
        video = VideoFactory()
        jwt_token = PlaylistAccessTokenFactory(playlist=video.playlist)
        response = self.client.put(
            self._put_url(video),
            {"display_name": "Antoine"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"detail": "Invalid request."})

    def test_api_livesession_put_username_public_no_anonymous_no_displayname(
        self,
    ):
        """Field display_name is mandatory."""
        video = VideoFactory()
        jwt_token = PlaylistAccessTokenFactory(playlist=video.playlist)
        response = self.client.put(
            self._put_url(video),
            {"anonymous_id": uuid.uuid4()},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"detail": "Invalid request."})

    def test_api_livesession_put_username_public_session_existing(
        self,
    ):
        """Should update the display_name with the new value."""
        video = VideoFactory()
        anonymous_id = uuid.uuid4()
        livesession = LiveSessionFactory(
            anonymous_id=anonymous_id, display_name="Samuel", video=video
        )

        self.assertEqual(LiveSession.objects.count(), 1)
        jwt_token = PlaylistAccessTokenFactory(playlist=video.playlist)
        response = self.client.put(
            self._put_url(video),
            {"anonymous_id": anonymous_id, "display_name": "Antoine"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        livesession.refresh_from_db()
        # no new record
        self.assertEqual(LiveSession.objects.count(), 1)

        self.assertEqual(
            response.json(),
            {
                "anonymous_id": str(anonymous_id),
                "consumer_site": None,
                "display_name": "Antoine",
                "email": livesession.email,
                "id": str(livesession.id),
                "is_registered": False,
                "language": "en",
                "live_attendance": None,
                "lti_id": None,
                "lti_user_id": None,
                "should_send_reminders": True,
                "username": None,
                "video": str(video.id),
            },
        )
        self.assertEqual(livesession.display_name, "Antoine")

    def test_api_livesession_put_username_public_session_exists_other_video(
        self,
    ):
        """Token is related to a specific video.
        We make sure that for the same anonymous_id we can't update data from other videos
        than the one refered in the token.
        """
        video = VideoFactory()
        video2 = VideoFactory()
        live_session = AnonymousLiveSessionFactory(display_name="Samuel", video=video2)

        self.assertEqual(LiveSession.objects.count(), 1)
        jwt_token = PlaylistAccessTokenFactory(playlist=video.playlist)
        response = self.client.put(
            self._put_url(video),
            {"anonymous_id": live_session.anonymous_id, "display_name": "Antoine"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        # a new record has been created
        self.assertEqual(LiveSession.objects.count(), 2)
        created_livesession = LiveSession.objects.get(video=video)
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": str(live_session.anonymous_id),
                "consumer_site": None,
                "display_name": "Antoine",
                "email": None,
                "id": str(created_livesession.id),
                "is_registered": False,
                "language": "en",
                "live_attendance": None,
                "lti_id": None,
                "lti_user_id": None,
                "should_send_reminders": True,
                "username": None,
                "video": str(video.id),
            },
        )
        self.assertEqual(created_livesession.display_name, "Antoine")
        self.assertEqual(created_livesession.username, None)
        self.assertEqual(created_livesession.anonymous_id, live_session.anonymous_id)

    def test_api_livesession_put_username_public_session_no(
        self,
    ):
        """Should create a livesession as no previous one exists."""
        video = VideoFactory()
        anonymous_id = uuid.uuid4()

        self.assertEqual(LiveSession.objects.count(), 0)
        jwt_token = PlaylistAccessTokenFactory(playlist=video.playlist)
        response = self.client.put(
            self._put_url(video),
            {"anonymous_id": anonymous_id, "display_name": "Antoine"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        # new record
        self.assertEqual(LiveSession.objects.count(), 1)
        created_livesession = LiveSession.objects.last()

        self.assertEqual(
            response.json(),
            {
                "anonymous_id": str(anonymous_id),
                "consumer_site": None,
                "display_name": "Antoine",
                "email": None,
                "id": str(created_livesession.id),
                "is_registered": False,
                "language": "en",
                "live_attendance": None,
                "lti_id": None,
                "lti_user_id": None,
                "should_send_reminders": True,
                "username": None,
                "video": str(video.id),
            },
        )
        self.assertEqual(created_livesession.display_name, "Antoine")
        self.assertEqual(created_livesession.username, None)
        self.assertEqual(created_livesession.anonymous_id, anonymous_id)

    def test_api_livesession_put_username_public_already_exists(
        self,
    ):
        """display_name already exists should return a 409."""
        video = VideoFactory()
        AnonymousLiveSessionFactory(display_name="Samuel", video=video)
        self.assertEqual(LiveSession.objects.count(), 1)
        jwt_token = PlaylistAccessTokenFactory(playlist=video.playlist)
        response = self.client.put(
            self._put_url(video),
            {"anonymous_id": uuid.uuid4(), "display_name": "Samuel"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(
            response.json(),
            {"display_name": "User with that display_name already exists!"},
        )

    def test_api_livesession_put_username_lti_no_displayname(self):
        """Field display_name is mandatory."""
        video = VideoFactory()
        jwt_token = LTIPlaylistAccessTokenFactory(
            playlist=video.playlist,
            consumer_site=str(video.playlist.consumer_site.id),
        )
        response = self.client.put(
            self._put_url(video),
            {"anonymous_id": uuid.uuid4()},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"detail": "Invalid request."})

    def test_api_livesession_put_username_lti_session_exists(self):
        """Should return the right information with existing record."""
        video = VideoFactory()
        livesession = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            display_name="Samantha63",
            lti_user_id="55555",
            lti_id="Maths",
            username="Sylvie",
            video=video,
        )

        self.assertEqual(LiveSession.objects.count(), 1)
        jwt_token = LiveSessionLtiTokenFactory(
            live_session=livesession,
            any_role=True,
            user__email="sabrina@fun-test.fr",
            user__username="Token",
        )
        response = self.client.put(
            self._put_url(video),
            {"display_name": "Antoine"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        livesession.refresh_from_db()
        # no new record
        self.assertEqual(LiveSession.objects.count(), 1)

        # username has been updated with current information in the token
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": "Antoine",
                "email": "sabrina@fun-test.fr",
                "id": str(livesession.id),
                "is_registered": False,
                "language": "en",
                "live_attendance": None,
                "lti_id": "Maths",
                "lti_user_id": "55555",
                "should_send_reminders": True,
                "username": "Token",
                "video": str(video.id),
            },
        )
        self.assertEqual(livesession.display_name, "Antoine")
        # username has been updated with current information in the token
        self.assertEqual(livesession.username, "Token")
        # email has been updated with current information in the token
        self.assertEqual(livesession.email, "sabrina@fun-test.fr")
        self.assertEqual(livesession.video.id, video.id)

    def test_api_livesession_put_username_lti_session_exists_other_video(self):
        """Token is related to a specific video.
        We make sure that for the same anonymous_id we can't read data from other videos
        than the one refered in the token.
        """
        video = VideoFactory()
        video2 = VideoFactory()
        live_session = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            display_name="Samantha63",
            lti_user_id="55555",
            lti_id="Maths",
            username="Sylvie",
            video=video2,
        )

        self.assertEqual(LiveSession.objects.count(), 1)
        jwt_token = LTIPlaylistAccessTokenFactory(
            playlist=video.playlist,
            consumer_site=str(live_session.consumer_site.id),
            context_id=live_session.lti_id,
            user__email="sabrina@fun-test.fr",
            user__id=live_session.lti_user_id,
            user__username="Patou",
        )
        response = self.client.put(
            self._put_url(video),
            {"display_name": "Antoine"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        # a new record has been created
        self.assertEqual(LiveSession.objects.count(), 2)
        created_livesession = LiveSession.objects.get(video=video)
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": "Antoine",
                "email": "sabrina@fun-test.fr",
                "id": str(created_livesession.id),
                "is_registered": False,
                "language": "en",
                "live_attendance": None,
                "lti_id": "Maths",
                "lti_user_id": "55555",
                "should_send_reminders": True,
                "username": "Patou",
                "video": str(video.id),
            },
        )
        self.assertEqual(created_livesession.display_name, "Antoine")
        self.assertEqual(created_livesession.username, "Patou")

    def test_api_livesession_put_username_lti_session_no(self):
        """Should create a livesession as no previous one exists."""
        video = VideoFactory()

        self.assertEqual(LiveSession.objects.count(), 0)
        jwt_token = LTIPlaylistAccessTokenFactory(
            playlist=video.playlist,
            consumer_site=str(video.playlist.consumer_site.id),
            context_id="Maths",
            user__email="sabrina@fun-test.fr",
            user__id="55555",
            user__username="Token",
        )
        response = self.client.put(
            self._put_url(video),
            {"anonymous_id": uuid.uuid4(), "display_name": "Antoine"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        # new record
        self.assertEqual(LiveSession.objects.count(), 1)
        created_livesession = LiveSession.objects.get(video=video)

        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": "Antoine",
                "email": "sabrina@fun-test.fr",
                "id": str(created_livesession.id),
                "is_registered": False,
                "language": "en",
                "live_attendance": None,
                "lti_id": "Maths",
                "lti_user_id": "55555",
                "should_send_reminders": True,
                "username": "Token",
                "video": str(video.id),
            },
        )

        self.assertEqual(created_livesession.display_name, "Antoine")
        self.assertEqual(created_livesession.username, "Token")

    def test_api_livesession_put_username_lti_already_exists(
        self,
    ):
        """display_name already exists should return a 409."""
        video = VideoFactory()
        AnonymousLiveSessionFactory(display_name="Samuel", video=video)

        jwt_token = LTIPlaylistAccessTokenFactory(
            playlist=video.playlist,
            consumer_site=str(video.playlist.consumer_site.id),
        )
        response = self.client.put(
            self._put_url(video),
            {"anonymous_id": uuid.uuid4(), "display_name": "Samuel"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(
            response.json(),
            {"display_name": "User with that display_name already exists!"},
        )
