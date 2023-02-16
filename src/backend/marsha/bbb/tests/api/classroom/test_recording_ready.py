"""Tests for the classroom API."""
from django.conf import settings
from django.test import TestCase, override_settings

import jwt
import responses

from marsha.bbb.factories import ClassroomFactory, ClassroomRecordingFactory
from marsha.bbb.models import ClassroomRecording
from marsha.core.tests.testing_utils import reload_urlconf


ALG = "HS256"


def build_bbb_jwt(data, secret):
    """Build a JWT sent by the BBB API."""
    return jwt.encode(data, secret, headers={"alg": ALG}, algorithm=ALG)


@override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
@override_settings(BBB_API_SECRET="SuperSecret")
@override_settings(BBB_API_CALLBACK_SECRET="OtherSuperSecret")
@override_settings(BBB_ENABLE_RECORD=True)
@override_settings(BBB_ENABLED=True)
class ClassroomRecordingReadyAPITest(TestCase):
    """Test for the Classroom API."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use BBB_ENABLED
        reload_urlconf()

    @responses.activate
    def test_recording_ready_valid_signature(self):
        """Test the callback view with a valid signature."""
        classroom = ClassroomFactory(meeting_id="7e1c8b28-cd7a-4abe-93b2-3121366cb049")
        signed_parameters = build_bbb_jwt(
            {
                "meeting_id": "7e1c8b28-cd7a-4abe-93b2-3121366cb049",
                "record_id": "d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234",
            },
            settings.BBB_API_CALLBACK_SECRET,
        )

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/getRecordings",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "meetingID": "7e1c8b28-cd7a-4abe-93b2-3121366cb049",
                        "recordID": "d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234",
                        "checksum": "85477147f74390fc7985edf85851aa29eea57e5e",
                    }
                )
            ],
            body="""
                <response>
                    <returncode>SUCCESS</returncode>
                    <recordings>
                        <recording>
                            <recordID>c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493</recordID>
                            <meetingID>881e8986-9673-11ed-a1eb-0242ac120002</meetingID>
                            <internalMeetingID>c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493</internalMeetingID>
                            <name>test ncl</name>
                            <published>true</published>
                            <state>published</state>
                            <startTime>1673282694493</startTime>
                            <endTime>1673282727208</endTime>
                            <participants>1</participants>
                            <metadata>
                                <analytics-callback-url>https://10.7.7.2/bbb-analytics/api/v1/post_events?tag=bbb-dev
                                </analytics-callback-url>
                            </metadata>
                            <playback>
                                <format>
                                    <type>presentation</type>
                                    <url>
                                        https://10.7.7.1/playback/presentation/2.3/c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493
                                    </url>
                                    <length>0</length>
                                </format>
                                <format>
                                    <type>video</type>
                                    <url>
                                        https://10.7.7.1/presentation/c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493/meeting.mp4
                                    </url>
                                    <length>0</length>
                                </format>
                            </playback>
                        </recording>
                        <recording>
                            <recordID>c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673255861863</recordID>
                            <meetingID>881e8986-9673-11ed-a1eb-0242ac120002</meetingID>
                            <internalMeetingID>c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673255861863</internalMeetingID>
                            <name>test ncl</name>
                            <published>true</published>
                            <state>published</state>
                            <startTime>1673255861863</startTime>
                            <endTime>1673255904043</endTime>
                            <participants>1</participants>
                            <metadata>
                                <analytics-callback-url>https://10.7.7.2/bbb-analytics/api/v1/post_events?tag=bbb-dev
                                </analytics-callback-url>
                            </metadata>
                            <playback>
                                <format>
                                    <type>video</type>
                                    <url>
                                        https://10.7.7.1/presentation/c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673255861863/meeting.mp4
                                    </url>
                                    <length>0</length>
                                </format>
                                <format>
                                    <type>presentation</type>
                                    <url>
                                        https://10.7.7.1/playback/presentation/2.3/c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673255861863
                                    </url>
                                    <length>0</length>
                                </format>
                            </playback>
                        </recording>
                    </recordings>
                </response>
            """,
            status=200,
        )

        response = self.client.post(
            "/api/classrooms/recording-ready/",
            data={"signed_parameters": signed_parameters},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(ClassroomRecording.objects.count(), 2)
        self.assertEqual(classroom.recordings.count(), 2)
        recording_1 = classroom.recordings.get(
            record_id="c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493"
        )
        self.assertEqual(
            recording_1.video_file_url,
            "https://10.7.7.1/presentation/"
            "c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493/meeting.mp4",
        )
        recording_2 = classroom.recordings.get(
            record_id="c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673255861863"
        )
        self.assertEqual(
            recording_2.video_file_url,
            "https://10.7.7.1/presentation/"
            "c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673255861863/meeting.mp4",
        )

    @responses.activate
    def test_recording_ready_unknown_classroom(self):
        """An unknown classroom should raise a 404."""
        signed_parameters = build_bbb_jwt(
            {
                "meeting_id": "7e1c8b28-cd7a-4abe-93b2-3121366cb049",
                "record_id": "d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234",
            },
            settings.BBB_API_CALLBACK_SECRET,
        )

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/getRecordings",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "meetingID": "7e1c8b28-cd7a-4abe-93b2-3121366cb049",
                        "checksum": "b661619f04336794f4518ab0d387d9c72cf11187",
                    }
                )
            ],
            body="""
                <response>
                    <returncode>SUCCESS</returncode>
                    <recordings>
                        <recording>
                            <recordID>c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493</recordID>
                            <meetingID>881e8986-9673-11ed-a1eb-0242ac120002</meetingID>
                            <internalMeetingID>c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493</internalMeetingID>
                            <name>test ncl</name>
                            <published>true</published>
                            <state>published</state>
                            <startTime>1673282694493</startTime>
                            <endTime>1673282727208</endTime>
                            <participants>1</participants>
                            <metadata>
                                <analytics-callback-url>https://10.7.7.2/bbb-analytics/api/v1/post_events?tag=bbb-dev
                                </analytics-callback-url>
                            </metadata>
                            <playback>
                                <format>
                                    <type>presentation</type>
                                    <url>
                                        https://10.7.7.1/playback/presentation/2.3/c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493
                                    </url>
                                    <length>0</length>
                                </format>
                                <format>
                                    <type>video</type>
                                    <url>
                                        https://10.7.7.1/presentation/c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493/meeting.mp4
                                    </url>
                                    <length>0</length>
                                </format>
                            </playback>
                        </recording>
                        <recording>
                            <recordID>c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673255861863</recordID>
                            <meetingID>881e8986-9673-11ed-a1eb-0242ac120002</meetingID>
                            <internalMeetingID>c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673255861863</internalMeetingID>
                            <name>test ncl</name>
                            <published>true</published>
                            <state>published</state>
                            <startTime>1673255861863</startTime>
                            <endTime>1673255904043</endTime>
                            <participants>1</participants>
                            <metadata>
                                <analytics-callback-url>https://10.7.7.2/bbb-analytics/api/v1/post_events?tag=bbb-dev
                                </analytics-callback-url>
                            </metadata>
                            <playback>
                                <format>
                                    <type>video</type>
                                    <url>
                                        https://10.7.7.1/presentation/c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673255861863/meeting.mp4
                                    </url>
                                    <length>0</length>
                                </format>
                                <format>
                                    <type>presentation</type>
                                    <url>
                                        https://10.7.7.1/playback/presentation/2.3/c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673255861863
                                    </url>
                                    <length>0</length>
                                </format>
                            </playback>
                        </recording>
                    </recordings>
                </response>
            """,
            status=200,
        )

        response = self.client.post(
            "/api/classrooms/recording-ready/",
            data={"signed_parameters": signed_parameters},
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(ClassroomRecording.objects.count(), 0)

    @responses.activate
    def test_recording_ready_no_recordings(self):
        """When no recording is found, nothing is stored."""
        classroom = ClassroomFactory(meeting_id="7e1c8b28-cd7a-4abe-93b2-3121366cb049")
        signed_parameters = build_bbb_jwt(
            {
                "meeting_id": "7e1c8b28-cd7a-4abe-93b2-3121366cb049",
                "record_id": "d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234",
            },
            settings.BBB_API_CALLBACK_SECRET,
        )

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/getRecordings",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "meetingID": "7e1c8b28-cd7a-4abe-93b2-3121366cb049",
                        "recordID": "d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234",
                        "checksum": "85477147f74390fc7985edf85851aa29eea57e5e",
                    }
                )
            ],
            body="""
            <response>
                <returncode>SUCCESS</returncode>
                <recordings> </recordings>
                <messageKey>noRecordings</messageKey>
                <message>There are not recordings for the meetings</message>
            </response>
            """,
            status=200,
        )

        response = self.client.post(
            "/api/classrooms/recording-ready/",
            data={"signed_parameters": signed_parameters},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(ClassroomRecording.objects.count(), 0)
        self.assertEqual(classroom.recordings.count(), 0)

    def test_recording_ready_invalid_signature(self):
        """An invalid signature should return a 401 response."""
        signed_parameters = build_bbb_jwt(
            {"meeting_id": "test_meeting", "record_id": "test_record"},
            "incorrect_secret",
        )

        response = self.client.post(
            "/api/classrooms/recording-ready/", {"signed_parameters": signed_parameters}
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(ClassroomRecording.objects.count(), 0)

    def test_recording_ready_missing_parameter(self):
        """Missing parameter should return a 400 response."""
        response = self.client.post("/api/classrooms/recording-ready/")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(ClassroomRecording.objects.count(), 0)

    @responses.activate
    def test_recording_ready_update(self):
        """When a recording exists, it should be updated."""
        classroom = ClassroomFactory(meeting_id="7e1c8b28-cd7a-4abe-93b2-3121366cb049")
        classroom_record = ClassroomRecordingFactory(
            classroom=classroom,
            record_id="d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234",
            video_file_url="https://example.com/video.mp4",
        )
        signed_parameters = build_bbb_jwt(
            {
                "meeting_id": "7e1c8b28-cd7a-4abe-93b2-3121366cb049",
                "record_id": "d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234",
            },
            settings.BBB_API_CALLBACK_SECRET,
        )

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/getRecordings",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "meetingID": "7e1c8b28-cd7a-4abe-93b2-3121366cb049",
                        "recordID": "d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234",
                        "checksum": "85477147f74390fc7985edf85851aa29eea57e5e",
                    }
                )
            ],
            body="""
                <response>
                    <returncode>SUCCESS</returncode>
                    <recordings>
                        <recording>
                            <recordID>d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234</recordID>
                            <meetingID>881e8986-9673-11ed-a1eb-0242ac120002</meetingID>
                            <internalMeetingID>c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493</internalMeetingID>
                            <name>test ncl</name>
                            <published>true</published>
                            <state>published</state>
                            <startTime>1673282694493</startTime>
                            <endTime>1673282727208</endTime>
                            <participants>1</participants>
                            <metadata>
                                <analytics-callback-url>https://10.7.7.2/bbb-analytics/api/v1/post_events?tag=bbb-dev
                                </analytics-callback-url>
                            </metadata>
                            <playback>
                                <format>
                                    <type>presentation</type>
                                    <url>
                                        https://10.7.7.1/playback/presentation/2.3/c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493
                                    </url>
                                    <length>0</length>
                                </format>
                                <format>
                                    <type>video</type>
                                    <url>
                                        https://10.7.7.1/presentation/c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493/meeting.mp4
                                    </url>
                                    <length>0</length>
                                </format>
                            </playback>
                        </recording>
                    </recordings>
                </response>
            """,
            status=200,
        )

        response = self.client.post(
            "/api/classrooms/recording-ready/",
            data={"signed_parameters": signed_parameters},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(ClassroomRecording.objects.count(), 1)
        self.assertEqual(classroom.recordings.count(), 1)
        classroom_record.refresh_from_db()
        self.assertEqual(
            classroom_record.video_file_url,
            "https://10.7.7.1/presentation/c62c9c205d37815befe1b75ae6ef5878d8da5bb6"
            "-1673282694493/meeting.mp4",
        )

    @responses.activate
    def test_recording_ready_delete(self):
        """When a recording exists, it should be deleted if not found."""
        classroom = ClassroomFactory(meeting_id="7e1c8b28-cd7a-4abe-93b2-3121366cb049")
        classroom_record = ClassroomRecordingFactory(
            classroom=classroom,
            record_id="d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234",
            video_file_url="https://example.com/video.mp4",
        )
        signed_parameters = build_bbb_jwt(
            {
                "meeting_id": "7e1c8b28-cd7a-4abe-93b2-3121366cb049",
                "record_id": "d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234",
            },
            settings.BBB_API_CALLBACK_SECRET,
        )

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/getRecordings",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "meetingID": "7e1c8b28-cd7a-4abe-93b2-3121366cb049",
                        "recordID": "d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234",
                        "checksum": "85477147f74390fc7985edf85851aa29eea57e5e",
                    }
                )
            ],
            body="""
            <response>
                <returncode>SUCCESS</returncode>
                <recordings> </recordings>
                <messageKey>noRecordings</messageKey>
                <message>There are not recordings for the meetings</message>
            </response>
            """,
            status=200,
        )

        response = self.client.post(
            "/api/classrooms/recording-ready/",
            data={"signed_parameters": signed_parameters},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(ClassroomRecording.objects.count(), 0)
        self.assertEqual(classroom.recordings.count(), 0)
        classroom_record.refresh_from_db()
        self.assertIsNotNone(classroom_record.deleted)
