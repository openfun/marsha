"""Tests for the update_session_learning_analytics service
in the ``bbb`` app of the Marsha project."""

import json

from django.test import TestCase, override_settings

import responses

from marsha.bbb.factories import ClassroomSessionFactory
from marsha.bbb.utils.bbb_utils import update_session_learning_analytics


@override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
@override_settings(BBB_API_SECRET="SuperSecret")
class ClassroomServiceUpdateSessionLearningAnalyticsTestCase(TestCase):
    """Test our intentions about the Classroom update_session_learning_analytics service."""

    maxDiff = None

    @responses.activate
    def test_update_session_learning_analytics(self):
        """When creating a session, we must call the join url to get the cookie,
        then build the learning analytics url and store them in the session."""
        classroom_session = ClassroomSessionFactory()

        responses.add(
            responses.GET,
            classroom_session.bbb_learning_analytics_url,
            # something is wrong with the matcher
            # match=[
            #     responses.matchers.header_matcher(
            #         {
            #             "Cookie": "foo=bar",
            #         }
            #     )
            # ],
            headers={"Content-Type": "application/json"},
            json={
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
                },
            },
            status=200,
        )

        update_session_learning_analytics(classroom_session.classroom)

        classroom_session.refresh_from_db()
        self.assertEqual(
            classroom_session.learning_analytics,
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
            classroom_session.attendees,
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
