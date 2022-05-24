"""This module holds the models for marsha's `account` application."""

from django.db import models
from django.utils.translation import gettext_lazy as _

from marsha.core.models import BaseModel, Organization


class IdpOrganizationAssociation(BaseModel):
    """
    Simple association between an Identity Provider and an Organization.

    Initially implemented for Renater, we identify the IdP using the SAML
    entity ID as we don't store them in database. Any "key" may be later
    used to identify uniquely an Identity Provider.
    """

    idp_identifier = models.CharField(
        max_length=255,
        db_index=True,
        unique=True,
        verbose_name=_("identity provider ID"),
        help_text=_("allows to know which IdP is linked (eg. the Entity ID for SAML)"),
    )
    organization = models.ForeignKey(
        to=Organization,
        related_name="identity_providers",
        verbose_name=_("organization"),
        help_text=_("organization linked to the identity provider"),
        on_delete=models.CASCADE,
    )

    class Meta:
        app_label = "account"
        db_table = "idp_organization_association"
