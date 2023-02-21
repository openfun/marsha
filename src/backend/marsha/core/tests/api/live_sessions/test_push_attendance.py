"""Tests for the livesession push_attendance API."""
import uuid

from django.utils import timezone

from marsha.core.factories import (
    AnonymousLiveSessionFactory,
    ConsumerSiteFactory,
    LiveSessionFactory,
    VideoFactory,
)
from marsha.core.models import LiveSession
from marsha.core.simple_jwt.factories import (
    LiveSessionLtiTokenFactory,
    LTIResourceAccessTokenFactory,
    ResourceAccessTokenFactory,
)
from marsha.core.utils.time_utils import to_timestamp

from .base import LiveSessionApiTestCase


class LiveSessionPushAttendanceApiTest(LiveSessionApiTestCase):
    """Test the push_attendance API of the liveSession object."""

    def test_api_livesession_post_attendance_no_payload(self):
        """Request without payload should raise an error."""
        response = self.client.post(
            "/api/livesessions/push_attendance/",
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.json(), {"detail": "Authentication credentials were not provided."}
        )

    def test_api_livesession_post_attendance_no_attendance(self):
        """Request without attendance should raise an error."""
        video = VideoFactory()
        jwt_token = LTIResourceAccessTokenFactory(
            resource=video,
            context_id=str(video.playlist.lti_id),
            consumer_site=str(video.playlist.consumer_site.id),
        )
        response = self.client.post(
            "/api/livesessions/push_attendance/",
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(), {"live_attendance": ["This field is required."]}
        )

    def test_api_livesession_post_attendance_token_lti_video_not_existing(
        self,
    ):
        """Pushing an attendance on a not existing video should fail."""
        video = VideoFactory()
        jwt_token = LTIResourceAccessTokenFactory(
            context_id=str(video.playlist.lti_id),
            consumer_site=str(video.playlist.consumer_site.id),
            user__email=None,
        )
        response = self.client.post(
            "/api/livesessions/push_attendance/",
            {
                "live_attendance": {
                    to_timestamp(timezone.now()): {"sound": "ON", "tabs": "OFF"}
                }
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_api_livesession_post_attendance_token_lti_consumer_site_not_existing(
        self,
    ):
        """Pushing an attendance on a not existing video should fail."""
        video = VideoFactory()
        jwt_token = LTIResourceAccessTokenFactory(
            resource=video,
            context_id=str(video.playlist.lti_id),
            user__email=None,
        )
        response = self.client.post(
            "/api/livesessions/push_attendance/",
            {
                "live_attendance": {
                    to_timestamp(timezone.now()): {"sound": "ON", "tabs": "OFF"}
                }
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)

    def test_api_livesession_post_attendance_token_lti_email_none_previous_none(
        self,
    ):
        """Endpoint push_attendance works with no email and no previous record."""
        video = VideoFactory()
        jwt_token = LTIResourceAccessTokenFactory(
            resource=video,
            context_id=str(video.playlist.lti_id),
            consumer_site=str(video.playlist.consumer_site.id),
            user__email=None,
            user__id="56255f3807599c377bf0e5bf072359fd",
            user__username="Token",
        )
        live_attendance = {to_timestamp(timezone.now()): {"sound": "ON", "tabs": "OFF"}}
        response = self.client.post(
            "/api/livesessions/push_attendance/",
            {"live_attendance": live_attendance, "language": "fr"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        created_livesession = LiveSession.objects.last()
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site_id),
                "display_name": None,
                "email": None,
                "id": str(created_livesession.id),
                "is_registered": False,
                "language": "fr",
                "live_attendance": live_attendance,
                "lti_id": str(video.playlist.lti_id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "username": "Token",
                "video": str(video.id),
            },
        )
        self.assertEqual(
            created_livesession.consumer_site, video.playlist.consumer_site
        )
        self.assertEqual(
            created_livesession.lti_user_id, "56255f3807599c377bf0e5bf072359fd"
        )
        self.assertEqual(created_livesession.email, None)
        self.assertEqual(created_livesession.username, "Token")
        self.assertEqual(created_livesession.live_attendance, live_attendance)
        self.assertEqual(created_livesession.is_registered, False)

    def test_api_livesession_post_attendance_token_lti_existing_record(self):
        """Endpoint push_attendance updates an existing record."""
        video = VideoFactory()
        livesession = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email=None,
            is_registered=False,
            live_attendance={"key1": {"sound": "OFF", "tabs": "OFF"}},
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            lti_id="Maths",
            video=video,
        )
        self.assertEqual(LiveSession.objects.count(), 1)
        jwt_token = LTIResourceAccessTokenFactory(
            resource=video,
            context_id=str(livesession.lti_id),
            consumer_site=str(video.playlist.consumer_site.id),
            user__email="chantal@aol.com",
            user__id="56255f3807599c377bf0e5bf072359fd",
            user__username="Token",
        )
        timestamp = to_timestamp(timezone.now())
        response = self.client.post(
            "/api/livesessions/push_attendance/",
            {"live_attendance": {timestamp: {"sound": "ON", "tabs": "OFF"}}},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        livesession.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site_id),
                "display_name": None,
                "email": "chantal@aol.com",
                "id": str(livesession.id),
                "is_registered": False,
                "language": "en",
                "live_attendance": {
                    "key1": {"sound": "OFF", "tabs": "OFF"},
                    timestamp: {"sound": "ON", "tabs": "OFF"},
                },
                "lti_id": "Maths",
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "username": "Token",
                "video": str(video.id),
            },
        )
        # no new object has been created
        self.assertEqual(LiveSession.objects.count(), 1)
        # update username and email with current token
        self.assertEqual(livesession.email, "chantal@aol.com")
        self.assertEqual(livesession.username, "Token")
        self.assertEqual(
            livesession.live_attendance,
            {
                "key1": {"sound": "OFF", "tabs": "OFF"},
                timestamp: {"sound": "ON", "tabs": "OFF"},
            },
        )

    def test_api_livesession_post_new_attendance_token_public_unexisting_video(
        self,
    ):
        """Pushing an attendance on a not existing video should fail"""
        anonymous_id = uuid.uuid4()
        self.assertEqual(LiveSession.objects.count(), 0)
        jwt_token = ResourceAccessTokenFactory()
        response = self.client.post(
            f"/api/livesessions/push_attendance/?anonymous_id={anonymous_id}",
            {"live_attendance": {}},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(LiveSession.objects.count(), 0)

    def test_api_livesession_post_new_attendance_token_public(self):
        """Create a new live session if no one was existing for this anonymous id"""
        video = VideoFactory()
        anonymous_id = uuid.uuid4()
        self.assertEqual(LiveSession.objects.count(), 0)
        jwt_token = ResourceAccessTokenFactory(resource=video)
        response = self.client.post(
            f"/api/livesessions/push_attendance/?anonymous_id={anonymous_id}",
            {"language": "fr", "live_attendance": {}},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(LiveSession.objects.count(), 1)
        created_livesession = LiveSession.objects.last()
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": str(anonymous_id),
                "consumer_site": None,
                "display_name": None,
                "email": None,
                "id": str(created_livesession.id),
                "is_registered": False,
                "language": "fr",
                "live_attendance": {},
                "lti_id": None,
                "lti_user_id": None,
                "should_send_reminders": True,
                "username": None,
                "video": str(video.id),
            },
        )
        self.assertEqual(created_livesession.anonymous_id, anonymous_id)

    def test_api_livesession_post_attendance_existing_token_public(self):
        """An existing live session for an anonymous id should be updated if existing."""
        livesession = AnonymousLiveSessionFactory(email=None, is_registered=False)
        self.assertEqual(LiveSession.objects.count(), 1)
        timestamp = to_timestamp(timezone.now())

        jwt_token = ResourceAccessTokenFactory(resource=livesession.video)
        response = self.client.post(
            f"/api/livesessions/push_attendance/?anonymous_id={livesession.anonymous_id}",
            {
                "live_attendance": {
                    timestamp: {"sound": "ON", "tabs": "OFF"},
                }
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        livesession.refresh_from_db()

        self.assertEqual(
            response.json(),
            {
                "anonymous_id": str(livesession.anonymous_id),
                "consumer_site": None,
                "display_name": None,
                "email": None,
                "id": str(livesession.id),
                "is_registered": False,
                "language": "en",
                "live_attendance": {timestamp: {"sound": "ON", "tabs": "OFF"}},
                "lti_id": None,
                "lti_user_id": None,
                "should_send_reminders": True,
                "username": None,
                "video": str(livesession.video.id),
            },
        )

        self.assertIsNone(livesession.email)
        self.assertIsNone(livesession.username)
        self.assertEqual(
            livesession.live_attendance,
            {
                timestamp: {"sound": "ON", "tabs": "OFF"},
            },
        )

    def test_api_livesession_post_attendance_token_public_missing_anonymous_id(self):
        """Posting an attendance with a public token and missing anonymous_id query string
        should fail."""
        video = VideoFactory()

        self.assertEqual(LiveSession.objects.count(), 0)
        timestamp = to_timestamp(timezone.now())

        jwt_token = ResourceAccessTokenFactory(resource=video)
        response = self.client.post(
            "/api/livesessions/push_attendance/",
            {
                "live_attendance": {
                    timestamp: {"sound": "ON", "tabs": "OFF"},
                }
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(LiveSession.objects.count(), 0)
        self.assertEqual(response.status_code, 400)

        self.assertEqual(
            response.json(),
            {"detail": "anonymous_id is missing"},
        )

    def test_api_livesession_post_attendance_token_live_attendance_timestamps(
        self,
    ):
        """Endpoint push_attendance expects the live_attendance field to only
        contain timestamps as keys"""
        livesession = LiveSessionFactory(
            is_registered=True, is_from_lti_connection=True
        )
        self.assertEqual(LiveSession.objects.count(), 1)
        self.assertIsNone(livesession.live_attendance)
        jwt_token = LiveSessionLtiTokenFactory(
            live_session=livesession,
            any_role=True,
        )

        response = self.client.post(
            "/api/livesessions/push_attendance/",
            {"live_attendance": {"key1": "val1"}},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        livesession.refresh_from_db()

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "live_attendance": [
                    "Field live_attendance doesn't contain expected key "
                    "`key1`, it should be a timestamp"
                ]
            },
        )

    def test_api_livesession_post_attendance_token_ok_user_record_empty_attendance(
        self,
    ):
        """Endpoint push_attendance updates an existing record without previous live_attendance."""
        video = VideoFactory()
        livesession = LiveSessionFactory(
            is_from_lti_connection=True,
            is_registered=True,
            email="chantal@aol.com",
            username="Token",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            lti_id="Maths",
            video=video,
        )
        self.assertEqual(LiveSession.objects.count(), 1)
        self.assertEqual(livesession.live_attendance, None)
        jwt_token = LiveSessionLtiTokenFactory(
            live_session=livesession,
            any_role=True,
        )

        live_attendance = {to_timestamp(timezone.now()): "val1"}

        response = self.client.post(
            "/api/livesessions/push_attendance/",
            {"live_attendance": live_attendance},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        livesession.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": None,
                "email": "chantal@aol.com",
                "id": str(livesession.id),
                "is_registered": True,
                "language": "en",
                "live_attendance": live_attendance,
                "lti_id": "Maths",
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "username": "Token",
                "video": str(video.id),
            },
        )
        # no new object has been created
        self.assertEqual(LiveSession.objects.count(), 1)

        # livesession object updated with data from the token
        self.assertEqual(livesession.email, "chantal@aol.com")
        self.assertEqual(livesession.username, "Token")
        # live_attendance has been set
        self.assertEqual(livesession.live_attendance, live_attendance)

    def test_api_livesession_post_attendance_token_lti_no_update_username_email_none(
        self,
    ):
        """Endpoint push_attendance matches record and doesn't update email and username
        if they are not defined in the token"""
        video = VideoFactory()
        livesession = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="chantal@aol.com",
            is_registered=True,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            lti_id="Maths",
            username="Sylvie",
            video=video,
        )
        self.assertEqual(LiveSession.objects.count(), 1)
        self.assertEqual(livesession.live_attendance, None)
        jwt_token = LiveSessionLtiTokenFactory(
            live_session=livesession,
            any_role=True,
        )
        live_attendance = {to_timestamp(timezone.now()): {"sound": "ON", "tabs": "OFF"}}
        response = self.client.post(
            "/api/livesessions/push_attendance/",
            {"live_attendance": live_attendance},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        livesession.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": None,
                "email": "chantal@aol.com",
                "id": str(livesession.id),
                "is_registered": True,
                "language": "en",
                "live_attendance": live_attendance,
                "lti_id": "Maths",
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "username": "Sylvie",
                "video": str(video.id),
            },
        )
        # no new object has been created
        self.assertEqual(LiveSession.objects.count(), 1)

        # livesession object updated with data from the token
        self.assertEqual(livesession.email, "chantal@aol.com")
        self.assertEqual(livesession.username, "Sylvie")
        # live_attendance has been set
        self.assertEqual(livesession.live_attendance, live_attendance)

    def test_api_livesession_post_attendance_token_lti_no_update_username_email_empty(
        self,
    ):
        """Endpoint push_attendance matches record and doesn't update email and username
        if they are empty in the token"""
        video = VideoFactory()
        livesession = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="chantal@aol.com",
            is_registered=True,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            lti_id="Maths",
            username="Sylvie",
            video=video,
        )
        self.assertEqual(LiveSession.objects.count(), 1)
        self.assertEqual(livesession.live_attendance, None)
        jwt_token = LiveSessionLtiTokenFactory(
            live_session=livesession,
            any_role=True,
            user__email="",
            user__username="",
        )
        live_attendance = {to_timestamp(timezone.now()): {"sound": "ON", "tabs": "OFF"}}
        response = self.client.post(
            "/api/livesessions/push_attendance/",
            {"live_attendance": live_attendance, "language": "fr"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        livesession.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": None,
                "email": "chantal@aol.com",
                "id": str(livesession.id),
                "is_registered": True,
                "language": "fr",
                "live_attendance": live_attendance,
                "lti_id": "Maths",
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "username": "Sylvie",
                "video": str(video.id),
            },
        )
        # no new object has been created
        self.assertEqual(LiveSession.objects.count(), 1)

        # livesession object updated with data from the token
        self.assertEqual(livesession.email, "chantal@aol.com")
        self.assertEqual(livesession.username, "Sylvie")
        # live_attendance has been set
        self.assertEqual(livesession.live_attendance, live_attendance)

    def test_api_livesession_post_attendance_wrong_language(self):
        """Wrong value of language generates an error"""
        video = VideoFactory()
        livesession = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="chantal@aol.com",
            is_registered=True,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            lti_id="Maths",
            username="Sylvie",
            video=video,
        )
        self.assertEqual(LiveSession.objects.count(), 1)
        self.assertEqual(livesession.live_attendance, None)
        jwt_token = LiveSessionLtiTokenFactory(
            live_session=livesession,
            any_role=True,
            user__email="",
            user__username="",
        )

        response = self.client.post(
            "/api/livesessions/push_attendance/",
            {"live_attendance": {"key1": "val1"}, "language": "whatever"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        livesession.refresh_from_db()

        self.assertEqual(response.status_code, 400)

        self.assertEqual(
            response.json(),
            {
                "language": ['"whatever" is not a valid choice.'],
                "live_attendance": [
                    "Field live_attendance doesn't contain expected key "
                    "`key1`, it should be a timestamp"
                ],
            },
        )

        # now with empty
        response = self.client.post(
            "/api/livesessions/push_attendance/",
            {"live_attendance": {to_timestamp(timezone.now()): "val1"}, "language": ""},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        livesession.refresh_from_db()

        self.assertEqual(response.status_code, 400)

        self.assertEqual(response.json(), {"language": ['"" is not a valid choice.']})

    def test_api_livesession_post_attendance_token_with_could_match_other_records(
        self,
    ):
        """Match the record with the combinaison consumer_site/lti_id/lti_user_id/video."""
        video = VideoFactory()
        video2 = VideoFactory()
        # different email and username than the token
        livesession = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="another@fun-test.fr",
            live_attendance={"r2": {"sound": "OFF", "tabs": "OFF"}},
            lti_user_id="55555",
            lti_id="Maths",
            username="Sylvie",
            video=video,
        )
        # same email and username but no consumer_site
        LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            consumer_site=None,
            display_name="Token",
            email="sabrina@fun-test.fr",
            live_attendance={"r2": {"sound": "OFF", "tabs": "OFF"}},
            lti_user_id=None,
            lti_id=None,
            video=video,
        )
        # not the same consumer_site
        LiveSessionFactory(
            consumer_site=ConsumerSiteFactory(),
            email="sabrina@fun-test.fr",
            live_attendance={"r2": {"sound": "OFF", "tabs": "OFF"}},
            lti_user_id="55555",
            lti_id="Maths",
            video=video,
        )
        # not the same context_id
        LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="sabrina@fun-test.fr",
            live_attendance={"r2": {"sound": "OFF", "tabs": "OFF"}},
            lti_user_id="55555",
            lti_id="Maths2",
            video=video,
        )
        # not the same lti_user_id
        LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="sabrina@fun-test.fr",
            live_attendance={"r1": {"sound": "OFF", "tabs": "OFF"}},
            lti_user_id="444444",
            lti_id="Maths",
            video=video,
        )

        # not the same video
        LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="sabrina@fun-test.fr",
            live_attendance={"r2": {"sound": "OFF", "tabs": "OFF"}},
            lti_user_id="55555",
            lti_id="Maths",
            video=video2,
        )
        nb_created = 6
        self.assertEqual(LiveSession.objects.count(), nb_created)
        # token with same email
        jwt_token = LTIResourceAccessTokenFactory(
            resource=video,
            consumer_site=str(video.playlist.consumer_site.id),
            context_id="Maths",
            user__id="55555",
            user__email="sabrina@fun-test.fr",
            user__username="Token",
        )
        timestamp = to_timestamp(timezone.now())
        response = self.client.post(
            "/api/livesessions/push_attendance/",
            {
                "language": "fr",
                "live_attendance": {timestamp: {"sound": "ON", "tabs": "OFF"}},
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        livesession.refresh_from_db()
        # no new record
        self.assertEqual(LiveSession.objects.count(), nb_created)

        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": None,
                "email": "sabrina@fun-test.fr",
                "id": str(livesession.id),
                "is_registered": False,
                "language": "fr",
                "live_attendance": {
                    "r2": {"sound": "OFF", "tabs": "OFF"},
                    timestamp: {"sound": "ON", "tabs": "OFF"},
                },
                "lti_id": "Maths",
                "lti_user_id": "55555",
                "should_send_reminders": True,
                "username": "Token",
                "video": str(video.id),
            },
        )
        self.assertEqual(livesession.email, "sabrina@fun-test.fr")
        self.assertEqual(livesession.lti_user_id, "55555")
        self.assertEqual(livesession.lti_id, "Maths")
        self.assertEqual(livesession.username, "Token")
        self.assertEqual(livesession.language, "fr")

        self.assertEqual(
            livesession.live_attendance,
            {
                "r2": {"sound": "OFF", "tabs": "OFF"},
                timestamp: {"sound": "ON", "tabs": "OFF"},
            },
        )
        self.assertEqual(livesession.consumer_site, video.playlist.consumer_site)
