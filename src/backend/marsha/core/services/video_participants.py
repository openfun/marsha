"""Services for video live participants."""

from marsha.core.defaults import DENIED


class VideoParticipantsException(Exception):
    """Exception class for video participants."""


def add_participant_asking_to_join(video, participant):
    """Add a participant asking to join a video."""
    if video.join_mode == DENIED:
        raise VideoParticipantsException("No join allowed.")

    if participant in video.participants_asking_to_join:
        raise VideoParticipantsException("Participant already asked to join.")

    if participant in video.participants_in_discussion:
        raise VideoParticipantsException("Participant already joined.")

    video.participants_asking_to_join.append(participant)
    video.save()


def remove_participant_asking_to_join(video, participant):
    """Removes a participant asking to join a video."""
    if participant not in video.participants_asking_to_join:
        raise VideoParticipantsException("Participant did not asked to join.")

    video.participants_asking_to_join.remove(participant)
    video.save()


def move_participant_to_discussion(video, participant):
    """Move a participant to the discussion."""
    if video.join_mode == DENIED:
        raise VideoParticipantsException("No join allowed.")

    if participant not in video.participants_asking_to_join:
        raise VideoParticipantsException("Participant did not asked to join.")

    video.participants_asking_to_join.remove(participant)
    video.participants_in_discussion.append(participant)
    video.save()


def remove_participant_from_discussion(video, participant):
    """Remove a participant from the discussion."""
    if participant not in video.participants_in_discussion:
        raise VideoParticipantsException("Participant not in discussion.")

    video.participants_in_discussion.remove(participant)
    video.save()
