"""Factories for the ``core`` app of the Marsha project."""
import uuid

from django.conf import settings
from django.contrib.auth.hashers import make_password

import factory
from factory import fuzzy
from factory.django import DjangoModelFactory

from marsha.core import models


# usage of format function here is wanted in this file
# pylint: disable=consider-using-f-string


class PlaylistLTIPassportFactory(DjangoModelFactory):
    """Factory to create LTI passport for a playlist."""

    class Meta:  # noqa
        model = models.LTIPassport

    playlist = factory.SubFactory("marsha.core.factories.PlaylistFactory")


class ConsumerSiteLTIPassportFactory(DjangoModelFactory):
    """Factory to create LTI passport for a consumer site."""

    class Meta:  # noqa
        model = models.LTIPassport

    consumer_site = factory.SubFactory("marsha.core.factories.ConsumerSiteFactory")


class UserFactory(DjangoModelFactory):
    """Factory for the User model."""

    class Meta:  # noqa
        model = models.User

    username = factory.Faker("user_name")
    password = make_password("password")
    email = factory.LazyAttribute(lambda o: f"{o.username}@example.org")


class ConsumerSiteFactory(DjangoModelFactory):
    """Factory for the ConsumerSite model."""

    class Meta:  # noqa
        model = models.ConsumerSite

    name = factory.Sequence("Site {:03d}".format)
    domain = factory.Faker("domain_name")


class ConsumerSiteAccessFactory(DjangoModelFactory):
    """Factory for the ConsumerSiteAccess model."""

    class Meta:  # noqa
        model = models.ConsumerSiteAccess


class OrganizationFactory(DjangoModelFactory):
    """Factory for the Organization model."""

    class Meta:  # noqa
        model = models.Organization

    name = factory.Faker("company")


class ConsumerSiteOrganizationFactory(DjangoModelFactory):
    """Factory for the SiteOrganization model."""

    class Meta:  # noqa
        model = models.ConsumerSiteOrganization


class OrganizationAccessFactory(DjangoModelFactory):
    """Factory for the OrganizationAccess model."""

    organization = factory.SubFactory(OrganizationFactory)
    user = factory.SubFactory(UserFactory)

    class Meta:  # noqa
        model = models.OrganizationAccess


class PlaylistFactory(DjangoModelFactory):
    """Factory for the Playlist model."""

    class Meta:  # noqa
        model = models.Playlist

    title = factory.Sequence("Playlist {:03d}".format)
    consumer_site = factory.SubFactory(ConsumerSiteFactory)
    lti_id = factory.Sequence("playlist#{:d}".format)


class PlaylistAccessFactory(DjangoModelFactory):
    """Factory for the PlaylistAccess model."""

    playlist = factory.SubFactory(PlaylistFactory)
    user = factory.SubFactory(UserFactory)

    class Meta:  # noqa
        model = models.PlaylistAccess


class VideoFactory(DjangoModelFactory):
    """Factory for the Video model."""

    class Meta:  # noqa
        model = models.Video

    title = factory.Sequence("Video {:03d}".format)
    description = factory.Faker("catch_phrase")
    position = fuzzy.FuzzyInteger(0)
    playlist = factory.SubFactory(PlaylistFactory)
    lti_id = factory.Sequence("video#{:d}".format)


class BaseTrackFactory(DjangoModelFactory):
    """Base factory to factorize code between all tracks models."""

    video = factory.SubFactory(VideoFactory)
    language = factory.fuzzy.FuzzyChoice(tuple(lang[0] for lang in settings.LANGUAGES))


class AudioTrackFactory(BaseTrackFactory):
    """Factory for the AudioTrack model."""

    class Meta:  # noqa
        model = models.AudioTrack


class TimedTextTrackFactory(BaseTrackFactory):
    """Factory for the TimedTextTrack model."""

    mode = factory.fuzzy.FuzzyChoice([m[0] for m in models.TimedTextTrack.MODE_CHOICES])

    class Meta:  # noqa
        model = models.TimedTextTrack


class SignTrackFactory(BaseTrackFactory):
    """Factory for the SignTrack model."""

    class Meta:  # noqa
        model = models.SignTrack


class ThumbnailFactory(DjangoModelFactory):
    """Factory for the Thumbnail model."""

    video = factory.SubFactory(VideoFactory)

    class Meta:  # noqa
        model = models.Thumbnail


class DocumentFactory(DjangoModelFactory):
    """Factory for the Document model."""

    class Meta:  # noqa
        model = models.Document

    title = factory.Sequence("Document {:03d}".format)
    playlist = factory.SubFactory(PlaylistFactory)
    lti_id = factory.Sequence("document#{:d}".format)


class LiveSessionFactory(DjangoModelFactory):
    """Factory for the liveSession model."""

    email = factory.Sequence("user{:d}@fun-mooc.fr".format)
    video = factory.SubFactory(VideoFactory)

    class Params:  # pylint:disable=missing-class-docstring
        is_from_lti_connection = factory.Trait(
            consumer_site=factory.LazyAttribute(lambda o: o.video.consumer_site),
            lti_id=factory.LazyAttribute(lambda o: o.video.playlist.lti_id),
            lti_user_id=factory.Sequence("lti-user#{:d}".format),
        )

    class Meta:  # noqa
        model = models.LiveSession


class AnonymousLiveSessionFactory(LiveSessionFactory):
    """Factory for anonymous liveSession model."""

    anonymous_id = factory.Faker("uuid4")

    class Params:  # pylint:disable=missing-class-docstring
        is_from_lti_connection = False


class LivePairingFactory(DjangoModelFactory):
    """Factory for the LivePairing model."""

    secret = factory.Sequence("{:06d}".format)
    video = factory.SubFactory(VideoFactory)

    class Meta:  # noqa
        model = models.LivePairing


class DeviceFactory(DjangoModelFactory):
    """Factory for the Device model."""

    id = uuid.uuid4()

    class Meta:  # noqa
        model = models.Device


class SharedLiveMediaFactory(DjangoModelFactory):
    """Factory for the SharedLiveMedia model."""

    video = factory.SubFactory(VideoFactory)
    nb_pages = fuzzy.FuzzyInteger(0, high=10)

    class Meta:  # noqa
        model = models.SharedLiveMedia
