"""Test the development ``refresh_bbb_recordings` management command."""
from logging import Logger
from unittest import mock

from django.core.management import call_command
from django.test import TransactionTestCase, override_settings

import responses

from marsha.bbb.factories import ClassroomFactory, ClassroomRecordingFactory
from marsha.bbb.models import ClassroomRecording


@override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
@override_settings(BBB_API_SECRET="SuperSecret")
@override_settings(BBB_API_CALLBACK_SECRET="OtherSuperSecret")
@override_settings(BBB_ENABLED=True)
class RefreshBBBRecordingsTestCase(TransactionTestCase):
    """Test the ``refresh_bbb_recordings` management command."""

    maxDiff = None

    @responses.activate
    @mock.patch.object(Logger, "info")
    def test_update_recordings_no_classroom(self, logger_mock):
        """Command should do nothing when no classroom exists."""
        call_command("refresh_bbb_recordings")

        logger_mock.assert_has_calls(
            [
                mock.call("No classroom found."),
            ]
        )
        self.assertEqual(ClassroomRecording.objects.count(), 0)

    @responses.activate
    @mock.patch.object(Logger, "info")
    def test_update_recordings_no_recording(self, logger_mock):
        """Command should call get_meetings when a classroom exists.
        Does nothing when no recording is found and no recording already exists."""
        classroom = ClassroomFactory(meeting_id="7e1c8b28-cd7a-4abe-93b2-3121366cb049")
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
                <recordings> </recordings>
                <messageKey>noRecordings</messageKey>
                <message>There are not recordings for the meetings</message>
            </response>
            """,
            status=200,
        )

        call_command("refresh_bbb_recordings")

        logger_mock.assert_has_calls(
            [
                mock.call("Classroom %s found.", classroom.id),
                mock.call("No recording found."),
            ]
        )
        self.assertEqual(ClassroomRecording.objects.count(), 0)
        self.assertEqual(classroom.recordings.count(), 0)

    @responses.activate
    @mock.patch.object(Logger, "info")
    def test_update_recordings_new_recording(self, logger_mock):
        """Command should call get_meetings when a classroom exists.
        Found recording is saved if not already exists."""
        classroom = ClassroomFactory(meeting_id="7e1c8b28-cd7a-4abe-93b2-3121366cb049")
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
                        <meetingID>7e1c8b28-cd7a-4abe-93b2-3121366cb049</meetingID>
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

        call_command("refresh_bbb_recordings")

        logger_mock.assert_has_calls(
            [
                mock.call("Classroom %s found.", classroom.id),
                mock.call(
                    "Recording %s found.",
                    "c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493",
                ),
                mock.call(
                    "%s recording started at %s with url %s",
                    "Created",
                    "2023-01-09T16:44:54+00:00",
                    "https://10.7.7.1/presentation/"
                    "c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493/"
                    "meeting.mp4",
                ),
            ]
        )
        self.assertEqual(ClassroomRecording.objects.count(), 1)
        self.assertEqual(classroom.recordings.count(), 1)
        recording = classroom.recordings.get(
            record_id="c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493"
        )
        self.assertEqual(
            recording.video_file_url,
            "https://10.7.7.1/presentation/"
            "c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493/meeting.mp4",
        )

    @responses.activate
    @mock.patch.object(Logger, "info")
    def test_update_recordings_deleted_recording(self, logger_mock):
        """When an existing recording is not found anymore, it should be deleted."""
        classroom = ClassroomFactory(meeting_id="7e1c8b28-cd7a-4abe-93b2-3121366cb049")
        classroom_recording = ClassroomRecordingFactory(
            classroom=classroom,
            record_id="d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234",
            video_file_url="https://example.com/video.mp4",
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
                <recordings> </recordings>
                <messageKey>noRecordings</messageKey>
                <message>There are not recordings for the meetings</message>
            </response>
            """,
            status=200,
        )

        call_command("refresh_bbb_recordings")

        logger_mock.assert_has_calls(
            [
                mock.call("Classroom %s found.", classroom.id),
                mock.call("No recording found."),
                mock.call(
                    "Recording %s not anymore available.",
                    "d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234",
                ),
                mock.call(
                    "Deleting recording %s.",
                    "d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234",
                ),
            ]
        )

        self.assertEqual(ClassroomRecording.objects.count(), 0)
        self.assertEqual(classroom.recordings.count(), 0)
        classroom_recording.refresh_from_db()
        self.assertIsNotNone(classroom_recording.deleted)

    @responses.activate
    @mock.patch.object(Logger, "info")
    def test_update_recordings_update_recording(self, logger_mock):
        """When an existing recording is found, it should be updated."""
        classroom = ClassroomFactory(meeting_id="7e1c8b28-cd7a-4abe-93b2-3121366cb049")
        classroom_recording = ClassroomRecordingFactory(
            classroom=classroom,
            record_id="d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234",
            video_file_url="https://example.com/video.mp4",
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
                        <meetingID>7e1c8b28-cd7a-4abe-93b2-3121366cb049</meetingID>
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
                                    https://10.7.7.1/playback/presentation/2.3/d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234
                                </url>
                                <length>0</length>
                            </format>
                            <format>
                                <type>video</type>
                                <url>
                                    https://10.7.7.1/presentation/d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234/meeting.mp4
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
                        <recordID>d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234</recordID>
                        <meetingID>7e1c8b28-cd7a-4abe-93b2-3121366cb049</meetingID>
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
                                    https://10.7.7.1/playback/presentation/2.3/d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234
                                </url>
                                <length>0</length>
                            </format>
                            <format>
                                <type>video</type>
                                <url>
                                    https://10.7.7.1/presentation/d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234/meeting.mp4
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

        call_command("refresh_bbb_recordings")

        logger_mock.assert_has_calls(
            [
                mock.call("Classroom %s found.", classroom.id),
                mock.call(
                    "Recording %s found.",
                    "d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234",
                ),
                mock.call(
                    "%s recording started at %s with url %s",
                    "Updated",
                    "2023-01-09T16:44:54+00:00",
                    "https://10.7.7.1/presentation/"
                    "d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234/"
                    "meeting.mp4",
                ),
            ]
        )

        self.assertEqual(ClassroomRecording.objects.count(), 1)
        self.assertEqual(classroom.recordings.count(), 1)
        classroom_recording.refresh_from_db()
        self.assertEqual(
            classroom_recording.video_file_url,
            "https://10.7.7.1/presentation/"
            "d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234/meeting.mp4",
        )

    @responses.activate
    @mock.patch.object(Logger, "info")
    def test_update_recordings_classroom_parameter(self, logger_mock):
        """Command should accept classroom parameter.
        Only recordings for this classroom should be updated."""
        ClassroomFactory(id="7e1c8b28-cd7a-4abe-93b2-3121366cb049")

        call_command(
            "refresh_bbb_recordings",
            classroom_id="0fabc045-6b9b-4914-bfbd-8b90c9eee9fc",
        )

        logger_mock.assert_has_calls(
            [
                mock.call("No classroom found."),
            ]
        )
        self.assertEqual(ClassroomRecording.objects.count(), 0)

    @responses.activate
    @mock.patch.object(Logger, "info")
    def test_update_recordings_recording_parameter(self, logger_mock):
        """Command should accept recording parameter.
        Only this recording should be updated."""
        classroom = ClassroomFactory(meeting_id="7e1c8b28-cd7a-4abe-93b2-3121366cb049")
        classroom_recording = ClassroomRecordingFactory(
            id="0fabc045-6b9b-4914-bfbd-8b90c9eee9fc",
            record_id="d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234",
            classroom=classroom,
            video_file_url="https://example.com/video.mp4",
        )

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/getRecordings",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "recordID": "d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234",
                        "checksum": "6bae8c87cb4f84d79cc5ff03e916512e3ad47c9b",
                    }
                )
            ],
            body="""
            <response>
                <returncode>SUCCESS</returncode>
                <recordings>
                    <recording>
                        <recordID>d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234</recordID>
                        <meetingID>7e1c8b28-cd7a-4abe-93b2-3121366cb049</meetingID>
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
                                    https://10.7.7.1/playback/presentation/2.3/d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234
                                </url>
                                <length>0</length>
                            </format>
                            <format>
                                <type>video</type>
                                <url>
                                    https://10.7.7.1/presentation/d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234/meeting.mp4
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

        call_command(
            "refresh_bbb_recordings",
            recording_id=classroom_recording.id,
        )

        logger_mock.assert_has_calls(
            [
                mock.call(
                    "Recording %s found.",
                    "d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234",
                ),
                mock.call(
                    "%s recording started at %s with url %s",
                    "Updated",
                    "2023-01-09T16:44:54+00:00",
                    "https://10.7.7.1/presentation/"
                    "d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234/"
                    "meeting.mp4",
                ),
            ]
        )

        self.assertEqual(ClassroomRecording.objects.count(), 1)
        self.assertEqual(classroom.recordings.count(), 1)
        classroom_recording.refresh_from_db()
        self.assertEqual(
            classroom_recording.video_file_url,
            "https://10.7.7.1/presentation/"
            "d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234/meeting.mp4",
        )

    @responses.activate
    @mock.patch.object(Logger, "info")
    def test_update_recordings_before_parameter(self, logger_mock):
        """Command should accept before parameter.
        Only this recording should be updated."""
        classroom = ClassroomFactory(meeting_id="7e1c8b28-cd7a-4abe-93b2-3121366cb049")
        classroom_recording = ClassroomRecordingFactory(
            id="0fabc045-6b9b-4914-bfbd-8b90c9eee9fc",
            record_id="d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234",
            classroom=classroom,
            video_file_url="https://example.com/video.mp4",
            started_at="2023-01-09",
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
                        <meetingID>7e1c8b28-cd7a-4abe-93b2-3121366cb049</meetingID>
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
                                    https://10.7.7.1/playback/presentation/2.3/d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234
                                </url>
                                <length>0</length>
                            </format>
                            <format>
                                <type>video</type>
                                <url>
                                    https://10.7.7.1/presentation/d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234/meeting.mp4
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
                        <recordID>d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234</recordID>
                        <meetingID>7e1c8b28-cd7a-4abe-93b2-3121366cb049</meetingID>
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
                                    https://10.7.7.1/playback/presentation/2.3/d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234
                                </url>
                                <length>0</length>
                            </format>
                            <format>
                                <type>video</type>
                                <url>
                                    https://10.7.7.1/presentation/d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234/meeting.mp4
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

        call_command(
            "refresh_bbb_recordings",
            before="2023-01-08",
        )

        logger_mock.assert_has_calls(
            [
                mock.call("Classroom %s found.", classroom.id),
            ]
        )
        self.assertNotIn(
            mock.call("Recording %s found.", classroom_recording.id),
            logger_mock.call_args_list,
        )

        self.assertEqual(ClassroomRecording.objects.count(), 1)
        self.assertEqual(classroom.recordings.count(), 1)
        classroom_recording.refresh_from_db()
        self.assertEqual(
            classroom_recording.video_file_url,
            "https://example.com/video.mp4",
        )

    @responses.activate
    @mock.patch.object(Logger, "info")
    def test_update_recordings_after_parameter(self, logger_mock):
        """Command should accept after parameter.
        Only this recording should be updated."""
        classroom = ClassroomFactory(meeting_id="7e1c8b28-cd7a-4abe-93b2-3121366cb049")
        classroom_recording = ClassroomRecordingFactory(
            id="0fabc045-6b9b-4914-bfbd-8b90c9eee9fc",
            record_id="d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234",
            classroom=classroom,
            video_file_url="https://example.com/video.mp4",
            started_at="2023-01-09",
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
                        <meetingID>7e1c8b28-cd7a-4abe-93b2-3121366cb049</meetingID>
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
                                    https://10.7.7.1/playback/presentation/2.3/d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234
                                </url>
                                <length>0</length>
                            </format>
                            <format>
                                <type>video</type>
                                <url>
                                    https://10.7.7.1/presentation/d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234/meeting.mp4
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
                        <recordID>d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234</recordID>
                        <meetingID>7e1c8b28-cd7a-4abe-93b2-3121366cb049</meetingID>
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
                                    https://10.7.7.1/playback/presentation/2.3/d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234
                                </url>
                                <length>0</length>
                            </format>
                            <format>
                                <type>video</type>
                                <url>
                                    https://10.7.7.1/presentation/d58d38e9e31b71a04b993c041d7ca74ef8d5f0dd-1673007560234/meeting.mp4
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

        call_command(
            "refresh_bbb_recordings",
            after="2023-01-10",
        )

        logger_mock.assert_has_calls(
            [
                mock.call("Classroom %s found.", classroom.id),
            ]
        )
        self.assertNotIn(
            mock.call("Recording %s found.", classroom_recording.id),
            logger_mock.call_args_list,
        )

        self.assertEqual(ClassroomRecording.objects.count(), 1)
        self.assertEqual(classroom.recordings.count(), 1)
        classroom_recording.refresh_from_db()
        self.assertEqual(
            classroom_recording.video_file_url,
            "https://example.com/video.mp4",
        )
