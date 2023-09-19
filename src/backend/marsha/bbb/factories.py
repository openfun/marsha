"""Factories for the ``bbb`` app of the Marsha project."""
from datetime import timezone

import factory
from factory.django import DjangoModelFactory

from marsha.core.factories import PlaylistFactory

from . import models


# usage of format function here is wanted in this file
# pylint: disable=consider-using-f-string


class ClassroomFactory(DjangoModelFactory):
    """Factory for the Classroom model."""

    class Meta:  # noqa
        model = models.Classroom

    lti_id = factory.Faker("uuid4")
    title = factory.Sequence("Classroom {:03d}".format)
    description = factory.Faker("paragraph")
    playlist = factory.SubFactory(PlaylistFactory)
    meeting_id = factory.Faker("uuid4")
    recording_purpose = factory.Faker("paragraph")


class ClassroomDocumentFactory(DjangoModelFactory):
    """Factory for the ClassroomDocument model."""

    class Meta:
        model = models.ClassroomDocument

    classroom = factory.SubFactory(ClassroomFactory)
    filename = factory.Faker("file_name")


class ClassroomRecordingFactory(DjangoModelFactory):
    """Factory for the ClassroomRecording model."""

    class Meta:
        model = models.ClassroomRecording

    classroom = factory.SubFactory(ClassroomFactory)
    record_id = factory.Faker("uuid4")
    started_at = factory.Faker("date_time", tzinfo=timezone.utc)
