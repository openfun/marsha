"""
Models for the bbb app of the Marsha project.

In this base model, we activate generic behaviours that apply to all our models and enforce
checks and validation that go further than what Django is doing.
"""

import logging
import uuid

from django.db import models
from django.utils.translation import gettext_lazy as _

from marsha.bbb.utils.bbb_utils import (
    ApiMeetingException,
    bbb_api_create,
    bbb_api_end,
    bbb_api_get_meeting_infos,
    bbb_api_join,
)
from marsha.core.models import BaseModel, Playlist


logger = logging.getLogger(__name__)


class MeetingManager(models.Manager):
    """Model manager for a BBB meeting."""

    def create(self, *args, **kwargs):
        """Remove unexisting parameters added by `lti.utils.get_or_create_resource`."""
        kwargs.pop("upload_state", None)
        kwargs.pop("show_download", None)
        return super().create(*args, **kwargs)


class Meeting(BaseModel):
    """Model representing a BBB meeting."""

    RESOURCE_NAME = "meetings"
    objects = MeetingManager()

    playlist = models.ForeignKey(
        to=Playlist,
        related_name="%(class)ss",
        verbose_name=_("playlist"),
        help_text=_("playlist to which this meeting belongs"),
        # don't allow hard deleting a playlist if it still contains meeting
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
        max_length=255, verbose_name=_("title"), help_text=_("title of the meeting")
    )
    description = models.TextField(
        verbose_name=_("description"),
        help_text=_("description of the meeting"),
        null=True,
        blank=True,
    )
    position = models.PositiveIntegerField(
        verbose_name=_("position"),
        help_text=_("position of this meeting in the playlist"),
        default=0,
    )

    meeting_id = models.UUIDField(
        verbose_name=_("meeting id"),
        help_text=_("BBB id for the meeting as UUID"),
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
            "The password that will join URL can later provide as its password parameter "
            "to indicate the user will as a moderator."
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

    started_on = models.DateTimeField(
        verbose_name=_("started on"),
        help_text=_("datetime at which the meeting was started."),
        null=True,
        blank=True,
    )

    class Meta:
        """Options for the ``Meeting`` model."""

        db_table = "meeting"
        verbose_name = _("meeting")
        verbose_name_plural = _("meetings")
        constraints = [
            models.UniqueConstraint(
                fields=["lti_id", "playlist"],
                condition=models.Q(deleted=None),
                name="meeting_unique_idx",
            )
        ]

    @property
    def slideshows(self):
        """Get slideshows for current meeting."""
        return []

    @staticmethod
    def get_ready_clause():
        """Clause used in lti.utils.get_or_create_resource to filter the meetings.

        Only show meetings that have successfully been created.

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

    def bbb_create(self):
        """Call BBB API to create a meeting."""
        api_response = bbb_api_create(self)
        self.started = True
        self.moderator_password = api_response["moderatorPW"]
        self.attendee_password = api_response["attendeePW"]
        self.save()
        return api_response

    def bbb_end(self, moderator=False):
        """Call BBB API to end a meeting."""
        return bbb_api_end(self, moderator)

    def bbb_join(self, fullname, moderator=False):
        """Call BBB API to join a meeting."""
        return bbb_api_join(self, fullname, moderator)

    def bbb_get_meeting_infos(self):
        """Call BBB API to retrieve meeting informations."""
        try:
            api_response = bbb_api_get_meeting_infos(self)
            self.started = api_response["returncode"] == "SUCCESS"
            self.save()
            return api_response
        except ApiMeetingException as exception:
            self.started = False
            self.save()
            raise exception
