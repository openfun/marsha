"""Tests for the get_recordings service in the ``bbb`` app of the Marsha project."""
from django.test import TestCase, override_settings

import responses

from marsha.bbb.factories import ClassroomFactory, ClassroomRecordingFactory
from marsha.bbb.utils.bbb_utils import get_recordings
from marsha.core.tests.testing_utils import reload_urlconf


@override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
@override_settings(BBB_API_SECRET="SuperSecret")
@override_settings(BBB_ENABLE_RECORD=True)
@override_settings(BBB_ENABLED=True)
class ClassroomServiceTestCase(TestCase):
    """Test our intentions about the Classroom get_recordings service."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use BBB_ENABLED
        reload_urlconf()

    @responses.activate
    def test_get_recordings_multiple(self):
        """Validate response when multiple recordings exists."""
        classroom = ClassroomFactory(
            meeting_id="881e8986-9673-11ed-a1eb-0242ac120002", started=True
        )

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/getRecordings",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "meetingID": "881e8986-9673-11ed-a1eb-0242ac120002",
                        "checksum": "4f027975a26f06f30c9b171f5401bdee6f5a2a07",
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
                                <analytics-callback-url>https://bbb-monitor.arawa.fr/bbb-analytics/api/v1/post_events?tag=bbb-dev
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
                                <analytics-callback-url>https://bbb-monitor.arawa.fr/bbb-analytics/api/v1/post_events?tag=bbb-dev
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

        api_response = get_recordings(classroom.meeting_id)

        self.assertDictEqual(
            {
                "recordings": [
                    {
                        "endTime": "1673282727208",
                        "internalMeetingID": (
                            "c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493"
                        ),
                        "meetingID": "881e8986-9673-11ed-a1eb-0242ac120002",
                        "metadata": {
                            "analytics-callback-url": "https://bbb-monitor.arawa.fr/"
                            "bbb-analytics/api/v1/post_events?tag=bbb-dev"
                        },
                        "name": "test ncl",
                        "participants": "1",
                        "playback": {
                            "format": [
                                {
                                    "length": "0",
                                    "type": "presentation",
                                    "url": "https://10.7.7.1/"
                                    "playback/presentation/2.3/c62c9c205d37815befe1b75ae6ef58"
                                    "78d8da5bb6-1673282694493",
                                },
                                {
                                    "length": "0",
                                    "type": "video",
                                    "url": "https://10.7.7.1/"
                                    "presentation/c62c9c205d37815befe1b75ae6ef5878d8da5bb6-16"
                                    "73282694493/meeting.mp4",
                                },
                            ]
                        },
                        "published": "true",
                        "recordID": "c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493",
                        "startTime": "1673282694493",
                        "state": "published",
                    },
                    {
                        "endTime": "1673255904043",
                        "internalMeetingID": (
                            "c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673255861863"
                        ),
                        "meetingID": "881e8986-9673-11ed-a1eb-0242ac120002",
                        "metadata": {
                            "analytics-callback-url": "https://bbb-monitor.arawa.fr/"
                            "bbb-analytics/api/v1/post_events?tag=bbb-dev"
                        },
                        "name": "test ncl",
                        "participants": "1",
                        "playback": {
                            "format": [
                                {
                                    "length": "0",
                                    "type": "video",
                                    "url": "https://10.7.7.1/"
                                    "presentation/c62c9c205d37815befe1b75ae6ef5878d8da5"
                                    "bb6-1673255861863/meeting.mp4",
                                },
                                {
                                    "length": "0",
                                    "type": "presentation",
                                    "url": "https://10.7.7.1/"
                                    "playback/presentation/2.3/"
                                    "c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673255861863",
                                },
                            ]
                        },
                        "published": "true",
                        "recordID": "c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673255861863",
                        "startTime": "1673255861863",
                        "state": "published",
                    },
                ],
                "returncode": "SUCCESS",
            },
            api_response,
        )

    @responses.activate
    def test_get_recordings_empty(self):
        """Validate response when no recording exists."""
        classroom = ClassroomFactory(
            meeting_id="881e8986-9673-11ed-a1eb-0242ac120002", started=True
        )

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/getRecordings",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "meetingID": "881e8986-9673-11ed-a1eb-0242ac120002",
                        "checksum": "4f027975a26f06f30c9b171f5401bdee6f5a2a07",
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

        api_response = get_recordings(classroom.meeting_id)

        self.assertDictEqual(
            {
                "message": "There are not recordings for the meetings",
                "messageKey": "noRecordings",
                "recordings": None,
                "returncode": "SUCCESS",
            },
            api_response,
        )

    @responses.activate
    def test_get_recordings_classroom_record(self):
        """Validate response when one specific recordings exists."""
        classroom = ClassroomFactory(
            meeting_id="881e8986-9673-11ed-a1eb-0242ac120002", started=True
        )

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/getRecordings",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "meetingID": "881e8986-9673-11ed-a1eb-0242ac120002",
                        "recordID": "c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493",
                        "checksum": "c669b064e10c987e02567a4c18747942a8f1563b",
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
                    </recordings>
                </response>
            """,
            status=200,
        )

        api_response = get_recordings(
            classroom.meeting_id,
            record_id="c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493",
        )

        self.assertDictEqual(
            {
                "recordings": [
                    {
                        "endTime": "1673282727208",
                        "internalMeetingID": (
                            "c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493"
                        ),
                        "meetingID": "881e8986-9673-11ed-a1eb-0242ac120002",
                        "metadata": {
                            "analytics-callback-url": "https://10.7.7.2/"
                            "bbb-analytics/api/v1/post_events?tag=bbb-dev"
                        },
                        "name": "test ncl",
                        "participants": "1",
                        "playback": {
                            "format": [
                                {
                                    "length": "0",
                                    "type": "presentation",
                                    "url": "https://10.7.7.1/"
                                    "playback/presentation/2.3/c62c9c205d37815befe1b75ae6ef58"
                                    "78d8da5bb6-1673282694493",
                                },
                                {
                                    "length": "0",
                                    "type": "video",
                                    "url": "https://10.7.7.1/"
                                    "presentation/c62c9c205d37815befe1b75ae6ef5878d8da5bb6-16"
                                    "73282694493/meeting.mp4",
                                },
                            ]
                        },
                        "published": "true",
                        "recordID": "c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493",
                        "startTime": "1673282694493",
                        "state": "published",
                    },
                ],
                "returncode": "SUCCESS",
            },
            api_response,
        )

    @responses.activate
    def test_get_recordings_classroom_record_empty(self):
        """Validate response when no specific recording exists."""
        classroom = ClassroomFactory(
            meeting_id="881e8986-9673-11ed-a1eb-0242ac120002", started=True
        )
        classroom_recording = ClassroomRecordingFactory(
            classroom=classroom,
            record_id="c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493",
            video_file_url="old_url",
        )

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/getRecordings",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "meetingID": "881e8986-9673-11ed-a1eb-0242ac120002",
                        "recordID": "c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493",
                        "checksum": "c669b064e10c987e02567a4c18747942a8f1563b",
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

        api_response = get_recordings(
            classroom.meeting_id, record_id=classroom_recording.record_id
        )

        self.assertDictEqual(
            {
                "message": "There are not recordings for the meetings",
                "messageKey": "noRecordings",
                "recordings": None,
                "returncode": "SUCCESS",
            },
            api_response,
        )
