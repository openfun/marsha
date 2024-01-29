"""Tests for the video_participants service in the ``core`` app of the Marsha project."""

from django.test import TestCase

from marsha.core.defaults import DENIED
from marsha.core.factories import VideoFactory
from marsha.core.services.video_participants import (
    VideoParticipantsException,
    add_participant_asking_to_join,
    move_participant_to_discussion,
    remove_participant_asking_to_join,
    remove_participant_from_discussion,
)


class VideoParticipantsServicesTestCase(TestCase):
    """Test about video live participants."""

    def test_services_video_participants_add_participant_asking_to_join(self):
        """An asking participant should be added."""
        participant = {
            "id": "1",
            "name": "Instructor",
        }
        video = VideoFactory(
            participants_asking_to_join=[],
            participants_in_discussion=[],
        )

        add_participant_asking_to_join(video, participant)

        self.assertEqual(video.participants_asking_to_join, [participant])
        self.assertEqual(video.participants_in_discussion, [])

    def test_services_video_participants_add_participant_asking_to_join_existing_asking(
        self,
    ):
        """An asking participant should be added.

        Existing asking participant should be conserved.
        """
        participant = {
            "id": "1",
            "name": "Instructor",
        }
        existing_ask_participant = {
            "id": "2",
            "name": "Student",
        }
        video = VideoFactory(
            participants_asking_to_join=[existing_ask_participant],
            participants_in_discussion=[],
        )

        add_participant_asking_to_join(video, participant)

        self.assertEqual(
            video.participants_asking_to_join, [existing_ask_participant, participant]
        )
        self.assertEqual(video.participants_in_discussion, [])

    def test_services_video_participants_add_participant_asking_to_join_matching_asking(
        self,
    ):
        """An asking participant should be added if already present."""
        participant = {
            "id": "1",
            "name": "Instructor",
        }
        video = VideoFactory(
            participants_asking_to_join=[participant],
            participants_in_discussion=[],
        )

        with self.assertRaises(VideoParticipantsException) as context:
            add_participant_asking_to_join(video, participant)

        self.assertEqual(str(context.exception), "Participant already asked to join.")

        self.assertEqual(video.participants_asking_to_join, [participant])
        self.assertEqual(video.participants_in_discussion, [])

    def test_services_video_participants_add_participant_asking_to_join_existing_joined(
        self,
    ):
        """An asking participant should be added.

        Existing joined participant should be conserved.
        """
        participant = {
            "id": "1",
            "name": "Instructor",
        }
        existing_joined_participant = {
            "id": "2",
            "name": "Student",
        }
        video = VideoFactory(
            participants_asking_to_join=[],
            participants_in_discussion=[existing_joined_participant],
        )

        add_participant_asking_to_join(video, participant)

        self.assertEqual(video.participants_asking_to_join, [participant])
        self.assertEqual(
            video.participants_in_discussion, [existing_joined_participant]
        )

    def test_services_video_participants_add_participant_asking_to_join_matching_joined(
        self,
    ):
        """An asking participant should be added if already present."""
        participant = {
            "id": "1",
            "name": "Instructor",
        }
        video = VideoFactory(
            participants_asking_to_join=[],
            participants_in_discussion=[participant],
        )

        with self.assertRaises(VideoParticipantsException) as context:
            add_participant_asking_to_join(video, participant)

        self.assertEqual(str(context.exception), "Participant already joined.")

        self.assertEqual(video.participants_asking_to_join, [])
        self.assertEqual(video.participants_in_discussion, [participant])

    def test_services_video_participants_add_participant_join_mode_denied(self):
        """An asking participant should not be added if join mode is denied."""
        participant = {
            "id": "1",
            "name": "Instructor",
        }
        video = VideoFactory(
            join_mode=DENIED,
            participants_asking_to_join=[],
            participants_in_discussion=[],
        )

        with self.assertRaises(VideoParticipantsException) as context:
            add_participant_asking_to_join(video, participant)

        self.assertEqual(str(context.exception), "No join allowed.")

        self.assertEqual(video.participants_asking_to_join, [])
        self.assertEqual(video.participants_in_discussion, [])

    def test_services_video_participants_remove_participant_asking_to_join(self):
        """An asking participant should be removed."""
        participant = {
            "id": "1",
            "name": "Instructor",
        }
        video = VideoFactory(
            participants_asking_to_join=[participant],
            participants_in_discussion=[],
        )

        remove_participant_asking_to_join(video, participant)

        self.assertEqual(video.participants_asking_to_join, [])
        self.assertEqual(video.participants_in_discussion, [])

    def test_services_video_participants_remove_participant_asking_to_join_unexisting(
        self,
    ):
        """VideoParticipantsException raised if no matching participant found."""
        participant = {
            "id": "1",
            "name": "Instructor",
        }
        video = VideoFactory(
            participants_asking_to_join=[],
            participants_in_discussion=[],
        )

        with self.assertRaises(VideoParticipantsException) as context:
            remove_participant_asking_to_join(video, participant)

        self.assertEqual(str(context.exception), "Participant did not asked to join.")

        self.assertEqual(video.participants_asking_to_join, [])
        self.assertEqual(video.participants_in_discussion, [])

    def test_services_video_participants_move_participant_to_discussion(self):
        """An existing participant asking to join should be moved to discussion."""
        participant = {
            "id": "1",
            "name": "Instructor",
        }
        video = VideoFactory(
            participants_asking_to_join=[participant],
            participants_in_discussion=[],
        )

        move_participant_to_discussion(video, participant)

        self.assertEqual(video.participants_asking_to_join, [])
        self.assertEqual(video.participants_in_discussion, [participant])

    def test_services_video_participants_move_participant_to_discussion_non_existing_asking(
        self,
    ):
        """An existing participant asking to join should be moved to discussion."""
        participant = {
            "id": "1",
            "name": "Instructor",
        }
        video = VideoFactory(
            participants_asking_to_join=[],
            participants_in_discussion=[],
        )

        with self.assertRaises(VideoParticipantsException) as context:
            move_participant_to_discussion(video, participant)

        self.assertEqual(str(context.exception), "Participant did not asked to join.")

        self.assertEqual(video.participants_asking_to_join, [])
        self.assertEqual(video.participants_in_discussion, [])

    def test_services_video_participants_move_participant_to_discussion_join_mode_denied(
        self,
    ):
        """An existing participant asking to join should not be moved to discussion
        if join mode is denied."""
        participant = {
            "id": "1",
            "name": "Instructor",
        }
        video = VideoFactory(
            join_mode=DENIED,
            participants_asking_to_join=[participant],
            participants_in_discussion=[],
        )

        with self.assertRaises(VideoParticipantsException) as context:
            move_participant_to_discussion(video, participant)

        self.assertEqual(str(context.exception), "No join allowed.")

        self.assertEqual(video.participants_asking_to_join, [participant])
        self.assertEqual(video.participants_in_discussion, [])

    def test_services_video_participants_remove_participant_from_discussion(self):
        """An asking participant should be removed."""
        participant = {
            "id": "1",
            "name": "Instructor",
        }
        video = VideoFactory(
            participants_asking_to_join=[],
            participants_in_discussion=[participant],
        )

        remove_participant_from_discussion(video, participant)

        self.assertEqual(video.participants_asking_to_join, [])
        self.assertEqual(video.participants_in_discussion, [])

    def test_services_video_participants_remove_participant_from_discussion_unexisting(
        self,
    ):
        """VideoParticipantsException raised if no matching participant found."""
        participant = {
            "id": "1",
            "name": "Instructor",
        }
        video = VideoFactory(
            participants_asking_to_join=[],
            participants_in_discussion=[],
        )

        with self.assertRaises(VideoParticipantsException) as context:
            remove_participant_from_discussion(video, participant)

        self.assertEqual(str(context.exception), "Participant not in discussion.")

        self.assertEqual(video.participants_asking_to_join, [])
        self.assertEqual(video.participants_in_discussion, [])
