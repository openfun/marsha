"""
Models for the bbb app of the Marsha project.

In this base model, we activate generic behaviours that apply to all our models and enforce
checks and validation that go further than what Django is doing.
"""

import logging
import uuid

from django.db import models
from django.utils.translation import gettext_lazy as _

from marsha.core.models import BaseModel, Playlist


logger = logging.getLogger(__name__)


class ClassroomManager(models.Manager):
    """Model manager for a BBB classroom."""

    def create(self, *args, **kwargs):
        """Remove unexisting parameters added by `lti.utils.get_or_create_resource`."""
        kwargs.pop("upload_state", None)
        kwargs.pop("show_download", None)
        return super().create(*args, **kwargs)


class Classroom(BaseModel):
    """Model representing a BBB classroom."""

    RESOURCE_NAME = "classrooms"
    objects = ClassroomManager()

    playlist = models.ForeignKey(
        to=Playlist,
        related_name="%(class)ss",
        verbose_name=_("playlist"),
        help_text=_("playlist to which this classroom belongs"),
        # don't allow hard deleting a playlist if it still contains classroom
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
        help_text=_("title of the classroom"),
        null=True,
        blank=True,
    )
    description = models.TextField(
        verbose_name=_("description"),
        help_text=_("description of the classroom"),
        null=True,
        blank=True,
    )
    position = models.PositiveIntegerField(
        verbose_name=_("position"),
        help_text=_("position of this classroom in the playlist"),
        default=0,
    )

    meeting_id = models.UUIDField(
        verbose_name=_("BBB meeting id"),
        help_text=_("BBB meeting id as UUID"),
        default=uuid.uuid4,
        editable=False,
    )

    attendee_password = models.CharField(
        max_length=50,
        verbose_name=_("Attendee Password"),
        help_text=_(
            "The password that the join URL can later provide as its password parameter "
            "to indicate the user will join as a viewer."
        ),
        blank=True,
        null=True,
    )
    moderator_password = models.CharField(
        max_length=50,
        verbose_name=_("Moderator Password"),
        help_text=_(
            "The password that the join URL can later provide as its password parameter "
            "to indicate the user will join as a moderator."
        ),
        blank=True,
        null=True,
    )
    welcome_text = models.TextField(
        default=_("Welcome!"),
        verbose_name=_(
            "A welcome message that gets displayed on the chat window when the participant joins."
        ),
        blank=True,
        null=True,
    )
    started = models.BooleanField(default=False)
    ended = models.BooleanField(default=False)

    starting_at = models.DateTimeField(
        blank=True,
        verbose_name=_("starting at date and time"),
        help_text=_("Start date and time at which a classroom is scheduled."),
        null=True,
    )
    estimated_duration = models.DurationField(
        blank=True,
        null=True,
        verbose_name=_("estimated duration"),
        help_text=_("Estimated duration of the classroom in seconds."),
    )

    class Meta:
        """Options for the ``Classroom`` model."""

        db_table = "classroom"
        verbose_name = _("classroom")
        verbose_name_plural = _("classrooms")
        constraints = [
            models.UniqueConstraint(
                fields=["lti_id", "playlist"],
                condition=models.Q(deleted=None),
                name="classroom_unique_idx",
            )
        ]

    @property
    def slideshows(self):
        """Get slideshows for current classroom."""
        return []

    @staticmethod
    def get_ready_clause():
        """Clause used in lti.utils.get_or_create_resource to filter the classrooms.

        Only show classrooms that have successfully been created.

        Returns
        -------
        models.Q
            A condition added to a QuerySet
        """
        # return models.Q(started_on__isnull=False)
        return models.Q()

    def __str__(self):
        """Get the string representation of an instance."""
        result = f"{self.title}"
        if self.deleted:
            result = _("{:s} [deleted]").format(result)
        return result
