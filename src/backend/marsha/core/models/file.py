"""This module holds the model for files and derivated resources."""
from django.db import models
from django.utils.translation import gettext_lazy as _

from ..defaults import PENDING, STATE_CHOICES
from ..utils.time_utils import to_timestamp
from .account import User
from .base import BaseModel


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

        extra_paramters: Type[Dict]
            Dictionnary containing arbitrary data sent from AWS lambda.
        """
        self.upload_state = upload_state
        if uploaded_on:
            self.uploaded_on = uploaded_on

        self.save()

    @property
    def is_ready_to_show(self):
        """Whether the file is ready to display (ie) has been sucessfully uploaded.

        The value of this field seems to be trivially derived from the value of the
        `uploaded_on` field but it is necessary for conveniency and clarity in the client.
        """
        return self.uploaded_on is not None


class PlaylistDocument(BaseModel):
    """Model for the relationship between a playlist and a document."""

    playlist = models.ForeignKey(
        to="Playlist",
        related_name="playlist_documents",
        verbose_name=_("playlist"),
        help_text=_("playlist to which this document belongs"),
        on_delete=models.CASCADE,
    )
    document = models.ForeignKey(
        to="Document",
        related_name="playlist_documents",
        verbose_name=_("document"),
        on_delete=models.CASCADE,
    )

    class Meta:
        """Options for the ``PlaylistDocument`` model."""

        db_table = "playlist_document"
        unique_together = ("playlist", "document")


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

    playlists = models.ManyToManyField(
        to="Playlist",
        through="PlaylistDocument",
        related_name="documents",
        verbose_name=_("playlists"),
        help_text=_("playlists to which this document belongs"),
        # don't allow hard deleting a playlist if it still contains documents
        # on_delete=models.PROTECT,
    )

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

    class Meta:
        """Options for the ``Document`` model."""

        db_table = "document"
        verbose_name = _("document")
        verbose_name_plural = _("documents")
        # constraints = [
        #     models.UniqueConstraint(
        #         fields=["lti_id", "playlist"],
        #         condition=models.Q(deleted=None),
        #         name="document_unique_idx",
        #     )
        # ]

    def get_source_s3_key(self, stamp=None, extension=None):
        """Compute the S3 key in the source bucket (ID of the file + version stamp).

        Parameters
        ----------
        stamp: Type[string]
            Passing a value for this argument will return the source S3 key for the document
            assuming its active stamp is set to this value. This is useful to create an upload
            policy for this prospective version of the document, so that the client can upload the
            file to S3 and the confirmation lambda can set the `uploaded_on` field to this value
            only after file upload is successful.
        extension: Type[string]
            The extension used by the uploaded file. This extension is added at the end of the key
            to keep a record of the extension. We will use it in the update-state endpoint to
            record it in the database.

        Returns
        -------
        string
            The S3 key for the document in the source bucket, where uploaded files are stored
            before they are moved to the destination bucket.

        """
        stamp = stamp or to_timestamp(self.uploaded_on)

        # We don't want to deal with None value so we set it with an empty string
        extension = extension or ""

        # We check if the extension starts with a leading dot or not. If it's not the case we add
        # it at the beginning of the string
        if extension and extension[:1] != ".":
            extension = "." + extension

        return "{pk!s}/document/{pk!s}/{stamp:s}{extension:s}".format(
            pk=self.pk, stamp=stamp, extension=extension
        )

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
