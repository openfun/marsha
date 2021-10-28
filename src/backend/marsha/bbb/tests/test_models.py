"""Tests for the models in the ``core`` app of the Marsha project."""

from unittest import mock

from django.db import transaction
from django.db.utils import IntegrityError
from django.test import TestCase, override_settings

import requests
import responses
from safedelete.models import SOFT_DELETE_CASCADE

from ..factories import MeetingFactory
from ..utils.bbb_utils import ApiMeetingException


@override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
@override_settings(BBB_API_SECRET="SuperSecret")
class MeetingModelsTestCase(TestCase):
    """Test our intentions about the Meeting model."""

    maxDiff = None

    def test_models_meeting_str(self):
        """The str method should display the meeting title and its eventual soft deletion."""
        meeting = MeetingFactory(title="ça joue")
        self.assertEqual(str(meeting), "ça joue")

        meeting.delete()
        self.assertEqual(str(meeting), "ça joue [deleted]")

    def test_models_meeting_fields_lti_id_unique(self):
        """Meetings should be unique for a given duo lti_id/playlist (see LTI specification)."""
        meeting = MeetingFactory()

        # A meeting with a different lti_id and the same playlist can still be created
        MeetingFactory(playlist=meeting.playlist)

        # A meeting for a different playlist and the same lti_id can still be created
        MeetingFactory(lti_id=meeting.lti_id)

        # Trying to create a meeting with the same duo lti_id/playlist should raise a
        # database error
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                MeetingFactory(lti_id=meeting.lti_id, playlist=meeting.playlist)

        # Soft deleted meetings should not count for unicity
        meeting.delete(force_policy=SOFT_DELETE_CASCADE)
        MeetingFactory(lti_id=meeting.lti_id, playlist=meeting.playlist)

    @mock.patch.object(requests, "get")
    def test_bbb_create_new_meeting(self, mock_create_request):
        """Create a meeting in current meeting related server."""
        meeting = MeetingFactory(
            attendee_password="9#R1kuUl3R",
            moderator_password="0$C7Aaz0o",
        )
        mock_create_request.return_value.status_code = 200
        mock_create_request.return_value.content = f"""
        <response>
            <returncode>SUCCESS</returncode>
            <meetingID>{meeting.id}</meetingID>
            <internalMeetingID>232a8ab5dbfde4d33a2bd9d5bbc08bd74d04e163-1628693645640</internalMeetingID>
            <parentMeetingID>bbb-none</parentMeetingID>
            <attendeePW>{meeting.attendee_password}</attendeePW>
            <moderatorPW>{meeting.moderator_password}</moderatorPW>
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

        api_response = meeting.bbb_create()
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
            api_response,
        )
        # self.assertEqual(meeting.started, True)

    @mock.patch.object(requests, "get")
    def test_bbb_create_existing_meeting(self, mock_create_request):
        """Create a meeting in current meeting related server."""
        meeting = MeetingFactory()
        mock_create_request.return_value.status_code = 200
        mock_create_request.return_value.content = """
        <response>
            <returncode>FAILED</returncode>
            <messageKey>idNotUnique</messageKey>
            <message>
                A meeting already exists with that meeting ID.
                Please use a different meeting ID.
            </message>
        </response>
        """

        with self.assertRaises(ApiMeetingException):
            meeting.bbb_create()
        meeting.refresh_from_db()
        self.assertEqual(meeting.started, False)

    @responses.activate
    def test_bbb_end_moderator(self):
        """End a meeting in current meeting related server."""
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

        api_response = meeting.bbb_end(moderator=True)
        self.assertDictEqual(
            {
                "message": "A request to end the meeting was sent.",
                "messageKey": "sentEndMeetingRequest",
                "returncode": "SUCCESS",
            },
            api_response,
        )

    @responses.activate
    def test_bbb_end_attendee(self):
        """End a meeting in current meeting related server."""
        meeting = MeetingFactory(
            meeting_id="21e6634f-ab6f-4c77-a665-4229c61b479a",
            title="Meeting 1",
            attendee_password="9#R1kuUl3R",
            moderator_password="0$C7Aaz0o",
        )

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/end",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "meetingID": "21e6634f-ab6f-4c77-a665-4229c61b479a",
                        "password": meeting.attendee_password,
                        "checksum": "471ac2a7f199c26fe9e58bf42145ea0d7ea7a3ec",
                    }
                )
            ],
            body="""<response>
                <returncode>FAILED</returncode>
                <messageKey>invalidPassword</messageKey>
                <message>You must supply the moderator password for this call.</message>
            </response>
            """,
            status=200,
        )

        with self.assertRaises(ApiMeetingException) as context:
            meeting.bbb_end(moderator=False)
        self.assertEqual(
            str(context.exception),
            "You must supply the moderator password for this call.",
        )

    @mock.patch.object(requests, "get")
    def test_join(self, mock_create_request):
        """Return a meeting join url."""
        meeting = MeetingFactory()
        mock_create_request.return_value.status_code = 200
        mock_create_request.return_value.content = """
        <response>
            <returncode>SUCCESS</returncode>
            <messageKey>successfullyJoined</messageKey>
            <message>You have joined successfully.</message>
            <meeting_id>74f4b5fefa00d05889a9095d1c81c51f704a74c0-1632323106549</meeting_id>
            <user_id>w_cmlgpuqzkqez</user_id>
            <auth_token>pcwfqes0ugkb</auth_token>
            <session_token>4vtuguoqsolsqkqi</session_token>
            <guestStatus>ALLOW</guestStatus>
            <url>https://10.7.7.1/html5client/join?sessionToken=4vtuguoqsolsqkqi</url>
        </response>
        """

        api_response = meeting.bbb_join(fullname="John Doe")
        self.assertIn(
            "https://10.7.7.1/bigbluebutton/api/join?"
            f"fullName=John+Doe&meetingID={meeting.meeting_id}&"
            f"password={meeting.attendee_password}&redirect=true",
            api_response.get("url"),
        )

    @mock.patch.object(requests, "get")
    def test_infos(self, mock_create_request):
        """Check if a meeting is running."""
        meeting = MeetingFactory()
        mock_create_request.return_value.status_code = 200
        mock_create_request.return_value.content = """
        <response>
            <returncode>SUCCESS</returncode>
            <meetingName>random-6256545</meetingName>
            <meetingID>random-6256545</meetingID>
            <internalMeetingID>ab0da0b4a1f283e94cfefdf32dd761eebd5461ce-1635514947533</internalMeetingID>
            <createTime>1635514947533</createTime>
            <createDate>Fri Oct 29 13:42:27 UTC 2021</createDate>
            <voiceBridge>77581</voiceBridge>
            <dialNumber>613-555-1234</dialNumber>
            <attendeePW>trac</attendeePW>
            <moderatorPW>trusti</moderatorPW>
            <running>true</running>
            <duration>0</duration>
            <hasUserJoined>true</hasUserJoined>
            <recording>false</recording>
            <hasBeenForciblyEnded>false</hasBeenForciblyEnded>
            <startTime>1635514947596</startTime>
            <endTime>0</endTime>
            <participantCount>1</participantCount>
            <listenerCount>0</listenerCount>
            <voiceParticipantCount>0</voiceParticipantCount>
            <videoCount>0</videoCount>
            <maxUsers>0</maxUsers>
            <moderatorCount>0</moderatorCount>
            <attendees>
                <attendee>
                    <userID>w_2xox6leao03w</userID>
                    <fullName>User 1907834</fullName>
                    <role>MODERATOR</role>
                    <isPresenter>true</isPresenter>
                    <isListeningOnly>false</isListeningOnly>
                    <hasJoinedVoice>false</hasJoinedVoice>
                    <hasVideo>false</hasVideo>
                    <clientType>HTML5</clientType>
                </attendee>
                <attendee>
                    <userID>w_bau7cr7aefju</userID>
                    <fullName>User 1907834</fullName>
                    <role>VIEWER</role>
                    <isPresenter>false</isPresenter>
                    <isListeningOnly>false</isListeningOnly>
                    <hasJoinedVoice>false</hasJoinedVoice>
                    <hasVideo>false</hasVideo>
                    <clientType>HTML5</clientType>
                </attendee>
            </attendees>
            <metadata>
            </metadata>
            <isBreakout>false</isBreakout>
        </response>
        """

        api_response = meeting.bbb_get_meeting_infos()
        self.assertDictEqual(
            {
                "attendeePW": "trac",
                "attendees": {
                    "attendee": [
                        {
                            "clientType": "HTML5",
                            "fullName": "User 1907834",
                            "hasJoinedVoice": "false",
                            "hasVideo": "false",
                            "isListeningOnly": "false",
                            "isPresenter": "true",
                            "role": "MODERATOR",
                            "userID": "w_2xox6leao03w",
                        },
                        {
                            "clientType": "HTML5",
                            "fullName": "User 1907834",
                            "hasJoinedVoice": "false",
                            "hasVideo": "false",
                            "isListeningOnly": "false",
                            "isPresenter": "false",
                            "role": "VIEWER",
                            "userID": "w_bau7cr7aefju",
                        },
                    ]
                },
                "createDate": "Fri Oct 29 13:42:27 UTC 2021",
                "createTime": "1635514947533",
                "dialNumber": "613-555-1234",
                "duration": "0",
                "endTime": "0",
                "hasBeenForciblyEnded": "false",
                "hasUserJoined": "true",
                "internalMeetingID": "ab0da0b4a1f283e94cfefdf32dd761eebd5461ce-1635514947533",
                "isBreakout": "false",
                "listenerCount": "0",
                "maxUsers": "0",
                "meetingID": "random-6256545",
                "meetingName": "random-6256545",
                "metadata": None,
                "moderatorCount": "0",
                "moderatorPW": "trusti",
                "participantCount": "1",
                "recording": "false",
                "returncode": "SUCCESS",
                "running": "true",
                "startTime": "1635514947596",
                "videoCount": "0",
                "voiceBridge": "77581",
                "voiceParticipantCount": "0",
            },
            api_response,
        )
        self.assertEqual(meeting.started, True)
