"""This module holds the model for files and derivated resources."""

from django.db import models
from django.utils.translation import gettext_lazy as _

from marsha.core.defaults import (
    AWS_STORAGE_BASE_DIRECTORY,
    DELETED_STORAGE_BASE_DIRECTORY,
    DOCUMENT_STORAGE_BASE_DIRECTORY,
    PENDING,
    SCW_S3,
    STATE_CHOICES,
    STORAGE_BASE_DIRECTORY,
    STORAGE_LOCATION_CHOICES,
)
from marsha.core.models.account import User
from marsha.core.models.base import BaseModel
from marsha.core.models.playlist import Playlist
from marsha.core.utils.time_utils import to_timestamp


class UploadableFileMixin(models.Model):
    """Mixin adding fields related to upload management."""

    S3_IDENTIFIER = None

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

    class Meta:
        """Options for the ``UploadableFileMixin`` model."""

        abstract = True

    # pylint: disable=unused-argument
    def update_upload_state(self, upload_state, uploaded_on, **extra_parameters):
        """Manage upload state.

        Parameters
        ----------
        upload_state: Type[string]
            state of the upload in AWS.

        uploaded_on: Type[DateTime]
            datetime at which the active version of the file was uploaded.

        extra_parameters: Type[Dict]
            Dictionary containing arbitrary data sent from AWS lambda.
        """
        self.upload_state = upload_state
        if uploaded_on:
            self.uploaded_on = uploaded_on

        self.save()

    @property
    def is_ready_to_show(self):
        """Whether the file is ready to display (ie) has been successfully uploaded.

        The value of this field seems to be trivially derived from the value of the
        `uploaded_on` field but it is necessary for convenience and clarity in the client.
        """
        return self.uploaded_on is not None

    def uploaded_on_stamp(self):
        """Return the timestamp of the file upload."""
        return to_timestamp(self.uploaded_on)


class BaseFile(UploadableFileMixin, BaseModel):
    """Base file model used by all our File based models."""

    title = models.CharField(
        max_length=255,
        verbose_name=_("title"),
        help_text=_("title of the file"),
        null=True,
        blank=True,
    )
    lti_id = models.CharField(
        max_length=255,
        verbose_name=_("lti id"),
        help_text=_("ID for synchronization with an external LTI tool"),
        blank=True,
        null=True,
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
    def consumer_site(self):
        """Return the consumer site linked to this file via the playlist."""
        return self.playlist.consumer_site


class Document(BaseFile):
    """Model representing a document."""

    RESOURCE_NAME = "documents"
    S3_IDENTIFIER = "document"

    extension = models.CharField(
        blank=True,
        default=None,
        help_text=_("file extension"),
        max_length=10,
        null=True,
        verbose_name=_("extension"),
    )

    is_public = models.BooleanField(
        default=False,
        verbose_name=_("is document public"),
        help_text=_("Is the document publicly accessible?"),
    )

    filename = models.CharField(
        max_length=255,
        verbose_name=_("filename"),
        help_text=_("filename of the document"),
        null=True,
        blank=True,
    )

    storage_location = models.CharField(
        max_length=255,
        verbose_name=_("storage location"),
        help_text=_("Location used to store the document"),
        choices=STORAGE_LOCATION_CHOICES,
        default=SCW_S3,
    )

    class Meta:
        """Options for the ``Document`` model."""

        db_table = "document"
        verbose_name = _("document")
        verbose_name_plural = _("documents")
        constraints = [
            models.UniqueConstraint(
                fields=["lti_id", "playlist"],
                condition=models.Q(deleted=None),
                name="document_unique_idx",
            )
        ]

    def get_storage_key(
        self,
        filename,
        base_dir: STORAGE_BASE_DIRECTORY = DOCUMENT_STORAGE_BASE_DIRECTORY,  # type: ignore
    ):
        """Compute the storage key for the document.

        Parameters
        ----------
        filename: Type[string]
            The filename of the uploaded media. For documents, the filename is
            directly set into the key.
        base: Type[STORAGE_BASE_DIRECTORY]
            The storage base directory. Defaults to Document. It will be used to
            compute the storage key.

        Returns
        -------
        string
            The storage key for the document, depending on the base directory
            passed.
        """
        base = base_dir
        if base == AWS_STORAGE_BASE_DIRECTORY:
            return f"{base}/{self.pk}/document/{filename}"

        if base == DELETED_STORAGE_BASE_DIRECTORY:
            base = f"{base}/{DOCUMENT_STORAGE_BASE_DIRECTORY}"

        return f"{base}/{self.pk}/{filename}"

    def update_upload_state(self, upload_state, uploaded_on, **extra_parameters):
        """Manage upload state.

        Parameters
        ----------
        upload_state: Type[string]
            state of the upload in AWS.

        uploaded_on: Type[DateTime]
            datetime at which the active version of the file was uploaded.

        extra_parameters: Type[Dict]
            Dictionary containing arbitrary data sent from AWS lambda.
        """
        self.extension = extra_parameters.get("extension")
        super().update_upload_state(upload_state, uploaded_on, **extra_parameters)

    @staticmethod
    def get_ready_clause():
        """Clause used in lti.utils.get_or_create_resource to filter the documents.

        Only show documents that have successfully gone through the upload process.

        Returns
        -------
        models.Q
            A condition added to a QuerySet
        """
        return models.Q(uploaded_on__isnull=False)


class AbstractImage(UploadableFileMixin, BaseModel):
    """Abstract model for images."""

    class Meta:
        """Options for the ``AbstractImage`` model."""

        abstract = True
