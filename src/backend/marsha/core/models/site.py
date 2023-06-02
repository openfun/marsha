"""This module holds the model for content-type resources."""
from django.contrib.sites.models import Site
from django.db import models
from django.utils.translation import gettext_lazy as _

from ..defaults import RESOURCES_CHOICES
from ..fields import InvertedArrayField
from .base import BaseModel


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

    def __str__(self):
        return f"Config associated to: {self.site.name}"

    class Meta:
        """Options for the ``SiteConfig`` model."""

        db_table = "site_config"
        verbose_name = _("site configuration")
        verbose_name_plural = _("sites configuration")
