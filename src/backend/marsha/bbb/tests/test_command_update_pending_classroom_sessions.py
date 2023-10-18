"""Test the cronjob ``update_pending_classroom_sessions` management command."""
from datetime import datetime, timezone
from io import StringIO
import json
from unittest import mock

from django.core.management import call_command
from django.test import TransactionTestCase, override_settings

import responses

from marsha.bbb.factories import ClassroomSessionFactory


@override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
@override_settings(BBB_API_SECRET="SuperSecret")
@override_settings(BBB_API_CALLBACK_SECRET="OtherSuperSecret")
@override_settings(BBB_ENABLED=True)
class UpdatePendingClassroomSessionsTestCase(TransactionTestCase):
    """Test the ``update_pending_classroom_sessions` management command."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

    maxDiff = None

    @responses.activate
    def test_update_pending_sessions_no_pending(self):
        """Command should do nothing when no session is pending."""
        out = StringIO()
        call_command("update_pending_classroom_sessions", stdout=out)
        self.assertIn("No pending classroom found.", out.getvalue())
        out.close()

    @responses.activate
    def test_update_pending_sessions_pending(self):
        """Command should retrieve learning analytics when a session is pending."""
        classroom_session = ClassroomSessionFactory(
            classroom__started=True,
        )
        other_classroom_session = ClassroomSessionFactory(
            ended_at=datetime(2021, 10, 29, 13, 42, 27, tzinfo=timezone.utc),
            classroom__started=False,
        )

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/getMeetingInfo",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "meetingID": str(classroom_session.classroom.meeting_id),
                    },
                    strict_match=False,
                )
            ],
            body="""
            <response>
                <returncode>SUCCESS</returncode>
                <meetingName>random-6256545</meetingName>
                <meetingID>random-6256545</meetingID>
                <internalMeetingID>ab0da0b4a1f283e94cfefdf32dd761eebd5461ce-1635514947533</internalMeetingID>
                <createTime>1635514947533</createTime>
                <createDate>Fri Oct 29 13:42:27 UTC 2021</createDate>
                <voiceBridge>77581</voiceBridge>
                <dialNumber>613-555-1234</dialNumber>
                <attendeePW>trac</attendeePW>
                <moderatorPW>trusti</moderatorPW>
                <running>true</running>
                <duration>0</duration>
                <hasUserJoined>true</hasUserJoined>
                <recording>false</recording>
                <hasBeenForciblyEnded>false</hasBeenForciblyEnded>
                <startTime>1635514947596</startTime>
                <endTime>0</endTime>
                <participantCount>1</participantCount>
                <listenerCount>0</listenerCount>
                <voiceParticipantCount>0</voiceParticipantCount>
                <videoCount>0</videoCount>
                <maxUsers>0</maxUsers>
                <moderatorCount>0</moderatorCount>
                <attendees>
                    <attendee>
                        <userID>w_2xox6leao03w</userID>
                        <fullName>User 1907834</fullName>
                        <role>MODERATOR</role>
                        <isPresenter>true</isPresenter>
                        <isListeningOnly>false</isListeningOnly>
                        <hasJoinedVoice>false</hasJoinedVoice>
                        <hasVideo>false</hasVideo>
                        <clientType>HTML5</clientType>
                    </attendee>
                    <attendee>
                        <userID>w_bau7cr7aefju</userID>
                        <fullName>User 1907834</fullName>
                        <role>VIEWER</role>
                        <isPresenter>false</isPresenter>
                        <isListeningOnly>false</isListeningOnly>
                        <hasJoinedVoice>false</hasJoinedVoice>
                        <hasVideo>false</hasVideo>
                        <clientType>HTML5</clientType>
                    </attendee>
                </attendees>
                <metadata>
                </metadata>
                <isBreakout>false</isBreakout>
            </response>
           """,
            status=200,
        )

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

        out = StringIO()
        call_command("update_pending_classroom_sessions", stdout=out)

        self.assertIn(
            f"Session for classroom {classroom_session.classroom.title} updated.",
            out.getvalue(),
        )
        self.assertNotIn(
            f"Session for classroom {other_classroom_session.classroom.title} updated.",
            out.getvalue(),
        )
        out.close()

        classroom_session.refresh_from_db()
        self.assertIsNone(classroom_session.ended_at)
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
        self.assertDictEqual(
            classroom_session.classroom.infos,
            {
                "attendeePW": "trac",
                "attendees": [
                    {
                        "clientType": "HTML5",
                        "fullName": "User 1907834",
                        "hasJoinedVoice": "false",
                        "hasVideo": "false",
                        "isListeningOnly": "false",
                        "isPresenter": "true",
                        "role": "MODERATOR",
                        "userID": "w_2xox6leao03w",
                    },
                    {
                        "clientType": "HTML5",
                        "fullName": "User 1907834",
                        "hasJoinedVoice": "false",
                        "hasVideo": "false",
                        "isListeningOnly": "false",
                        "isPresenter": "false",
                        "role": "VIEWER",
                        "userID": "w_bau7cr7aefju",
                    },
                ],
                "createDate": "Fri Oct 29 13:42:27 UTC 2021",
                "createTime": "1635514947533",
                "dialNumber": "613-555-1234",
                "duration": "0",
                "endTime": "0",
                "hasBeenForciblyEnded": "false",
                "hasUserJoined": "true",
                "internalMeetingID": "ab0da0b4a1f283e94cfefdf32dd761eebd5461ce-1635514947533",
                "isBreakout": "false",
                "listenerCount": "0",
                "maxUsers": "0",
                "meetingID": "random-6256545",
                "meetingName": "random-6256545",
                "metadata": None,
                "moderatorCount": "0",
                "moderatorPW": "trusti",
                "participantCount": "1",
                "recording": "false",
                "returncode": "SUCCESS",
                "running": "true",
                "startTime": "1635514947596",
                "videoCount": "0",
                "voiceBridge": "77581",
                "voiceParticipantCount": "0",
            },
        )

    @responses.activate
    def test_update_pending_sessions_ended(self):
        """Command should retrieve learning analytics and end session
        when a meeting is not found."""
        now = datetime(2021, 10, 29, 13, 42, 27, tzinfo=timezone.utc)
        classroom_session = ClassroomSessionFactory(
            classroom__started=True,
        )

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/getMeetingInfo",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "meetingID": str(classroom_session.classroom.meeting_id),
                    },
                    strict_match=False,
                )
            ],
            body="""
                    <response>
                        <returncode>FAILED</returncode>
                        <messageKey>notFound</messageKey>
                        <message>We could not find a meeting with that meeting ID</message>
                    </response>
                    """,
            status=200,
        )

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

        out = StringIO()

        with mock.patch(
            "marsha.bbb.utils.bbb_utils.now",
            return_value=now,
        ):
            call_command("update_pending_classroom_sessions", stdout=out)

        self.assertIn(
            f"Failed to update pending classroom {classroom_session.classroom.title}: "
            "We could not find a meeting with that meeting ID",
            out.getvalue(),
        )
        out.close()

        classroom_session.refresh_from_db()
        self.assertEqual(classroom_session.ended_at, now)
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
        self.assertIsNone(classroom_session.classroom.infos)
