"""Tests for the Video update API of the Marsha project."""
from datetime import timedelta
import json
import random
from unittest import mock
import uuid

from django.conf import settings
from django.test import TestCase

from marsha.core import factories, models
from marsha.core.api import timezone
from marsha.core.defaults import (
    APPROVAL,
    CC_BY_SA,
    HARVESTED,
    IDLE,
    JITSI,
    JOIN_MODE_CHOICES,
    LIVE_CHOICES,
    PENDING,
    RAW,
)
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)


# pylint: disable=too-many-lines


class VideoUpdateAPITest(TestCase):
    """Test the update API of the video object."""

    maxDiff = None

    def test_api_video_update_detail_anonymous(self):
        """Anonymous users should not be allowed to update a video through the API."""
        video = factories.VideoFactory(title="my title")
        data = {"title": "my new title"}
        response = self.client.put(
            f"/api/videos/{video.id}/",
            data,
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)
        video.refresh_from_db()
        self.assertEqual(video.title, "my title")

    def test_api_video_update_detail_student(self):
        """Student users should not be allowed to update a video through the API."""
        video = factories.VideoFactory(title="my title")
        jwt_token = StudentLtiTokenFactory(playlist=video.playlist)

        data = {"title": "my new title"}
        response = self.client.put(
            f"/api/videos/{video.id}/",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )
        video.refresh_from_db()
        self.assertEqual(video.title, "my title")

    def test_api_video_update_detail_token_user_title(self):
        """Token users should be able to update the title of their video through the API."""
        video = factories.VideoFactory(title="my title")
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)
        data = {"title": "my new title"}
        response = self.client.put(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.title, "my new title")

    def test_api_video_update_detail_token_user_title_null(self):
        """Token users can not set a null title."""
        video = factories.VideoFactory(title="my title")
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)
        data = {"title": None}
        response = self.client.put(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"title": ["This field may not be null."]})
        video.refresh_from_db()
        self.assertEqual(video.title, "my title")

    def test_api_video_update_detail_token_user_title_empty(self):
        """Token users can not set an empty title."""
        video = factories.VideoFactory(title="my title")
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)
        data = {"title": " "}
        response = self.client.put(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"title": ["This field may not be blank."]})
        video.refresh_from_db()
        self.assertEqual(video.title, "my title")

    def test_api_video_update_detail_token_scheduled_date_future(self):
        """
        Update video with scheduled date.

        Users should be able to update the starting_date of their video through the API
        as long as starting_date is in the future.
        """
        video = factories.VideoFactory(
            title="my title",
            live_state=IDLE,
            live_type=JITSI,
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)
        # set microseconds to 0 to compare date surely as serializer truncate them
        starting_at = (timezone.now() + timedelta(hours=1)).replace(microsecond=0)
        data = {
            "title": "title required",
            "starting_at": starting_at,
        }
        response = self.client.put(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.starting_at, starting_at)
        self.assertTrue(video.is_scheduled)

    def test_api_video_update_detail_token_scheduled_date_future_live_session(self):
        """
        Update date of video with scheduled date.

        Live_sessions registered for this video should have their field must_notify
        updated
        """
        video = factories.VideoFactory(
            title="my title",
            live_state=IDLE,
            live_type=JITSI,
        )
        video2 = factories.VideoFactory(
            live_state=IDLE,
            live_type=JITSI,
        )
        ls_must_notify_none = factories.LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            is_registered=True,
            should_send_reminders=True,
            lti_id=str(video.playlist.lti_id),
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        ls_dont_send_reminders = factories.LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            is_registered=True,
            should_send_reminders=False,
            lti_id=str(video.playlist.lti_id),
            lti_user_id="66255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        ls_not_registered = factories.LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            is_registered=False,
            should_send_reminders=False,
            lti_id=str(video.playlist.lti_id),
            lti_user_id="76255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        ls_must_notify_data = factories.LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            email="sarah@openfun.fr",
            must_notify=["SOME_VAL"],
            is_registered=True,
            should_send_reminders=True,
            video=video,
        )
        ls_video2 = factories.LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            email="raoul@openfun.fr",
            must_notify=["SOME_VAL"],
            is_registered=True,
            should_send_reminders=True,
            video=video2,
        )
        # livesession already has the tag, it won't be added
        ls_with_tag = factories.LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            email="with_tag@openfun.fr",
            must_notify=[settings.REMINDER_DATE_UPDATED],
            is_registered=True,
            should_send_reminders=True,
            video=video,
        )
        # livesession has a reminder in error, it won't be added
        ls_with_reminder_error = factories.LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            email="with_error@openfun.fr",
            reminders=[settings.REMINDER_1, settings.REMINDER_ERROR],
            is_registered=True,
            should_send_reminders=True,
            video=video,
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)
        # we only change the title
        response = self.client.put(
            f"/api/videos/{video.id}/",
            {
                "title": "new title",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        # data have been updated but field must_notify has not changed
        self.assertEqual(video.title, "new title")
        ls_must_notify_none.refresh_from_db()
        ls_must_notify_data.refresh_from_db()
        self.assertEqual(ls_must_notify_none.must_notify, [])
        self.assertEqual(ls_must_notify_data.must_notify, ["SOME_VAL"])

        # set microseconds to 0 to compare date surely as serializer truncate them
        starting_at = (timezone.now() + timedelta(days=1)).replace(microsecond=0)
        data = {
            "title": "title required",
            "starting_at": starting_at,
        }
        response = self.client.put(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.starting_at, starting_at)
        self.assertTrue(video.is_scheduled)
        ls_must_notify_data.refresh_from_db()
        ls_must_notify_none.refresh_from_db()
        self.assertEqual(
            ls_must_notify_data.must_notify,
            ["SOME_VAL", settings.REMINDER_DATE_UPDATED],
        )
        self.assertEqual(
            ls_must_notify_none.must_notify, [settings.REMINDER_DATE_UPDATED]
        )

        # these records haven't changed
        ls_dont_send_reminders.refresh_from_db()
        ls_not_registered.refresh_from_db()
        ls_video2.refresh_from_db()
        ls_with_reminder_error.refresh_from_db()
        ls_with_tag.refresh_from_db()
        self.assertEqual(ls_dont_send_reminders.must_notify, [])
        self.assertEqual(ls_not_registered.must_notify, [])
        self.assertEqual(ls_video2.must_notify, ["SOME_VAL"])
        self.assertEqual(ls_with_reminder_error.must_notify, [])
        self.assertEqual(ls_with_tag.must_notify, [settings.REMINDER_DATE_UPDATED])

    def test_api_video_update_detail_token_scheduled_date_past(self):
        """
        Try to schedule a video with a date in the past.

        Users can't update the starting_date of their video through the API if starting_date
        is in the past.
        """
        init_starting_at = timezone.now() + timedelta(hours=1)
        video = factories.VideoFactory(
            live_state=IDLE,
            live_type=JITSI,
            starting_at=init_starting_at,
            title="my title",
        )
        self.assertTrue(video.is_scheduled)
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)

        # try to set a date in the past
        # set microseconds to 0 to compare date surely as serializer truncate them
        starting_at = (timezone.now() - timedelta(days=10)).replace(microsecond=0)
        data = {"title": "title required", "starting_at": starting_at}
        response = self.client.put(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        # data didn't change and an error is thrown
        self.assertEqual(
            json.loads(response.content),
            {
                "starting_at": [
                    f"{starting_at} is not a valid date, date should be planned after!"
                ]
            },
        )
        video.refresh_from_db()
        self.assertEqual(video.starting_at, init_starting_at)
        self.assertTrue(video.is_scheduled)

    def test_api_video_update_detail_token_scheduled_date_to_none(self):
        """
        Update starting_at to None.

        Users can update the starting_date of their video through the API to None to cancel the
        scheduled mode.
        """
        starting_at = timezone.now() + timedelta(minutes=10)
        video = factories.VideoFactory(
            live_state=IDLE, live_type=JITSI, starting_at=starting_at, title="my title"
        )
        self.assertTrue(video.is_scheduled)
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)

        data = {"title": "title required", "starting_at": None}
        response = self.client.put(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.starting_at, None)
        self.assertFalse(video.is_scheduled)

    def test_api_video_update_detail_token_scheduled_with_previous_starting_at_already_past(
        self,
    ):
        """starting_at is in the past, it can't be updated anymore."""
        initial_starting_at = timezone.now() + timedelta(days=10)
        video = factories.VideoFactory(
            live_state=IDLE, live_type=RAW, starting_at=initial_starting_at
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)
        # now is set to after initial starting_at
        now = initial_starting_at + timedelta(days=10)
        with mock.patch.object(timezone, "now", return_value=now):
            # even if we try to update the starting_at in the future date, as previous one is past
            # it can't get updated.
            new_starting_at = now + timedelta(days=10)
            response = self.client.put(
                f"/api/videos/{video.id}/",
                {"starting_at": new_starting_at, "title": "Required title"},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )
            content = json.loads(response.content)
            self.assertEqual(
                content,
                {
                    "starting_at": [
                        (
                            f"Field starting_at {initial_starting_at} "
                            "is already past and can't be updated!"
                        )
                    ]
                },
            )
            self.assertEqual(response.status_code, 400)

    def test_api_video_update_detail_token_user_description(self):
        """Token users should be able to update the description of their video through the API."""
        video = factories.VideoFactory(description="my description")
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)

        response = self.client.get(
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        data = json.loads(response.content)
        data["description"] = "my new description"
        response = self.client.put(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.description, "my new description")

    def test_api_video_update_detail_token_user_uploaded_on(self):
        """Token users trying to update "uploaded_on" through the API should be ignored."""
        video = factories.VideoFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)

        response = self.client.get(
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        data = json.loads(response.content)
        self.assertIsNone(data["active_stamp"])
        data["active_stamp"] = "1533686400"

        response = self.client.put(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.uploaded_on, None)

    def test_api_video_update_detail_token_user_upload_state(self):
        """Token users should not be able to update "upload_state" through the API."""
        video = factories.VideoFactory(
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__title="playlist-002",
            live_state=HARVESTED,
            live_type=JITSI,
            live_info={
                "started_at": "1533686400",
                "stopped_at": "1533686400",
            },
            upload_state=PENDING,
            uploaded_on="2019-09-24 07:24:40+00",
            transcode_pipeline="AWS",
            resolutions=[240, 480, 720],
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)

        response = self.client.get(
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        data = json.loads(response.content)
        self.assertEqual(data["upload_state"], "pending")
        data["upload_state"] = "ready"

        response = self.client.put(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "active_stamp": "1569309880",
                "allow_recording": True,
                "can_edit": True,
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "is_public": False,
                "is_ready_to_show": True,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "show_download": True,
                "starting_at": None,
                "description": video.description,
                "id": str(video.id),
                "is_live": True,
                "upload_state": PENDING,
                "timed_text_tracks": [],
                "thumbnail": None,
                "title": video.title,
                "urls": {
                    "manifests": {},
                    "mp4": {
                        "240": f"https://abc.cloudfront.net/{video.id}/"
                        "mp4/1569309880_240.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-002_1569309880.mp4",
                        "480": f"https://abc.cloudfront.net/{video.id}/"
                        "mp4/1569309880_480.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-002_1569309880.mp4",
                        "720": f"https://abc.cloudfront.net/{video.id}/"
                        "mp4/1569309880_720.mp4?response-content-disposition=attachment%3B+"
                        "filename%3Dplaylist-002_1569309880.mp4",
                    },
                    "thumbnails": {
                        "240": f"https://abc.cloudfront.net/{video.id}/"
                        "thumbnails/1569309880_240.0000000.jpg",
                        "480": f"https://abc.cloudfront.net/{video.id}/"
                        "thumbnails/1569309880_480.0000000.jpg",
                        "720": f"https://abc.cloudfront.net/{video.id}/"
                        "thumbnails/1569309880_720.0000000.jpg",
                    },
                },
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(video.playlist.id),
                    "title": "playlist-002",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "recording_time": 0,
                "retention_date": None,
                "shared_live_medias": [],
                "live_state": HARVESTED,
                "live_info": {
                    "started_at": "1533686400",
                    "stopped_at": "1533686400",
                    "jitsi": {
                        "config_overwrite": {},
                        "domain": "meet.jit.si",
                        "external_api_url": "https://meet.jit.si/external_api.js",
                        "interface_config_overwrite": {},
                        "room_name": str(video.id),
                    },
                },
                "live_type": JITSI,
                "xmpp": None,
                "tags": [],
                "license": None,
            },
        )
        video.refresh_from_db()
        self.assertEqual(video.upload_state, PENDING)

    def test_api_video_update_detail_token_user_join_mode(self):
        """Token users should be able to update the join mode of their video through the API."""
        video = factories.VideoFactory(
            description="my description",
            join_mode=APPROVAL,
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)

        response = self.client.get(
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        data = json.loads(response.content)
        data["join_mode"] = random.choice(
            [mode for (mode, _) in JOIN_MODE_CHOICES if mode != video.join_mode]
        )
        response = self.client.put(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.join_mode, data["join_mode"])

    def test_api_video_instructor_update_video_in_read_only(self):
        """An instructor with read_only set to true should not be able to update the video."""
        video = factories.VideoFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=video.playlist,
            permissions__can_update=False,
        )

        data = {"upload_state": "ready"}

        response = self.client.put(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_video_patch_video_anonymous(self):
        """Anonymous users should not be allowed to patch a video through the API."""
        video = factories.VideoFactory(title="my title")
        data = {"title": "my new title"}
        response = self.client.patch(
            f"/api/videos/{video.id}/",
            data,
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)
        video.refresh_from_db()
        self.assertEqual(video.title, "my title")

    def test_api_video_patch_video_student(self):
        """Student users should not be allowed to patch a video through the API."""
        video = factories.VideoFactory(title="my title")
        jwt_token = StudentLtiTokenFactory(playlist=video.playlist)

        data = {"title": "my new title"}
        response = self.client.patch(
            f"/api/videos/{video.id}/",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )
        video.refresh_from_db()
        self.assertEqual(video.title, "my title")

    def test_api_video_instructor_patch_video_in_read_only(self):
        """An instructor with read_only set to true should not be able to patch the video."""
        video = factories.VideoFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=video.playlist,
            permissions__can_update=False,
        )

        data = {"upload_state": "ready"}

        response = self.client.patch(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_video_patch_detail_token_user_stamp(self):
        """Token users should not be able to patch active stamp.

        this field can only be updated by AWS via the separate update-state API endpoint.
        """
        video = factories.VideoFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)
        self.assertIsNone(video.uploaded_on)

        data = {"active_stamp": "1533686400"}

        response = self.client.patch(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertIsNone(video.uploaded_on)

    def test_api_video_update_detail_token_user_id(self):
        """Token users trying to update the ID of a video they own should be ignored."""
        video = factories.VideoFactory()
        original_id = video.id
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)

        response = self.client.get(
            f"/api/videos/{video.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        data = json.loads(response.content)
        data["id"] = "my new id"

        response = self.client.put(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.id, original_id)

    def test_api_video_update_detail_token_user_other_video(self):
        """Token users should not be allowed to update another video through the API."""
        video_token = factories.VideoFactory()
        video_update = factories.VideoFactory(title="my title")
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video_token.playlist)

        data = {"title": "my new title"}
        response = self.client.put(
            f"/api/videos/{video_update.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)
        video_update.refresh_from_db()
        self.assertEqual(video_update.title, "my title")

    def test_api_video_patch_detail_token_user_description(self):
        """Token users should be able to patch fields on their video through the API."""
        video = factories.VideoFactory(description="my description")
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)

        data = {"description": "my new description"}

        response = self.client.patch(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.description, "my new description")

    def test_api_video_patch_detail_token_user_is_public(self):
        """Instructors and administrators should be able to
        patch the public flag of their video through the API."""
        video = factories.VideoFactory(is_public=False)
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)
        data = {"is_public": True}
        response = self.client.patch(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertTrue(video.is_public)

    def test_api_video_patch_detail_token_user_allow_recording(self):
        """Instructors and administrators should be able to
        patch the recording flag of their video through the API."""
        video = factories.VideoFactory()
        self.assertTrue(video.allow_recording)

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)
        data = {"allow_recording": False}
        response = self.client.patch(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertFalse(video.allow_recording)

    def test_api_video_patch_detail_token_user_tags(self):
        """Instructors and administrators should be able to
        patch tags."""
        video = factories.VideoFactory()
        self.assertEqual(video.tags, [])

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)
        data = {"tags": ["foo", "bar"]}
        response = self.client.patch(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.tags, ["foo", "bar"])

    def test_api_video_patch_detail_token_user_license(self):
        """Instructors and administrators should be able to
        patch video license."""
        video = factories.VideoFactory()
        self.assertIsNone(video.license)

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)
        data = {"license": CC_BY_SA}
        response = self.client.patch(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.license, CC_BY_SA)

    def test_api_video_patch_detail_token_user_estimated_duration(self):
        """Instructors and administrators should be able to
        patch the estimated_duration field of their video through the API."""
        video = factories.VideoFactory()
        self.assertIsNone(video.estimated_duration)

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)
        estimated_duration = timedelta(seconds=2100)
        data = {"estimated_duration": estimated_duration}
        response = self.client.patch(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json().get("estimated_duration"), "00:35:00")
        video.refresh_from_db()
        self.assertEqual(video.estimated_duration, estimated_duration)

    def test_api_video_patch_detail_token_user_estimated_duration_negative(self):
        """Sending a negative integer for estimated_duration should be rejected."""
        video = factories.VideoFactory()
        self.assertIsNone(video.estimated_duration)

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)
        # from -7 days to -1 second
        estimated_duration = timedelta(seconds=random.randint(-604800, -1))
        data = {"estimated_duration": estimated_duration}
        response = self.client.patch(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "estimated_duration": [
                    "Ensure this value is greater than or equal to 0."
                ]
            },
        )
        video.refresh_from_db()
        self.assertIsNone(video.estimated_duration)

    def test_api_video_patch_detail_token_user_estimated_duration_negative_one_second(
        self,
    ):
        """As soon as the estimated_duration is negative, the request should be rejected."""
        video = factories.VideoFactory()
        self.assertIsNone(video.estimated_duration)

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)

        estimated_duration = timedelta(seconds=-1)
        data = {"estimated_duration": estimated_duration}
        response = self.client.patch(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "estimated_duration": [
                    "Ensure this value is greater than or equal to 0."
                ]
            },
        )
        video.refresh_from_db()
        self.assertIsNone(video.estimated_duration)

    def test_api_video_patch_detail_token_user_has_chat(self):
        """Instructors and administrators should be able to
        patch the chat flag of their video through the API."""
        video = factories.VideoFactory()
        self.assertTrue(video.has_chat)

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)
        data = {"has_chat": False}
        response = self.client.patch(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertFalse(video.has_chat)

    def test_api_video_patch_detail_token_user_has_live_media(self):
        """Instructors and administrators should be able to
        patch the live media flag of their video through the API."""
        video = factories.VideoFactory()
        self.assertTrue(video.has_live_media)

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)
        data = {"has_live_media": False}
        response = self.client.patch(
            f"/api/videos/{video.id}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertFalse(video.has_live_media)

    def test_api_video_patch_by_organization_instructor(self):
        """Organization instructors cannot patch videos on the API."""
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            role=models.INSTRUCTOR, organization=organization, user=user
        )
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist, title="existing title")

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.patch(
            f"/api/videos/{video.id}/",
            {"title": "updated title"},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)
        video.refresh_from_db()
        self.assertEqual(video.title, "existing title")

    def test_api_video_patch_by_instructor_scheduling_date_future(self):
        """
        Updating starting_at with date in the future.

        Instructors and administrators with a token should be able to patch fields
        starting_at on their video through the API as long as date is in the future.
        """
        video = factories.VideoFactory(
            live_state=IDLE, live_type=JITSI, starting_at=None
        )

        # starting_at is None there is no event scheduled
        self.assertFalse(video.is_scheduled)

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)

        # starting_at gets updated to a date in the future
        # set microseconds to 0 to compare date surely as serializer truncate them
        starting_at = (timezone.now() + timedelta(hours=1)).replace(microsecond=0)
        response = self.client.patch(
            f"/api/videos/{video.id}/",
            {"starting_at": starting_at, "is_scheduled": False},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        # video is now a scheduled one
        self.assertTrue(video.is_scheduled)
        self.assertEqual(video.live_state, IDLE)
        self.assertEqual(video.starting_at, starting_at)

        # we now try to set starting_at to a date in the past, and it mustn't be allowed
        past_starting_at = (timezone.now() - timedelta(hours=1)).replace(microsecond=0)
        response = self.client.patch(
            f"/api/videos/{video.id}/",
            {"starting_at": past_starting_at},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        content = json.loads(response.content)
        # data didn't change and an error is thrown
        self.assertEqual(
            content,
            {
                "starting_at": [
                    f"{past_starting_at} is not a valid date, date should be planned after!"
                ]
            },
        )
        video.refresh_from_db()
        self.assertEqual(video.starting_at, starting_at)
        self.assertTrue(video.is_scheduled)

        # we now set the date to null to cancel the event
        response = self.client.patch(
            f"/api/videos/{video.id}/",
            {"starting_at": None},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        # request got approved
        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()

        # video is not a scheduled one anymore
        self.assertFalse(video.is_scheduled)
        self.assertEqual(video.starting_at, None)

    def test_api_patch_video_with_previous_starting_at_already_past(self):
        """Date is already set in video and is in the past, it can't be updated anymore."""
        initial_starting_at = timezone.now() + timedelta(days=10)
        video = factories.VideoFactory(
            live_state=IDLE, live_type=RAW, starting_at=initial_starting_at
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)
        # now is set after video.starting_at
        now = initial_starting_at + timedelta(days=10)
        with mock.patch.object(timezone, "now", return_value=now):
            # even if we try to update the starting_at in the future date, as previous one is past
            # it can't get updated.
            new_starting_at = now + timedelta(days=100)
            response = self.client.patch(
                f"/api/videos/{video.id}/",
                {"starting_at": new_starting_at, "title": "Required title"},
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )
            content = json.loads(response.content)
            self.assertEqual(
                content,
                {
                    "starting_at": [
                        (
                            f"Field starting_at {initial_starting_at} "
                            "is already past and can't be updated!"
                        )
                    ]
                },
            )
            self.assertEqual(response.status_code, 400)

    def test_api_patch_video_with_live_state_set(self):
        """Check we can't update starting_date if live_state is not IDLE."""
        for live_choice in LIVE_CHOICES:
            if live_choice[0] != IDLE:
                video = factories.VideoFactory(
                    live_state=live_choice[0],
                    live_type=RAW,
                )
                self.assertFalse(video.is_scheduled)

                jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)

                starting_at = timezone.now() + timedelta(days=10)
                response = self.client.patch(
                    f"/api/videos/{video.id}/",
                    {"starting_at": starting_at, "title": "Required title"},
                    HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                    content_type="application/json",
                )

                content = json.loads(response.content)
                self.assertEqual(
                    content,
                    {
                        "starting_at": (
                            [
                                (
                                    "Field starting_at can't be changed, video live is not "
                                    "in default mode."
                                )
                            ]
                        )
                    },
                )
                self.assertEqual(response.status_code, 400)

    def test_api_video_patch_by_organization_admin(self):
        """Organization admins can patch videos on the API."""
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            role=models.ADMINISTRATOR, organization=organization, user=user
        )
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist, title="existing title")

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.patch(
            f"/api/videos/{video.id}/",
            json.dumps({"title": "updated title"}),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.title, "updated title")

    def test_api_video_patch_by_playlist_instructor(self):
        """Playlist instructors cannot patch videos on the API."""
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            role=models.INSTRUCTOR, playlist=playlist, user=user
        )
        video = factories.VideoFactory(playlist=playlist, title="existing title")

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.patch(
            f"/api/videos/{video.id}/",
            json.dumps({"title": "updated title"}),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.title, "updated title")

    def test_api_video_patch_by_playlist_admin(self):
        """Playlist admins can patch videos on the API."""
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            role=models.ADMINISTRATOR, playlist=playlist, user=user
        )
        video = factories.VideoFactory(playlist=playlist, title="existing title")

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.patch(
            f"/api/videos/{video.id}/",
            json.dumps({"title": "updated title"}),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.title, "updated title")

    def test_api_video_put_by_organization_instructor(self):
        """Organization instructors cannot update videos on the API."""
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            role=models.INSTRUCTOR, organization=organization, user=user
        )
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist, title="existing title")

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.put(
            f"/api/videos/{video.id}/",
            json.dumps({"title": "updated title"}),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)
        video.refresh_from_db()
        self.assertEqual(video.title, "existing title")

    def test_api_video_put_by_organization_admin(self):
        """Organization admins can update videos on the API."""
        user = factories.UserFactory()
        organization = factories.OrganizationFactory()
        factories.OrganizationAccessFactory(
            role=models.ADMINISTRATOR, organization=organization, user=user
        )
        playlist = factories.PlaylistFactory(organization=organization)
        video = factories.VideoFactory(playlist=playlist, title="existing title")

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.put(
            f"/api/videos/{video.id}/",
            json.dumps({"title": "updated title"}),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.title, "updated title")

    def test_api_video_put_by_playlist_instructor(self):
        """Playlist instructors cannot update videos on the API."""
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            role=models.INSTRUCTOR, playlist=playlist, user=user
        )
        video = factories.VideoFactory(playlist=playlist, title="existing title")

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.put(
            f"/api/videos/{video.id}/",
            json.dumps({"title": "updated title"}),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.title, "updated title")

    def test_api_video_put_by_playlist_admin(self):
        """Playlist admins can update videos on the API."""
        user = factories.UserFactory()
        playlist = factories.PlaylistFactory()
        factories.PlaylistAccessFactory(
            role=models.ADMINISTRATOR, playlist=playlist, user=user
        )
        video = factories.VideoFactory(playlist=playlist, title="existing title")

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.put(
            f"/api/videos/{video.id}/",
            json.dumps({"title": "updated title"}),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        video.refresh_from_db()
        self.assertEqual(video.title, "updated title")

    def test_api_update_video_with_live_state_set(self):
        """Check we can't update starting_date if live_state is not IDLE."""
        for live_choice in LIVE_CHOICES:
            if live_choice[0] != IDLE:
                video = factories.VideoFactory(
                    live_state=live_choice[0],
                    live_type=RAW,
                )
                self.assertFalse(video.is_scheduled)

                jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)
                starting_at = timezone.now() + timedelta(hours=1)
                response = self.client.put(
                    f"/api/videos/{video.id}/",
                    {"starting_at": starting_at, "title": "Required title"},
                    HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                    content_type="application/json",
                )

                content = json.loads(response.content)
                self.assertEqual(
                    content,
                    {
                        "starting_at": (
                            [
                                (
                                    "Field starting_at can't be changed, video live is not "
                                    "in default mode."
                                )
                            ]
                        )
                    },
                )
                self.assertEqual(response.status_code, 400)

    def test_api_update_video_with_starting_at_past(self):
        """Check we can update video if starting_at is past"""
        starting_at = (timezone.now() + timedelta(seconds=10)).replace(microsecond=0)
        # first create a scheduled video
        video = factories.VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=starting_at,
        )
        # Video is scheduled
        self.assertTrue(video.starting_at > timezone.now())
        self.assertTrue(video.is_scheduled)
        self.assertEqual(video.live_state, IDLE)
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)
        # Mock now to the future to check video gets set to not scheduled
        future = timezone.now() + timedelta(hours=1)
        with mock.patch.object(timezone, "now", return_value=future):
            self.assertFalse(video.is_scheduled)
            # starting_at is over, we still want to update the video
            response = self.client.put(
                f"/api/videos/{video.id}/",
                {
                    "description": "updated description",
                    "title": "updated title",
                    "starting_at": starting_at,
                },
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
            )
            self.assertEqual(response.status_code, 200)
            video.refresh_from_db()
            self.assertEqual(video.title, "updated title")
            self.assertEqual(video.description, "updated description")
