"""Tests for the pairing device endpoint on the API of the Marsha project."""
from datetime import timedelta
import json
import random
import time
from unittest import mock
import uuid

from django.conf import settings
from django.core.cache import cache
from django.test import TestCase

from faker import Faker
from rest_framework_simplejwt.tokens import AccessToken

from marsha.core.defaults import IDLE, JITSI

from .. import factories
from ..api import timezone
from ..factories import DeviceFactory, LivePairingFactory
from ..models import Device, LivePairing, Video


class PairingDeviceAPITest(TestCase):
    """Test the API route for pairing device."""

    maxDiff = None

    def setUp(self):
        """
        Reset the cache so that no throttles will be active
        """
        cache.clear()

    def test_api_video_pairing_secret_anonymous_user(self):
        """Anonymous users are not allowed to request a live pairing secret."""
        video = factories.VideoFactory()

        response = self.client.get(f"/api/videos/{video.id}/pairing-secret/")

        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            {"detail": "Authentication credentials were not provided."}, response.json()
        )

    def test_api_video_student_pairing_secret(self):
        """A student should not be able to request a live pairing secret."""
        video = factories.VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]

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
        """Logged in users should not be able to request a live pairing secret."""
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
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

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
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        response = self.client.get(
            f"/api/videos/{video.id}/pairing-secret/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(str(video.live_pairing.secret), response.json().get("secret"))

    def test_api_video_instructor_pairing_secret_2nd_request(self):
        """An instructor should be able to request several times a live pairing secret."""
        video = factories.VideoFactory(live_state=IDLE, live_type=JITSI)
        live_pairing = LivePairingFactory(video=video)
        previous_secret = live_pairing.secret

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

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
            jwt_token = AccessToken()
            jwt_token.payload["resource_id"] = str(video.id)
            jwt_token.payload["roles"] = [
                random.choice(["instructor", "administrator"])
            ]
            jwt_token.payload["permissions"] = {"can_update": True}

            self.client.get(
                f"/api/videos/{video.id}/pairing-secret/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

            self.assertEqual(0, LivePairing.objects.count())

    def test_api_video_pairing_secret_post(self):
        """Post request is not allowed."""
        live_pairing = LivePairingFactory()
        initial_secret = live_pairing.secret
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(live_pairing.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

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
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(live_pairing.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

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
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(live_pairing.video.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

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
        self.assertEqual(Video.objects.count(), 1)
        device = Device.objects.first()
        self.assertEqual(device.id, box_id)

    def test_api_video_pairing_challenge_valid_secret_jitsi_multiple_challenges(self):
        """Multiple successfull pairing should not fail."""
        video = factories.VideoFactory(live_state=IDLE, live_type=JITSI)
        live_pairing = LivePairingFactory(video=video)

        box_id = uuid.uuid4()
        payload = {"box_id": box_id, "secret": live_pairing.secret}

        # first sucessful pairing
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

        # second sucessful pairing on another video
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
