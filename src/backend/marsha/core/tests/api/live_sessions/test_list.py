"""Tests for the livesession list API."""
from datetime import timedelta
import random
import time
from unittest import mock
import uuid

from django.utils import timezone

from marsha.core.defaults import IDLE, RAW
from marsha.core.factories import (
    AnonymousLiveSessionFactory,
    ConsumerSiteFactory,
    LiveSessionFactory,
    OrganizationAccessFactory,
    OrganizationFactory,
    UserFactory,
    VideoFactory,
    WebinarVideoFactory,
)
from marsha.core.models import ADMINISTRATOR, INSTRUCTOR, STUDENT
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    LiveSessionLtiTokenFactory,
    LiveSessionPlaylistAccessTokenFactory,
    PlaylistAccessTokenFactory,
    UserAccessTokenFactory,
)

from .base import LiveSessionApiTestCase


class LiveSessionListApiTest(LiveSessionApiTestCase):
    """Test the list API of the liveSession object."""

    def _get_url(self, video):
        """Return the url to use in tests."""
        return f"/api/videos/{video.pk}/livesessions/"

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.organization = OrganizationFactory()
        cls.live = WebinarVideoFactory(playlist__organization=cls.organization)

    def assert_user_cannot_list(self, user, video):
        """Assert a user cannot list with a GET request."""
        livesession = LiveSessionFactory(
            email=user.email,
            is_registered=True,
            user=user,
            video=video,
        )

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            self._get_url(video),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        livesession.refresh_from_db()
        self.assertEqual(
            response.json(),
            {
                "count": 0,
                "next": None,
                "previous": None,
                "results": [],
            },
        )

    def assert_user_can_list(self, user, video, awaited_results=1):
        """
        Assert a user cannot list with a GET request.

        Depending on user's role, list can be a unique element or
        a list of every livessions related to the video
        """
        livesession = LiveSessionFactory(
            email=user.email,
            is_registered=True,
            user=user,
            video=video,
        )

        public_livesession = AnonymousLiveSessionFactory(
            email=None,
            is_registered=False,
            video=self.live,
        )

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            self._get_url(video),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        livesession.refresh_from_db()

        results = [
            {
                "anonymous_id": None,
                "consumer_site": None,
                "display_name": None,
                "email": user.email,
                "id": str(livesession.id),
                "is_registered": True,
                "language": "en",
                "live_attendance": None,
                "lti_id": None,
                "lti_user_id": None,
                "should_send_reminders": True,
                "username": user.username,
                "video": str(video.id),
            },
        ]
        if awaited_results == 2:
            results.append(
                {
                    "anonymous_id": str(public_livesession.anonymous_id),
                    "consumer_site": None,
                    "display_name": None,
                    "email": None,
                    "id": str(public_livesession.id),
                    "is_registered": False,
                    "language": "en",
                    "live_attendance": None,
                    "lti_id": None,
                    "lti_user_id": None,
                    "should_send_reminders": True,
                    "username": None,
                    "video": str(video.id),
                }
            )

        self.assertEqual(
            response.json(),
            {
                "count": awaited_results,
                "next": None,
                "previous": None,
                "results": results,
            },
        )

    def test_list_by_anonymous_user(self):
        """Anonymous users cannot list."""
        response = self.client.get(
            self._get_url(self.live),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)

    def test_list_by_random_logged_in_user(self):
        """
        Random logged-in users.

        Can list their own livessession related to a video.
        """
        user = UserFactory()

        self.assert_user_can_list(user, self.live)

    def test_list_by_organization_student(self):
        """Organization students can list their own livessession related to a video."""
        organization_access = OrganizationAccessFactory(
            role=STUDENT,
            organization=self.organization,
        )

        self.assert_user_can_list(organization_access.user, self.live)

    def test_list_by_organization_instructor(self):
        """Organization instructors can list their own livessession related to a video."""
        organization_access = OrganizationAccessFactory(
            role=INSTRUCTOR,
            organization=self.organization,
        )

        self.assert_user_can_list(organization_access.user, self.live)

    def test_list_by_organization_administrator(self):
        """Organization administrators can list every livessession related to a video."""
        organization_access = OrganizationAccessFactory(
            role=ADMINISTRATOR,
            organization=self.organization,
        )

        self.assert_user_can_list(organization_access.user, self.live, 2)

    def test_list_livesession_by_anonymous_user(self):
        """Anonymous users cannot fetch list requests for livesessions."""
        video = VideoFactory()
        response = self.client.get(self._get_url(video))
        self.assertEqual(response.status_code, 401)

    def test_list_livesession_public_token(self):
        """
        Public token can't fetch any livesession if there is no anonymous_id.
        """
        user = UserFactory()
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        video2 = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        # consumer_site is not defined
        AnonymousLiveSessionFactory(email=user.email, video=video)
        AnonymousLiveSessionFactory(email="chantal@test-fun-mooc.fr", video=video)
        AnonymousLiveSessionFactory(email="super@test-fun-mooc.fr", video=video)
        # livesession for another consumer_site
        LiveSessionFactory(
            email="chantal@test-fun-mooc.fr",
            video=video,
            is_from_lti_connection=True,
            lti_user_id=user.id,
            consumer_site=ConsumerSiteFactory(),
        )
        # livesession for another video
        AnonymousLiveSessionFactory(email=user.email, video=video2)

        # public token
        jwt_token = PlaylistAccessTokenFactory(playlist=video.playlist)
        response = self.client.get(
            self._get_url(video),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 0)

    def test_api_livesession_list_throttling(self):
        """Throttling should prevent more than three requests per minute."""
        # first 3 requests shouldn't be throttled
        for _i in range(3):
            video = VideoFactory()
            jwt_token = PlaylistAccessTokenFactory(playlist=video.playlist)

            response = self.client.get(
                f"{self._get_url(video)}?anonymous_id={uuid.uuid4()}",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["count"], 0)

        # fourth request should be throttled
        response = self.client.get(
            f"{self._get_url(video)}?anonymous_id={uuid.uuid4()}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 429)
        self.assertEqual(
            response.json(),
            {"detail": "Request was throttled. Expected available in 60 seconds."},
        )

        # resetting throttling by mocking timer used by DRF in AnonRateThrottle
        with mock.patch.object(time, "time", return_value=time.time() + 60):
            # first 3 requests shouldn't be throttled
            for _i in range(3):
                response = self.client.get(
                    f"{self._get_url(video)}?anonymous_id={uuid.uuid4()}",
                    HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                )
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json()["count"], 0)

            # fourth request should be throttled
            response = self.client.get(
                f"{self._get_url(video)}?anonymous_id={uuid.uuid4()}",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            self.assertEqual(response.status_code, 429)
            self.assertEqual(
                response.json(),
                {"detail": "Request was throttled. Expected available in 60 seconds."},
            )

    def test_api_livesession_list_throttling_no_anonymous(self):
        """Throttling is not called if anonymous_id is not used."""
        # first 3 requests shouldn't be throttled
        for _i in range(3):
            video = VideoFactory()
            jwt_token = PlaylistAccessTokenFactory(playlist=video.playlist)

            response = self.client.get(
                self._get_url(video),
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["count"], 0)

        # fourth request shouldn't be throttled
        response = self.client.get(
            self._get_url(video),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 0)

    def test_list_livesession_public_token_anonymous(self):
        """
        Public token can fetch is livesession if there is an anonymous_id.
        """
        user = UserFactory()
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        video2 = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        livesession = AnonymousLiveSessionFactory(email=user.email, video=video)
        # another anonymous_id for the same video
        AnonymousLiveSessionFactory(email="chantal@test-fun-mooc.fr", video=video)

        # livesession for a LTI connection
        LiveSessionFactory(
            email="chantal@test-fun-mooc.fr",
            video=video,
            is_from_lti_connection=True,
            lti_user_id=user.id,
            consumer_site=ConsumerSiteFactory(),
        )
        # livesession for another video with the same anonymous_id
        AnonymousLiveSessionFactory(
            anonymous_id=livesession.anonymous_id,
            email=user.email,
            video=video2,
        )

        # public token
        jwt_token = PlaylistAccessTokenFactory(playlist=video.playlist)
        response = self.client.get(
            f"{self._get_url(video)}?anonymous_id={livesession.anonymous_id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)

        self.assertEqual(
            response.json()["results"],
            [
                {
                    "anonymous_id": str(livesession.anonymous_id),
                    "consumer_site": None,
                    "display_name": None,
                    "email": user.email,
                    "id": str(livesession.id),
                    "is_registered": False,
                    "live_attendance": None,
                    "language": "en",
                    "lti_user_id": None,
                    "lti_id": None,
                    "should_send_reminders": True,
                    "username": None,
                    "video": str(video.id),
                }
            ],
        )

    def test_list_livesession_lti_token_role_none(self):
        """
        User with LTI token can only fetch livesessions filtered by their token.

        livesessions can be fetched  for the same video, same consumer site and
        same context_id. Token can have or not an email, result won't be filtered on
        email.
        """
        user = UserFactory()
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        video2 = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        livesession = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email=user.email,
            lti_id="Maths",
            lti_user_id=str(user.id),
            username=user.username,
            video=video,
        )
        # livesession with different lti_user
        LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email=user.email,
            lti_id="Maths",
            lti_user_id="5555",
            video=video,
        )
        # livesession with another consumer_site
        LiveSessionFactory(
            consumer_site=ConsumerSiteFactory(),
            email=user.email,
            lti_id="Maths",
            lti_user_id=str(user.id),
            video=video,
        )
        # livesession with another context_id
        LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email=user.email,
            lti_id="Maths2",
            lti_user_id=str(user.id),
            video=video,
        )
        # livesession for another video
        LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email=user.email,
            lti_id="Maths",
            lti_user_id=str(user.id),
            video=video2,
        )
        # livesession with the same email with no consumer_site
        AnonymousLiveSessionFactory(email=user.email, video=video)
        # livesession with the same email for another video
        AnonymousLiveSessionFactory(email=user.email, video=video2)

        # context_id in the token
        jwt_token = LiveSessionLtiTokenFactory(
            live_session=livesession,
            # results aren't filtered by email
            user__email=random.choice([user.email, ""]),
        )

        response = self.client.get(
            self._get_url(video),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(
            response.json()["results"],
            [
                {
                    "anonymous_id": None,
                    "consumer_site": str(video.playlist.consumer_site.id),
                    "display_name": None,
                    "email": user.email,
                    "id": str(livesession.id),
                    "is_registered": False,
                    "live_attendance": None,
                    "language": "en",
                    "lti_user_id": str(user.id),
                    "lti_id": "Maths",
                    "should_send_reminders": True,
                    "username": user.username,
                    "video": str(video.id),
                }
            ],
        )

    def test_list_livesession_lti_token_role_admin_instructors(self):
        """
        Admin/Instructors can fetch all livesessions belonging to a video.
        """

        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        video2 = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        livesession = LiveSessionFactory(
            video=video,
            is_from_lti_connection=True,
            is_registered=True,
            lti_id="Maths",
        )
        # livesession with different lti_user
        livesession2 = LiveSessionFactory(
            video=video,
            is_from_lti_connection=True,
            is_registered=False,
            lti_id="Maths",
        )
        # livesession with another consumer_site
        livesession3 = LiveSessionFactory(
            video=video,
            is_from_lti_connection=True,
            consumer_site=ConsumerSiteFactory(),
            lti_id="Maths",
        )
        # livesession with another context_id
        livesession4 = LiveSessionFactory(
            video=video,
            is_from_lti_connection=True,
            lti_id="Maths2",
        )
        # anonymous live session
        livesession5 = AnonymousLiveSessionFactory(email=livesession.email, video=video)
        # livesession for another video
        LiveSessionFactory(
            video=video2,
            is_from_lti_connection=True,
            lti_id="Maths",
        )
        AnonymousLiveSessionFactory(email=livesession.email, video=video2)

        # context_id in the token
        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=video.playlist,
            context_id="Maths",
            consumer_site=str(video.playlist.consumer_site.id),
        )

        response = self.client.get(
            self._get_url(video),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 5)
        self.assertEqual(
            response.json()["results"],
            [
                {
                    "anonymous_id": None,
                    "consumer_site": str(livesession.consumer_site.id),
                    "display_name": None,
                    "email": livesession.email,
                    "id": str(livesession.id),
                    "is_registered": True,
                    "language": "en",
                    "live_attendance": None,
                    "lti_user_id": livesession.lti_user_id,
                    "lti_id": "Maths",
                    "should_send_reminders": True,
                    "username": livesession.username,
                    "video": str(video.id),
                },
                {
                    "anonymous_id": None,
                    "consumer_site": str(livesession2.consumer_site.id),
                    "display_name": None,
                    "email": livesession2.email,
                    "id": str(livesession2.id),
                    "is_registered": False,
                    "language": "en",
                    "live_attendance": None,
                    "lti_user_id": livesession2.lti_user_id,
                    "lti_id": "Maths",
                    "should_send_reminders": True,
                    "username": livesession2.username,
                    "video": str(video.id),
                },
                {
                    "anonymous_id": None,
                    "consumer_site": str(livesession3.consumer_site.id),
                    "display_name": None,
                    "email": livesession3.email,
                    "id": str(livesession3.id),
                    "is_registered": False,
                    "language": "en",
                    "live_attendance": None,
                    "lti_user_id": livesession3.lti_user_id,
                    "lti_id": "Maths",
                    "should_send_reminders": True,
                    "username": livesession3.username,
                    "video": str(video.id),
                },
                {
                    "anonymous_id": None,
                    "consumer_site": str(livesession4.consumer_site.id),
                    "display_name": None,
                    "email": livesession4.email,
                    "id": str(livesession4.id),
                    "is_registered": False,
                    "language": "en",
                    "live_attendance": None,
                    "lti_user_id": livesession4.lti_user_id,
                    "lti_id": "Maths2",
                    "should_send_reminders": True,
                    "username": livesession4.username,
                    "video": str(video.id),
                },
                {
                    "anonymous_id": str(livesession5.anonymous_id),
                    "consumer_site": None,
                    "display_name": None,
                    "email": livesession5.email,
                    "id": str(livesession5.id),
                    "is_registered": False,
                    "language": "en",
                    "live_attendance": None,
                    "lti_user_id": None,
                    "lti_id": None,
                    "should_send_reminders": True,
                    "username": None,
                    "video": str(video.id),
                },
            ],
        )

    def test_list_livesession_token_lti_wrong_is_registered_field(self):
        """
        Lti token can fetch list requests but will fetch only his livesession.
        A livesession without the flag is_registered set to True is not returned by
        livesessions API endpoint if it's filtered with flag is_registered.
        """
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        # livesession for the right video, lti_user_id and consumer_site
        live_session = LiveSessionFactory(
            is_from_lti_connection=True,
            is_registered=False,
            video=video,
        )

        # token has context_id and no email
        jwt_token = LiveSessionPlaylistAccessTokenFactory(live_session=live_session)
        response = self.client.get(
            f"{self._get_url(video)}?is_registered=True",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 0)
