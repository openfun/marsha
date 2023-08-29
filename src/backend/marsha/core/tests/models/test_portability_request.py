"""Tests for the models in the ``core`` app of the Marsha project."""

from django.core.exceptions import ValidationError
from django.test import TestCase

from marsha.core.factories import (
    ConsumerSiteAccessFactory,
    OrganizationAccessFactory,
    PlaylistAccessFactory,
    PlaylistFactory,
    PortabilityRequestFactory,
    UserFactory,
)
from marsha.core.models import (
    ADMINISTRATOR,
    PortabilityRequest,
    PortabilityRequestState,
)


class PortabilityRequestModelsTestCase(TestCase):
    """Test our intentions about the PortabilityRequest model."""

    maxDiff = None

    def test_model_str(self):
        """The str method should display the model's dict representation."""
        portability_request = PortabilityRequestFactory(
            resource__playlist__title="for_playlist",  # for_playlist__title
            from_playlist__title="from_playlist",
        )
        self.assertEqual(
            str(portability_request),
            "Portability request from from_playlist for for_playlist",
        )

    def test_model_deletion(self):
        """The model should be hard-deleted."""
        portability_request = PortabilityRequestFactory()
        portability_request.delete()

        self.assertEqual(PortabilityRequest.objects.all().count(), 0)

    def test_model_unique_together(self):
        """The model should be unique together for_playlist and from_playlist."""
        portability_request = PortabilityRequestFactory()

        with self.assertRaises(ValidationError) as exception_context_manager:
            PortabilityRequestFactory(
                resource__playlist=portability_request.for_playlist,
                from_playlist=portability_request.from_playlist,
            )

        raised_exception = exception_context_manager.exception
        self.assertListEqual(
            raised_exception.messages,
            [
                "Portability request with this For playlist and From playlist already exists.",
            ],
        )


class PortabilityRequestManagerTestCase(TestCase):
    """Test our intentions about the PortabilityRequest manager."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = UserFactory()

        # Owned portability request
        cls.owned_portability_request = PortabilityRequestFactory(
            from_user=cls.user,
        )

        # not related playlists
        PortabilityRequestFactory()
        organization_access = OrganizationAccessFactory(
            user=cls.user, role=ADMINISTRATOR
        )
        consumer_site_access = ConsumerSiteAccessFactory(
            user=cls.user, role=ADMINISTRATOR
        )
        from_playlist = PlaylistFactory(
            created_by=cls.user,
            organization=organization_access.organization,
            consumer_site=consumer_site_access.consumer_site,
        )
        PlaylistAccessFactory(user=cls.user, playlist=from_playlist, role=ADMINISTRATOR)

        PortabilityRequestFactory(from_playlist=from_playlist)

    def assertManagerReturnsExpectedPortabilityRequest(self, portability_request):
        """
        Assert that the manager returns the expected results when called:
         - to retrieve the portability request the user can answer to;
         - to retrieve the portability request the user can answer to
           and which they are allowed to see (`include_owned_requests`).
        """
        self.assertListEqual(
            list(PortabilityRequest.objects.regarding_user_id(self.user.id)),
            [portability_request],
        )

        self.assertListEqual(
            list(
                PortabilityRequest.objects.regarding_user_id(
                    self.user.id,
                    include_owned_requests=True,
                ).order_by(
                    "created_on",  # only to prevent test flakiness
                )
            ),
            [self.owned_portability_request, portability_request],
        )

    def test_regarding_user_id_when_is_owner_of_the_playlist(self):
        """
        The manager should return a list of portability requests
        when the user is owner of the requested playlist.
        """
        portability_request = PortabilityRequestFactory(
            resource__playlist__created_by=self.user,
        )

        self.assertManagerReturnsExpectedPortabilityRequest(portability_request)

    def test_regarding_user_id_when_has_admin_role_on_playlist(self):
        """
        The manager should return a list of portability requests
        when the user has admin rights on the requested playlist.
        """
        portability_request = PortabilityRequestFactory()
        PlaylistAccessFactory(
            user=self.user,
            playlist=portability_request.for_playlist,
            role=ADMINISTRATOR,
        )

        self.assertManagerReturnsExpectedPortabilityRequest(portability_request)

    def test_regarding_user_id_when_has_admin_role_on_organization(self):
        """
        The manager should return a list of portability requests
        when the user has admin rights on the requested playlist's organization.
        """
        organization_access = OrganizationAccessFactory(
            user=self.user,
            role=ADMINISTRATOR,
        )
        portability_request = PortabilityRequestFactory(
            resource__playlist__organization=organization_access.organization,
        )

        self.assertManagerReturnsExpectedPortabilityRequest(portability_request)

    def test_regarding_user_id_when_has_admin_role_on_consumer_site(self):
        """
        The manager should return a list of portability requests
        when the user has admin rights on the requested playlist's consumer site.
        """
        consumer_site_access = ConsumerSiteAccessFactory(
            user=self.user,
            role=ADMINISTRATOR,
        )
        portability_request = PortabilityRequestFactory(
            resource__playlist__consumer_site=consumer_site_access.consumer_site,
        )

        self.assertManagerReturnsExpectedPortabilityRequest(portability_request)

    def test_regarding_user_id_when_several_admin(self):
        """The returned results should not be duplicated."""
        consumer_site_access = ConsumerSiteAccessFactory(
            user=self.user,
            role=ADMINISTRATOR,
        )
        ConsumerSiteAccessFactory.create_batch(  # other administrators
            5,
            consumer_site=consumer_site_access.consumer_site,
        )
        organization_access = OrganizationAccessFactory(
            user=self.user,
            role=ADMINISTRATOR,
        )
        OrganizationAccessFactory.create_batch(  # other administrators
            5,
            organization=organization_access.organization,
        )
        portability_request = PortabilityRequestFactory(
            resource__playlist__consumer_site=consumer_site_access.consumer_site,
            resource__playlist__organization=organization_access.organization,
        )

        self.assertManagerReturnsExpectedPortabilityRequest(portability_request)


class PortabilityRequestStateTestCase(TestCase):
    """Test our intentions about the PortabilityRequestState enum."""

    def test_choices(self):
        """The get_choices method should return the expected value."""
        self.assertListEqual(
            PortabilityRequestState.choices,
            [
                # (Enum value, display/translated value)
                ("pending", "pending"),
                ("accepted", "accepted"),
                ("rejected", "rejected"),
            ],
        )

    def test_model_state_display_values(self):
        """The model should display the expected values."""
        self.assertEqual(
            PortabilityRequestFactory(
                state=PortabilityRequestState.PENDING.value
            ).get_state_display(),
            "pending",
        )
        self.assertEqual(
            PortabilityRequestFactory(
                state=PortabilityRequestState.ACCEPTED.value
            ).get_state_display(),
            "accepted",
        )
        self.assertEqual(
            PortabilityRequestFactory(
                state=PortabilityRequestState.REJECTED.value
            ).get_state_display(),
            "rejected",
        )
