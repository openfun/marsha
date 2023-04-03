"""Tests for the get_meeting_infos service in the ``bbb`` app of the Marsha project."""

from django.test import TestCase, override_settings

import responses

from marsha.bbb.factories import ClassroomFactory
from marsha.bbb.utils.bbb_utils import ApiMeetingException, get_meeting_infos


@override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
@override_settings(BBB_API_SECRET="SuperSecret")
class ClassroomServiceTestCase(TestCase):
    """Test our intentions about the Classroom get_meeting_infos service."""

    maxDiff = None

    @responses.activate
    def test_infos_started(self):
        """Return meeting infos.
        If meeting is found, model instance start is set to True."""
        classroom = ClassroomFactory(
            meeting_id="7a567d67-29d3-4547-96f3-035733a4dfaa", started=False
        )

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/getMeetingInfo",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "meetingID": "7a567d67-29d3-4547-96f3-035733a4dfaa",
                        "checksum": "7f13332ec54e7df0a02d07904746cb5b8b330498",
                    }
                )
            ],
            body="""
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
           """,
            status=200,
        )

        api_response = get_meeting_infos(classroom)
        self.assertDictEqual(
            {
                "attendeePW": "trac",
                "attendees": [
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
                ],
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
        classroom.refresh_from_db()
        self.assertEqual(classroom.started, True)

    @responses.activate
    def test_infos_one_attendee(self):
        """Return meeting infos.
        If meeting is found, model instance start is set to True."""
        classroom = ClassroomFactory(
            meeting_id="7a567d67-29d3-4547-96f3-035733a4dfaa", started=False
        )

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/getMeetingInfo",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "meetingID": "7a567d67-29d3-4547-96f3-035733a4dfaa",
                        "checksum": "7f13332ec54e7df0a02d07904746cb5b8b330498",
                    }
                )
            ],
            body="""
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
                </attendees>
                <metadata>
                </metadata>
                <isBreakout>false</isBreakout>
            </response>
           """,
            status=200,
        )

        api_response = get_meeting_infos(classroom)
        self.assertDictEqual(
            {
                "attendeePW": "trac",
                "attendees": [
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
                ],
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
        classroom.refresh_from_db()
        self.assertEqual(classroom.started, True)

    @responses.activate
    def test_infos_not_found(self):
        """When a meeting is not found on BBB server an exception is raised,
        and model instance start is set to False."""
        classroom = ClassroomFactory(
            meeting_id="7a567d67-29d3-4547-96f3-035733a4dfaa", started=True
        )

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/getMeetingInfo",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "meetingID": "7a567d67-29d3-4547-96f3-035733a4dfaa",
                        "checksum": "7f13332ec54e7df0a02d07904746cb5b8b330498",
                    }
                )
            ],
            body="""
            <response>
                <returncode>FAILED</returncode>
                <messageKey>notFound</messageKey>
                <message>We could not find a meeting with that meeting ID</message>
            </response>
            """,
            status=200,
        )

        with self.assertRaises(ApiMeetingException):
            get_meeting_infos(classroom)
        classroom.refresh_from_db()
        self.assertEqual(classroom.started, False)
