"""Factories for the ``bbb`` app of the Marsha project."""

import factory
from factory.django import DjangoModelFactory

from marsha.core.factories import PlaylistFactory

from . import models


# usage of format function here is wanted in this file
# pylint: disable=consider-using-f-string


class MeetingFactory(DjangoModelFactory):
    """Factory for the Meeting model."""

    class Meta:  # noqa
        model = models.Meeting

    lti_id = factory.Faker("uuid4")
    title = factory.Sequence("Meeting {:03d}".format)
    description = factory.Faker("paragraph")
    playlist = factory.SubFactory(PlaylistFactory)
    meeting_id = factory.Faker("uuid4")
    attendee_password = factory.Faker("word")
    moderator_password = factory.Faker("word")
