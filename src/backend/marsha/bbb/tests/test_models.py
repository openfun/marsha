"""Tests for the models in the ``bbb`` app of the Marsha project."""

import json

from django.db import transaction
from django.db.utils import IntegrityError
from django.test import TestCase

from safedelete.models import SOFT_DELETE_CASCADE

from marsha.bbb.factories import (
    ClassroomFactory,
    ClassroomRecordingFactory,
    ClassroomSessionFactory,
)


class ClassroomModelsTestCase(TestCase):
    """Test our intentions about the Classroom model."""

    maxDiff = None

    def test_models_classroom_str(self):
        """The str method should display the classroom title and its eventual soft deletion."""
        classroom = ClassroomFactory(title="ça joue")
        self.assertEqual(str(classroom), "ça joue")

        classroom.delete()
        self.assertEqual(str(classroom), "ça joue [deleted]")

    def test_models_classroom_fields_lti_id_unique(self):
        """Classrooms should be unique for a given duo lti_id/playlist (see LTI specification)."""
        classroom = ClassroomFactory()

        # A classroom with a different lti_id and the same playlist can still be created
        ClassroomFactory(playlist=classroom.playlist)

        # A classroom for a different playlist and the same lti_id can still be created
        ClassroomFactory(lti_id=classroom.lti_id)

        # Trying to create a classroom with the same duo lti_id/playlist should raise a
        # database error
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                ClassroomFactory(lti_id=classroom.lti_id, playlist=classroom.playlist)

        # Soft deleted classrooms should not count for unicity
        classroom.delete(force_policy=SOFT_DELETE_CASCADE)
        ClassroomFactory(lti_id=classroom.lti_id, playlist=classroom.playlist)


class ClassroomClassroomRecordingTestCase(TestCase):
    """Test the ClassroomRecording model."""

    maxDiff = None

    def test_models_classroomrecording_video_file_url(self):
        """The video_file_url method should return the video file url."""
        classroom_recording = ClassroomRecordingFactory()
        with self.assertRaises(DeprecationWarning) as deprecation:
            # pylint: disable=pointless-statement
            classroom_recording.video_file_url

        self.assertEqual(
            deprecation.exception.args[0],
            "Access denied to video_file_url: deprecated field",
        )


class ClassroomSessionTestCase(TestCase):
    """Test the ClassroomSession model."""

    maxDiff = None

    def test_models_classroomsession_str(self):
        """The str method should display the classroom session start."""
        classroom_session = ClassroomSessionFactory(
            started_at="2021-10-29T13:42:27Z",
            ended_at=None,
        )
        self.assertEqual(str(classroom_session), "2021-10-29 13:42:27+00:00 (pending)")

        classroom_session.ended_at = "2021-10-29T15:34:28Z"
        classroom_session.save()
        self.assertEqual(str(classroom_session), "2021-10-29 13:42:27+00:00 (1:52:01)")

    def test_models_classroomsession_fields_unique(self):
        """Classroom sessions should be unique for a given classroom and start."""
        classroom_session = ClassroomSessionFactory(
            ended_at=None,
        )

        # Trying to create a classroom session for the same classroom and no end date
        # should raise a database error
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                ClassroomSessionFactory(
                    classroom=classroom_session.classroom,
                    ended_at=None,
                )

        # A classroom session for a different classroom can still be created
        ClassroomSessionFactory(
            ended_at=None,
        )

    def test_models_classroomsession_property_attendees(self):
        """The attendees property should return the number of attendees."""
        classroom_session = ClassroomSessionFactory(
            learning_analytics=json.dumps(
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
            )
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
