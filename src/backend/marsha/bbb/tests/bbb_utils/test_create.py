"""Tests for the create service in the ``bbb`` app of the Marsha project."""
from datetime import datetime, timezone

from django.test import TestCase, override_settings

import responses

from marsha.bbb.factories import ClassroomDocumentFactory, ClassroomFactory
from marsha.bbb.utils.bbb_utils import ApiMeetingException, create


@override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
@override_settings(BBB_API_SECRET="SuperSecret")
@override_settings(BBB_ENABLE_RECORD=True)
class ClassroomServiceTestCase(TestCase):
    """Test our intentions about the create Classroom service."""

    maxDiff = None

    @responses.activate
    def test_bbb_create_new_classroom(self):
        """Create a classroom in current classroom related server."""
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
                        "checksum": "cdd04259644640f009860f4d5daaf6e35ea6d244",
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
    @override_settings(BBB_ENABLE_RECORD=False)
    def test_bbb_create_new_classroom_record_disabled(self):
        """Create a classroom in current classroom related server."""
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
                        "checksum": "f13b9e5bb900b2e33065ef05a2a88c6da1341436",
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
                        "checksum": "cdd04259644640f009860f4d5daaf6e35ea6d244",
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
                        "checksum": "cdd04259644640f009860f4d5daaf6e35ea6d244",
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
                        "checksum": "cdd04259644640f009860f4d5daaf6e35ea6d244",
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
