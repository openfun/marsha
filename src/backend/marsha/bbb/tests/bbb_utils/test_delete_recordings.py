"""Tests for the delete recordings service in the ``bbb`` app of the Marsha project."""
from django.test import TestCase, override_settings

import responses

from marsha.bbb.factories import ClassroomRecordingFactory
from marsha.bbb.utils.bbb_utils import ApiMeetingException, delete_recording


@override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
@override_settings(BBB_API_SECRET="SuperSecret")
class ClassroomServiceTestCase(TestCase):
    """Test our intentions about the delete Classroom recordings service."""

    maxDiff = None

    @responses.activate
    def test_bbb_delete_classroom_recording(self):
        """Delete a classroom recording."""
        classroom_recording = ClassroomRecordingFactory(
            record_id="7a567d67-29d3-4547-96f3-035733a4dfaa"
        )

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/deleteRecordings",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "checksum": "9a34c362ccb7725e9e55f5133c8b7a40a97c70f7",
                        "recordID": "7a567d67-29d3-4547-96f3-035733a4dfaa",
                    }
                )
            ],
            body="""
            <response>
                <returncode>SUCCESS</returncode>
                <deleted>true</deleted>
            </response>
            """,
            status=200,
        )

        api_response = delete_recording([classroom_recording])

        self.assertDictEqual(
            {
                "deleted": "true",
                "returncode": "SUCCESS",
            },
            api_response,
        )

    @responses.activate
    def test_bbb_fail_delete_classroom_recording(self):
        """Delete a classroom recording."""
        classroom_recording = ClassroomRecordingFactory(
            record_id="7a567d67-29d3-4547-96f3-035733a4dfaa"
        )

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/deleteRecordings",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "checksum": "9a34c362ccb7725e9e55f5133c8b7a40a97c70f7",
                        "recordID": "7a567d67-29d3-4547-96f3-035733a4dfaa",
                    }
                )
            ],
            body="""
            <response>
                <returncode>FAILED</returncode>
                <message>404 video doesn't exists</message>
            </response>
            """,
            status=200,
        )

        try:
            delete_recording([classroom_recording])
        except ApiMeetingException as exception:
            self.assertEqual("404 video doesn't exists", str(exception))
