"""Tests for the start_session service in the ``bbb`` app of the Marsha project."""

from datetime import datetime, timezone
import json
from unittest import mock

from django.test import TestCase, override_settings

import responses

from marsha.bbb.factories import ClassroomFactory
from marsha.bbb.utils.bbb_utils import start_session


@override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
@override_settings(BBB_API_SECRET="SuperSecret")
class ClassroomServiceStartSessionTestCase(TestCase):
    """Test our intentions about the Classroom start_session service."""

    maxDiff = None

    @responses.activate
    def test_start_session(self):
        """When creating a session, we must call the join url to get the cookie,
        then build the learning analytics url and store them in the session."""
        now = datetime(2021, 10, 29, 13, 42, 27, tzinfo=timezone.utc)
        classroom = ClassroomFactory()

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
            start_session(classroom)

        classroom_session = classroom.sessions.get()
        self.assertEqual(classroom_session.started_at, now)
        self.assertIsNone(classroom_session.ended_at)
        self.assertEqual(classroom_session.cookie, json.dumps({"foo": "bar"}))
        self.assertEqual(
            classroom_session.bbb_learning_analytics_url,
            "https://bbb.net/bigbluebutton/api/learningDashboard?sessionToken=123",
        )
