"""Tests for the models in the ``core`` app of the Marsha project."""
import random
from typing import Type
import uuid

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models.deletion import ProtectedError
from django.db.utils import IntegrityError
from django.test import TestCase

from factory.django import DjangoModelFactory
from safedelete.models import HARD_DELETE, SOFT_DELETE_CASCADE

from marsha.core.factories import (
    AudioTrackFactory,
    ConsumerSiteAccessFactory,
    ConsumerSiteFactory,
    ConsumerSiteOrganizationFactory,
    LiveSessionFactory,
    OrganizationAccessFactory,
    OrganizationFactory,
    PlaylistAccessFactory,
    PlaylistFactory,
    SignTrackFactory,
    TimedTextTrackFactory,
    UserFactory,
    VideoFactory,
)
from marsha.core.models import TimedTextTrack


# We don't enforce arguments documentation in tests
# pylint: disable=too-many-public-methods,unused-argument


class DeletionTestCase(TestCase):
    """Test our intentions about model instances soft/hard deletion."""

    def assertIsSoftDeleted(self, obj: models.Model):
        """Check that the given object is soft-deleted."""
        self.assertIsNotNone(
            obj.__class__.objects.all_with_deleted().get(pk=obj.pk).deleted
        )

    def assertIsHardDeleted(self, obj: models.Model):
        """Check that the given object is hard-deleted."""
        with self.assertRaises(obj.__class__.DoesNotExist):
            obj.__class__.objects.all_with_deleted().get(pk=obj.pk)

    def assertIsVisible(self, obj: models.Model):
        """Check that the given object is nor deleted neither soft-deleted.

        Will fail if object is hard deleted.

        """
        self.assertIsNone(
            obj.__class__.objects.all_with_deleted().get(pk=obj.pk).deleted
        )

    def _test_soft_deletion(self, factory: Type[DjangoModelFactory], **kwargs):
        """Ensure that soft deletion works for the model represented by the factory.

        Parameters
        ----------
        factory: Type[DjangoModelFactory]
            The factory to use to create an object to soft-delete.
        kwargs:
            Arguments to pass to the given `factory`.

        """
        model = factory._meta.model  # noqa

        obj = factory(**kwargs)
        self.assertIsNone(obj.deleted)

        obj.delete()
        self.assertIsNotNone(obj.deleted)

        # object should be invisible to normal queryset
        with self.assertRaises(model.DoesNotExist):
            model.objects.get(pk=obj.pk)

        # but still present in deleted mode
        self.assertEqual(model.objects.deleted_only().get(pk=obj.pk), obj)

        # we could still force delete it
        obj.delete(force_policy=HARD_DELETE)

        self.assertIsHardDeleted(obj)

    def _test_hard_deletion(self, factory: Type[DjangoModelFactory], **kwargs):
        """Ensure directly deleting an instance of the given kind implies hard deletion.

        Parameters
        ----------
        factory: Type[DjangoModelFactory]
            The factory to use to create an object to delete.
        kwargs:
            Arguments to pass to the given `factory`.

        """
        obj = factory(**kwargs)
        obj.delete()

        self.assertIsHardDeleted(obj)

    def _test_uniqueness_ignores_deleted(
        self, factory: Type[DjangoModelFactory], **kwargs
    ):
        """Ensure uniqueness doesn't take deleted instances into account.

        Parameters
        ----------
        factory: Type[DjangoModelFactory]
            The factory to use to create/delete some objects
        kwargs:
            Arguments to pass to the given `factory`.

        """
        obj1 = factory(**kwargs)

        # force a soft deletion (useful for through models configured with ``HARD_DELETE``)
        obj1.delete(force_policy=SOFT_DELETE_CASCADE)
        self.assertIsSoftDeleted(obj1)

        # we can create it again
        factory(**kwargs)

        # when exists non-deleted, cannot create another one
        with self.assertRaises(IntegrityError):
            factory(**kwargs)

    def test_user_soft_deletion(self):
        """Ensure soft deletion work as expected for users."""
        self._test_soft_deletion(UserFactory)

        # test cascade
        user = UserFactory()

        consumer_site = ConsumerSiteFactory()
        site_admin = ConsumerSiteAccessFactory(user=user, consumer_site=consumer_site)
        organization = OrganizationFactory()
        organization_access = OrganizationAccessFactory(
            user=user, organization=organization
        )
        video = VideoFactory(created_by=user)
        user_playlist = PlaylistFactory(created_by=user, organization=organization)
        other_playlist = PlaylistFactory(
            created_by=UserFactory(), organization=organization
        )
        other_playlist_access = PlaylistAccessFactory(
            user=user, playlist=other_playlist
        )

        user.delete()

        self.assertIsVisible(consumer_site)
        self.assertIsSoftDeleted(site_admin)
        self.assertIsVisible(organization)
        self.assertIsSoftDeleted(organization_access)
        self.assertIsSoftDeleted(user)
        self.assertIsSoftDeleted(video)
        self.assertIsSoftDeleted(user_playlist)
        self.assertIsVisible(other_playlist)
        self.assertIsSoftDeleted(other_playlist_access)

    def test_user_hard_deletion_cascade(self):
        """Ensure hard deletion work in cascade as expected for users."""
        user = UserFactory()

        consumer_site = ConsumerSiteFactory()
        site_admin = ConsumerSiteAccessFactory(user=user, consumer_site=consumer_site)
        organization = OrganizationFactory()
        organization_access = OrganizationAccessFactory(
            user=user, organization=organization
        )
        video = VideoFactory(created_by=user)
        user_playlist = PlaylistFactory(created_by=user, organization=organization)
        other_playlist = PlaylistFactory(
            created_by=UserFactory(), organization=organization
        )
        other_playlist_access = PlaylistAccessFactory(
            user=user, playlist=other_playlist
        )

        user.delete(force_policy=HARD_DELETE)

        self.assertIsVisible(consumer_site)
        self.assertIsHardDeleted(site_admin)
        self.assertIsVisible(organization)
        self.assertIsHardDeleted(organization_access)
        self.assertIsHardDeleted(video)
        self.assertIsHardDeleted(user_playlist)
        self.assertIsVisible(other_playlist)
        self.assertIsHardDeleted(other_playlist_access)

    def test_user_uniqueness(self):
        """Ensure that a username of a deleted user cannot be used by another."""
        user = UserFactory(username="foo")
        user.delete()

        with self.assertRaises(ValidationError) as context:
            UserFactory(username="foo")
        self.assertEqual(
            context.exception.messages, ["A user with that username already exists."]
        )

    def test_site_soft_deletion(self):
        """Ensure soft deletion work as expected for videos."""
        self._test_soft_deletion(ConsumerSiteFactory)

        # test cascade
        consumer_site = ConsumerSiteFactory()
        user = UserFactory()
        site_admin = ConsumerSiteAccessFactory(user=user, consumer_site=consumer_site)
        organization = OrganizationFactory()
        site_organization = ConsumerSiteOrganizationFactory(
            consumer_site=consumer_site, organization=organization
        )

        consumer_site.delete()

        self.assertIsSoftDeleted(site_admin)
        self.assertIsVisible(organization)
        self.assertIsSoftDeleted(site_organization)

    def test_site_hard_deletion_cascade(self):
        """Ensure hard deletion work in cascade as expected for videos."""
        consumer_site = ConsumerSiteFactory()

        user = UserFactory()
        site_admin = ConsumerSiteAccessFactory(user=user, consumer_site=consumer_site)
        organization = OrganizationFactory()
        site_organization = ConsumerSiteOrganizationFactory(
            consumer_site=consumer_site, organization=organization
        )

        consumer_site.delete()

        self.assertIsSoftDeleted(site_admin)
        self.assertIsVisible(organization)
        self.assertIsSoftDeleted(site_organization)

    def test_site_admin_deletion(self):
        """Ensure directly deleting a site-user link implies hard deletion."""
        self._test_hard_deletion(
            ConsumerSiteAccessFactory,
            user=UserFactory(),
            consumer_site=ConsumerSiteFactory(),
        )

    def test_site_admin_uniqueness(self):
        """Ensure a site-user link cannot exist twice as non-deleted."""
        self._test_uniqueness_ignores_deleted(
            ConsumerSiteAccessFactory,
            user=UserFactory(),
            consumer_site=ConsumerSiteFactory(),
        )

    def test_organization_soft_deletion(self):
        """Ensure soft deletion work as expected for videos."""
        self._test_soft_deletion(OrganizationFactory)

        # test cascade
        organization = OrganizationFactory()

        user = UserFactory()
        organization_access = OrganizationAccessFactory(
            user=user, organization=organization
        )
        consumer_site = ConsumerSiteFactory()
        site_organization = ConsumerSiteOrganizationFactory(
            consumer_site=consumer_site, organization=organization
        )
        playlist = PlaylistFactory(organization=organization)

        organization.delete()

        self.assertIsVisible(user)
        self.assertIsSoftDeleted(organization_access)
        self.assertIsVisible(consumer_site)
        self.assertIsSoftDeleted(site_organization)
        self.assertIsSoftDeleted(playlist)

    def test_organization_hard_deletion_cascade(self):
        """Ensure hard deletion work in cascade as expected for videos."""
        organization = OrganizationFactory()

        user = UserFactory()
        organization_access = OrganizationAccessFactory(
            user=user, organization=organization
        )
        consumer_site = ConsumerSiteFactory()
        site_organization = ConsumerSiteOrganizationFactory(
            consumer_site=consumer_site, organization=organization
        )
        playlist = PlaylistFactory(organization=organization)

        organization.delete(force_policy=HARD_DELETE)

        self.assertIsVisible(user)
        self.assertIsHardDeleted(organization_access)
        self.assertIsVisible(consumer_site)
        self.assertIsHardDeleted(site_organization)
        self.assertIsHardDeleted(playlist)

    def test_site_organization_deletion(self):
        """Ensure directly deleting a site-organization link implies hard deletion."""
        self._test_hard_deletion(
            ConsumerSiteOrganizationFactory,
            consumer_site=ConsumerSiteFactory(),
            organization=OrganizationFactory(),
        )

    def test_site_organization_uniqueness(self):
        """Ensure a site-organization link cannot exist twice as non-deleted."""
        self._test_uniqueness_ignores_deleted(
            ConsumerSiteOrganizationFactory,
            consumer_site=ConsumerSiteFactory(),
            organization=OrganizationFactory(),
        )

    def test_organization_access_deletion(self):
        """Ensure directly deleting a organization-user link implies hard deletion."""
        self._test_hard_deletion(
            OrganizationAccessFactory,
            organization=OrganizationFactory(),
            user=UserFactory(),
        )

    def test_organization_access_uniqueness(self):
        """Ensure an organization-user link cannot exist twice as non-deleted."""
        self._test_uniqueness_ignores_deleted(
            OrganizationAccessFactory,
            organization=OrganizationFactory(),
            user=UserFactory(),
        )

    def test_video_soft_deletion(self):
        """Ensure soft deletion work as expected for videos."""
        user = UserFactory()
        self._test_soft_deletion(VideoFactory, created_by=user)

        # test cascade
        organization = OrganizationFactory()
        playlist = PlaylistFactory(created_by=user, organization=organization)
        video = VideoFactory(created_by=user, playlist=playlist)
        audio_track = AudioTrackFactory(video=video)
        livesession = LiveSessionFactory(anonymous_id=uuid.uuid4(), video=video)
        timed_text_track = TimedTextTrackFactory(video=video)
        sign_track = SignTrackFactory(video=video)
        copied_video = VideoFactory(created_by=user, duplicated_from=video)

        video.delete()

        self.assertIsSoftDeleted(video)
        self.assertIsSoftDeleted(audio_track)
        self.assertIsSoftDeleted(livesession)
        self.assertIsSoftDeleted(timed_text_track)
        self.assertIsSoftDeleted(sign_track)
        self.assertIsVisible(copied_video)
        self.assertIsVisible(organization)
        self.assertIsVisible(playlist)

    def test_video_hard_deletion_cascade(self):
        """Ensure hard deletion work in cascade as expected for videos."""
        user = UserFactory()
        organization = OrganizationFactory()
        playlist = PlaylistFactory(created_by=user, organization=organization)
        video = VideoFactory(created_by=user, playlist=playlist)

        audio_track = AudioTrackFactory(video=video)
        livesession = LiveSessionFactory(anonymous_id=uuid.uuid4(), video=video)
        timed_text_track = TimedTextTrackFactory(video=video)
        sign_track = SignTrackFactory(video=video)
        copied_video = VideoFactory(created_by=user, duplicated_from=video)

        video.delete(force_policy=HARD_DELETE)

        self.assertIsHardDeleted(video)
        self.assertIsHardDeleted(audio_track)
        self.assertIsHardDeleted(livesession)
        self.assertIsHardDeleted(timed_text_track)
        self.assertIsHardDeleted(sign_track)
        self.assertIsVisible(copied_video)
        self.assertIsVisible(organization)
        self.assertIsVisible(playlist)

    def test_video_tracks_soft_deletion(self):
        """Ensure soft deletion work as expected for video tracks."""
        video = VideoFactory(created_by=UserFactory())

        for factory in [AudioTrackFactory, TimedTextTrackFactory, SignTrackFactory]:
            with self.subTest(model=factory._meta.model):  # noqa
                self._test_soft_deletion(factory, video=video)

    def test_audio_track_uniqueness(self):
        """Ensure audio track cannot exist twice as non-deleted."""
        self._test_uniqueness_ignores_deleted(
            AudioTrackFactory,
            language="en",
            video=VideoFactory(created_by=UserFactory()),
        )

    def test_timed_text_track_uniqueness(self):
        """Ensure timed text track cannot exist twice as non-deleted."""
        self._test_uniqueness_ignores_deleted(
            TimedTextTrackFactory,
            language="en",
            mode=random.choice([m[0] for m in TimedTextTrack.MODE_CHOICES]),
            video=VideoFactory(created_by=UserFactory()),
        )

    def test_timed_text_track_can_exist_with_and_without_closed_captioning(self):
        """Ensure tracks can exist simultaneously in all modes for the same language."""
        video = VideoFactory(created_by=UserFactory())
        for mode, _ in TimedTextTrack.MODE_CHOICES:
            TimedTextTrackFactory(video=video, language="en", mode=mode)

    def test_sign_track_uniqueness(self):
        """Ensure sign track cannot exist twice as non-deleted."""
        self._test_uniqueness_ignores_deleted(
            SignTrackFactory,
            language="en",
            video=VideoFactory(created_by=UserFactory()),
        )

    def test_playlist_soft_deletion(self):
        """Playlist containing resources can not be soft deleted in cascade."""
        organization = OrganizationFactory()
        user = UserFactory()
        self._test_soft_deletion(
            PlaylistFactory, organization=organization, created_by=user
        )

        # test cascade
        playlist = PlaylistFactory(organization=organization, created_by=user)
        video = VideoFactory(created_by=user, playlist=playlist)
        copied_playlist = PlaylistFactory(
            organization=organization, created_by=user, duplicated_from=playlist
        )
        playlist_access = PlaylistAccessFactory(user=user, playlist=playlist)

        with self.assertRaises(ProtectedError):
            playlist.delete()

        self.assertIsVisible(playlist)
        self.assertIsVisible(video)
        self.assertIsVisible(copied_playlist)
        self.assertIsVisible(playlist_access)

    def test_playlist_hard_deletion_cascade(self):
        """It should not be possible to hard delete a playlist that still contains videos."""
        organization = OrganizationFactory()
        user = UserFactory()
        playlist = PlaylistFactory(organization=organization, created_by=user)

        video = VideoFactory(created_by=user, playlist=playlist)
        copied_playlist = PlaylistFactory(
            organization=organization, created_by=user, duplicated_from=playlist
        )
        playlist_access = PlaylistAccessFactory(user=user, playlist=playlist)

        with self.assertRaises(ProtectedError):
            playlist.delete(force_policy=HARD_DELETE)

        self.assertIsVisible(playlist)
        self.assertIsVisible(video)
        self.assertIsVisible(copied_playlist)
        self.assertIsVisible(playlist_access)

    def test_playlist_access_deletion(self):
        """Ensure directly deleting a playlist-user link implies hard deletion."""
        user = UserFactory()
        self._test_hard_deletion(
            PlaylistAccessFactory,
            playlist=PlaylistFactory(
                created_by=user, organization=OrganizationFactory()
            ),
            user=user,
        )

    def test_playlist_access_uniqueness(self):
        """Ensure a playlist-user link cannot exist twice as non-deleted."""
        user = UserFactory()
        self._test_uniqueness_ignores_deleted(
            PlaylistAccessFactory,
            playlist=PlaylistFactory(
                created_by=user, organization=OrganizationFactory()
            ),
            user=user,
        )
