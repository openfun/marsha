"""
Models for the deposit app of the Marsha project.

In this base model, we activate generic behaviours that apply to all our models and enforce
checks and validation that go further than what Django is doing.
"""

import logging

from django.db import models
from django.utils.translation import gettext_lazy as _

from marsha.core.models import BaseModel, Playlist, UploadableFileMixin
from marsha.core.utils.time_utils import to_timestamp


logger = logging.getLogger(__name__)


class FileDepository(BaseModel):
    """Model representing a main container for a file depository."""

    RESOURCE_NAME = "filedepositories"

    playlist = models.ForeignKey(
        to=Playlist,
        related_name="filedepositories",
        verbose_name=_("playlist"),
        help_text=_("playlist to which this file depository belongs"),
        # don't allow hard deleting a playlist if it still contains file_depository
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
        help_text=_("title of the file depository"),
        null=True,
        blank=True,
    )
    description = models.TextField(
        verbose_name=_("description"),
        help_text=_("description of the file depository"),
        null=True,
        blank=True,
    )
    position = models.PositiveIntegerField(
        verbose_name=_("position"),
        help_text=_("position of this file depository in the playlist"),
        default=0,
    )

    class Meta:
        """Options for the ``FileDepository`` model."""

        db_table = "file_depository"
        verbose_name = _("File depository")
        verbose_name_plural = _("File depositories")
        constraints = [
            models.UniqueConstraint(
                fields=["lti_id", "playlist"],
                condition=models.Q(deleted=None),
                name="file_depository_unique_idx",
            )
        ]

    @staticmethod
    def get_ready_clause():
        """Clause used in lti.utils.get_or_create_resource to filter the file_depositories.

        Only show file_depositories that have successfully been created.

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


class DepositedFile(UploadableFileMixin, BaseModel):
    """Model representing a file in a file depository."""

    RESOURCE_NAME = "depositedfiles"
    S3_IDENTIFIER = "depositedfile"

    file_depository = models.ForeignKey(
        to=FileDepository,
        related_name="deposited_files",
        verbose_name=_("file depository"),
        help_text=_("file depository to which this deposited file belongs"),
        # don't allow hard deleting a file depository if it still contains a deposited file
        on_delete=models.PROTECT,
    )

    filename = models.CharField(
        max_length=255,
        verbose_name=_("filename"),
        help_text=_("filename of the deposited file"),
        null=True,
        blank=True,
    )

    author_name = models.CharField(
        max_length=255,
        verbose_name=_("author name"),
        help_text=_("author name of the deposited file"),
        null=True,
        blank=True,
    )

    author_id = models.CharField(
        max_length=255,
        verbose_name=_("author id"),
        help_text=_("author id of the deposited file"),
        null=True,
        blank=True,
    )

    size = models.PositiveIntegerField(
        verbose_name=_("size"),
        help_text=_("size of the deposited file"),
        null=True,
        blank=True,
    )

    extension = models.CharField(
        blank=True,
        default=None,
        help_text=_("deposited file extension"),
        max_length=10,
        null=True,
        verbose_name=_("extension"),
    )

    read = models.BooleanField(
        default=False,
        help_text=_("whether the file has been read by an instructor"),
        verbose_name=_("read"),
    )

    class Meta:
        """Options for the ``DepositedFile`` model."""

        db_table = "deposited_file"
        ordering = ["-uploaded_on", "-created_on"]
        verbose_name = _("Deposited file")
        verbose_name_plural = _("Deposited files")

    def get_source_s3_key(self, stamp=None, extension=None):
        """Compute the S3 key in the source bucket.

        It is built from the file deposit ID + ID of the deposited file + version stamp.

        Parameters
        ----------
        stamp: Type[string]
            Passing a value for this argument will return the source S3 key for the deposited file
            assuming its active stamp is set to this value. This is useful to create an
            upload policy for this prospective version of the track, so that the client can
            upload the file to S3 and the confirmation lambda can set the `uploaded_on` field
            to this value only after the file upload and processing is successful.


        extension: Type[string]
            The extension used by the uploaded media. This extension is added at the end of the key
            to keep a record of the extension. We will use it in the update-state endpoint to
            record it in the database.

        Returns
        -------
        string
            The S3 key for the deposited file in the source bucket, where uploaded files are
            stored before they are converted and copied to the destination bucket.

        """
        # We don't want to deal with None value so we set it with an empty string
        extension = extension or ""

        # We check if the extension starts with a leading dot or not. If it's not the case we add
        # it at the beginning of the string
        if extension and not extension.startswith("."):
            extension = "." + extension

        stamp = stamp or to_timestamp(self.uploaded_on)
        return f"{self.file_depository.pk}/depositedfile/{self.pk}/{stamp}{extension}"

    def update_upload_state(self, upload_state, uploaded_on, **extra_parameters):
        """Manage upload state.

        Parameters
        ----------
        upload_state: Type[string]
            state of the upload in AWS.

        uploaded_on: Type[DateTime]
            datetime at which the active version of the file was uploaded.

        extra_paramters: Type[Dict]
            Dictionnary containing arbitrary data sent from AWS lambda.
        """
        if "extension" in extra_parameters:
            self.extension = extra_parameters["extension"]

        super().update_upload_state(upload_state, uploaded_on, **extra_parameters)
