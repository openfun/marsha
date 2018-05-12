"""Factories for the ``core`` app of the Marsha project."""


import factory
from factory.django import DjangoModelFactory

from marsha.core import models


class UserFactory(DjangoModelFactory):
    """Factory for the User model."""

    class Meta:  # noqa
        model = models.User

    is_active = True
    is_staff = False
    is_superuser = False

    username = factory.Sequence(lambda n: "User %03d" % n)


class ConsumerSiteFactory(DjangoModelFactory):
    """Factory for the ConsumerSite model."""

    class Meta:  # noqa
        model = models.ConsumerSite

    name = factory.Sequence(lambda n: "Site %03d" % n)


class SiteAdminFactory(DjangoModelFactory):
    """Factory for the SiteAdmin model."""

    class Meta:  # noqa
        model = models.SiteAdmin


class OrganizationFactory(DjangoModelFactory):
    """Factory for the Organization model."""

    class Meta:  # noqa
        model = models.Organization

    name = factory.Sequence(lambda n: "Org %03d" % n)


class SiteOrganizationFactory(DjangoModelFactory):
    """Factory for the SiteOrganization model."""

    class Meta:  # noqa
        model = models.SiteOrganization


class OrganizationManagerFactory(DjangoModelFactory):
    """Factory for the OrganizationManager model."""

    class Meta:  # noqa
        model = models.OrganizationManager


class AuthoringFactory(DjangoModelFactory):
    """Factory for the Authoring model."""

    class Meta:  # noqa
        model = models.Authoring


class VideoFactory(DjangoModelFactory):
    """Factory for the Video model."""

    class Meta:  # noqa
        model = models.Video

    name = factory.Sequence(lambda n: "Video %03d" % n)
    language = "en"
    duplicated_from = None


class AudioTrackFactory(DjangoModelFactory):
    """Factory for the AudioTrack model."""

    class Meta:  # noqa
        model = models.AudioTrack

    language = "en"


class SubtitleTrackFactory(DjangoModelFactory):
    """Factory for the SubtitleTrack model."""

    class Meta:  # noqa
        model = models.SubtitleTrack

    language = "en"
    has_closed_captioning = False


class SignTrackFactory(DjangoModelFactory):
    """Factory for the SignTrack model."""

    class Meta:  # noqa
        model = models.SignTrack

    language = "en"


class PlaylistFactory(DjangoModelFactory):
    """Factory for the Playlist model."""

    class Meta:  # noqa
        model = models.Playlist

    name = factory.Sequence(lambda n: "Playlist %03d" % n)


class PlaylistVideoFactory(DjangoModelFactory):
    """Factory for the PlaylistVideo model."""

    class Meta:  # noqa
        model = models.PlaylistVideo

    order = factory.Sequence(lambda n: n)


class PlaylistAccessFactory(DjangoModelFactory):
    """Factory for the PlaylistAccess model."""

    class Meta:  # noqa
        model = models.PlaylistAccess
