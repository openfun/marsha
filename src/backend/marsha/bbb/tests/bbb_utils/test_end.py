"""Tests for the end service in the ``bbb`` app of the Marsha project."""
from datetime import datetime, timezone
import json
from unittest import mock

from django.test import TestCase, override_settings

import responses

from marsha.bbb.factories import ClassroomFactory, ClassroomSessionFactory
from marsha.bbb.utils.bbb_utils import ApiMeetingException, end


@override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
@override_settings(BBB_API_SECRET="SuperSecret")
class ClassroomServiceTestCase(TestCase):
    """Test our intentions about the Classroom end service."""

    maxDiff = None

    @responses.activate
    def test_bbb_end_moderator(self):
        """End a meeting in current classroom related server."""
        now = datetime(2021, 10, 29, 13, 42, 27, tzinfo=timezone.utc)
        classroom = ClassroomFactory(
            meeting_id="21e6634f-ab6f-4c77-a665-4229c61b479a",
            title="Classroom 1",
        )
        # a classroom session has started
        session = ClassroomSessionFactory(
            classroom=classroom,
            started_at=now,
            ended_at=None,
            cookie=json.dumps({"SESSION_ID": "123"}),
            bbb_learning_analytics_url="https://bbb.learning-analytics.info",
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
        responses.add(
            responses.GET,
            "https://bbb.learning-analytics.info",
            body=json.dumps(
                {
                    "response": {
                        "data": json.dumps(
                            {
                                "intId": "0cbb2ac668bb4ac05bf7db4a440aee6de8cd0066-1697111611289",
                                "extId": "86c5bb46-ace5-4362-9a0d-6dbdde9e745f",
                                "name": "Classroom webhook",
                                "users": {
                                    "8ade4720": {
                                        "userKey": "8ade4720",
                                        "extId": "5bc189df9500bfbc70418b399ad5745b",
                                        "intIds": {
                                            "w_xzkbsh7stiq8": {
                                                "intId": "w_xzkbsh7stiq8",
                                                "registeredOn": 1697111634434,
                                                "leftOn": 0,
                                                "userLeftFlag": False,
                                            }
                                        },
                                        "name": "Instructor",
                                        "isModerator": True,
                                        "isDialIn": False,
                                        "currentIntId": "w_xzkbsh7stiq8",
                                        "answers": {},
                                        "talk": {
                                            "totalTime": 0,
                                            "lastTalkStartedOn": 0,
                                        },
                                        "emojis": [],
                                        "webcams": [],
                                        "totalOfMessages": 0,
                                    },
                                    "6af84fe6": {
                                        "userKey": "6af84fe6",
                                        "extId": "dd02eb66ff1f7088facb52c102473230",
                                        "intIds": {
                                            "w_ecvwvvvhwhum": {
                                                "intId": "w_ecvwvvvhwhum",
                                                "registeredOn": 1697111639229,
                                                "leftOn": 1697111696308,
                                                "userLeftFlag": True,
                                            },
                                            "w_j5dism2ei19x": {
                                                "intId": "w_j5dism2ei19x",
                                                "registeredOn": 1697111692850,
                                                "leftOn": 0,
                                                "userLeftFlag": False,
                                            },
                                        },
                                        "name": "Student 2",
                                        "isModerator": False,
                                        "isDialIn": False,
                                        "currentIntId": "w_j5dism2ei19x",
                                        "answers": {},
                                        "talk": {
                                            "totalTime": 0,
                                            "lastTalkStartedOn": 0,
                                        },
                                        "emojis": [],
                                        "webcams": [],
                                        "totalOfMessages": 0,
                                    },
                                    "869e1c1e": {
                                        "userKey": "869e1c1e",
                                        "extId": "a39b0fa4be7c54821d0409d1ccb44099",
                                        "intIds": {
                                            "w_bgguwo64n4ib": {
                                                "intId": "w_bgguwo64n4ib",
                                                "registeredOn": 1697111642068,
                                                "leftOn": 0,
                                                "userLeftFlag": False,
                                            }
                                        },
                                        "name": "Student 1",
                                        "isModerator": False,
                                        "isDialIn": False,
                                        "currentIntId": "w_bgguwo64n4ib",
                                        "answers": {},
                                        "talk": {
                                            "totalTime": 0,
                                            "lastTalkStartedOn": 0,
                                        },
                                        "emojis": [],
                                        "webcams": [],
                                        "totalOfMessages": 0,
                                    },
                                },
                                "polls": {},
                                "screenshares": [],
                                "presentationSlides": [
                                    {
                                        "presentationId": "31f33b5e",
                                        "pageNum": 1,
                                        "setOn": 1697111617283,
                                        "presentationName": "default.pdf",
                                    }
                                ],
                                "createdOn": 1697111611293,
                                "endedOn": 0,
                            }
                        ),
                    },
                }
            ),
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
        with mock.patch(
            "marsha.bbb.utils.bbb_utils.now",
            return_value=now,
        ):
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
        session.refresh_from_db()
        self.assertEqual(session.ended_at, now)
        self.assertEqual(
            session.learning_analytics,
            json.dumps(
                {
                    "intId": "0cbb2ac668bb4ac05bf7db4a440aee6de8cd0066-1697111611289",
                    "extId": "86c5bb46-ace5-4362-9a0d-6dbdde9e745f",
                    "name": "Classroom webhook",
                    "users": {
                        "8ade4720": {
                            "userKey": "8ade4720",
                            "extId": "5bc189df9500bfbc70418b399ad5745b",
                            "intIds": {
                                "w_xzkbsh7stiq8": {
                                    "intId": "w_xzkbsh7stiq8",
                                    "registeredOn": 1697111634434,
                                    "leftOn": 0,
                                    "userLeftFlag": False,
                                }
                            },
                            "name": "Instructor",
                            "isModerator": True,
                            "isDialIn": False,
                            "currentIntId": "w_xzkbsh7stiq8",
                            "answers": {},
                            "talk": {"totalTime": 0, "lastTalkStartedOn": 0},
                            "emojis": [],
                            "webcams": [],
                            "totalOfMessages": 0,
                        },
                        "6af84fe6": {
                            "userKey": "6af84fe6",
                            "extId": "dd02eb66ff1f7088facb52c102473230",
                            "intIds": {
                                "w_ecvwvvvhwhum": {
                                    "intId": "w_ecvwvvvhwhum",
                                    "registeredOn": 1697111639229,
                                    "leftOn": 1697111696308,
                                    "userLeftFlag": True,
                                },
                                "w_j5dism2ei19x": {
                                    "intId": "w_j5dism2ei19x",
                                    "registeredOn": 1697111692850,
                                    "leftOn": 0,
                                    "userLeftFlag": False,
                                },
                            },
                            "name": "Student 2",
                            "isModerator": False,
                            "isDialIn": False,
                            "currentIntId": "w_j5dism2ei19x",
                            "answers": {},
                            "talk": {"totalTime": 0, "lastTalkStartedOn": 0},
                            "emojis": [],
                            "webcams": [],
                            "totalOfMessages": 0,
                        },
                        "869e1c1e": {
                            "userKey": "869e1c1e",
                            "extId": "a39b0fa4be7c54821d0409d1ccb44099",
                            "intIds": {
                                "w_bgguwo64n4ib": {
                                    "intId": "w_bgguwo64n4ib",
                                    "registeredOn": 1697111642068,
                                    "leftOn": 0,
                                    "userLeftFlag": False,
                                }
                            },
                            "name": "Student 1",
                            "isModerator": False,
                            "isDialIn": False,
                            "currentIntId": "w_bgguwo64n4ib",
                            "answers": {},
                            "talk": {"totalTime": 0, "lastTalkStartedOn": 0},
                            "emojis": [],
                            "webcams": [],
                            "totalOfMessages": 0,
                        },
                    },
                    "polls": {},
                    "screenshares": [],
                    "presentationSlides": [
                        {
                            "presentationId": "31f33b5e",
                            "pageNum": 1,
                            "setOn": 1697111617283,
                            "presentationName": "default.pdf",
                        }
                    ],
                    "createdOn": 1697111611293,
                    "endedOn": 0,
                }
            ),
        )
        self.assertDictEqual(
            session.attendees,
            {
                "6af84fe6": {
                    "fullname": "Student 2",
                    "presence": [
                        {
                            "entered_at": 1697111639229,
                            "left_at": 1697111696308,
                        },
                        {
                            "entered_at": 1697111692850,
                            "left_at": 0,
                        },
                    ],
                },
                "869e1c1e": {
                    "fullname": "Student 1",
                    "presence": [
                        {
                            "entered_at": 1697111642068,
                            "left_at": 0,
                        }
                    ],
                },
            },
        )

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
