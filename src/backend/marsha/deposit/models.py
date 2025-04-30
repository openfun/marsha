"""
Models for the deposit app of the Marsha project.

In this base model, we activate generic behaviours that apply to all our models and enforce
checks and validation that go further than what Django is doing.
"""

import logging

from django.db import models
from django.utils.translation import gettext_lazy as _

from marsha.core.defaults import (
    DELETED_STORAGE_BASE_DIRECTORY,
    FILE_DEPOSITORY_STORAGE_BASE_DIRECTORY,
    SCW_S3,
    STORAGE_BASE_DIRECTORY,
    STORAGE_LOCATION_CHOICES,
)
from marsha.core.models import BaseModel, Playlist, UploadableFileMixin


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

    storage_location = models.CharField(
        max_length=255,
        verbose_name=_("storage location"),
        help_text=_("Location used to store the deposited file"),
        choices=STORAGE_LOCATION_CHOICES,
        default=SCW_S3,
    )

    class Meta:
        """Options for the ``DepositedFile`` model."""

        db_table = "deposited_file"
        ordering = ["-uploaded_on", "-created_on"]
        verbose_name = _("Deposited file")
        verbose_name_plural = _("Deposited files")

    def get_storage_key(
        self,
        filename,
        base_dir: STORAGE_BASE_DIRECTORY = FILE_DEPOSITORY_STORAGE_BASE_DIRECTORY,
    ):
        """Compute the storage key for the classroom document.

        Parameters
        ----------
        filename: Type[string]
            The filename of the uploaded media. For classroom documents, the filename is
            directly set into the key.
        base: Type[STORAGE_BASE_DIRECTORY]
            The storage base directory. Defaults to Classroom. It will be used to
            compute the storage key.

        Returns
        -------
        string
            The storage key for the classroom document, depending on the base directory
            passed.
        """
        base = base_dir
        if base == DELETED_STORAGE_BASE_DIRECTORY:
            base = f"{base}/{FILE_DEPOSITORY_STORAGE_BASE_DIRECTORY}"

        return f"{base}/{self.file_depository.pk}/depositedfile/{self.pk}/{filename}"

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
