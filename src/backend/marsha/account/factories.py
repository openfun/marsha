"""Factories for marsha.account module."""

import factory
from factory.django import DjangoModelFactory

from marsha.account import models


# usage of format function here is wanted in this file
# pylint: disable=consider-using-f-string


class IdpOrganizationAssociationFactory(DjangoModelFactory):
    """Factory to create an idp association for an organization."""

    class Meta:  # noqa
        model = models.IdpOrganizationAssociation

    organization = factory.SubFactory("marsha.core.factories.OrganizationFactory")
    idp_identifier = factory.Sequence("IdpOrganizationAssociation {:03d}".format)
