"""Tests for the end service in the ``bbb`` app of the Marsha project."""

from django.test import TestCase, override_settings

import responses

from marsha.bbb.factories import ClassroomFactory
from marsha.bbb.utils.bbb_utils import ApiMeetingException, end


@override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
@override_settings(BBB_API_SECRET="SuperSecret")
class ClassroomServiceTestCase(TestCase):
    """Test our intentions about the Classroom end service."""

    maxDiff = None

    @responses.activate
    def test_bbb_end_moderator(self):
        """End a meeting in current classroom related server."""
        classroom = ClassroomFactory(
            meeting_id="21e6634f-ab6f-4c77-a665-4229c61b479a",
            title="Classroom 1",
        )

        # initial end request
        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/end",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "checksum": "a0759ad31f4361995954347c6aa14dc6e62b7b84",
                        "meetingID": "21e6634f-ab6f-4c77-a665-4229c61b479a",
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

        api_response = end(classroom)
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
        )

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/end",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "checksum": "a0759ad31f4361995954347c6aa14dc6e62b7b84",
                        "meetingID": "21e6634f-ab6f-4c77-a665-4229c61b479a",
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
            end(classroom)
        self.assertEqual(
            str(context.exception),
            "You must supply the moderator password for this call.",
        )
