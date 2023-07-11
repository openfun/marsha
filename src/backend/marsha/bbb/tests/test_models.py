"""Tests for the models in the ``bbb`` app of the Marsha project."""


from django.db import transaction
from django.db.utils import IntegrityError
from django.test import TestCase

from safedelete.models import SOFT_DELETE_CASCADE

from ..factories import ClassroomFactory, ClassroomRecordingFactory


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
