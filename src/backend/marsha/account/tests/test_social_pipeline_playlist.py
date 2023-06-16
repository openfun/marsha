"""Module testing playlist creation from saml pipeline."""

import random

from django.test import TestCase

from social_django.utils import load_strategy

from marsha.account.factories import IdpOrganizationAssociationFactory
from marsha.account.social_pipeline.playlist import create_playlist_from_saml
from marsha.account.tests.utils import MockedFERSAMLAuth, override_saml_fer_settings
from marsha.core.factories import PlaylistAccessFactory, UserFactory
from marsha.core.models import ADMINISTRATOR, INSTRUCTOR, Playlist, PlaylistAccess


@override_saml_fer_settings()
class PlaylistPipelineTestCase(TestCase):
    """Test case for Renater SAML authentication Playlist pipeline step."""

    @classmethod
    def setUpClass(cls):
        """
        Init backend for the test case: A fake SAML backend which
        always uses a configured Identity Provider with driven attributes.
        Also init common data: SAML response, SAML details,  a User in database.
        """
        super().setUpClass()

        # Init a fake backend with only what we need
        cls.backend = MockedFERSAMLAuth(
            load_strategy(),
            redirect_uri="http://testserver/",
        )

        cls.saml_response = {
            "idp_name": "marsha-local-idp",
            "attributes": {
                "attributes_are_unused_here": None,
            },
            "session_index": "unused",
        }

        # Prepare common data
        cls.default_saml_details = {
            "first_name": "unused",
            "last_name": "unused",
            "username": "rsanchez@samltest.id",  # unused
            "email": "rsanchez@samltest.id",  # unused
        }
        cls.user = UserFactory(
            username=cls.default_saml_details["username"],
            email=cls.default_saml_details["email"],
        )

    def setUp(self) -> None:
        """Always test there are no pre-existing data, or it may break tests for nothing."""
        # Pre-flight assertions
        self.assertEqual(Playlist.objects.count(), 0)
        self.assertEqual(PlaylistAccess.objects.count(), 0)

    def test_create_playlist_from_saml_student_or_unknown_new(self):
        """No playlist should be created when the user is a student."""

        saml_details = {"roles": [], **self.default_saml_details}

        create_playlist_from_saml(
            None,  # strategy is unused
            saml_details,
            self.backend,
            user=self.user,
            response=self.saml_response,
            new_association=True,
        )

        self.assertEqual(Playlist.objects.count(), 0)
        self.assertEqual(PlaylistAccess.objects.count(), 0)

    def test_create_playlist_no_new_association(self):
        """When new_association is False, no playlist should be created."""
        saml_details = {"roles": ["teacher"], **self.default_saml_details}

        create_playlist_from_saml(
            None,  # strategy is unused
            saml_details,
            self.backend,
            user=self.user,
            response=self.saml_response,
            new_association=False,
        )

        self.assertEqual(Playlist.objects.count(), 0)
        self.assertEqual(PlaylistAccess.objects.count(), 0)

    def test_create_playlist_new_association_no_existing_idporganization(self):
        """With a new association but no existing IdpOrganizationAssociation
        an exception should be raised"""

        saml_details = {"roles": ["teacher"], **self.default_saml_details}

        with self.assertRaises(RuntimeError):
            create_playlist_from_saml(
                None,  # strategy is unused
                saml_details,
                self.backend,
                user=self.user,
                response=self.saml_response,
                new_association=True,
            )

    def test_create_playlist_new_association_existing_idporganization(self):
        """A new playlist should be created when new_association is True
        and an idpOrganizationAssociation exists."""
        saml_details = {"roles": ["teacher"], **self.default_saml_details}

        idp_organization_association = IdpOrganizationAssociationFactory(
            idp_identifier="http://marcha.local/idp/"
        )

        create_playlist_from_saml(
            None,  # strategy is unused
            saml_details,
            self.backend,
            user=self.user,
            response=self.saml_response,
            new_association=True,
        )

        playlist = Playlist.objects.last()
        playlist_access = PlaylistAccess.objects.last()

        self.assertEqual(
            playlist.organization, idp_organization_association.organization
        )
        self.assertEqual(playlist.title, self.user.username)
        self.assertEqual(playlist_access.playlist, playlist)
        self.assertEqual(playlist_access.user, self.user)
        self.assertEqual(playlist_access.role, ADMINISTRATOR)

    def test_create_playlist_new_association_existing_idp_organization_user_full_name(
        self,
    ):
        """A new playlist should be created when new_association is True
        and an idpOrganizationAssociation exists.
        The playlist title should be the user full name"""

        saml_details = {
            "roles": ["teacher"],
            "first_name": "jon",
            "last_name": "snow",
            "username": "jsnow@samltest.id",  # unused
            "email": "jsnow@samltest.id",  # unused
        }

        user = UserFactory(
            first_name=saml_details["first_name"],
            last_name=saml_details["last_name"],
            username=saml_details["username"],
            email=saml_details["email"],
        )

        idp_organization_association = IdpOrganizationAssociationFactory(
            idp_identifier="http://marcha.local/idp/"
        )

        create_playlist_from_saml(
            None,  # strategy is unused
            saml_details,
            self.backend,
            user=user,
            response=self.saml_response,
            new_association=True,
        )

        playlist = Playlist.objects.last()
        playlist_access = PlaylistAccess.objects.last()

        self.assertEqual(
            playlist.organization, idp_organization_association.organization
        )
        self.assertEqual(playlist.title, user.get_full_name())
        self.assertEqual(playlist_access.playlist, playlist)
        self.assertEqual(playlist_access.user, user)
        self.assertEqual(playlist_access.role, ADMINISTRATOR)

    def test_create_playlist_already_existing_playlist_access(self):
        """No playlist should be created if an existing playlist access for the user and the
        organization is found."""

        saml_details = {"roles": ["teacher"], **self.default_saml_details}

        idp_organization_association = IdpOrganizationAssociationFactory(
            idp_identifier="http://marcha.local/idp/"
        )
        PlaylistAccessFactory(
            user=self.user,
            role=random.choice([ADMINISTRATOR, INSTRUCTOR]),
            playlist__organization=idp_organization_association.organization,
        )

        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(PlaylistAccess.objects.count(), 1)

        create_playlist_from_saml(
            None,  # strategy is unused
            saml_details,
            self.backend,
            user=self.user,
            response=self.saml_response,
            new_association=True,
        )

        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(PlaylistAccess.objects.count(), 1)
