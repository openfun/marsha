"""Test the marsha's account models."""

from django.core.exceptions import ValidationError
from django.test import TestCase

from marsha.account.models import IdpOrganizationAssociation
from marsha.core.factories import OrganizationFactory


class IdpOrganizationAssociationTestCase(TestCase):
    """Test case for the `IdpOrganizationAssociation` model."""

    @classmethod
    def setUpClass(cls):
        """Init all tests once with an organization and an already existing association"""
        super().setUpClass()
        cls.organization = OrganizationFactory()
        cls.idp_entity_id = "https://some-idp.com/entity/id/"
        IdpOrganizationAssociation.objects.create(
            organization=cls.organization,
            idp_identifier=cls.idp_entity_id,
        )

    def test_unicity(self):
        """Asserts we can only link twice the same identity provider to the same organization"""
        with self.assertRaises(ValidationError) as exception_context_manager:
            IdpOrganizationAssociation.objects.create(
                organization=self.organization,
                idp_identifier=self.idp_entity_id,
            )

        raised_exception = exception_context_manager.exception
        self.assertListEqual(
            raised_exception.messages,
            [
                "Idp organization association with this Identity provider ID already exists.",
            ],
        )

    def test_one_organization_many_identity_providers(self):
        """Asserts the same organization can be linked to several identity providers"""
        IdpOrganizationAssociation.objects.create(
            organization=self.organization,
            idp_identifier="https://some-other-idp.com/entity/id/",
        )

        IdpOrganizationAssociation.objects.create(
            organization=self.organization,
            idp_identifier="https://my-idp.com/entity/id/",
        )

        self.assertEqual(
            IdpOrganizationAssociation.objects.filter(
                organization=self.organization
            ).count(),
            3,
        )

    def test_one_identity_provider_many_organizations(self):
        """Asserts the same identity provider cannot be linked to several organizations"""
        with self.assertRaises(ValidationError) as exception_context_manager:
            IdpOrganizationAssociation.objects.create(
                organization=OrganizationFactory(),
                idp_identifier=self.idp_entity_id,
            )
        raised_exception = exception_context_manager.exception
        self.assertListEqual(
            raised_exception.messages,
            [
                "Idp organization association with this Identity provider ID already exists.",
            ],
        )
