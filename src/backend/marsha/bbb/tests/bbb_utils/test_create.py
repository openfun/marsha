"""Tests for the create service in the ``bbb`` app of the Marsha project."""

from datetime import datetime, timezone
from unittest import mock

from django.test import TestCase, override_settings

import responses

from marsha.bbb.factories import ClassroomDocumentFactory, ClassroomFactory
from marsha.bbb.utils.bbb_utils import ApiMeetingException, create


@override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
@override_settings(BBB_API_SECRET="SuperSecret")
class ClassroomServiceTestCase(TestCase):
    """Test our intentions about the create Classroom service."""

    maxDiff = None

    @responses.activate
    def test_bbb_create_new_classroom(self):
        """Create a classroom in current classroom related server."""
        now = datetime(2021, 10, 29, 13, 42, 27, tzinfo=timezone.utc)
        classroom = ClassroomFactory(
            title="Classroom 001",
            meeting_id="7a567d67-29d3-4547-96f3-035733a4dfaa",
        )
        self.assertQuerysetEqual(classroom.sessions.all(), [])

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/create",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "checksum": "423d38ea468e5836e8946c89a62d646107ecd411",
                        "guestPolicy": "ALWAYS_ACCEPT",
                        "meetingID": "7a567d67-29d3-4547-96f3-035733a4dfaa",
                        "meta_bbb-recording-ready-url": (
                            "https://example.com/api/classrooms/recording-ready/"
                        ),
                        "name": "Classroom 001",
                        "record": True,
                        "role": "moderator",
                        "welcome": "Welcome!",
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

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/join",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "meetingID": str(classroom.meeting_id),
                    },
                    strict_match=False,
                )
            ],
            body="""Should redirect""",
            headers={
                "Location": "https://bbb.net/html5client/join?sessionToken=123",
            },
            status=301,
        )

        responses.add(
            responses.GET,
            "https://bbb.net/html5client/join?sessionToken=123",
            body="whatever, just need the cookie",
            headers={
                "set-cookie": "foo=bar",
            },
            status=200,
        )

        with mock.patch(
            "marsha.bbb.utils.bbb_utils.now",
            return_value=now,
        ):
            api_response = create(
                classroom, "https://example.com/api/classrooms/recording-ready/"
            )

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
        self.assertEqual(classroom.ended, False)
        session = classroom.sessions.get()
        self.assertEqual(session.started_at, now)
        self.assertEqual(session.ended_at, None)
        self.assertEqual(session.cookie, '{"foo": "bar"}')
        self.assertEqual(
            session.bbb_learning_analytics_url,
            "https://bbb.net/bigbluebutton/api/learningDashboard?sessionToken=123",
        )

    @responses.activate
    def test_bbb_create_new_classroom_record_disabled(self):
        """Create a classroom in current classroom related server."""
        classroom = ClassroomFactory(
            title="Classroom 001",
            meeting_id="7a567d67-29d3-4547-96f3-035733a4dfaa",
            enable_recordings=False,
        )

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/create",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "checksum": "31ca84abd5ccfe15b208eee164fd14305ddb95e6",
                        "guestPolicy": "ALWAYS_ACCEPT",
                        "meetingID": "7a567d67-29d3-4547-96f3-035733a4dfaa",
                        "meta_bbb-recording-ready-url": (
                            "https://example.com/api/classrooms/recording-ready/"
                        ),
                        "name": "Classroom 001",
                        "record": False,
                        "role": "moderator",
                        "welcome": "Welcome!",
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

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/join",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "meetingID": str(classroom.meeting_id),
                    },
                    strict_match=False,
                )
            ],
            body="""Should redirect""",
            headers={
                "Location": "https://bbb.net/html5client/join?sessionToken=123",
            },
            status=301,
        )

        responses.add(
            responses.GET,
            "https://bbb.net/html5client/join?sessionToken=123",
            body="whatever, just need the cookie",
            headers={
                "set-cookie": "foo=bar",
            },
            status=200,
        )

        api_response = create(
            classroom, "https://example.com/api/classrooms/recording-ready/"
        )

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
        self.assertEqual(classroom.ended, False)

    @responses.activate
    def test_bbb_create_new_classroom_enable_waiting_room(self):
        """Create a classroom in current classroom related server."""
        classroom = ClassroomFactory(
            title="Classroom 001",
            meeting_id="7a567d67-29d3-4547-96f3-035733a4dfaa",
            enable_recordings=True,
            enable_waiting_room=True,
        )

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/create",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "checksum": "7758b74caca5d6833377c3844eaee681e6c19d4b",
                        "guestPolicy": "ASK_MODERATOR",
                        "meetingID": "7a567d67-29d3-4547-96f3-035733a4dfaa",
                        "meta_bbb-recording-ready-url": (
                            "https://example.com/api/classrooms/recording-ready/"
                        ),
                        "name": "Classroom 001",
                        "record": True,
                        "role": "moderator",
                        "welcome": "Welcome!",
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

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/join",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "meetingID": str(classroom.meeting_id),
                    },
                    strict_match=False,
                )
            ],
            body="""Should redirect""",
            headers={
                "Location": "https://bbb.net/html5client/join?sessionToken=123",
            },
            status=301,
        )

        responses.add(
            responses.GET,
            "https://bbb.net/html5client/join?sessionToken=123",
            body="whatever, just need the cookie",
            headers={
                "set-cookie": "foo=bar",
            },
            status=200,
        )

        api_response = create(
            classroom, "https://example.com/api/classrooms/recording-ready/"
        )

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
        self.assertEqual(classroom.ended, False)

    @responses.activate
    def test_bbb_create_new_classroom_disabled_feature(self):
        """Create a classroom in current classroom related server."""
        classroom = ClassroomFactory(
            title="Classroom 001",
            meeting_id="7a567d67-29d3-4547-96f3-035733a4dfaa",
            enable_recordings=True,
            enable_chat=False,
        )

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/create",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "checksum": "76d51ecd901fea1eff64ccf8195ba6bfbace5aa1",
                        "guestPolicy": "ALWAYS_ACCEPT",
                        "disabledFeatures": "chat",
                        "meetingID": "7a567d67-29d3-4547-96f3-035733a4dfaa",
                        "meta_bbb-recording-ready-url": (
                            "https://example.com/api/classrooms/recording-ready/"
                        ),
                        "name": "Classroom 001",
                        "record": True,
                        "role": "moderator",
                        "welcome": "Welcome!",
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

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/join",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "meetingID": str(classroom.meeting_id),
                    },
                    strict_match=False,
                )
            ],
            body="""Should redirect""",
            headers={
                "Location": "https://bbb.net/html5client/join?sessionToken=123",
            },
            status=301,
        )

        responses.add(
            responses.GET,
            "https://bbb.net/html5client/join?sessionToken=123",
            body="whatever, just need the cookie",
            headers={
                "set-cookie": "foo=bar",
            },
            status=200,
        )

        api_response = create(
            classroom, "https://example.com/api/classrooms/recording-ready/"
        )

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
        self.assertEqual(classroom.ended, False)

    @responses.activate
    def test_bbb_create_new_classroom_disabled_features(self):
        """Create a classroom in current classroom related server."""
        classroom = ClassroomFactory(
            title="Classroom 001",
            meeting_id="7a567d67-29d3-4547-96f3-035733a4dfaa",
            enable_recordings=True,
            enable_chat=False,
            enable_shared_notes=False,
            enable_presentation_supports=False,
        )

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/create",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "checksum": "397fe8d80ccd9e55efde93a80e0c0404d497c2d3",
                        "guestPolicy": "ALWAYS_ACCEPT",
                        "disabledFeatures": "chat,sharedNotes,presentation",
                        "meetingID": "7a567d67-29d3-4547-96f3-035733a4dfaa",
                        "meta_bbb-recording-ready-url": (
                            "https://example.com/api/classrooms/recording-ready/"
                        ),
                        "name": "Classroom 001",
                        "record": True,
                        "role": "moderator",
                        "welcome": "Welcome!",
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

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/join",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "meetingID": str(classroom.meeting_id),
                    },
                    strict_match=False,
                )
            ],
            body="""Should redirect""",
            headers={
                "Location": "https://bbb.net/html5client/join?sessionToken=123",
            },
            status=301,
        )

        responses.add(
            responses.GET,
            "https://bbb.net/html5client/join?sessionToken=123",
            body="whatever, just need the cookie",
            headers={
                "set-cookie": "foo=bar",
            },
            status=200,
        )

        api_response = create(
            classroom, "https://example.com/api/classrooms/recording-ready/"
        )

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
        self.assertEqual(classroom.ended, False)

    @responses.activate
    def test_bbb_create_existing_classroom(self):
        """Create a meeting in current classroom related server."""
        classroom = ClassroomFactory(
            title="Classroom 001",
            meeting_id="7a567d67-29d3-4547-96f3-035733a4dfaa",
        )

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/create",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "checksum": "423d38ea468e5836e8946c89a62d646107ecd411",
                        "guestPolicy": "ALWAYS_ACCEPT",
                        "meetingID": "7a567d67-29d3-4547-96f3-035733a4dfaa",
                        "meta_bbb-recording-ready-url": (
                            "https://example.com/api/classrooms/recording-ready/"
                        ),
                        "name": "Classroom 001",
                        "record": True,
                        "role": "moderator",
                        "welcome": "Welcome!",
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
            create(classroom, "https://example.com/api/classrooms/recording-ready/")
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
                        "checksum": "423d38ea468e5836e8946c89a62d646107ecd411",
                        "guestPolicy": "ALWAYS_ACCEPT",
                        "meetingID": "7a567d67-29d3-4547-96f3-035733a4dfaa",
                        "meta_bbb-recording-ready-url": (
                            "https://example.com/api/classrooms/recording-ready/"
                        ),
                        "name": "Classroom 001",
                        "record": True,
                        "role": "moderator",
                        "welcome": "Welcome!",
                    }
                ),
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

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/join",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "meetingID": str(classroom.meeting_id),
                    },
                    strict_match=False,
                )
            ],
            body="""Should redirect""",
            headers={
                "Location": "https://bbb.net/html5client/join?sessionToken=123",
            },
            status=301,
        )

        responses.add(
            responses.GET,
            "https://bbb.net/html5client/join?sessionToken=123",
            body="whatever, just need the cookie",
            headers={
                "set-cookie": "foo=bar",
            },
            status=200,
        )

        api_response = create(
            classroom, "https://example.com/api/classrooms/recording-ready/"
        )

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
        self.assertEqual(classroom.ended, False)

    @responses.activate
    def test_bbb_create_new_classroom_with_documents(self):
        """Create a classroom with multiple documents."""
        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
        classroom = ClassroomFactory(
            id="9b3df0bd-240c-49fe-85e0-caa47420f3eb",
            title="Classroom 001",
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
                        "checksum": "423d38ea468e5836e8946c89a62d646107ecd411",
                        "guestPolicy": "ALWAYS_ACCEPT",
                        "meetingID": "7a567d67-29d3-4547-96f3-035733a4dfaa",
                        "meta_bbb-recording-ready-url": (
                            "https://example.com/api/classrooms/recording-ready/"
                        ),
                        "name": "Classroom 001",
                        "record": True,
                        "role": "moderator",
                        "welcome": "Welcome!",
                    }
                ),
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

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/join",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "meetingID": str(classroom.meeting_id),
                    },
                    strict_match=False,
                )
            ],
            body="""Should redirect""",
            headers={
                "Location": "https://bbb.net/html5client/join?sessionToken=123",
            },
            status=301,
        )

        responses.add(
            responses.GET,
            "https://bbb.net/html5client/join?sessionToken=123",
            body="whatever, just need the cookie",
            headers={
                "set-cookie": "foo=bar",
            },
            status=200,
        )

        api_response = create(
            classroom, "https://example.com/api/classrooms/recording-ready/"
        )
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
        self.assertEqual(classroom.ended, False)

    @responses.activate
    def test_create_classroom_failing_with_reattempt_exceeded(self):
        """When creation fail, end is called and create is attempt 5 times before stopping."""
        classroom = ClassroomFactory(
            title="Classroom 001",
            meeting_id="99769277-ca54-4813-9976-b473481ddb13",
        )

        create_response = responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/create",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "checksum": "a7e7967e4055bedd0c5be44adc832fb90141bcc0",
                        "guestPolicy": "ALWAYS_ACCEPT",
                        "meetingID": "99769277-ca54-4813-9976-b473481ddb13",
                        "meta_bbb-recording-ready-url": (
                            "https://example.com/api/classrooms/recording-ready/"
                        ),
                        "name": "Classroom 001",
                        "record": True,
                        "role": "moderator",
                        "welcome": "Welcome!",
                    }
                )
            ],
            body="""
            <response>
            <returncode>FAILED</returncode>
            <messageKey>internalError</messageKey>
            <message>Unable to create meeting on server.</message>
            </response>
            """,
            status=200,
        )

        # end request
        end_response = responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/end",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "checksum": "6382b2fd11bc4ceaa45fc37259fc357d596dfd4e",
                        "meetingID": "99769277-ca54-4813-9976-b473481ddb13",
                    }
                )
            ],
            body="""
            <response>
                <returncode>FAILED</returncode>
                <messageKey>internalError</messageKey>
                <message>Unable to access meeting on server.</message>
            </response>
            """,
            status=200,
        )

        with self.assertRaises(ApiMeetingException):
            create(classroom, "https://example.com/api/classrooms/recording-ready/")

        self.assertEqual(classroom.started, False)
        self.assertEqual(classroom.ended, False)
        self.assertEqual(create_response.call_count, 5)
        self.assertEqual(end_response.call_count, 4)

    @responses.activate
    def test_create_classroom_failing_before_ending(self):
        """
        Forcing to end a meeting when a creation fail can unlock the meeting
        and then it is possible to create it.
        This a hack for this issue: https://github.com/bigbluebutton/bigbluebutton/issues/18913
        """
        classroom = ClassroomFactory(
            title="Classroom 001",
            meeting_id="99769277-ca54-4813-9976-b473481ddb13",
        )

        # First create, the creation fail
        create_response = responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/create",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "checksum": "a7e7967e4055bedd0c5be44adc832fb90141bcc0",
                        "guestPolicy": "ALWAYS_ACCEPT",
                        "meetingID": "99769277-ca54-4813-9976-b473481ddb13",
                        "meta_bbb-recording-ready-url": (
                            "https://example.com/api/classrooms/recording-ready/"
                        ),
                        "name": "Classroom 001",
                        "record": True,
                        "role": "moderator",
                        "welcome": "Welcome!",
                    }
                )
            ],
            body="""
            <response>
            <returncode>FAILED</returncode>
            <messageKey>internalError</messageKey>
            <message>Unable to create meeting on server.</message>
            </response>
            """,
            status=200,
        )

        # end request fails too
        end_response = responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/end",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "checksum": "6382b2fd11bc4ceaa45fc37259fc357d596dfd4e",
                        "meetingID": "99769277-ca54-4813-9976-b473481ddb13",
                    }
                )
            ],
            body="""
            <response>
                <returncode>FAILED</returncode>
                <messageKey>internalError</messageKey>
                <message>Unable to access meeting on server.</message>
            </response>
            """,
            status=200,
        )

        # Second create, the creation succeeded
        second_create_response = responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/create",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "checksum": "a7e7967e4055bedd0c5be44adc832fb90141bcc0",
                        "guestPolicy": "ALWAYS_ACCEPT",
                        "meetingID": "99769277-ca54-4813-9976-b473481ddb13",
                        "meta_bbb-recording-ready-url": (
                            "https://example.com/api/classrooms/recording-ready/"
                        ),
                        "name": "Classroom 001",
                        "record": True,
                        "role": "moderator",
                        "welcome": "Welcome!",
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

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/join",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "meetingID": str(classroom.meeting_id),
                    },
                    strict_match=False,
                )
            ],
            body="""Should redirect""",
            headers={
                "Location": "https://bbb.net/html5client/join?sessionToken=123",
            },
            status=301,
        )

        responses.add(
            responses.GET,
            "https://bbb.net/html5client/join?sessionToken=123",
            body="whatever, just need the cookie",
            headers={
                "set-cookie": "foo=bar",
            },
            status=200,
        )

        api_response = create(
            classroom, "https://example.com/api/classrooms/recording-ready/"
        )

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
        self.assertEqual(classroom.ended, False)
        self.assertEqual(create_response.call_count, 1)
        self.assertEqual(second_create_response.call_count, 1)
        self.assertEqual(end_response.call_count, 1)
