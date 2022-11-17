"""Tests for the services in the ``bbb`` app of the Marsha project."""
from datetime import datetime

from django.test import TestCase, override_settings
from django.utils import timezone

import responses

from marsha.bbb.factories import ClassroomDocumentFactory, ClassroomFactory
from marsha.bbb.utils.bbb_utils import (
    ApiMeetingException,
    create,
    end,
    get_meeting_infos,
    join,
    sign_parameters,
)


@override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
@override_settings(BBB_API_SECRET="SuperSecret")
class ClassroomServiceTestCase(TestCase):
    """Test our intentions about the Classroom service."""

    maxDiff = None

    def test_sign_parameters(self):
        """Build params for BBB server request."""
        parameters = {
            "fullName": "User 7585026",
            "meetingID": "random - 8619987",
            "password": "ap",
            "redirect": "false",
        }
        self.assertEqual(
            {
                "fullName": "User 7585026",
                "meetingID": "random - 8619987",
                "password": "ap",
                "redirect": "false",
                "checksum": "26390c020c085ddf328305d33bbdf96ba22244b1",
            },
            sign_parameters(action="join", parameters=parameters),
        )

    @responses.activate
    def test_bbb_create_new_classroom(self):
        """Create a classroom in current classroom related server."""
        classroom = ClassroomFactory(
            title="Classroom 001",
            attendee_password="9#R1kuUl3R",
            moderator_password="0$C7Aaz0o",
            meeting_id="7a567d67-29d3-4547-96f3-035733a4dfaa",
        )

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/create",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "attendeePW": "9#R1kuUl3R",
                        "checksum": "6471127292c7f4c0676b0ce7ef76f9589276ab60",
                        "meetingID": "7a567d67-29d3-4547-96f3-035733a4dfaa",
                        "moderatorPW": "0$C7Aaz0o",
                        "name": "Classroom 001",
                        "welcome": "Welcome!",
                        "record": True,
                    }
                )
            ],
            body=f"""
            <response>
                <returncode>SUCCESS</returncode>
                <meetingID>{classroom.id}</meetingID>
                <internalMeetingID>232a8ab5dbfde4d33a2bd9d5bbc08bd74d04e163-1628693645640</internalMeetingID>
                <parentMeetingID>bbb-none</parentMeetingID>
                <attendeePW>{classroom.attendee_password}</attendeePW>
                <moderatorPW>{classroom.moderator_password}</moderatorPW>
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
            """,
            status=200,
        )

        api_response = create(classroom)

        self.assertDictEqual(
            {
                "attendeePW": classroom.attendee_password,
                "createDate": "Wed Aug 11 14:54:05 UTC 2021",
                "createTime": "1628693645640",
                "dialNumber": "613-555-1234",
                "duration": "0",
                "hasBeenForciblyEnded": "false",
                "hasUserJoined": "false",
                "internalMeetingID": "232a8ab5dbfde4d33a2bd9d5bbc08bd74d04e163-1628693645640",
                "meetingID": str(classroom.id),
                "message": "Meeting created.",
                "messageKey": None,
                "moderatorPW": classroom.moderator_password,
                "parentMeetingID": "bbb-none",
                "returncode": "SUCCESS",
                "voiceBridge": "83267",
            },
            api_response,
        )
        self.assertEqual(classroom.started, True)
        self.assertEqual(classroom.ended, False)

    @responses.activate
    def test_bbb_create_new_classroom_no_passwords(self):
        """When starting a classroom, if no passwords exists,
        BBB generates them, and they are stored in classroom instance."""
        classroom = ClassroomFactory(
            title="Classroom 001",
            attendee_password=None,
            moderator_password=None,
            meeting_id="7a567d67-29d3-4547-96f3-035733a4dfaa",
        )
        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/create",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "checksum": "d198c1846dd058c9d030fafff557be74a2a276ba",
                        "meetingID": "7a567d67-29d3-4547-96f3-035733a4dfaa",
                        "name": "Classroom 001",
                        "welcome": "Welcome!",
                        "record": True,
                    }
                )
            ],
            body=f"""
            <response>
                <returncode>SUCCESS</returncode>
                <meetingID>{classroom.id}</meetingID>
                <internalMeetingID>232a8ab5dbfde4d33a2bd9d5bbc08bd74d04e163-1628693645640</internalMeetingID>
                <parentMeetingID>bbb-none</parentMeetingID>
                <attendeePW>attendee_password</attendeePW>
                <moderatorPW>moderator_password</moderatorPW>
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
            """,
            status=200,
        )

        api_response = create(classroom)

        self.assertDictEqual(
            {
                "attendeePW": "attendee_password",
                "createDate": "Wed Aug 11 14:54:05 UTC 2021",
                "createTime": "1628693645640",
                "dialNumber": "613-555-1234",
                "duration": "0",
                "hasBeenForciblyEnded": "false",
                "hasUserJoined": "false",
                "internalMeetingID": "232a8ab5dbfde4d33a2bd9d5bbc08bd74d04e163-1628693645640",
                "meetingID": str(classroom.id),
                "message": "Meeting created.",
                "messageKey": None,
                "moderatorPW": "moderator_password",
                "parentMeetingID": "bbb-none",
                "returncode": "SUCCESS",
                "voiceBridge": "83267",
            },
            api_response,
        )
        self.assertEqual(classroom.started, True)
        self.assertEqual(classroom.attendee_password, "attendee_password")
        self.assertEqual(classroom.moderator_password, "moderator_password")

    @responses.activate
    def test_bbb_create_existing_classroom(self):
        """Create a meeting in current classroom related server."""
        classroom = ClassroomFactory(
            title="Classroom 001",
            attendee_password="9#R1kuUl3R",
            moderator_password="0$C7Aaz0o",
            meeting_id="7a567d67-29d3-4547-96f3-035733a4dfaa",
        )

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/create",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "attendeePW": "9#R1kuUl3R",
                        "checksum": "6471127292c7f4c0676b0ce7ef76f9589276ab60",
                        "meetingID": "7a567d67-29d3-4547-96f3-035733a4dfaa",
                        "moderatorPW": "0$C7Aaz0o",
                        "name": "Classroom 001",
                        "welcome": "Welcome!",
                        "record": True,
                    }
                )
            ],
            body="""
            <response>
                <returncode>FAILED</returncode>
                <messageKey>idNotUnique</messageKey>
                <message>A meeting already exists with that meeting ID.</message>
            </response>
            """,
            status=200,
        )

        with self.assertRaises(ApiMeetingException) as exception:
            create(classroom)
        self.assertEqual(
            str(exception.exception), "A meeting already exists with that meeting ID."
        )
        classroom.refresh_from_db()
        self.assertEqual(classroom.started, False)

    @responses.activate
    def test_bbb_create_new_classroom_with_document(self):
        """Create a classroom with one document."""
        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
        classroom = ClassroomFactory(
            id="9b3df0bd-240c-49fe-85e0-caa47420f3eb",
            title="Classroom 001",
            attendee_password="9#R1kuUl3R",
            moderator_password="0$C7Aaz0o",
            meeting_id="7a567d67-29d3-4547-96f3-035733a4dfaa",
        )
        ClassroomDocumentFactory(
            id="c5c84f7b-7f1a-4689-8da8-28fae7c7e8d9",
            is_default=True,
            filename="file.pdf",
            classroom=classroom,
            uploaded_on=now,
            upload_state="ready",
        )

        responses.add(
            responses.POST,
            "https://10.7.7.1/bigbluebutton/api/create",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "attendeePW": "9#R1kuUl3R",
                        "checksum": "6471127292c7f4c0676b0ce7ef76f9589276ab60",
                        "meetingID": "7a567d67-29d3-4547-96f3-035733a4dfaa",
                        "moderatorPW": "0$C7Aaz0o",
                        "name": "Classroom 001",
                        "welcome": "Welcome!",
                        "record": True,
                    }
                ),
            ],
            body=f"""
            <response>
                <returncode>SUCCESS</returncode>
                <meetingID>{classroom.id}</meetingID>
                <internalMeetingID>232a8ab5dbfde4d33a2bd9d5bbc08bd74d04e163-1628693645640</internalMeetingID>
                <parentMeetingID>bbb-none</parentMeetingID>
                <attendeePW>{classroom.attendee_password}</attendeePW>
                <moderatorPW>{classroom.moderator_password}</moderatorPW>
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
            """,
            status=200,
        )

        api_response = create(classroom)

        self.assertEqual(
            responses.calls[0].request.body,
            b'<modules><module name="presentation">'
            b"<document "
            b'url="https://abc.cloudfront.net/9b3df0bd-240c-49fe-85e0-caa47420f3eb/'
            b'classroomdocument/c5c84f7b-7f1a-4689-8da8-28fae7c7e8d9/1533686400.pdf" '
            b'filename="file.pdf" '
            b'current="true" '
            b"/>"
            b"</module></modules>",
        )

        self.assertDictEqual(
            {
                "attendeePW": classroom.attendee_password,
                "createDate": "Wed Aug 11 14:54:05 UTC 2021",
                "createTime": "1628693645640",
                "dialNumber": "613-555-1234",
                "duration": "0",
                "hasBeenForciblyEnded": "false",
                "hasUserJoined": "false",
                "internalMeetingID": "232a8ab5dbfde4d33a2bd9d5bbc08bd74d04e163-1628693645640",
                "meetingID": str(classroom.id),
                "message": "Meeting created.",
                "messageKey": None,
                "moderatorPW": classroom.moderator_password,
                "parentMeetingID": "bbb-none",
                "returncode": "SUCCESS",
                "voiceBridge": "83267",
            },
            api_response,
        )
        self.assertEqual(classroom.started, True)
        self.assertEqual(classroom.ended, False)

    @responses.activate
    def test_bbb_create_new_classroom_with_documents(self):
        """Create a classroom with multiple documents."""
        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
        classroom = ClassroomFactory(
            id="9b3df0bd-240c-49fe-85e0-caa47420f3eb",
            title="Classroom 001",
            attendee_password="9#R1kuUl3R",
            moderator_password="0$C7Aaz0o",
            meeting_id="7a567d67-29d3-4547-96f3-035733a4dfaa",
        )
        ClassroomDocumentFactory(
            id="c5c84f7b-7f1a-4689-8da8-28fae7c7e8d9",
            is_default=True,
            filename="file.pdf",
            classroom=classroom,
            uploaded_on=now,
            upload_state="ready",
        )
        ClassroomDocumentFactory(
            id="a753faf5-5d6a-4091-856b-71d2c600e1cd",
            is_default=False,
            filename="file2.pdf",
            classroom=classroom,
            uploaded_on=now,
            upload_state="ready",
        )

        responses.add(
            responses.POST,
            "https://10.7.7.1/bigbluebutton/api/create",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "attendeePW": "9#R1kuUl3R",
                        "checksum": "6471127292c7f4c0676b0ce7ef76f9589276ab60",
                        "meetingID": "7a567d67-29d3-4547-96f3-035733a4dfaa",
                        "moderatorPW": "0$C7Aaz0o",
                        "name": "Classroom 001",
                        "welcome": "Welcome!",
                        "record": True,
                    }
                ),
            ],
            body=f"""
            <response>
                <returncode>SUCCESS</returncode>
                <meetingID>{classroom.id}</meetingID>
                <internalMeetingID>232a8ab5dbfde4d33a2bd9d5bbc08bd74d04e163-1628693645640</internalMeetingID>
                <parentMeetingID>bbb-none</parentMeetingID>
                <attendeePW>{classroom.attendee_password}</attendeePW>
                <moderatorPW>{classroom.moderator_password}</moderatorPW>
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
            """,
            status=200,
        )

        api_response = create(classroom)

        self.assertEqual(
            responses.calls[0].request.body,
            b'<modules><module name="presentation">'
            b"<document "
            b'url="https://abc.cloudfront.net/9b3df0bd-240c-49fe-85e0-caa47420f3eb/'
            b'classroomdocument/a753faf5-5d6a-4091-856b-71d2c600e1cd/1533686400.pdf" '
            b'filename="file2.pdf" '
            b'current="false" '
            b"/>"
            b"<document "
            b'url="https://abc.cloudfront.net/9b3df0bd-240c-49fe-85e0-caa47420f3eb/'
            b'classroomdocument/c5c84f7b-7f1a-4689-8da8-28fae7c7e8d9/1533686400.pdf" '
            b'filename="file.pdf" '
            b'current="true" '
            b"/>"
            b"</module></modules>",
        )

        self.assertDictEqual(
            {
                "attendeePW": classroom.attendee_password,
                "createDate": "Wed Aug 11 14:54:05 UTC 2021",
                "createTime": "1628693645640",
                "dialNumber": "613-555-1234",
                "duration": "0",
                "hasBeenForciblyEnded": "false",
                "hasUserJoined": "false",
                "internalMeetingID": "232a8ab5dbfde4d33a2bd9d5bbc08bd74d04e163-1628693645640",
                "meetingID": str(classroom.id),
                "message": "Meeting created.",
                "messageKey": None,
                "moderatorPW": classroom.moderator_password,
                "parentMeetingID": "bbb-none",
                "returncode": "SUCCESS",
                "voiceBridge": "83267",
            },
            api_response,
        )
        self.assertEqual(classroom.started, True)
        self.assertEqual(classroom.ended, False)

    @responses.activate
    def test_bbb_end_moderator(self):
        """End a meeting in current classroom related server."""
        classroom = ClassroomFactory(
            meeting_id="21e6634f-ab6f-4c77-a665-4229c61b479a",
            title="Classroom 1",
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
                        "password": classroom.moderator_password,
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
                <meetingName>Super bbb classroom</meetingName>
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

        api_response = end(classroom, moderator=True)
        self.assertDictEqual(
            {
                "message": "A request to end the meeting was sent.",
                "messageKey": "sentEndMeetingRequest",
                "returncode": "SUCCESS",
            },
            api_response,
        )
        self.assertEqual(classroom.started, False)
        self.assertEqual(classroom.ended, True)

    @responses.activate
    def test_bbb_end_attendee(self):
        """End a meeting in current classroom related server."""
        classroom = ClassroomFactory(
            meeting_id="21e6634f-ab6f-4c77-a665-4229c61b479a",
            title="Classroom 1",
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
                        "password": classroom.attendee_password,
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
            end(classroom, moderator=False)
        self.assertEqual(
            str(context.exception),
            "You must supply the moderator password for this call.",
        )

    def test_join(self):
        """Return a meeting join url."""
        classroom = ClassroomFactory()
        api_response = join(classroom, consumer_site_user_id="a_1", fullname="John Doe")
        self.assertIn(
            "https://10.7.7.1/bigbluebutton/api/join?"
            f"fullName=John+Doe&meetingID={classroom.meeting_id}&"
            f"password={classroom.attendee_password}&userID=a_1&redirect=true",
            api_response.get("url"),
        )

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
