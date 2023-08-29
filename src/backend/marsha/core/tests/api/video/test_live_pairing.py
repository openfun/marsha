"""Tests for the pairing device endpoint on the API of the Marsha project."""
from datetime import timedelta
import json
import time
from unittest import mock
import uuid

from django.conf import settings
from django.core.cache import cache
from django.test import TestCase, override_settings

from corsheaders.middleware import (
    ACCESS_CONTROL_ALLOW_METHODS,
    ACCESS_CONTROL_ALLOW_ORIGIN,
)
from faker import Faker

from marsha.core import factories, models
from marsha.core.api import timezone
from marsha.core.defaults import IDLE, JITSI
from marsha.core.factories import DeviceFactory, LivePairingFactory
from marsha.core.models import Device, LivePairing, Video
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)


class PairingDeviceAPITest(TestCase):
    """Test the API route for pairing device."""

    maxDiff = None

    def setUp(self):
        """
        Reset the cache so that no throttles will be active
        """
        cache.clear()

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.some_organization = factories.OrganizationFactory()
        cls.some_video = factories.WebinarVideoFactory(
            playlist__organization=cls.some_organization,
            live_type=JITSI,
        )

    def assert_user_cannot_request_pairing_secret(self, user, video):
        """Assert the user cannot request a live pairing secret."""

        jwt_token = UserAccessTokenFactory(user=user)
        response = self.client.get(
            f"/api/videos/{video.pk}/pairing-secret/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def assert_user_can_request_pairing_secret(self, user, video):
        """Assert the user can request a live pairing secret."""
        self.assertIsNone(getattr(video, "live_pairing", None))

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.get(
            f"/api/videos/{video.id}/pairing-secret/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(str(video.live_pairing.secret), response.json().get("secret"))

    def test_api_video_pairing_secret_anonymous_user(self):
        """Anonymous users are not allowed to request a live pairing secret."""
        video = factories.VideoFactory()

        response = self.client.get(f"/api/videos/{video.id}/pairing-secret/")

        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            {"detail": "Authentication credentials were not provided."}, response.json()
        )

    def test_pairing_secret_by_random_user(self):
        """Authenticated user without access cannot request a live pairing secret."""
        user = factories.UserFactory()

        self.assert_user_cannot_request_pairing_secret(user, self.some_video)

    def test_pairing_secret_by_organization_student(self):
        """Organization students cannot request a live pairing secret."""
        organization_access = factories.OrganizationAccessFactory(
            organization=self.some_organization,
            role=models.STUDENT,
        )

        self.assert_user_cannot_request_pairing_secret(
            organization_access.user, self.some_video
        )

    def test_pairing_secret_by_organization_instructor(self):
        """Organization instructors cannot request a live pairing secret."""
        organization_access = factories.OrganizationAccessFactory(
            organization=self.some_organization,
            role=models.INSTRUCTOR,
        )

        self.assert_user_cannot_request_pairing_secret(
            organization_access.user, self.some_video
        )

    def test_pairing_secret_by_organization_administrator(self):
        """Organization administrators can request a live pairing secret."""
        organization_access = factories.OrganizationAccessFactory(
            organization=self.some_organization,
            role=models.ADMINISTRATOR,
        )

        self.assert_user_can_request_pairing_secret(
            organization_access.user, self.some_video
        )

    def test_pairing_secret_by_consumer_site_any_role(self):
        """Consumer site roles cannot request a live pairing secret."""
        consumer_site_access = factories.ConsumerSiteAccessFactory(
            consumer_site=self.some_video.playlist.consumer_site,
        )

        self.assert_user_cannot_request_pairing_secret(
            consumer_site_access.user, self.some_video
        )

    def test_pairing_secret_by_playlist_student(self):
        """Playlist student cannot request a live pairing secret."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=models.STUDENT,
        )

        self.assert_user_cannot_request_pairing_secret(
            playlist_access.user, self.some_video
        )

    def test_pairing_secret_by_playlist_instructor(self):
        """Playlist instructor cannot request a live pairing secret."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=models.INSTRUCTOR,
        )

        self.assert_user_can_request_pairing_secret(
            playlist_access.user, self.some_video
        )

    def test_pairing_secret_by_playlist_admin(self):
        """Playlist administrator can request a live pairing secret."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.some_video.playlist,
            role=models.ADMINISTRATOR,
        )

        self.assert_user_can_request_pairing_secret(
            playlist_access.user, self.some_video
        )

    def test_api_video_student_pairing_secret(self):
        """A student should not be able to request a live pairing secret."""
        video = factories.VideoFactory()
        jwt_token = StudentLtiTokenFactory(playlist=video.playlist)

        response = self.client.get(
            f"/api/videos/{video.id}/pairing-secret/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            {"detail": "You do not have permission to perform this action."},
            response.json(),
        )

    def test_api_video_pairing_secret_staff_or_user(self):
        """Logged-in users should not be able to request a live pairing secret."""
        for user in [factories.UserFactory(), factories.UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            video = factories.VideoFactory()

            response = self.client.get(f"/api/videos/{video.id}/pairing-secret/")
            self.assertEqual(response.status_code, 401)
            self.assertEqual(
                {"detail": "Authentication credentials were not provided."},
                response.json(),
            )

    def test_api_video_instructor_pairing_secret_non_jitsi(self):
        """A request related to a non jitsi video should raise a 400 error."""
        video = factories.VideoFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)

        response = self.client.get(
            f"/api/videos/{video.id}/pairing-secret/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            {"detail": "Matching video is not a Jitsi Live."},
            response.json(),
        )

    def test_api_video_instructor_pairing_secret_1st_request(self):
        """An instructor should be able to request a live pairing secret."""
        video = factories.VideoFactory(live_state=IDLE, live_type=JITSI)
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)

        response = self.client.get(
            f"/api/videos/{video.id}/pairing-secret/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(str(video.live_pairing.secret), response.json().get("secret"))
        self.assertEqual(
            settings.LIVE_PAIRING_EXPIRATION_SECONDS, response.json().get("expires_in")
        )

    def test_api_video_instructor_pairing_secret_2nd_request(self):
        """An instructor should be able to request several times a live pairing secret."""
        video = factories.VideoFactory(live_state=IDLE, live_type=JITSI)
        live_pairing = LivePairingFactory(video=video)
        previous_secret = live_pairing.secret

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)

        response = self.client.get(
            f"/api/videos/{video.id}/pairing-secret/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(str(video.live_pairing.secret), response.json().get("secret"))
        self.assertNotEqual(previous_secret, str(video.live_pairing.secret))

    def test_api_video_pairing_secret_delete_expired(self):
        """Every secret request should delete expired ones."""
        LivePairingFactory()

        expired_date = timezone.now() + timedelta(
            seconds=(settings.LIVE_PAIRING_EXPIRATION_SECONDS + 2)
        )
        with mock.patch.object(timezone, "now", return_value=expired_date):
            video = factories.VideoFactory()
            jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)

            self.client.get(
                f"/api/videos/{video.id}/pairing-secret/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

            self.assertEqual(0, LivePairing.objects.count())

    def test_api_video_pairing_secret_post(self):
        """Post request is not allowed."""
        live_pairing = LivePairingFactory()
        initial_secret = live_pairing.secret
        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=live_pairing.video.playlist
        )

        response = self.client.post(
            f"/api/videos/{live_pairing.video.id}/pairing-secret/",
            data={"secret": "123456"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 405)
        self.assertEqual({"detail": 'Method "POST" not allowed.'}, response.json())
        live_pairing.refresh_from_db()
        self.assertEqual(initial_secret, live_pairing.secret)

    def test_api_video_pairing_secret_patch(self):
        """Patch request is not allowed."""
        live_pairing = LivePairingFactory()
        initial_secret = live_pairing.secret
        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=live_pairing.video.playlist
        )

        response = self.client.patch(
            f"/api/videos/{live_pairing.video.id}/pairing-secret/",
            data=json.dumps({"secret": "123456"}),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 405)
        self.assertEqual({"detail": 'Method "PATCH" not allowed.'}, response.json())
        live_pairing.refresh_from_db()
        self.assertEqual(initial_secret, live_pairing.secret)

    def test_api_video_pairing_secret_put(self):
        """Put request is not allowed."""
        live_pairing = LivePairingFactory()
        initial_secret = live_pairing.secret
        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=live_pairing.video.playlist
        )

        response = self.client.put(
            f"/api/videos/{live_pairing.video.id}/pairing-secret/",
            data=json.dumps({"secret": "123456"}),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 405)
        self.assertEqual({"detail": 'Method "PUT" not allowed.'}, response.json())
        live_pairing.refresh_from_db()
        self.assertEqual(initial_secret, live_pairing.secret)

    def test_api_video_pairing_challenge_no_payload(self):
        """Request without payload should raise a 400 error."""
        response = self.client.post("/api/pairing-challenge")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"detail": "Invalid request."})

    def test_api_video_pairing_challenge_no_box_id(self):
        """Request without box_id payload should raise a 400 error."""
        payload = {"secret": "000000"}
        response = self.client.post("/api/pairing-challenge", data=payload)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"detail": "Invalid request."})

    def test_api_video_pairing_challenge_wrong_box_id(self):
        """Request with wrong box_id payload should raise a 400 error."""
        payload = {"box_id": "wrong", "secret": "000000"}
        response = self.client.post("/api/pairing-challenge", data=payload)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"detail": "Invalid request."})

    def test_api_video_pairing_challenge_no_secret(self):
        """Request without secret payload should raise a 400 error."""
        payload = {"box_id": uuid.uuid4()}
        response = self.client.post("/api/pairing-challenge", data=payload)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"detail": "Invalid request."})

    def test_api_video_pairing_challenge_wrong_secret(self):
        """Request with wrong secret payload should raise a 404 error."""
        payload = {"box_id": uuid.uuid4(), "secret": "000000"}
        response = self.client.post("/api/pairing-challenge", data=payload)

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json(), {"detail": "Secret not found."})

    def test_api_video_pairing_challenge_valid_secret_expired(self):
        """Request with expired secret payload should delete live pairing and raise a 404."""
        ten_minute_ago = timezone.now() - timedelta(minutes=10)
        live_pairing = LivePairingFactory(created_on=ten_minute_ago)
        payload = {"box_id": uuid.uuid4(), "secret": live_pairing.secret}
        response = self.client.post("/api/pairing-challenge", data=payload)

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json(), {"detail": "Secret not found."})
        self.assertEqual(LivePairing.objects.count(), 0)

    def test_api_video_pairing_challenge_valid_secret_non_jitsi(self):
        """Request with secret matching a non jitsi video.
        Should delete live pairing and raise a 400."""
        video = factories.VideoFactory()
        live_pairing = LivePairingFactory(video=video)

        payload = {"box_id": uuid.uuid4(), "secret": live_pairing.secret}
        response = self.client.post("/api/pairing-challenge", data=payload)

        self.assertEqual(response.status_code, 400)

        self.assertEqual(
            {"detail": "Matching video is not a Jitsi Live."},
            response.json(),
        )
        self.assertEqual(LivePairing.objects.count(), 0)

    def test_api_video_pairing_challenge_valid_secret_jitsi(self):
        """Request with valid secret payload should delete live pairing and return a jitsi url."""
        video = factories.VideoFactory(live_state=IDLE, live_type=JITSI)
        live_pairing = LivePairingFactory(video=video)

        box_id = uuid.uuid4()
        payload = {"box_id": box_id, "secret": live_pairing.secret}
        response = self.client.post("/api/pairing-challenge", data=payload)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            {"jitsi_url": f"https://{settings.JITSI_DOMAIN}/{video.id}"},
            response.json(),
        )
        self.assertEqual(LivePairing.objects.count(), 0)
        self.assertEqual(Device.objects.count(), 1)
        self.assertEqual(Video.objects.count(), 2)  # video + self.some_video
        device = Device.objects.first()
        self.assertEqual(device.id, box_id)

    def test_api_video_pairing_challenge_valid_secret_jitsi_multiple_challenges(self):
        """Multiple successfully pairing should not fail."""
        video = factories.VideoFactory(live_state=IDLE, live_type=JITSI)
        live_pairing = LivePairingFactory(video=video)

        box_id = uuid.uuid4()
        payload = {"box_id": box_id, "secret": live_pairing.secret}

        # first successful pairing
        response = self.client.post("/api/pairing-challenge", data=payload)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            {"jitsi_url": f"https://{settings.JITSI_DOMAIN}/{video.id}"},
            response.json(),
        )
        self.assertEqual(LivePairing.objects.count(), 0)
        self.assertEqual(Device.objects.count(), 1)
        device = Device.objects.first()
        self.assertEqual(device.id, box_id)

        video = factories.VideoFactory(live_state=IDLE, live_type=JITSI)
        live_pairing = LivePairingFactory(video=video)

        payload = {"box_id": box_id, "secret": live_pairing.secret}

        # second successful pairing on another video
        response = self.client.post("/api/pairing-challenge", data=payload)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            {"jitsi_url": f"https://{settings.JITSI_DOMAIN}/{video.id}"},
            response.json(),
        )
        self.assertEqual(LivePairing.objects.count(), 0)
        self.assertEqual(Device.objects.count(), 1)
        device = Device.objects.first()
        self.assertEqual(device.id, box_id)

    def test_api_video_pairing_challenge_unknown_devices_throttling(self):
        """Throttling should prevent more than three requests per minute.

        Possible scenarios:
        - Multiple requests from legit box that were never been paired.
        - Brute force attempt to guess a secret.
        """
        faker = Faker()
        payload = {"box_id": uuid.uuid4(), "secret": "000000"}

        # first 3 requests shouldn't be throttled
        for _ in range(3):
            response = self.client.post(
                "/api/pairing-challenge",
                data=payload,
                REMOTE_ADDR=faker.ipv4(),
            )
            self.assertEqual(response.status_code, 404)
            self.assertEqual(response.json(), {"detail": "Secret not found."})

        # fourth request should be throttled
        response = self.client.post(
            "/api/pairing-challenge",
            data=payload,
            REMOTE_ADDR=faker.ipv4(),
        )
        self.assertEqual(response.status_code, 429)
        self.assertEqual(
            response.json(),
            {"detail": "Request was throttled. Expected available in 60 seconds."},
        )

        # resetting throttling by mocking timer used by DRF in AnonRateThrottle
        with mock.patch.object(time, "time", return_value=time.time() + 60):
            # first 3 requests shouldn't be throttled
            for _ in range(3):
                response = self.client.post("/api/pairing-challenge", data=payload)
                self.assertEqual(response.status_code, 404)
                self.assertEqual(response.json(), {"detail": "Secret not found."})

            # fourth request should be throttled
            response = self.client.post("/api/pairing-challenge", data=payload)
            self.assertEqual(response.status_code, 429)
            self.assertEqual(
                response.json(),
                {"detail": "Request was throttled. Expected available in 60 seconds."},
            )

    def test_api_video_pairing_challenge_unknown_device_throttling(self):
        """Unknown device requests should be throttled with others."""
        box_id = uuid.uuid4()
        payload = {"box_id": box_id, "secret": "000000"}

        # first 3 requests shouldn't be throttled
        for _ in range(3):
            response = self.client.post("/api/pairing-challenge", data=payload)
            self.assertEqual(response.status_code, 404)
            self.assertEqual(response.json(), {"detail": "Secret not found."})

        # fourth known box request should be throttled
        response = self.client.post("/api/pairing-challenge", data=payload)
        self.assertEqual(response.status_code, 429)
        self.assertEqual(
            response.json(),
            {"detail": "Request was throttled. Expected available in 60 seconds."},
        )

        # other request should be throttled
        response = self.client.post(
            "/api/pairing-challenge",
            data={"box_id": uuid.uuid4(), "secret": "000000"},
        )
        self.assertEqual(response.status_code, 429)
        self.assertEqual(
            response.json(),
            {"detail": "Request was throttled. Expected available in 60 seconds."},
        )

        # resetting throttling by mocking timer used by DRF in AnonRateThrottle
        with mock.patch.object(time, "time", return_value=time.time() + 60):
            # first 3 requests shouldn't be throttled
            for _ in range(3):
                response = self.client.post("/api/pairing-challenge", data=payload)
                self.assertEqual(response.status_code, 404)
                self.assertEqual(response.json(), {"detail": "Secret not found."})

            # fourth known box request should be throttled
            response = self.client.post("/api/pairing-challenge", data=payload)
            self.assertEqual(response.status_code, 429)
            self.assertEqual(
                response.json(),
                {"detail": "Request was throttled. Expected available in 60 seconds."},
            )

    def test_api_video_pairing_challenge_known_device_throttling(self):
        """Known device requests should be throttled separately from others."""
        box_id = uuid.uuid4()
        DeviceFactory(id=box_id)
        payload = {"box_id": box_id, "secret": "000000"}

        # first 3 requests shouldn't be throttled
        for _ in range(3):
            response = self.client.post("/api/pairing-challenge", data=payload)
            self.assertEqual(response.status_code, 404)
            self.assertEqual(response.json(), {"detail": "Secret not found."})

        # fourth known box request should be throttled
        response = self.client.post("/api/pairing-challenge", data=payload)
        self.assertEqual(response.status_code, 429)
        self.assertEqual(
            response.json(),
            {"detail": "Request was throttled. Expected available in 60 seconds."},
        )

        # other request shouldn't be throttled
        response = self.client.post(
            "/api/pairing-challenge",
            data={"box_id": uuid.uuid4(), "secret": "000000"},
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json(), {"detail": "Secret not found."})

        # resetting throttling by mocking timer used by DRF in AnonRateThrottle
        with mock.patch.object(time, "time", return_value=time.time() + 60):
            # first 3 requests shouldn't be throttled
            for _ in range(3):
                response = self.client.post("/api/pairing-challenge", data=payload)
                self.assertEqual(response.status_code, 404)
                self.assertEqual(response.json(), {"detail": "Secret not found."})

            # fourth known box request should be throttled
            response = self.client.post("/api/pairing-challenge", data=payload)
            self.assertEqual(response.status_code, 429)
            self.assertEqual(
                response.json(),
                {"detail": "Request was throttled. Expected available in 60 seconds."},
            )

    def test_api_video_pairing_challenge_delete_expired(self):
        """Every challenge request should delete expired ones."""
        LivePairingFactory()

        expired_date = timezone.now() + timedelta(
            seconds=(settings.LIVE_PAIRING_EXPIRATION_SECONDS + 2)
        )
        with mock.patch.object(timezone, "now", return_value=expired_date):
            self.client.post("/api/pairing-challenge")

            self.assertEqual(0, LivePairing.objects.count())

    @override_settings(
        CORS_ALLOWED_ORIGINS=["http://example.com"],
        CORS_ALLOW_METHODS=["POST", "OPTIONS"],
        CORS_URLS_REGEX=r"^/api/pairing-challenge$",
    )
    def test_api_video_pairing_challenge_cors(self):
        """When CORS is enabled on this url, CORS headers are added to the response."""
        with self.modify_settings(
            MIDDLEWARE={
                "append": "corsheaders.middleware.CorsMiddleware",
            }
        ):
            response = self.client.options(
                "/api/pairing-challenge",
                HTTP_ORIGIN="http://example.com",
                content_type="application/json",
            )

            self.assertEqual(response.status_code, 200)

            self.assertEqual(response[ACCESS_CONTROL_ALLOW_METHODS], "POST, OPTIONS")
            self.assertEqual(
                response[ACCESS_CONTROL_ALLOW_ORIGIN], "http://example.com"
            )

    @override_settings(
        CORS_ALLOWED_ORIGINS=["http://example.com"],
        CORS_ALLOW_METHODS=["POST", "OPTIONS"],
        CORS_URLS_REGEX=r"^/api/other$",
    )
    def test_api_video_pairing_challenge_cors_not_matching_urls(self):
        """When CORS is enabled but not matching the current URL, no header should be added."""
        with self.modify_settings(
            MIDDLEWARE={
                "append": "corsheaders.middleware.CorsMiddleware",
            }
        ):
            response = self.client.options(
                "/api/pairing-challenge",
                HTTP_ORIGIN="http://example.com",
                content_type="application/json",
            )

            self.assertEqual(response.status_code, 200)

            self.assertNotIn(ACCESS_CONTROL_ALLOW_METHODS, response)
            self.assertNotIn(ACCESS_CONTROL_ALLOW_ORIGIN, response)
