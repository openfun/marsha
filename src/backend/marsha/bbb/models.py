"""
Models for the bbb app of the Marsha project.

In this base model, we activate generic behaviours that apply to all our models and enforce
checks and validation that go further than what Django is doing.
"""

import logging
import uuid

from django.db import models
from django.utils.translation import gettext_lazy as _

from safedelete.managers import SafeDeleteManager

from marsha.core.models import BaseModel, Playlist, UploadableFileMixin
from marsha.core.utils.time_utils import to_timestamp


logger = logging.getLogger(__name__)


class ClassroomManager(SafeDeleteManager):
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

    # Tools & Application widget specific parameters
    enable_waiting_room = models.BooleanField(
        default=False, help_text=_("Enable or not waiting room for the classroom")
    )
    enable_shared_notes = models.BooleanField(
        default=True,
        help_text=_("Enable or not the shared notes option for the classroom"),
    )
    enable_chat = models.BooleanField(
        default=True, help_text=_("Enable or not the chat for the classroom")
    )
    enable_presentation_supports = models.BooleanField(
        default=True, help_text=_("Allow or not to share documents with the classroom")
    )
    enable_recordings = models.BooleanField(
        default=True, help_text=_("Enable or not to record the classroom sessions")
    )

    class Meta:
        """Options for the ``Classroom`` model."""

        db_table = "classroom"
        ordering = ["-created_on", "id"]
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

    def generate_disabled_features(self):
        """Generate the right string to pass as parameter in classroom creation"""
        disabled_features = []

        if not self.enable_chat:
            disabled_features.append("chat")
        if not self.enable_shared_notes:
            disabled_features.append("sharedNotes")
        if not self.enable_presentation_supports:
            disabled_features.append("presentation")

        return ",".join(disabled_features)


class ClassroomDocument(UploadableFileMixin, BaseModel):
    """Model representing a document in a classroom."""

    RESOURCE_NAME = "classroomdocuments"
    S3_IDENTIFIER = "classroomdocument"

    classroom = models.ForeignKey(
        to=Classroom,
        related_name="classroom_documents",
        verbose_name=_("classroom document"),
        help_text=_("clasroom to which this document belongs"),
        # don't allow hard deleting a classroom if it still contains a document
        on_delete=models.PROTECT,
    )

    filename = models.CharField(
        max_length=255,
        verbose_name=_("filename"),
        help_text=_("filename of the classroom document"),
        null=True,
        blank=True,
    )

    is_default = models.BooleanField(
        default=False,
        verbose_name=_("is default"),
        help_text=_("is displayed by default in the classroom"),
    )

    class Meta:
        """Options for the ``ClassroomDocument`` model."""

        db_table = "classroom_document"
        ordering = ["-uploaded_on", "-created_on"]
        verbose_name = _("Classroom document")
        verbose_name_plural = _("Classroom documents")

    def get_source_s3_key(self, stamp=None, extension=None):
        """Compute the S3 key in the source bucket.
        It is built from the classroom ID + ID of the classroom document + version stamp.
        Parameters
        ----------
        stamp: Type[string]
            Passing a value for this argument will return the source S3 key for the classroom
            document assuming its active stamp is set to this value. This is useful to create an
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
            The S3 key for the classroom document in the source bucket, where uploaded files are
            stored before they are converted and copied to the destination bucket.
        """
        # We don't want to deal with None value, so we set it with an empty string
        extension = extension or ""

        # We check if the extension starts with a leading dot or not. If it's not the case we add
        # it at the beginning of the string
        if extension and not extension.startswith("."):
            extension = "." + extension

        stamp = stamp or to_timestamp(self.uploaded_on)
        return f"{self.classroom.pk}/classroomdocument/{self.pk}/{stamp}{extension}"


class ClassroomRecording(BaseModel):
    """Model representing a recording in a classroom."""

    classroom = models.ForeignKey(
        to=Classroom,
        related_name="recordings",
        verbose_name=_("classroom recording"),
        help_text=_("classroom to which this recording belongs"),
        # Delete all records belonging to this classroom
        on_delete=models.CASCADE,
    )

    record_id = models.CharField(
        unique=True,
        max_length=255,
        verbose_name=_("BBB record id"),
        help_text=_("BBB meeting id"),
        editable=False,
    )

    video_file_url = models.CharField(
        max_length=255,
        verbose_name=_("video url"),
        help_text=_("url of the classroom recording"),
        null=True,
        blank=True,
    )

    started_at = models.DateTimeField(
        blank=True,
        verbose_name=_("Recording started at date and time"),
        help_text=_("Start date and time of the record."),
        null=True,
    )

    class Meta:
        """Options for the ``ClassroomRecording`` model."""

        db_table = "classroom_recording"
        ordering = ["-created_on"]
        verbose_name = _("Classroom recording")
        verbose_name_plural = _("Classroom recordings")
