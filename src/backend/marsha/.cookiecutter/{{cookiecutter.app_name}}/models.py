"""
Models for the {{cookiecutter.app_name}} app of the Marsha project.

In this base model, we activate generic behaviours that apply to all our models and enforce
checks and validation that go further than what Django is doing.
"""

import logging

from django.db import models
from django.utils.translation import gettext_lazy as _

from marsha.core.models import BaseModel, Playlist


logger = logging.getLogger(__name__)


class {{cookiecutter.model}}(BaseModel):
    """Model representing a {{cookiecutter.model_short_description}}."""

    RESOURCE_NAME = "{{cookiecutter.model_plural_lower}}"

    playlist = models.ForeignKey(
        to=Playlist,
        related_name="%(class)ss",
        verbose_name=_("playlist"),
        help_text=_("playlist to which this {{cookiecutter.model_lower}} belongs"),
        # don't allow hard deleting a playlist if it still contains {{cookiecutter.model_lower}}
        on_delete=models.PROTECT,
    )
    lti_id = models.CharField(
        max_length=255,
        verbose_name=_("lti id"),
        help_text=_("ID for synchronization with an external LTI tool"),
        blank=True,
        null=True,
    )
    title = models.CharField(
        max_length=255,
        verbose_name=_("title"),
        help_text=_("title of the {{cookiecutter.model_lower}}"),
        null=True,
        blank=True,
    )
    description = models.TextField(
        verbose_name=_("description"),
        help_text=_("description of the {{cookiecutter.model_lower}}"),
        null=True,
        blank=True,
    )
    position = models.PositiveIntegerField(
        verbose_name=_("position"),
        help_text=_("position of this {{cookiecutter.model_lower}} in the playlist"),
        default=0,
    )

    class Meta:
        """Options for the ``{{cookiecutter.model}}`` model."""

        db_table = "{{cookiecutter.model_lower}}"
        verbose_name = _("{{cookiecutter.model_lower}}")
        verbose_name_plural = _("{{cookiecutter.model_plural_lower}}")
        constraints = [
            models.UniqueConstraint(
                fields=["lti_id", "playlist"],
                condition=models.Q(deleted=None),
                name="{{cookiecutter.model_lower}}_unique_idx",
            )
        ]

    @staticmethod
    def get_ready_clause():
        """Clause used in lti.utils.get_or_create_resource to filter the {{cookiecutter.model_plural_lower}}.

        Only show {{cookiecutter.model_plural_lower}} that have successfully been created.

        Returns
        -------
        models.Q
            A condition added to a QuerySet
        """
        return models.Q()

    def __str__(self):
        """Get the string representation of an instance."""
        result = f"{self.title}"
        if self.deleted:
            result = _("{:s} [deleted]").format(result)
        return result
