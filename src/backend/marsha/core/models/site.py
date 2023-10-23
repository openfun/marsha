"""This module holds the model for content-type resources."""
from django.contrib.sites.models import Site
from django.db import models
from django.utils.translation import gettext_lazy as _

from marsha.core.defaults import FEATURES_CHOICES, RESOURCES_CHOICES
from marsha.core.fields import InvertedArrayField
from marsha.core.models.base import BaseModel


class SiteConfig(BaseModel):
    """Model to extend the django site model."""

    site = models.OneToOneField(
        to=Site,
        related_name="site_config",
        verbose_name=_("site"),
        # link is (soft-)deleted if source site is (soft-)deleted
        on_delete=models.CASCADE,
    )

    # list of content types that are active for this site
    # stored as a list of inactive content types
    inactive_resources = InvertedArrayField(
        models.CharField(
            choices=RESOURCES_CHOICES,
            max_length=100,
            blank=True,
            null=True,
        ),
        verbose_name=_("active resources"),
        help_text=_("list of active resources for this site."),
        default=list,
        blank=True,
    )

    # list of features that are active for this consumer site
    # stored as a list of inactive features
    inactive_features = InvertedArrayField(
        models.CharField(
            choices=FEATURES_CHOICES,
            max_length=100,
            blank=True,
            null=True,
        ),
        verbose_name=_("active features"),
        help_text=_("list of features that are active for this site."),
        default=list,
        blank=True,
    )

    login_html = models.TextField(
        verbose_name=_("login page text"),
        help_text=_("HTML to display on the login page"),
        null=True,
        blank=True,
    )

    logo_url = models.CharField(
        max_length=255,
        verbose_name=_("logo"),
        help_text=_("URl of the logo to display on the site"),
        null=True,
        blank=True,
    )

    is_logo_enabled = models.BooleanField(
        default=True,
        verbose_name=_("logo enabled"),
        help_text=_("Is the logo enabled ?"),
        null=True,
    )

    homepage_banner_title = models.CharField(
        max_length=255,
        verbose_name=_("Homepage banner title"),
        help_text=_("Homepage banner title"),
        blank=True,
        null=True,
    )
    homepage_banner_text = models.TextField(
        verbose_name=_("Homepage banner text"),
        help_text=_("Homepage banner text"),
        blank=True,
        null=True,
    )

    footer_copyright = models.CharField(
        max_length=255,
        verbose_name=_("footer text"),
        help_text=_("Text to display in the footer"),
        null=True,
        blank=True,
    )

    saml_technical_contact = models.JSONField(
        blank=True,
        default=dict,
        verbose_name=_("SAML technical contact"),
        help_text=_("Technical contact responsible for your app"),
    )

    saml_support_contact = models.JSONField(
        blank=True,
        default=dict,
        verbose_name=_("SAML support contact"),
        help_text=_("Support contact responsible for your app"),
    )

    saml_organization_info = models.JSONField(
        blank=True,
        default=dict,
        verbose_name=_("SAML organization info"),
        help_text=_("Organization info for your app"),
    )

    saml_entity_id = models.CharField(
        max_length=255,
        verbose_name=_("saml entity id"),
        help_text=_("should be a URL that includes a domain name you own"),
        null=True,
        blank=True,
    )

    def __str__(self):
        return f"Config associated to: {self.site.name}"

    class Meta:
        """Options for the ``SiteConfig`` model."""

        db_table = "site_config"
        verbose_name = _("site configuration")
        verbose_name_plural = _("sites configuration")
