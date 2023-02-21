"""Tests for the livesession list-attendances API."""
from datetime import timedelta
import json
import time
from unittest import mock
import uuid

from django.conf import settings
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.utils import timezone

from marsha.core.defaults import JITSI, RAW, RUNNING, STOPPED
from marsha.core.factories import (
    AnonymousLiveSessionFactory,
    LiveSessionFactory,
    VideoFactory,
)
from marsha.core.models import Video
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    LiveSessionLtiTokenFactory,
)
from marsha.core.utils.api_utils import generate_hash
from marsha.core.utils.time_utils import to_timestamp


# pylint: disable=too-many-lines


class LiveSessionLListAttendancesApiTest(TestCase):
    """Test the list-attendances API of the liveSession object."""

    maxDiff = None

    def setUp(self):
        """
        Reset the cache so that no throttles will be active
        """
        cache.clear()

    def test_api_livesession_student_cant_read_attendances(self):
        """LTI Token can't read its liveattendance computed."""
        video = VideoFactory(
            live_state=RUNNING,
            live_info={
                "started_at": "1533686400",
            },
            live_type=JITSI,
        )
        # livesession with consumer_site
        live_session = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="samia@test-fun-mooc.fr",
            is_registered=True,
            lti_id=str(video.playlist.lti_id),
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )

        # token with right context_id and lti_user_id
        jwt_token = LiveSessionLtiTokenFactory(live_session=live_session)

        response = self.client.get(
            "/api/livesessions/list_attendances/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_livesession_read_attendances_admin_video_unknown(self):
        """
        Admin/Instructor with a JWT token targeting a video not found
        receive a 404 requesting live_attendances
        """
        video = VideoFactory(
            live_state=RUNNING,
            live_info={
                "started_at": "1533686400",
            },
            live_type=JITSI,
        )

        # token with right context_id and lti_user_id
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            consumer_site=str(video.playlist.consumer_site.id),
            context_id=str(video.playlist.lti_id),
        )
        video.delete()
        response = self.client.get(
            "/api/livesessions/list_attendances/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_api_livesession_read_attendances_admin(self):
        """
        Admin/Instructor user can read all liveattendances computed that have
        is_registered set to True or that have live_attendance's field not empty.
        The display_name is calculated depending on the data contained in
        the JWT token.
        """
        video = VideoFactory(
            live_state=RUNNING,
            live_info={
                "started_at": "1533686400",
            },
            live_type=JITSI,
        )
        video2 = VideoFactory(
            live_state=RUNNING,
            live_info={
                "started_at": "1533686400",
            },
            live_type=JITSI,
        )
        # livesession no display_name email defined
        live_session_email = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="samia@test-fun-mooc.fr",
            is_registered=True,
            lti_id=str(video.playlist.lti_id),
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )

        # other liveregistration no display_name username defined
        live_session_display_name = LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            consumer_site=video.playlist.consumer_site,
            display_name="Aurélie",
            email="ignored_email@test-fun-mooc.fr",
            live_attendance={"1533686400": {"wonderful": True}},
            lti_id=str(video.playlist.lti_id),
            lti_user_id="77255f3807599c377bf0e5bf072359fd",
            username="Ignored",
            video=video,
        )
        # other liveregistration no display_name username defined
        live_session_username = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email=None,
            live_attendance={"1533686400": {"wonderful": True}},
            lti_id=str(video.playlist.lti_id),
            lti_user_id="99255f3807599c377bf0e5bf072359fd",
            username="Sophie",
            video=video,
        )

        # will be ignored live_attendance is empty and is_registered is
        # False
        AnonymousLiveSessionFactory(
            email=None,
            live_attendance={},
            video=video,
        )
        # will be ignored other video
        AnonymousLiveSessionFactory(
            email=None,
            live_attendance={"1533686400": {"wonderful": True}},
            video=video2,
        )
        # token with right context_id and lti_user_id
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            consumer_site=str(video.playlist.consumer_site.id),
            context_id=str(video.playlist.lti_id),
        )

        response = self.client.get(
            "/api/livesessions/list_attendances/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        live_session_email.refresh_from_db()
        live_session_display_name.refresh_from_db()
        live_session_username.refresh_from_db()

        self.assertEqual(
            response.json(),
            {
                "count": 3,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "id": str(live_session_email.id),
                        "display_name": "samia@test-fun-mooc.fr",
                        "is_registered": True,
                        "live_attendance": video.get_list_timestamps_attendences(),
                    },
                    {
                        "id": str(live_session_display_name.id),
                        "display_name": "Aurélie",
                        "is_registered": False,
                        # the aim of the test is not to test live_attendance's value
                        "live_attendance": response.json()["results"][1][
                            "live_attendance"
                        ],
                    },
                    {
                        "id": str(live_session_username.id),
                        "display_name": "Sophie",
                        "is_registered": False,
                        # the aim of the test is not to test live_attendance's value
                        "live_attendance": response.json()["results"][2][
                            "live_attendance"
                        ],
                    },
                ],
            },
        )

    def test_api_livesession_read_attendances_admin_target_record(self):
        """Admin/Instructor user can read a specific attendance"""
        video = VideoFactory(
            live_state=RUNNING,
            live_info={
                "started_at": "1533686400",
            },
            live_type=JITSI,
        )
        # livesession no display_name email defined
        livesession = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="samia@test-fun-mooc.fr",
            is_registered=True,
            lti_id=str(video.playlist.lti_id),
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )

        # other liveregistration no display_name username defined
        LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            consumer_site=video.playlist.consumer_site,
            display_name="Aurélie",
            email="ignored_email@test-fun-mooc.fr",
            lti_id=str(video.playlist.lti_id),
            lti_user_id="77255f3807599c377bf0e5bf072359fd",
            username="Ignored",
            video=video,
        )

        # token with right context_id and lti_user_id
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            consumer_site=str(video.playlist.consumer_site.id),
            context_id=str(video.playlist.lti_id),
        )
        livesession.refresh_from_db()
        response = self.client.get(
            f"/api/livesessions/list_attendances/?pk={livesession.id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        livesession.refresh_from_db()

        # other livesessions are ignored as it was filtered on specific livesession
        self.assertEqual(
            response.json(),
            {
                "count": 1,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "id": str(livesession.id),
                        "display_name": "samia@test-fun-mooc.fr",
                        "is_registered": True,
                        "live_attendance": video.get_list_timestamps_attendences(),
                    }
                ],
            },
        )

    @override_settings(ATTENDANCE_PUSH_DELAY=500)
    @override_settings(ATTENDANCE_POINTS=5)
    def test_api_livesession_read_attendances_well_computed_start_and_end(self):
        """Check depending on the live_attendance's livesession, the key
        live_attendance is well computed for a live that is over
        """

        started = 1620800000
        # ends an hour later
        ended = started + 3600
        video = VideoFactory(
            live_state=STOPPED,
            live_info={"started_at": str(started), "stopped_at": str(ended)},
            live_type=JITSI,
        )

        livesession = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="samia@test-fun-mooc.fr",
            is_registered=True,
            live_attendance={
                str(started + 10): {"first": 1},
                str(started + 510): {"volume": 0.11},
                str(started + 1010): {"volume": 0.12},
                # diff with key system is equal with settings.ATTENDANCE_PUSH_DELAY
                str(started + 1300): {"volume": 0.13},
                str(started + 2010): {"volume": 0.14},
                # key existing in the video's timestamps list
                str(started + 2800): {"volume": 0.15},
                str(started + 3200): {"volume": 0.16},
                # key outside range
                str(started + 3700): {"ignored": 1},
            },
            lti_id=str(video.playlist.lti_id),
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        livesession_public = AnonymousLiveSessionFactory(
            email=None,
            is_registered=False,
            live_attendance={
                # key before range
                str(started + 30): {"muted": 1, "timestamp": str(started + 30)},
                str(started + 1030): {"data": 0},
                str(started + 2230): {"volume": 0.15, "timestamp": str(started + 2230)},
                str(started + 2730): {"volume": 0.10, "timestamp": str(started + 2730)},
            },
            video=video,
        )
        # token with right context_id and lti_user_id
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            consumer_site=str(video.playlist.consumer_site.id),
            context_id=str(video.playlist.lti_id),
        )
        livesession.refresh_from_db()
        livesession_public.refresh_from_db()

        response = self.client.get(
            "/api/livesessions/list_attendances/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        # we expect one timestamp every 15 * 60 seconds as we have 5 attendance points
        self.assertEqual(
            response.json(),
            {
                "count": 2,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "id": str(livesession.id),
                        "display_name": "samia@test-fun-mooc.fr",
                        "is_registered": True,
                        "live_attendance": {
                            str(started): {},
                            str(started + 900): {"volume": 0.11},
                            str(started + 1800): {"volume": 0.13},
                            str(started + 2700): {
                                "connectedInBetween": True,
                                "lastConnected": started + 2010,
                            },
                            str(started + 3600): {"volume": 0.16},
                        },
                    },
                    {
                        "id": str(livesession_public.id),
                        "display_name": None,
                        "is_registered": False,
                        "live_attendance": {
                            str(started): {},
                            str(started + 900): {
                                "connectedInBetween": True,
                                "lastConnected": started + 30,
                            },
                            str(started + 1800): {
                                "connectedInBetween": True,
                                "lastConnected": started + 1030,
                            },
                            str(started + 2700): {
                                "volume": 0.15,
                                "timestamp": str(started + 2230),
                            },
                            str(started + 3600): {
                                "connectedInBetween": True,
                                "lastConnected": started + 2730,
                            },
                        },
                    },
                ],
            },
        )

        list_timestamps_attendences = video.get_list_timestamps_attendences()
        live_attendance_ls1 = response.json()["results"][0]["live_attendance"]
        live_attendance_ls2 = response.json()["results"][1]["live_attendance"]

        self.assertEqual(len(list_timestamps_attendences), len(live_attendance_ls1))
        self.assertEqual(len(list_timestamps_attendences), len(live_attendance_ls2))
        self.assertEqual(len(list_timestamps_attendences), settings.ATTENDANCE_POINTS)

        # key returned are identical for each livesession
        self.assertEqual(list_timestamps_attendences.keys(), live_attendance_ls1.keys())
        self.assertEqual(list_timestamps_attendences.keys(), live_attendance_ls2.keys())

    @override_settings(ATTENDANCE_PUSH_DELAY=500)
    @override_settings(ATTENDANCE_POINTS=5)
    def test_api_livesession_read_attendances_well_computed_before_start(self):
        """Check if timestamps exist before the list of timestamp of the video they get
        ignored
        """

        started = 1620800000
        # ends an hour later
        ended = started + 3600
        video = VideoFactory(
            live_state=STOPPED,
            live_info={"started_at": str(started), "stopped_at": str(ended)},
            live_type=JITSI,
        )

        livesession = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="samia@test-fun-mooc.fr",
            is_registered=True,
            live_attendance={
                str(started - 1000): {"first": 1},
                str(started + 510): {"volume": 0.15},
                str(started + 1780): {"volume": 0.18},
            },
            lti_id=str(video.playlist.lti_id),
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )

        livesession_only_before = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="only_before@test-fun-mooc.fr",
            is_registered=True,
            live_attendance={
                str(started - 1000): {"first": 1},
            },
            lti_id=str(video.playlist.lti_id),
            lti_user_id="33255f3807599c377bf0e5bf072359fd",
            video=video,
        )

        # token with right context_id and lti_user_id
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            consumer_site=str(video.playlist.consumer_site.id),
            context_id=str(video.playlist.lti_id),
        )
        livesession.refresh_from_db()

        response = self.client.get(
            "/api/livesessions/list_attendances/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)

        # we expect one timestamp every 15 * 60 seconds as we have 5 attendance points
        self.assertEqual(
            response.json(),
            {
                "count": 2,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "id": str(livesession_only_before.id),
                        "display_name": "only_before@test-fun-mooc.fr",
                        "is_registered": True,
                        "live_attendance": {
                            str(started): {
                                "connectedInBetween": True,
                                "lastConnected": int(started - 1000),
                            },
                            str(started + 900): {},
                            str(started + 1800): {},
                            str(started + 2700): {},
                            str(started + 3600): {},
                        },
                    },
                    {
                        "id": str(livesession.id),
                        "display_name": "samia@test-fun-mooc.fr",
                        "is_registered": True,
                        "live_attendance": {
                            str(started): {
                                "connectedInBetween": True,
                                "lastConnected": int(started - 1000),
                            },
                            str(started + 900): {"volume": 0.15},
                            str(started + 1800): {"volume": 0.18},
                            str(started + 2700): {},
                            str(started + 3600): {},
                        },
                    },
                ],
            },
        )

        # keys returned are only the key of the timeline of the video
        list_timestamps_attendences = video.get_list_timestamps_attendences()
        live_attendance_ls1 = response.json()["results"][0]["live_attendance"]
        self.assertEqual(len(list_timestamps_attendences), len(live_attendance_ls1))
        self.assertEqual(len(list_timestamps_attendences), settings.ATTENDANCE_POINTS)

    @override_settings(ATTENDANCE_POINTS=5)
    def test_api_livesession_read_attendances_well_computed_start_and_live_running(
        self,
    ):
        """Check depending on the live_attendance's livesession, the key
        live_attendance is well computed for a live that is not over yet and
        where the end time is changing
        """
        # set the start at current time minus 30 minutes
        started = int(to_timestamp(timezone.now())) - 30 * 60

        # we expect 5 attendance points for 30 minutes, so one every 7 and a half min
        elapsed = 450

        video = VideoFactory(
            live_state=RUNNING,
            live_info={"started_at": str(started)},
            live_type=JITSI,
        )

        livesession = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="samia@test-fun-mooc.fr",
            is_registered=True,
            live_attendance={
                started
                + 30: {
                    "fullScreen": 1,
                    "muted": 1,
                    "player_timer": 10,
                    "playing": 1,
                    "timestamp": str(started + 30),
                    "volume": 0.10,
                },
                started
                + 40: {
                    "fullScreen": 1,
                    "muted": 1,
                    "player_timer": 10,
                    "playing": 1,
                    "timestamp": started + 40,
                    "volume": 0.11,
                },
                started
                + 2 * elapsed
                - 5: {
                    "fullScreen": 0,
                    "muted": 0,
                    "player_timer": 10,
                    "playing": 1,
                    "timestamp": started + 2 * elapsed - 5,
                    "volume": 0.19,
                },
                started
                + 2 * elapsed
                + 5: {
                    "fullScreen": 0,
                    "muted": 0,
                    "player_timer": 10,
                    "playing": 1,
                    "timestamp": started + 2 * elapsed + 5,
                    "volume": 0.19,
                },
            },
            lti_id=str(video.playlist.lti_id),
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )

        livesession_public = AnonymousLiveSessionFactory(
            email=None,
            is_registered=False,
            live_attendance={
                started
                + elapsed
                - 6: {
                    "fullScreen": 1,
                    "muted": 1,
                    "player_timer": 10,
                    "playing": 1,
                    "timestamp": str(started + elapsed - 6),
                    "volume": 0.15,
                },
                started
                + elapsed
                + 4: {
                    "fullScreen": 1,
                    "muted": 0,
                    "player_timer": 20,
                    "playing": 1,
                    "timestamp": str(started + elapsed + 4),
                    "volume": 0.18,
                },
            },
            video=video,
        )

        # token with right context_id and lti_user_id
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            consumer_site=str(video.playlist.consumer_site.id),
            context_id=str(video.playlist.lti_id),
        )
        livesession.refresh_from_db()
        livesession_public.refresh_from_db()

        response = self.client.get(
            "/api/livesessions/list_attendances/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            response.json(),
            {
                "count": 2,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "id": str(livesession.id),
                        "display_name": "samia@test-fun-mooc.fr",
                        "is_registered": True,
                        "live_attendance": {
                            str(started): {},
                            str(started + elapsed): {
                                "connectedInBetween": True,
                                "lastConnected": started + 40,
                            },
                            str(started + 2 * elapsed): {
                                "fullScreen": 0,
                                "muted": 0,
                                "player_timer": 10,
                                "playing": 1,
                                "timestamp": started + 2 * elapsed - 5,
                                "volume": 0.19,
                            },
                            str(started + 3 * elapsed): {
                                "connectedInBetween": True,
                                "lastConnected": started + 2 * elapsed + 5,
                            },
                            str(started + 4 * elapsed): {},
                        },
                    },
                    {
                        "id": str(livesession_public.id),
                        "display_name": None,
                        "is_registered": False,
                        "live_attendance": {
                            str(started): {},
                            str(started + elapsed): {
                                "muted": 1,
                                "volume": 0.15,
                                "playing": 1,
                                "timestamp": str(started + elapsed - 6),
                                "fullScreen": 1,
                                "player_timer": 10,
                            },
                            str(started + 2 * elapsed): {
                                "connectedInBetween": True,
                                "lastConnected": started + elapsed + 4,
                            },
                            str(started + 3 * elapsed): {},
                            str(started + 4 * elapsed): {},
                        },
                    },
                ],
            },
        )

        list_timestamps_attendences = video.get_list_timestamps_attendences()
        live_attendance_ls1 = response.json()["results"][0]["live_attendance"]
        live_attendance_ls2 = response.json()["results"][1]["live_attendance"]

        self.assertEqual(len(list_timestamps_attendences), len(live_attendance_ls1))
        self.assertEqual(len(list_timestamps_attendences), len(live_attendance_ls2))
        self.assertEqual(len(list_timestamps_attendences), settings.ATTENDANCE_POINTS)

        # list of timestamp of the video are identical for each livesession
        self.assertEqual(list_timestamps_attendences.keys(), live_attendance_ls1.keys())
        self.assertEqual(list_timestamps_attendences.keys(), live_attendance_ls2.keys())

    @override_settings(ATTENDANCE_POINTS=3)
    def test_api_livesession_read_attendances_well_computed_start_and_live_running_cache_is_on(
        self,
    ):
        """Check depending on the live_attendance's livesession, the key
        live_attendance is well computed for a live that is not over yet and
        where the end is changing. We control that the results are cached.
        """
        # set the start at current time minus 30 seconds
        started = int(to_timestamp(timezone.now())) - 30

        video = VideoFactory(
            live_state=RUNNING,
            live_info={"started_at": str(started)},
            live_type=JITSI,
        )
        video2 = VideoFactory(
            live_state=RUNNING,
            live_info={"started_at": str(started)},
            live_type=JITSI,
        )

        livesession = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="samia@test-fun-mooc.fr",
            live_attendance={started + 10: {"onStage": 0}, started + 20: {"muted": 0}},
            lti_id=str(video.playlist.lti_id),
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="samia@test-fun-mooc.fr",
            live_attendance={started + 5: {"onStage": 0}, started + 30: {"muted": 0}},
            lti_id=str(video.playlist.lti_id),
            lti_user_id="88888f3807599c377bf0e5bf072359fd",
            video=video2,
        )

        livesession_public = AnonymousLiveSessionFactory(
            email=None,
            live_attendance={
                started + 5: {"muted": 1},
                started + 18: {"muted": 0},  # will be ignored
                started + 25: {"fullscreen": 1, "muted": 1},
            },
            video=video,
        )

        # token with right context_id and lti_user_id
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            consumer_site=str(video.playlist.consumer_site.id),
            context_id=str(video.playlist.lti_id),
        )
        livesession.refresh_from_db()
        livesession_public.refresh_from_db()
        with self.assertNumQueries(3):
            response = self.client.get(
                "/api/livesessions/list_attendances/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 200)
        # we expect 3 attendance points for 30 secondes, so one every 15
        response_json = {
            "count": 2,
            "next": None,
            "previous": None,
            "results": [
                {
                    "id": str(livesession.id),
                    "display_name": "samia@test-fun-mooc.fr",
                    "is_registered": False,
                    "live_attendance": {
                        str(started): {},
                        str(started + 15): {"onStage": 0},
                        str(started + 30): {"muted": 0},
                    },
                },
                {
                    "id": str(livesession_public.id),
                    "display_name": None,
                    "is_registered": False,
                    "live_attendance": {
                        str(started): {},
                        str(started + 15): {"muted": 1},
                        str(started + 30): {"muted": 1, "fullscreen": 1},
                    },
                },
            ],
        }
        self.assertEqual(response.json(), response_json)

        list_timestamps_attendences = video.get_list_timestamps_attendences()
        live_attendance_ls1 = response.json()["results"][0]["live_attendance"]
        live_attendance_ls2 = response.json()["results"][1]["live_attendance"]
        # the list of timestamp are identical
        self.assertEqual(len(list_timestamps_attendences), len(live_attendance_ls1))
        self.assertEqual(len(list_timestamps_attendences), len(live_attendance_ls2))
        self.assertEqual(len(list_timestamps_attendences), settings.ATTENDANCE_POINTS)

        # keys returned are identical for each livesession
        self.assertEqual(list_timestamps_attendences.keys(), live_attendance_ls1.keys())
        self.assertEqual(list_timestamps_attendences.keys(), live_attendance_ls2.keys())

        # we call again the same request,
        # results are identical as it is cached, no queries are executed
        with self.assertNumQueries(0):
            response = self.client.get(
                "/api/livesessions/list_attendances/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json(), response_json)

        # we now query the list of attendance for video2
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video2,
            consumer_site=str(video2.playlist.consumer_site.id),
            context_id=str(video2.playlist.lti_id),
        )
        # nothing is already cached
        with self.assertNumQueries(3):
            response = self.client.get(
                "/api/livesessions/list_attendances/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 200)
        # results are different
        self.assertNotEqual(response.json(), response_json)

    @override_settings(
        CACHES={
            "default": {
                "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            },
            "memory_cache": {
                "BACKEND": "django.core.cache.backends.locmem.LocMemCache"
            },
        }
    )
    @override_settings(ATTENDANCE_POINTS=3)
    @override_settings(VIDEO_ATTENDANCES_CACHE_DURATION=10)
    @override_settings(UPDATE_STATE_SHARED_SECRETS=["shared secret"])
    def test_api_livesession_reset_cache(
        self,
    ):
        """If a video stopped goes running again, keys with no timeout must be dropped"""
        # set the start at current time minus 30 seconds
        started = int(to_timestamp(timezone.now())) - 30

        video = VideoFactory(
            id="a1a21411-bf2f-4926-b97f-3c48a124d528",
            live_state=STOPPED,
            live_info={
                "medialive": {
                    "input": {
                        "id": "medialive_input_1",
                        "endpoints": [
                            "https://live_endpoint1",
                            "https://live_endpoint2",
                        ],
                    },
                    "channel": {"id": "medialive_channel_1"},
                },
                "mediapackage": {
                    "id": "mediapackage_channel_1",
                    "endpoints": {
                        "hls": {
                            "id": "endpoint1",
                            "url": "https://channel_endpoint1/live.m3u8",
                        },
                    },
                },
                "started_at": started,
                "stopped_at": to_timestamp(timezone.now() + timedelta(minutes=10)),
            },
            live_type=RAW,
        )

        livesession = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="samia@test-fun-mooc.fr",
            live_attendance={started + 10: {"onStage": 0}, started + 20: {"muted": 0}},
            lti_id=str(video.playlist.lti_id),
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )

        livesession_public = AnonymousLiveSessionFactory(
            email=None,
            live_attendance={
                started + 5: {"muted": 1},
                started + 18: {"muted": 0},  # will be ignored
                started + 25: {"fullscreen": 1, "muted": 1},
            },
            video=video,
        )

        # token with right context_id and lti_user_id
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            consumer_site=str(video.playlist.consumer_site.id),
            context_id=str(video.playlist.lti_id),
        )
        livesession.refresh_from_db()
        livesession_public.refresh_from_db()
        prefix_key = f"attendances:video:{video.id}"

        with self.assertNumQueries(3):
            response = self.client.get(
                "/api/livesessions/list_attendances/?limit=99",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            response_json = response.json()
            cache_key = f"{prefix_key}offset:Nonelimit:99"
            self.assertEqual(response.status_code, 200)
            self.assertEqual(cache.get(prefix_key), [cache_key])

        # two queries are cached with no timeout
        # results are identical as it is cached, no queries are executed
        with self.assertNumQueries(3):
            response = self.client.get(
                "/api/livesessions/list_attendances/?limit=1&offset=1",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            cache_key_offset = f"{prefix_key}offset:1limit:1"

            response_offset_1 = response.json()
            self.assertEqual(response.status_code, 200)
            self.assertNotEqual(response_json, response_offset_1)
            self.assertEqual(cache.get(prefix_key), [cache_key, cache_key_offset])

        # go over the cache limit, the two queries are cached
        new_time = timezone.now() + timedelta(
            settings.VIDEO_ATTENDANCES_CACHE_DURATION + 1
        )
        with mock.patch.object(
            timezone, "now", return_value=new_time
        ), mock.patch.object(time, "time", return_value=int(to_timestamp(new_time))):
            with self.assertNumQueries(0):
                response = self.client.get(
                    "/api/livesessions/list_attendances/?limit=99",
                    HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                )

                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json(), response_json)

            with self.assertNumQueries(0):
                response = self.client.get(
                    "/api/livesessions/list_attendances/?limit=1&offset=1",
                    HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                )

            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json(), response_offset_1)

        # we now reset the video, keys must have been reseted
        data = {
            "logGroupName": "/aws/lambda/dev-test-marsha-medialive",
            "requestId": "7954d4d1-9dd3-47f4-9542-e7fd5f937fe6",
            "state": "running",
        }
        signature = generate_hash("shared secret", json.dumps(data).encode("utf-8"))
        response = self.client.patch(
            f"/api/videos/{video.id}/update-live-state/",
            data,
            content_type="application/json",
            HTTP_X_MARSHA_SIGNATURE=signature,
        )
        self.assertEqual(response.status_code, 200)

        # results aren't cached anymore
        with self.assertNumQueries(3):
            response = self.client.get(
                "/api/livesessions/list_attendances/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

            self.assertEqual(response.status_code, 200)

        with self.assertNumQueries(3):
            response = self.client.get(
                "/api/livesessions/list_attendances/?limit=1&offset=1",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 200)
        # listing of key are deleted
        self.assertEqual(cache.get(prefix_key, []), [])

    @override_settings(ATTENDANCE_POINTS=3)
    @override_settings(VIDEO_ATTENDANCES_CACHE_DURATION=2)
    @override_settings(
        CACHES={
            "default": {
                "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            },
            "memory_cache": {
                "BACKEND": "django.core.cache.backends.locmem.LocMemCache"
            },
        }
    )
    def test_api_livesession_video_no_stopped_at_cache_has_timeout(
        self,
    ):
        """If the video has not ended, we control that the results are cached
        but with a timeout.
        """
        # set the start at current time minus 30 seconds
        started = int(to_timestamp(timezone.now())) - 30
        video = VideoFactory(
            live_state=RUNNING,
            live_info={"started_at": str(started)},
            live_type=JITSI,
        )

        livesession = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="samia@test-fun-mooc.fr",
            live_attendance={started + 10: {"onStage": 0}, started + 20: {"muted": 0}},
            lti_id=str(video.playlist.lti_id),
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )

        # token with right context_id and lti_user_id
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            consumer_site=str(video.playlist.consumer_site.id),
            context_id=str(video.playlist.lti_id),
        )
        livesession.refresh_from_db()
        with self.assertNumQueries(3):
            response = self.client.get(
                "/api/livesessions/list_attendances/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 200)
        response_json = {
            "count": 1,
            "next": None,
            "previous": None,
            "results": [
                {
                    "id": str(livesession.id),
                    "display_name": "samia@test-fun-mooc.fr",
                    "is_registered": False,
                    "live_attendance": {
                        str(started): {},
                        str(started + 15): {"onStage": 0},
                        str(started + 30): {"muted": 0},
                    },
                }
            ],
        }
        self.assertEqual(response.json(), response_json)

        with self.assertNumQueries(0):
            response = self.client.get(
                "/api/livesessions/list_attendances/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json(), response_json)

        # go over the cache limit
        new_time = timezone.now() + timedelta(
            settings.VIDEO_ATTENDANCES_CACHE_DURATION + 1
        )
        with mock.patch.object(
            timezone, "now", return_value=new_time
        ), mock.patch.object(time, "time", return_value=int(to_timestamp(new_time))):
            # we call again the same request,
            # results are not identical
            with self.assertNumQueries(3):
                response = self.client.get(
                    "/api/livesessions/list_attendances/",
                    HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                )

                self.assertEqual(response.status_code, 200)
                self.assertNotEqual(response.json(), response_json)

    @override_settings(
        CACHES={
            "default": {
                "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            },
            "memory_cache": {
                "BACKEND": "django.core.cache.backends.locmem.LocMemCache"
            },
        }
    )
    @override_settings(ATTENDANCE_POINTS=3)
    @override_settings(VIDEO_ATTENDANCES_CACHE_DURATION=1)
    def test_api_livesession_video_ended_cache_no_timeout(
        self,
    ):
        """If the video has ended, we control that the results are cached and
        there is no timeout for the cache.
        """
        started = int(to_timestamp(timezone.now())) - 1000

        video = VideoFactory(
            live_state=STOPPED,
            live_info={"started_at": str(started), "stopped_at": str(started + 30)},
            live_type=JITSI,
        )

        livesession = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="samia@test-fun-mooc.fr",
            live_attendance={started + 10: {"onStage": 0}, started + 20: {"muted": 0}},
            lti_id=str(video.playlist.lti_id),
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )

        # token with right context_id and lti_user_id
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            consumer_site=str(video.playlist.consumer_site.id),
            context_id=str(video.playlist.lti_id),
        )
        livesession.refresh_from_db()
        with self.assertNumQueries(3):
            response = self.client.get(
                "/api/livesessions/list_attendances/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 200)
        response_json = {
            "count": 1,
            "next": None,
            "previous": None,
            "results": [
                {
                    "id": str(livesession.id),
                    "display_name": "samia@test-fun-mooc.fr",
                    "is_registered": False,
                    "live_attendance": {
                        str(started): {},
                        str(started + 15): {"onStage": 0},
                        str(started + 30): {"muted": 0},
                    },
                }
            ],
        }
        self.assertEqual(response.json(), response_json)

        # go over the cache limit
        new_time = timezone.now() + timedelta(
            settings.VIDEO_ATTENDANCES_CACHE_DURATION + 1
        )
        with mock.patch.object(
            timezone, "now", return_value=new_time
        ), mock.patch.object(time, "time", return_value=int(to_timestamp(new_time))):
            # cache has no timeout
            with self.assertNumQueries(0):
                response = self.client.get(
                    "/api/livesessions/list_attendances/",
                    HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                )

                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json(), response_json)

    @override_settings(ATTENDANCE_POINTS=3)
    def test_api_livesession_read_attendances_same_keys(
        self,
    ):
        """
        Check if the keys of the list of timestamp generated by the video are identical with
        the keys of timestamp of the livesession that the
        correct list is returned
        """
        # set the start at current time minus 30 seconds
        started = int(to_timestamp(timezone.now())) - 30

        video = VideoFactory(
            live_state=RUNNING,
            live_info={"started_at": str(started)},
            live_type=JITSI,
        )
        livesession = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="samia@test-fun-mooc.fr",
            live_attendance={
                started: {"onStage": 0},
                started + 15: {"muted": 0},
                started + 30: {"fullscreen": 0},
            },
            lti_id=str(video.playlist.lti_id),
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )

        # token with right context_id and lti_user_id
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            consumer_site=str(video.playlist.consumer_site.id),
            context_id=str(video.playlist.lti_id),
        )
        livesession.refresh_from_db()
        response = self.client.get(
            "/api/livesessions/list_attendances/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        # we expect 3 attendance points for 30 secondes, so one every 15
        self.assertEqual(
            response.json(),
            {
                "count": 1,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "id": str(livesession.id),
                        "display_name": "samia@test-fun-mooc.fr",
                        "is_registered": False,
                        "live_attendance": {
                            str(started): {"onStage": 0},
                            str(started + 15): {"muted": 0},
                            str(started + 30): {"fullscreen": 0},
                        },
                    }
                ],
            },
        )

    @override_settings(ATTENDANCE_PUSH_DELAY=1)
    @override_settings(ATTENDANCE_POINTS=3)
    def test_api_livesession_read_attendances_well_computed_running_between_info_attendance_delay(
        self,
    ):
        """
        ATTENDANCE_PUSH_DELAY is a setting that helps computing the final list of attendance
        and defines when to create a key with in `between_info`. We control that changing this
        value influences the results and the creation of this key.
        """
        # set the start at current time minus 10 seconds
        started = int(to_timestamp(timezone.now())) - 10

        video = VideoFactory(
            live_state=RUNNING,
            live_info={"started_at": str(started)},
            live_type=JITSI,
        )

        livesession = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="samia@test-fun-mooc.fr",
            live_attendance={
                started: {"muted": 1},
                started + 3: {"onStage": 0},
                started + 6: {"muted": 0},
            },
            lti_id=str(video.playlist.lti_id),
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )

        # token with right context_id and lti_user_id
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            consumer_site=str(video.playlist.consumer_site.id),
            context_id=str(video.playlist.lti_id),
        )
        livesession.refresh_from_db()
        with self.assertNumQueries(3):
            response = self.client.get(
                "/api/livesessions/list_attendances/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 200)
        # we expect 3 attendance points for 30 secondes, so one every 15
        response_json = {
            "count": 1,
            "next": None,
            "previous": None,
            "results": [
                {
                    "id": str(livesession.id),
                    "display_name": "samia@test-fun-mooc.fr",
                    "is_registered": False,
                    "live_attendance": {
                        str(started): {"muted": 1},
                        # ATTENDANCE_PUSH_DELAY = 1, started+3 exists but not started+4,
                        # so the user doesn't seem connected anymore at started+ 5
                        str(started + 5): {
                            "connectedInBetween": True,
                            "lastConnected": started + 3,
                        },
                        # ATTENDANCE_PUSH_DELAY = 1, started+6 exists but not started+9,
                        # so the user doesn't seem connected anymore at started+ 10
                        str(started + 10): {
                            "connectedInBetween": True,
                            "lastConnected": started + 6,
                        },
                    },
                }
            ],
        }

        self.assertEqual(response.json(), response_json)

        # we call again the same request,
        # results are identical as it is cached, no queries are executed
        with self.assertNumQueries(0):
            response = self.client.get(
                "/api/livesessions/list_attendances/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json(), response_json)

    def test_api_livesession_read_attendances_well_computed_start_and_live_page(self):
        """Check list is filtered by pagination and changing offset is filtering
        the list and results are properly cached
        """
        video = VideoFactory(
            live_state=RUNNING,
            live_info={
                "started_at": "1533686400",
            },
            live_type=JITSI,
        )
        # livesession no display_name email defined
        live_session_email = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="samia@test-fun-mooc.fr",
            is_registered=True,
            lti_id=str(video.playlist.lti_id),
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )

        # other liveregistration no display_name username defined
        live_session_display_name = LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            consumer_site=video.playlist.consumer_site,
            display_name="Aurélie",
            email="ignored_email@test-fun-mooc.fr",
            is_registered=True,
            lti_id=str(video.playlist.lti_id),
            lti_user_id="77255f3807599c377bf0e5bf072359fd",
            username="Ignored",
            video=video,
        )
        # other liveregistration no display_name username defined
        live_session_username = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email=None,
            live_attendance={"10000": True},
            lti_id=str(video.playlist.lti_id),
            lti_user_id="99255f3807599c377bf0e5bf072359fd",
            username="Sophie",
            video=video,
        )

        live_session_anonymous_id = AnonymousLiveSessionFactory(
            email=None,
            live_attendance={"10033": True},
            video=video,
        )

        # will be ignored, is_registered is False and live_attendance has
        # no data
        AnonymousLiveSessionFactory(email=None, video=video)

        # token with right context_id and lti_user_id
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            consumer_site=str(video.playlist.consumer_site.id),
            context_id=str(video.playlist.lti_id),
        )

        response = self.client.get(
            "/api/livesessions/list_attendances/?limit=1",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        live_session_email.refresh_from_db()
        live_session_display_name.refresh_from_db()
        live_session_username.refresh_from_db()
        live_session_anonymous_id.refresh_from_db()

        response_offset_1_limit_1 = {
            "count": 4,
            "next": "http://testserver/api/livesessions/list_attendances/?limit=1&offset=1",
            "previous": None,
            "results": [
                {
                    "id": str(live_session_email.id),
                    "display_name": "samia@test-fun-mooc.fr",
                    "is_registered": True,
                    "live_attendance": video.get_list_timestamps_attendences(),
                }
            ],
        }

        self.assertEqual(response.json(), response_offset_1_limit_1)

        # results are cached and response is identical
        with self.assertNumQueries(0):
            response = self.client.get(
                "/api/livesessions/list_attendances/?limit=1",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json(), response_offset_1_limit_1)

        response = self.client.get(
            "/api/livesessions/list_attendances/?limit=2&offset=2",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        response_offset_2_limit_1 = {
            "count": 4,
            "next": None,
            "previous": "http://testserver/api/livesessions/list_attendances/?limit=2",
            "results": [
                {
                    "id": str(live_session_username.id),
                    "display_name": "Sophie",
                    "is_registered": False,
                    # the aim of the test is not to test live_attendance's value
                    "live_attendance": response.json()["results"][0]["live_attendance"],
                },
                {
                    "id": str(live_session_anonymous_id.id),
                    "display_name": None,
                    "is_registered": False,
                    # the aim of the test is not to test live_attendance's value
                    "live_attendance": response.json()["results"][1]["live_attendance"],
                },
            ],
        }

        self.assertEqual(response.json(), response_offset_2_limit_1)

        # results are cached and response is identical
        with self.assertNumQueries(0):
            response = self.client.get(
                "/api/livesessions/list_attendances/?limit=2&offset=2",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json(), response_offset_2_limit_1)

    def test_api_livesession_read_attendances_no_timeline_video(self):
        """
        Check that if there is no list of timestamp for the video that it returns
        empty live_attendance
        """

        started = int(to_timestamp(timezone.now())) - 10

        video = VideoFactory(
            live_state=RUNNING,
            live_info={"started_at": str(int(to_timestamp(timezone.now())) - 10)},
            live_type=JITSI,
        )

        livesession = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="samia@test-fun-mooc.fr",
            live_attendance={
                started: {"muted": 1},
                started + 3: {"onStage": 0},
                started + 6: {"muted": 0},
            },
            lti_id=str(video.playlist.lti_id),
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )

        livesession.refresh_from_db()
        # token with right context_id and lti_user_id
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            consumer_site=str(video.playlist.consumer_site.id),
            context_id=str(video.playlist.lti_id),
        )

        with mock.patch.object(
            Video, "get_list_timestamps_attendences", return_value={}
        ):
            response = self.client.get(
                "/api/livesessions/list_attendances/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            self.assertEqual(
                response.json(),
                {
                    "count": 1,
                    "next": None,
                    "previous": None,
                    "results": [
                        {
                            "id": str(livesession.id),
                            "display_name": "samia@test-fun-mooc.fr",
                            "is_registered": False,
                            "live_attendance": {},
                        }
                    ],
                },
            )

    def test_api_livesession_read_attendances_admin_is_registered_att_null_or_empty(
        self,
    ):
        """
        Admin/Instructor user can read all liveattendances computed that have
        is_registered set to True or that have live_attendance's field not empty
        or Null.
        """
        video = VideoFactory(
            live_state=RUNNING,
            live_info={
                "started_at": "1533686400",
            },
            live_type=JITSI,
        )
        AnonymousLiveSessionFactory(
            video=video,
        )
        AnonymousLiveSessionFactory(
            live_attendance={},
            video=video,
        )

        # token with right context_id and lti_user_id
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            consumer_site=str(video.playlist.consumer_site.id),
            context_id=str(video.playlist.lti_id),
        )

        response = self.client.get(
            "/api/livesessions/list_attendances/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            response.json(),
            {
                "count": 0,
                "next": None,
                "previous": None,
                "results": [],
            },
        )

    def test_api_livesession_read_attendances_admin_live_attendance_key_string(self):
        """
        live_attendance field should be composed of timestamps, if one live_attendance
        is wrongly formated, an error is generated
        """
        video = VideoFactory(
            live_state=RUNNING,
            live_info={
                "started_at": "1533686400",
            },
            live_type=JITSI,
        )

        AnonymousLiveSessionFactory(
            live_attendance={"data": True},
            video=video,
        )

        AnonymousLiveSessionFactory(
            live_attendance={"1533686400": {"wonderful": True}},
            video=video,
        )

        # token with right context_id and lti_user_id
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            consumer_site=str(video.playlist.consumer_site.id),
            context_id=str(video.playlist.lti_id),
        )

        response = self.client.get(
            "/api/livesessions/list_attendances/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 400)

        self.assertEqual(
            response.json(), {"live_attendance": "keys in fields should be timestamps"}
        )
