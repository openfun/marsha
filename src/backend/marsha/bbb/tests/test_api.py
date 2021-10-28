"""Tests for the meeting API."""

import json
import random
import re
from unittest import mock
from unittest.mock import MagicMock
from urllib.parse import quote_plus
import uuid

from django.test import TestCase, override_settings

import requests
import responses
from rest_framework_simplejwt.tokens import AccessToken

from marsha.core import factories as core_factories

from ..factories import MeetingFactory


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
@override_settings(BBB_API_SECRET="SuperSecret")
@override_settings(BBB_ENABLED=True)
class MeetingAPITest(TestCase):
    """Test for the Meeting API."""

    maxDiff = None

    @mock.patch.object(requests, "get")
    def test_api_meeting_fetch_student(self, mock_create_request):
        """A student should be allowed to fetch a meeting."""
        meeting = MeetingFactory()
        mock_create_request.return_value.status_code = 200
        mock_create_request.return_value.content = """
        <response>
            <returncode>SUCCESS</returncode>
            <running>true</running>
        </response>
        """

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(meeting.id)
        jwt_token.payload["roles"] = ["student"]

        response = self.client.get(
            f"/api/meetings/{meeting.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertDictEqual(
            {
                "id": str(meeting.id),
                "infos": {"returncode": "SUCCESS", "running": "true"},
                "lti_id": str(meeting.lti_id),
                "title": meeting.title,
                "started": False,
                "meeting_id": str(meeting.meeting_id),
                "welcome_text": meeting.welcome_text,
                "playlist": {
                    "id": str(meeting.playlist.id),
                    "title": meeting.playlist.title,
                    "lti_id": meeting.playlist.lti_id,
                },
            },
            content,
        )

    @mock.patch.object(requests, "get")
    def test_api_meeting_fetch_instructor(self, mock_create_request: MagicMock):
        """An instructor should be able to fetch a meeting."""
        meeting = MeetingFactory()
        mock_create_request.return_value.status_code = 200
        mock_create_request.return_value.content = """
        <response>
            <returncode>SUCCESS</returncode>
            <running>true</running>
        </response>
        """

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(meeting.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        response = self.client.get(
            f"/api/meetings/{meeting.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertDictEqual(
            {
                "id": str(meeting.id),
                "infos": {"returncode": "SUCCESS", "running": "true"},
                "lti_id": str(meeting.lti_id),
                "title": meeting.title,
                "started": False,
                "meeting_id": str(meeting.meeting_id),
                "welcome_text": meeting.welcome_text,
                "playlist": {
                    "id": str(meeting.playlist.id),
                    "title": meeting.playlist.title,
                    "lti_id": meeting.playlist.lti_id,
                },
            },
            content,
        )

    def test_api_meeting_update_anonymous(self):
        """An anonymous should not be able to update a meeting."""
        meeting = MeetingFactory()
        response = self.client.put(f"/api/meetings/{meeting.id!s}/")
        self.assertEqual(response.status_code, 401)

    def test_api_meeting_update_user_logged_in(self):
        """An logged in user should not be able to update a meeting."""
        user = core_factories.UserFactory(
            first_name="Jane", last_name="Doe", email="jane.doe@example.com"
        )
        meeting = MeetingFactory()
        self.client.force_login(user)
        response = self.client.put(f"/api/meetings/{meeting.id!s}/")
        self.assertEqual(response.status_code, 401)

    def test_api_meeting_update_student(self):
        """A student user should not be able to update a meeting."""
        meeting = MeetingFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(meeting.id)
        jwt_token.payload["roles"] = ["student"]
        data = {"title": "new title"}

        response = self.client.put(
            f"/api/meetings/{meeting.id!s}/",
            json.dumps(data),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_meeting_update_instructor_read_only(self):
        """An instructor should not be able to update a meeting in read_only."""
        meeting = MeetingFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(meeting.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": False}
        data = {"title": "new title"}

        response = self.client.put(
            f"/api/meetings/{meeting.id!s}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    @mock.patch.object(requests, "get")
    def test_api_meeting_update_instructor(self, mock_create_request: MagicMock):
        """An instructor should be able to update a meeting."""
        meeting = MeetingFactory()
        mock_create_request.return_value.status_code = 200
        mock_create_request.return_value.content = """
        <response>
            <returncode>SUCCESS</returncode>
            <running>true</running>
        </response>
        """

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(meeting.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        data = {"title": "new title", "welcome_text": "Hello"}

        response = self.client.put(
            f"/api/meetings/{meeting.id!s}/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)

        meeting.refresh_from_db()
        self.assertEqual("new title", meeting.title)
        self.assertEqual("Hello", meeting.welcome_text)

    def test_api_select_instructor_no_bbb_server(self):
        """An instructor should be able to fetch a meeting lti select."""
        playlist = core_factories.PlaylistFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = "None"
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        jwt_token.payload["playlist_id"] = str(playlist.id)

        response = self.client.get(
            "/api/meetings/lti-select/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        new_uuid = re.search(
            "http://testserver/lti/meetings/(.*)", response.json().get("new_url", "")
        ).group(1)
        self.assertEqual(uuid.UUID(new_uuid).version, 4)
        self.assertDictEqual(
            {
                "new_url": f"http://testserver/lti/meetings/{new_uuid}",
                "meetings": [],
            },
            response.json(),
        )

    def test_api_select_instructor_no_meetings(self):
        """An instructor should be able to fetch a meeting lti select."""
        playlist = core_factories.PlaylistFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = "None"
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        jwt_token.payload["playlist_id"] = str(playlist.id)

        response = self.client.get(
            "/api/meetings/lti-select/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        new_uuid = re.search(
            "http://testserver/lti/meetings/(.*)", response.json().get("new_url", "")
        ).group(1)
        self.assertEqual(uuid.UUID(new_uuid).version, 4)
        self.assertDictEqual(
            {
                "new_url": f"http://testserver/lti/meetings/{new_uuid}",
                "meetings": [],
            },
            response.json(),
        )

    def test_api_select_instructor(self):
        """An instructor should be able to fetch a meeting lti select."""
        # playlist = core_factories.PlaylistFactory()
        # MeetingFactory.build_batch(3, playlist=playlist)
        meeting = MeetingFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = "None"
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        jwt_token.payload["playlist_id"] = str(meeting.playlist_id)

        response = self.client.get(
            "/api/meetings/lti-select/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        new_uuid = re.search(
            "http://testserver/lti/meetings/(.*)", response.json().get("new_url", "")
        ).group(1)
        self.assertEqual(uuid.UUID(new_uuid).version, 4)
        self.assertDictEqual(
            {
                "new_url": f"http://testserver/lti/meetings/{new_uuid}",
                "meetings": [
                    {
                        "id": str(meeting.id),
                        "lti_id": str(meeting.lti_id),
                        "lti_url": f"http://testserver/lti/meetings/{str(meeting.id)}",
                        "title": meeting.title,
                        "meeting_id": str(meeting.meeting_id),
                        "playlist": {
                            "id": str(meeting.playlist_id),
                            "title": meeting.playlist.title,
                            "lti_id": meeting.playlist.lti_id,
                        },
                    }
                ],
            },
            response.json(),
        )

    @mock.patch.object(requests, "get")
    def test_api_bbb_create_anonymous(self, mock_create_request: MagicMock):
        """An anonymous should not be able to create a meeting."""
        meeting = MeetingFactory()

        response = self.client.patch(f"/api/meetings/{meeting.id}/bbb_create/")
        self.assertEqual(response.status_code, 401)
        mock_create_request.assert_not_called()

    @mock.patch.object(requests, "get")
    def test_api_bbb_create_user_logged_in(self, mock_create_request: MagicMock):
        """A logged in user should not be able to create a meeting."""
        user = core_factories.UserFactory(
            first_name="Jane", last_name="Doe", email="jane.doe@example.com"
        )
        meeting = MeetingFactory()
        self.client.force_login(user)

        response = self.client.patch(f"/api/meetings/{meeting.id}/bbb_create/")
        self.assertEqual(response.status_code, 401)
        mock_create_request.assert_not_called()

    @mock.patch.object(requests, "get")
    def test_api_bbb_create_student(self, mock_create_request: MagicMock):
        """A student should not be able to create a meeting."""
        meeting = MeetingFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(meeting.id)
        jwt_token.payload["roles"] = ["student"]

        response = self.client.patch(
            f"/api/meetings/{meeting.id}/bbb_create/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        mock_create_request.assert_not_called()

    @mock.patch.object(requests, "get")
    def test_api_bbb_create_new_meeting(self, mock_create_request: MagicMock):
        """A new meeting should be started if no BBB meeting exists for the same id."""
        meeting = MeetingFactory(
            meeting_id="21e6634f-ab6f-4c77-a665-4229c61b479a",
            title="Meeting 1",
            attendee_password="9#R1kuUl3R",
            moderator_password="0$C7Aaz0o",
        )
        mock_create_request.return_value.status_code = 200
        mock_create_request.return_value.content = f"""
        <response>
            <returncode>SUCCESS</returncode>
            <meetingID>{str(meeting.id)}</meetingID>
            <internalMeetingID>232a8ab5dbfde4d33a2bd9d5bbc08bd74d04e163-1628693645640</internalMeetingID>
            <parentMeetingID>bbb-none</parentMeetingID>
            <attendeePW>9#R1kuUl3R</attendeePW>
            <moderatorPW>0$C7Aaz0o</moderatorPW>
            <createTime>1628693645640</createTime>
            <voiceBridge>83267</voiceBridge>
            <dialNumber>613-555-1234</dialNumber>
            <createDate>Wed Aug 11 14:54:05 UTC 2021</createDate>
            <hasUserJoined>false</hasUserJoined>
            <duration>0</duration>
            <hasBeenForciblyEnded>false</hasBeenForciblyEnded>
            <messageKey></messageKey>
            <message></message>
        </response>
        """

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(meeting.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        data = {"title": "new title", "welcome_text": "Hello"}

        response = self.client.patch(
            f"/api/meetings/{meeting.id}/bbb_create/",
            data,
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertDictEqual(
            {
                "attendeePW": meeting.attendee_password,
                "createDate": "Wed Aug 11 14:54:05 UTC 2021",
                "createTime": "1628693645640",
                "dialNumber": "613-555-1234",
                "duration": "0",
                "hasBeenForciblyEnded": "false",
                "hasUserJoined": "false",
                "internalMeetingID": "232a8ab5dbfde4d33a2bd9d5bbc08bd74d04e163-1628693645640",
                "meetingID": str(meeting.id),
                "message": "Meeting created.",
                "messageKey": None,
                "moderatorPW": meeting.moderator_password,
                "parentMeetingID": "bbb-none",
                "returncode": "SUCCESS",
                "voiceBridge": "83267",
            },
            response.data,
        )
        meeting.refresh_from_db()
        self.assertEqual("new title", meeting.title)
        self.assertEqual("Hello", meeting.welcome_text)
        mock_create_request.assert_called_with(
            "https://10.7.7.1/bigbluebutton/api/create",
            params={
                "attendeePW": "9#R1kuUl3R",
                "checksum": "785ac3521f7bc9af716660c99517add01c2b3f7e",
                "meetingID": "21e6634f-ab6f-4c77-a665-4229c61b479a",
                "moderatorPW": "0$C7Aaz0o",
                "name": "new title",
                "welcome": "Hello",
            },
            verify=True,
        )

    @mock.patch.object(requests, "get")
    def test_api_bbb_create_existing_meeting(self, mock_create_request: MagicMock):
        """No new meeting should be started if a BBB meeting exists for the same id."""
        meeting = MeetingFactory(
            meeting_id="21e6634f-ab6f-4c77-a665-4229c61b479a",
            title="Meeting 1",
            attendee_password="9#R1kuUl3R",
            moderator_password="0$C7Aaz0o",
        )
        mock_create_request.return_value.status_code = 200
        mock_create_request.return_value.content = """
        <response>
            <returncode>FAILED</returncode>
            <messageKey>idNotUnique</messageKey>
            <message>A meeting already exists with that meeting ID. Please use a different meeting ID.</message>  # noqa: E501
        </response>
        """

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(meeting.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}
        data = {"title": meeting.title, "welcome_text": meeting.welcome_text}

        response = self.client.patch(
            f"/api/meetings/{meeting.id}/bbb_create/",
            data,
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertDictEqual(
            response.data,
            {
                "message": "A meeting already exists with that meeting ID. "
                "Please use a different meeting ID."
            },
        )
        mock_create_request.assert_called_with(
            "https://10.7.7.1/bigbluebutton/api/create",
            params={
                "name": "Meeting 1",
                "meetingID": "21e6634f-ab6f-4c77-a665-4229c61b479a",
                "attendeePW": "9#R1kuUl3R",
                "moderatorPW": "0$C7Aaz0o",
                "welcome": "Welcome!",
                "checksum": "34248ddd5ec5df64e4535141d79a71b314b83ecd",
            },
            verify=True,
        )

    @mock.patch.object(requests, "get")
    def test_api_bbb_join_meeting_anonymous(self, mock_create_request: MagicMock):
        """An anonymous should not be able to join a meeting."""
        meeting = MeetingFactory()

        response = self.client.patch(
            f"/api/meetings/{meeting.id}/bbb_join/",
        )
        self.assertEqual(response.status_code, 401)
        mock_create_request.assert_not_called()

    @mock.patch.object(requests, "get")
    def test_api_bbb_join_meeting_user_logged_in(self, mock_create_request: MagicMock):
        """A logged in user should not be able to join a meeting."""
        user = core_factories.UserFactory(
            first_name="Jane", last_name="Doe", email="jane.doe@example.com"
        )
        meeting = MeetingFactory()
        self.client.force_login(user)

        response = self.client.patch(f"/api/meetings/{meeting.id}/bbb_join/")
        self.assertEqual(response.status_code, 401)
        mock_create_request.assert_not_called()

    def test_api_bbb_join_student(self):
        """Joining a meeting as student should return an attendee meeting url."""
        meeting = MeetingFactory(
            meeting_id="21e6634f-ab6f-4c77-a665-4229c61b479a",
            title="Meeting 1",
            attendee_password="9#R1kuUl3R",
            moderator_password="0$C7Aaz0o",
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(meeting.id)
        jwt_token.payload["roles"] = ["student"]

        response = self.client.patch(
            f"/api/meetings/{meeting.id}/bbb_join/",
            data=json.dumps({"fullname": "John Doe"}),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn(
            "https://10.7.7.1/bigbluebutton/api/join?"
            f"fullName=John+Doe&meetingID={meeting.meeting_id}&"
            f"password={quote_plus(meeting.attendee_password)}&redirect=true",
            response.data.get("url"),
        )

    def test_api_bbb_join_instructor(self):
        """Joining a meeting as instructor should return a moderator meeting url."""
        meeting = MeetingFactory(
            meeting_id="21e6634f-ab6f-4c77-a665-4229c61b479a",
            title="Meeting 1",
            attendee_password="9#R1kuUl3R",
            moderator_password="0$C7Aaz0o",
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(meeting.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        response = self.client.patch(
            f"/api/meetings/{meeting.id}/bbb_join/",
            data=json.dumps({"fullname": "John Doe"}),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn(
            "https://10.7.7.1/bigbluebutton/api/join?"
            f"fullName=John+Doe&meetingID={meeting.meeting_id}&"
            f"password={quote_plus(meeting.moderator_password)}&redirect=true",
            response.data.get("url"),
        )

    def test_api_bbb_join_instructor_no_fullname(self):
        """Joining a meeting without fullname parameter should return a 422."""
        meeting = MeetingFactory(
            meeting_id="21e6634f-ab6f-4c77-a665-4229c61b479a",
            title="Meeting 1",
            attendee_password="9#R1kuUl3R",
            moderator_password="0$C7Aaz0o",
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(meeting.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        response = self.client.patch(
            f"/api/meetings/{meeting.id}/bbb_join/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertDictEqual(
            {"message": "missing fullname parameter"},
            response.data,
        )

    @mock.patch.object(requests, "get")
    def test_api_bbb_end_meeting_anonymous(self, mock_create_request: MagicMock):
        """An anonymous should not be able to end a meeting."""
        meeting = MeetingFactory()

        response = self.client.patch(
            f"/api/meetings/{meeting.id}/bbb_end/",
        )
        self.assertEqual(response.status_code, 401)
        mock_create_request.assert_not_called()

    @mock.patch.object(requests, "get")
    def test_api_bbb_end_meeting_user_logged_in(self, mock_create_request: MagicMock):
        """A logged in user should not be able to end a meeting."""
        user = core_factories.UserFactory(
            first_name="Jane", last_name="Doe", email="jane.doe@example.com"
        )
        meeting = MeetingFactory()
        self.client.force_login(user)

        response = self.client.patch(
            f"/api/meetings/{meeting.id}/bbb_end/",
        )
        self.assertEqual(response.status_code, 401)
        mock_create_request.assert_not_called()

    @mock.patch.object(requests, "get")
    def test_api_bbb_end_meeting_student(self, mock_create_request: MagicMock):
        """A student should not be able to end a meeting."""
        meeting = MeetingFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(meeting.id)
        jwt_token.payload["roles"] = ["student"]

        response = self.client.patch(
            f"/api/meetings/{meeting.id}/bbb_end/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)
        mock_create_request.assert_not_called()

    @responses.activate
    def test_api_bbb_end_meeting_instructor(self):
        """Ending a meeting as instructor should return a moderator meeting url."""
        meeting = MeetingFactory(
            meeting_id="21e6634f-ab6f-4c77-a665-4229c61b479a",
            title="Meeting 1",
            attendee_password="9#R1kuUl3R",
            moderator_password="0$C7Aaz0o",
        )

        # initial end request
        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/end",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "meetingID": "21e6634f-ab6f-4c77-a665-4229c61b479a",
                        "password": meeting.moderator_password,
                        "checksum": "3e7b6970d927f542261f18d6c2c10b5d94bcb55c",
                    }
                )
            ],
            body="""<response>
                <returncode>SUCCESS</returncode>
                <messageKey>sentEndMeetingRequest</messageKey>
                <message>A request to end the meeting was sent.</message>
            </response>
            """,
            status=200,
        )
        # first poll request meeting still exists
        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/getMeetingInfo",
            body="""<response>
                <returncode>SUCCESS</returncode>
                <meetingName>Super bbb meeting</meetingName>
                <meetingID>b3fc0805-c9fb-4e62-b12d-d4472986406b</meetingID>
            </response>
            """,
            status=200,
        )
        # second poll request meeting does not exist
        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/getMeetingInfo",
            body="""<response>
                <returncode>FAILED</returncode>
                <messageKey>notFound</messageKey>
                <message>We could not find a meeting with that meeting ID</message>
            </response>
            """,
            status=200,
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(meeting.id)
        jwt_token.payload["roles"] = [random.choice(["instructor", "administrator"])]
        jwt_token.payload["permissions"] = {"can_update": True}

        response = self.client.patch(
            f"/api/meetings/{meeting.id}/bbb_end/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertDictEqual(
            {
                "returncode": "SUCCESS",
                "message": "A request to end the meeting was sent.",
                "messageKey": "sentEndMeetingRequest",
            },
            response.data,
        )
