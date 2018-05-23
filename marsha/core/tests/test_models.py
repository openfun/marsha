"""Tests for the models in the ``core`` app of the Marsha project."""
from typing import Type

from django.core.exceptions import ValidationError
from django.db import IntegrityError, models
from django.test import TestCase
from django.utils.timezone import now

from factory.django import DjangoModelFactory
from safedelete.models import HARD_DELETE, SOFT_DELETE_CASCADE

from marsha.core.models import PlaylistAccess

from .factories import (
    AudioTrackFactory,
    AuthoringFactory,
    ConsumerSiteFactory,
    OrganizationFactory,
    OrganizationManagerFactory,
    PlaylistAccessFactory,
    PlaylistFactory,
    PlaylistVideoFactory,
    SignTrackFactory,
    SiteAdminFactory,
    SiteOrganizationFactory,
    SubtitleTrackFactory,
    UserFactory,
    VideoFactory,
)


# We don't enforce arguments documentation in tests
# pylint: disable=missing-param-doc,missing-type-doc


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
        obj2 = factory(**kwargs)

        # soft delete this one two: no uniqueness for deleted objects
        obj2.delete(force_policy=SOFT_DELETE_CASCADE)
        self.assertIsSoftDeleted(obj2)

        # when exists non-deleted, cannot create another one
        factory(**kwargs)
        with self.assertRaises(IntegrityError):
            factory(**kwargs)

    def test_user_soft_deletion(self):
        """Ensure soft deletion work as expected for users."""
        self._test_soft_deletion(UserFactory)

        # test cascade
        user = UserFactory()

        site = ConsumerSiteFactory()
        site_admin = SiteAdminFactory(user=user, site=site)
        organization = OrganizationFactory()
        organization_manager = OrganizationManagerFactory(
            user=user, organization=organization
        )
        authoring = AuthoringFactory(user=user, organization=organization)
        video = VideoFactory(author=user)
        user_playlist = PlaylistFactory(author=user, organization=organization)
        other_playlist = PlaylistFactory(
            author=UserFactory(), organization=organization
        )
        other_playlist_access = PlaylistAccessFactory(
            user=user, playlist=other_playlist
        )

        user.delete()

        self.assertIsVisible(site)
        self.assertIsSoftDeleted(site_admin)
        self.assertIsVisible(organization)
        self.assertIsSoftDeleted(organization_manager)
        self.assertIsSoftDeleted(authoring)
        self.assertIsSoftDeleted(video)
        self.assertIsSoftDeleted(user_playlist)
        self.assertIsVisible(other_playlist)
        self.assertIsSoftDeleted(other_playlist_access)

    def test_user_hard_deletion_cascade(self):
        """Ensure hard deletion work in cascade as expected for users."""
        user = UserFactory()

        site = ConsumerSiteFactory()
        site_admin = SiteAdminFactory(user=user, site=site)
        organization = OrganizationFactory()
        organization_manager = OrganizationManagerFactory(
            user=user, organization=organization
        )
        authoring = AuthoringFactory(user=user, organization=organization)
        video = VideoFactory(author=user)
        user_playlist = PlaylistFactory(author=user, organization=organization)
        other_playlist = PlaylistFactory(
            author=UserFactory(), organization=organization
        )
        other_playlist_access = PlaylistAccessFactory(
            user=user, playlist=other_playlist
        )

        user.delete(force_policy=HARD_DELETE)

        self.assertIsVisible(site)
        self.assertIsHardDeleted(site_admin)
        self.assertIsVisible(organization)
        self.assertIsHardDeleted(organization_manager)
        self.assertIsHardDeleted(authoring)
        self.assertIsHardDeleted(video)
        self.assertIsHardDeleted(user_playlist)
        self.assertIsVisible(other_playlist)
        self.assertIsHardDeleted(other_playlist_access)

    def test_user_uniqueness(self):
        """Ensure that a username of a deleted user cannot be used by another."""
        user = UserFactory(username="foo")
        user.delete()

        with self.assertRaises(IntegrityError):
            UserFactory(username="foo")

    def test_site_soft_deletion(self):
        """Ensure soft deletion work as expected for videos."""
        self._test_soft_deletion(ConsumerSiteFactory)

        # test cascade
        site = ConsumerSiteFactory()
        user = UserFactory()
        site_admin = SiteAdminFactory(user=user, site=site)
        organization = OrganizationFactory()
        site_organization = SiteOrganizationFactory(
            site=site, organization=organization
        )

        site.delete()

        self.assertIsSoftDeleted(site_admin)
        self.assertIsVisible(organization)
        self.assertIsSoftDeleted(site_organization)

    def test_site_hard_deletion_cascade(self):
        """Ensure hard deletion work in cascade as expected for videos."""
        site = ConsumerSiteFactory()

        user = UserFactory()
        site_admin = SiteAdminFactory(user=user, site=site)
        organization = OrganizationFactory()
        site_organization = SiteOrganizationFactory(
            site=site, organization=organization
        )

        site.delete()

        self.assertIsSoftDeleted(site_admin)
        self.assertIsVisible(organization)
        self.assertIsSoftDeleted(site_organization)

    def test_site_admin_deletion(self):
        """Ensure directly deleting a site-user link implies hard deletion."""
        self._test_hard_deletion(
            SiteAdminFactory, user=UserFactory(), site=ConsumerSiteFactory()
        )

    def test_site_admin_uniqueness(self):
        """Ensure a site-user link cannot exist twice as non-deleted."""
        self._test_uniqueness_ignores_deleted(
            SiteAdminFactory, user=UserFactory(), site=ConsumerSiteFactory()
        )

    def test_organization_soft_deletion(self):
        """Ensure soft deletion work as expected for videos."""
        self._test_soft_deletion(OrganizationFactory)

        # test cascade
        organization = OrganizationFactory()

        user = UserFactory()
        organization_manager = OrganizationManagerFactory(
            user=user, organization=organization
        )
        authoring = AuthoringFactory(user=user, organization=organization)
        site = ConsumerSiteFactory()
        site_organization = SiteOrganizationFactory(
            site=site, organization=organization
        )
        playlist = PlaylistFactory(organization=organization)

        organization.delete()

        self.assertIsVisible(user)
        self.assertIsSoftDeleted(organization_manager)
        self.assertIsSoftDeleted(authoring)
        self.assertIsVisible(site)
        self.assertIsSoftDeleted(site_organization)
        self.assertIsSoftDeleted(playlist)

    def test_organization_hard_deletion_cascade(self):
        """Ensure hard deletion work in cascade as expected for videos."""
        organization = OrganizationFactory()

        user = UserFactory()
        organization_manager = OrganizationManagerFactory(
            user=user, organization=organization
        )
        authoring = AuthoringFactory(user=user, organization=organization)
        site = ConsumerSiteFactory()
        site_organization = SiteOrganizationFactory(
            site=site, organization=organization
        )
        playlist = PlaylistFactory(organization=organization)

        organization.delete(force_policy=HARD_DELETE)

        self.assertIsVisible(user)
        self.assertIsHardDeleted(organization_manager)
        self.assertIsHardDeleted(authoring)
        self.assertIsVisible(site)
        self.assertIsHardDeleted(site_organization)
        self.assertIsHardDeleted(playlist)

    def test_site_organization_deletion(self):
        """Ensure directly deleting a site-organization link implies hard deletion."""
        self._test_hard_deletion(
            SiteOrganizationFactory,
            site=ConsumerSiteFactory(),
            organization=OrganizationFactory(),
        )

    def test_site_organization_uniqueness(self):
        """Ensure a site-organization link cannot exist twice as non-deleted."""
        self._test_uniqueness_ignores_deleted(
            SiteOrganizationFactory,
            site=ConsumerSiteFactory(),
            organization=OrganizationFactory(),
        )

    def test_organization_manager_deletion(self):
        """Ensure directly deleting a organization-user link implies hard deletion."""
        self._test_hard_deletion(
            OrganizationManagerFactory,
            organization=OrganizationFactory(),
            user=UserFactory(),
        )

    def test_organization_manager_uniqueness(self):
        """Ensure a organization-user link cannot exist twice as non-deleted."""
        self._test_uniqueness_ignores_deleted(
            OrganizationManagerFactory,
            organization=OrganizationFactory(),
            user=UserFactory(),
        )

    def test_authoring_deletion(self):
        """Ensure directly deleting a organization-user link implies hard deletion."""
        self._test_hard_deletion(
            AuthoringFactory, organization=OrganizationFactory(), user=UserFactory()
        )

    def test_authoring_uniqueness(self):
        """Ensure a organization-user link cannot exist twice as non-deleted."""
        self._test_uniqueness_ignores_deleted(
            AuthoringFactory, organization=OrganizationFactory(), user=UserFactory()
        )

    def test_video_soft_deletion(self):
        """Ensure soft deletion work as expected for videos."""
        user = UserFactory()
        self._test_soft_deletion(VideoFactory, author=user)

        # test cascade
        video = VideoFactory(author=user)
        audio_track = AudioTrackFactory(video=video)
        subtitle_track = SubtitleTrackFactory(video=video)
        sign_track = SignTrackFactory(video=video)
        copied_video = VideoFactory(author=user, duplicated_from=video)
        organization = OrganizationFactory()
        playlist = PlaylistFactory(author=user, organization=organization)
        playlist_video = PlaylistVideoFactory(playlist=playlist, video=video)

        video.delete()

        self.assertIsSoftDeleted(audio_track)
        self.assertIsSoftDeleted(subtitle_track)
        self.assertIsSoftDeleted(sign_track)
        self.assertIsVisible(copied_video)
        self.assertIsVisible(organization)
        self.assertIsVisible(playlist)
        self.assertIsSoftDeleted(playlist_video)

    def test_video_hard_deletion_cascade(self):
        """Ensure hard deletion work in cascade as expected for videos."""
        user = UserFactory()
        video = VideoFactory(author=user)

        audio_track = AudioTrackFactory(video=video)
        subtitle_track = SubtitleTrackFactory(video=video)
        sign_track = SignTrackFactory(video=video)
        copied_video = VideoFactory(author=user, duplicated_from=video)
        organization = OrganizationFactory()
        playlist = PlaylistFactory(author=user, organization=organization)
        playlist_video = PlaylistVideoFactory(playlist=playlist, video=video)

        video.delete(force_policy=HARD_DELETE)

        self.assertIsHardDeleted(audio_track)
        self.assertIsHardDeleted(subtitle_track)
        self.assertIsHardDeleted(sign_track)
        self.assertIsVisible(copied_video)
        self.assertIsVisible(organization)
        self.assertIsVisible(playlist)
        self.assertIsHardDeleted(playlist_video)

    def test_video_tracks_soft_deletion(self):
        """Ensure soft deletion work as expected for video tracks."""
        video = VideoFactory(author=UserFactory())

        for factory in [AudioTrackFactory, SubtitleTrackFactory, SignTrackFactory]:
            with self.subTest(model=factory._meta.model):  # noqa
                self._test_soft_deletion(factory, video=video)

    def test_audio_track_uniqueness(self):
        """Ensure audio track cannot exist twice as non-deleted."""
        self._test_uniqueness_ignores_deleted(
            AudioTrackFactory, video=VideoFactory(author=UserFactory(), language="en")
        )

    def test_subtitle_track_uniqueness(self):
        """Ensure audio track cannot exist twice as non-deleted."""
        self._test_uniqueness_ignores_deleted(
            SubtitleTrackFactory,
            video=VideoFactory(author=UserFactory(), language="en"),
        )

    def test_subtitle_track_can_exist_with_and_without_closed_captioning(self):
        """Ensure tracks can exists in same lang with or without closed captioning."""
        video = VideoFactory(author=UserFactory())
        SubtitleTrackFactory(video=video, language="en", has_closed_captioning=True)
        SubtitleTrackFactory(video=video, language="en", has_closed_captioning=False)

    def test_sign_track_uniqueness(self):
        """Ensure audio track cannot exist twice as non-deleted."""
        self._test_uniqueness_ignores_deleted(
            SignTrackFactory, video=VideoFactory(author=UserFactory(), language="en")
        )

    def test_playlist_soft_deletion(self):
        """Ensure soft deletion work as expected for playlists."""
        organization = OrganizationFactory()
        user = UserFactory()
        self._test_soft_deletion(
            PlaylistFactory, organization=organization, author=user
        )

        # test cascade
        playlist = PlaylistFactory(organization=organization, author=user)
        video = VideoFactory(author=user)
        playlist_video = PlaylistVideoFactory(playlist=playlist, video=video)
        copied_playlist = PlaylistFactory(
            organization=organization, author=user, duplicated_from=playlist
        )
        playlist_access = PlaylistAccessFactory(user=user, playlist=playlist)

        playlist.delete()

        self.assertIsVisible(video)
        self.assertIsSoftDeleted(playlist_video)
        self.assertIsVisible(copied_playlist)
        self.assertIsSoftDeleted(playlist_access)

    def test_playlist_hard_deletion_cascade(self):
        """Ensure hard deletion work in cascade as expected for playlists."""
        organization = OrganizationFactory()
        user = UserFactory()
        playlist = PlaylistFactory(organization=organization, author=user)

        video = VideoFactory(author=user)
        playlist_video = PlaylistVideoFactory(playlist=playlist, video=video)
        copied_playlist = PlaylistFactory(
            organization=organization, author=user, duplicated_from=playlist
        )
        playlist_access = PlaylistAccessFactory(user=user, playlist=playlist)

        playlist.delete(force_policy=HARD_DELETE)

        self.assertIsVisible(video)
        self.assertIsHardDeleted(playlist_video)
        self.assertIsVisible(copied_playlist)
        self.assertIsHardDeleted(playlist_access)

    def test_playlist_video_deletion(self):
        """Ensure directly deleting a playlist-video link implies hard deletion."""
        user = UserFactory()
        self._test_hard_deletion(
            PlaylistVideoFactory,
            playlist=PlaylistFactory(author=user, organization=OrganizationFactory()),
            video=VideoFactory(author=user),
        )

    def test_playlist_video_uniqueness(self):
        """Ensure a playlist-video link cannot exist twice as non-deleted."""
        user = UserFactory()
        self._test_uniqueness_ignores_deleted(
            PlaylistVideoFactory,
            playlist=PlaylistFactory(author=user, organization=OrganizationFactory()),
            video=VideoFactory(author=user),
        )

    def test_playlist_access_deletion(self):
        """Ensure directly deleting a playlist-user link implies hard deletion."""
        user = UserFactory()
        self._test_hard_deletion(
            PlaylistAccessFactory,
            playlist=PlaylistFactory(author=user, organization=OrganizationFactory()),
            user=user,
        )

    def test_playlist_access_uniqueness(self):
        """Ensure a playlist-user link cannot exist twice as non-deleted."""
        user = UserFactory()
        self._test_uniqueness_ignores_deleted(
            PlaylistAccessFactory,
            playlist=PlaylistFactory(author=user, organization=OrganizationFactory()),
            user=user,
        )

    def test_django_default_uniqueness(self):
        """Verify that by default Django ignores our unique-together."""
        user = UserFactory()
        playlist = PlaylistFactory(author=user, organization=OrganizationFactory())

        # fields that should be considered unique together, and force non-deleted objects
        fields = {"user": user, "playlist": playlist, "deleted": None}

        # create an object with these fields in database
        playlist_access1 = PlaylistAccessFactory(**fields)

        # create an object without saving it, with same "unique" fields
        playlist_access2 = PlaylistAccess(**fields)

        # here is the trick: we return nothing on our own method to let django do
        # the default unique validation only
        playlist_access2._get_conditional_non_deleted_unique_checks = (
            lambda exclude=None: []
        )

        # so this should not raise because for django there is not unique_together on these fields
        playlist_access2.validate_unique()

        # same if one is already deleted which is the normal behavior
        playlist_access1.delete(force_policy=SOFT_DELETE_CASCADE)
        playlist_access2.validate_unique()

        # and if new one is to be deleted
        playlist_access2.deleted = now()
        playlist_access2.validate_unique()

    def test_django_enhanced_uniqueness(self):
        """Verify that our unique-together defined by ConditionalUniqueIndex are checked."""
        user = UserFactory()
        playlist = PlaylistFactory(author=user, organization=OrganizationFactory())

        # fields that should be considered unique together, and force non-deleted objects
        fields = {"user": user, "playlist": playlist, "deleted": None}

        # create an object with these fields in database
        playlist_access1 = PlaylistAccessFactory(**fields)

        # create an object without saving it, with same "unique" fields
        playlist_access2 = PlaylistAccess(**fields)

        # now we check uniqueness for fields defined in a ``ConditionalUniqueIndex``
        # so this should raise
        with self.assertRaises(ValidationError):
            playlist_access2.validate_unique()

        # but it should be ok if first is soft-deleted
        playlist_access1.delete(force_policy=SOFT_DELETE_CASCADE)
        playlist_access2.validate_unique()

        # and also is the second one is to be deleted
        playlist_access2.deleted = now()
        playlist_access2.validate_unique()
