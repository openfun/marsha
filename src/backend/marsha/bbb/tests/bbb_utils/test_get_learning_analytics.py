"""Tests for the get_learning_analytics service in the ``bbb`` app of the Marsha project."""

import json

from django.test import TestCase, override_settings

import responses

from marsha.bbb.factories import ClassroomSessionFactory
from marsha.bbb.utils.bbb_utils import get_learning_analytics


@override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
@override_settings(BBB_API_SECRET="SuperSecret")
class ClassroomServiceGetLearningAnalyticsTestCase(TestCase):
    """Test our intentions about the Classroom get_learning_analytics service."""

    maxDiff = None

    @responses.activate
    def test_get_learning_analytics(self):
        """If the session has cookie and bbb_learning_analytics_url,
        just call the url and store the response."""
        session = ClassroomSessionFactory()

        responses.add(
            responses.GET,
            session.bbb_learning_analytics_url,
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

        learning_analytics = get_learning_analytics(session)
        session.learning_analytics = learning_analytics
        session.save()

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

    def test_get_learning_analytics_wrong_cookie(self):
        """If the session has an invalid json cookie, return None."""
        session = ClassroomSessionFactory(
            cookie="wrong_cookie",
        )

        self.assertIsNone(get_learning_analytics(session))

    def test_get_learning_analytics_wrong_bbb_learning_analytics_url(self):
        """If the session has an invalid bbb_learning_analytics_url, return None."""
        session = ClassroomSessionFactory(
            bbb_learning_analytics_url="wrong_bbb_learning_analytics_url",
        )

        self.assertIsNone(get_learning_analytics(session))

    @responses.activate
    def test_get_learning_analytics_error(self):
        """If the server returns an error, return None."""
        session = ClassroomSessionFactory()

        responses.add(
            responses.GET,
            session.bbb_learning_analytics_url,
            body=json.dumps({"error": {"key": "notFound"}}),
            status=500,
        )

        self.assertIsNone(get_learning_analytics(session))

    @responses.activate
    def test_get_learning_analytics_not_found(self):
        """If the server returns an error, return None."""
        session = ClassroomSessionFactory()

        responses.add(
            responses.GET,
            session.bbb_learning_analytics_url,
            body=json.dumps(
                {"response": {"returncode": "FAILED", "message": "Meeting not found"}}
            ),
            status=200,
        )

        self.assertIsNone(get_learning_analytics(session))

    @responses.activate
    def test_get_learning_analytics_error_no_json(self):
        """If the server returns a non json response, return None."""
        session = ClassroomSessionFactory()

        responses.add(
            responses.GET,
            session.bbb_learning_analytics_url,
            body="something wrong",
            status=200,
        )

        self.assertIsNone(get_learning_analytics(session))
