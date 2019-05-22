"""This module holds the model for files and derivated resources."""
from django.db import models
from django.utils.translation import gettext_lazy as _

from ..defaults import PENDING, STATE_CHOICES
from .account import User
from .base import BaseModel
from .playlist import Playlist


class BaseFile(BaseModel):
    """Base file model used by all our File based models."""

    title = models.CharField(
        max_length=255, verbose_name=_("title"), help_text=_("title of the file")
    )
    lti_id = models.CharField(
        max_length=255,
        verbose_name=_("lti id"),
        help_text=_("ID for synchronization with an external LTI tool"),
    )
    created_by = models.ForeignKey(
        to=User,
        related_name="created_%(class)s",
        verbose_name=_("author"),
        help_text=_("author of the file"),
        # file is (soft-)deleted if author is (soft-)deleted
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    playlist = models.ForeignKey(
        to=Playlist,
        related_name="%(class)ss",
        verbose_name=_("playlist"),
        help_text=_("playlist to which this file belongs"),
        # don't allow hard deleting a playlist if it still contains files
        on_delete=models.PROTECT,
    )
    duplicated_from = models.ForeignKey(
        to="self",
        related_name="duplicates",
        verbose_name=_("duplicated from"),
        help_text=_("original file this one was duplicated from"),
        # don't delete a file if the one it was duplicated from is hard deleted
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    uploaded_on = models.DateTimeField(
        verbose_name=_("uploaded on"),
        help_text=_("datetime at which the active version of the file was uploaded."),
        null=True,
        blank=True,
    )
    upload_state = models.CharField(
        max_length=20,
        verbose_name=_("upload state"),
        help_text=_("state of the upload in AWS."),
        choices=STATE_CHOICES,
        default=PENDING,
    )
    show_download = models.BooleanField(default=True)
    description = models.TextField(
        verbose_name=_("description"),
        help_text=_("description of the file"),
        null=True,
        blank=True,
    )
    position = models.PositiveIntegerField(
        verbose_name=_("position"),
        help_text=_("position of this file in the playlist"),
        default=0,
    )

    class Meta:
        """Options for the ``File`` model."""

        abstract = True

    def __str__(self):
        """Get the string representation of an instance."""
        result = f"{self.title}"
        if self.deleted:
            result = _("{:s} [deleted]").format(result)
        return result

    @property
    def is_ready_to_display(self):
        """Whether the file is ready to display (ie) has been sucessfully uploaded.

        The value of this field seems to be trivially derived from the value of the
        `uploaded_on` field but it is necessary for conveniency and clarity in the client.
        """
        return self.uploaded_on is not None

    @property
    def consumer_site(self):
        """Return the consumer site linked to this file via the playlist."""
        return self.playlist.consumer_site


class File(BaseFile):
    """Model representing a file."""

    class Meta:
        """Options for the ``File`` model."""

        db_table = "file"
        verbose_name = _("file")
        verbose_name_plural = _("files")
        constraints = [
            models.UniqueConstraint(
                fields=["lti_id", "playlist"],
                condition=models.Q(deleted=None),
                name="file_unique_idx",
            )
        ]
