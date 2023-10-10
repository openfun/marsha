"""Tests for the models in the ``bbb`` app of the Marsha project."""


from django.db import transaction
from django.db.utils import IntegrityError
from django.test import TestCase

from safedelete.models import SOFT_DELETE_CASCADE

from ..factories import (
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
        classroom_session = ClassroomFactory().sessions.create(
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
