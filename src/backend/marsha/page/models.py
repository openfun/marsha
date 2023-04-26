"""
Models for the ``page`` app of the Marsha project.
"""

import logging

from django.db import models
from django.utils.translation import gettext_lazy as _

from marsha.core.models import BaseModel


logger = logging.getLogger(__name__)


class Page(BaseModel):
    """Model representing a page."""

    RESOURCE_NAME = "page"

    slug = models.SlugField(
        max_length=100,
        verbose_name=_("slug"),
        help_text=_("Page slug (/page/{slug})"),
        unique=True,
    )
    name = models.CharField(
        max_length=255,
        verbose_name=_("name"),
        help_text=_("Page displayed name"),
        null=False,
        blank=False,
    )
    content = models.TextField(
        verbose_name=_("content"),
        help_text=_("Content of the page in Markdown format"),
        null=True,
        blank=True,
    )
    is_published = models.BooleanField(
        verbose_name=_("is published"),
        help_text=_("Is the page ready to be shown publicly"),
        default=False,
    )

    class Meta:
        """Options for the ``Page`` model."""

        db_table = "page"
        ordering = ["created_on"]
        verbose_name = _("page")
        verbose_name_plural = _("page")
