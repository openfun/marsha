"""Tests for the models in the ``bbb`` app of the Marsha project."""


from django.db import transaction
from django.db.utils import IntegrityError
from django.test import TestCase

from safedelete.models import SOFT_DELETE_CASCADE

from ..factories import MeetingFactory


class MeetingModelsTestCase(TestCase):
    """Test our intentions about the Meeting model."""

    maxDiff = None

    def test_models_meeting_str(self):
        """The str method should display the meeting title and its eventual soft deletion."""
        meeting = MeetingFactory(title="ça joue")
        self.assertEqual(str(meeting), "ça joue")

        meeting.delete()
        self.assertEqual(str(meeting), "ça joue [deleted]")

    def test_models_meeting_fields_lti_id_unique(self):
        """Meetings should be unique for a given duo lti_id/playlist (see LTI specification)."""
        meeting = MeetingFactory()

        # A meeting with a different lti_id and the same playlist can still be created
        MeetingFactory(playlist=meeting.playlist)

        # A meeting for a different playlist and the same lti_id can still be created
        MeetingFactory(lti_id=meeting.lti_id)

        # Trying to create a meeting with the same duo lti_id/playlist should raise a
        # database error
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                MeetingFactory(lti_id=meeting.lti_id, playlist=meeting.playlist)

        # Soft deleted meetings should not count for unicity
        meeting.delete(force_policy=SOFT_DELETE_CASCADE)
        MeetingFactory(lti_id=meeting.lti_id, playlist=meeting.playlist)
