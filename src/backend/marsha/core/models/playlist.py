"""This module holds the model for playlist resources."""
from datetime import timedelta
import logging

from django.db import models
from django.db.models import Q
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from safedelete import HARD_DELETE
from safedelete.managers import SafeDeleteManager
from safedelete.queryset import SafeDeleteQueryset

from marsha.core.models.account import ADMINISTRATOR, INSTRUCTOR, ROLE_CHOICES
from marsha.core.models.base import BaseModel
from marsha.core.tasks.video import delete_s3_video


logger = logging.getLogger(__name__)


class PlaylistQueryset(SafeDeleteQueryset):
    """A queryset to provide helper for querying playlist."""

    def annotate_can_edit(self, user_id):
        """
        Annotate the queryset with a boolean indicating if the user can act
        on the playlist.

        Parameters
        ----------
        user_id : str
            The user ID to who is concerned by the permission.
            We use the user ID here because it can be provided from UserToken

        Returns
        -------
        QuerySet
            The annotated queryset.
        """
        return self.annotate(
            can_edit=models.Case(
                models.When(
                    Q(
                        user_accesses__user_id=user_id,
                        user_accesses__role__in=[ADMINISTRATOR, INSTRUCTOR],
                    )
                    | Q(
                        organization__user_accesses__user_id=user_id,
                        organization__user_accesses__role=ADMINISTRATOR,
                    ),
                    then=models.Value(True),
                ),
                default=models.Value(False),
                output_field=models.BooleanField(),
            )
        )


class Playlist(BaseModel):
    """Model representing a playlist which is a list of resources."""

    title = models.CharField(
        max_length=255, verbose_name=_("title"), help_text=_("title of the playlist")
    )
    lti_id = models.CharField(
        max_length=255,
        verbose_name=_("lti id"),
        help_text=_("ID for synchronization with an external LTI tool"),
        null=True,
        blank=True,
    )
    organization = models.ForeignKey(
        to="Organization",
        related_name="playlists",
        # playlist is (soft-)deleted if organization is (soft-)deleted
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    consumer_site = models.ForeignKey(
        to="ConsumerSite",
        related_name="playlists",
        # playlist is (soft-)deleted if consumer site is (soft-)deleted
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    created_by = models.ForeignKey(
        to="User",
        related_name="created_playlists",
        # playlist is (soft-)deleted if author is (soft-)deleted
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    is_public = models.BooleanField(
        default=False,
        verbose_name=_("is public"),
        help_text=_("if this playlist can be viewed without any access control"),
    )
    duplicated_from = models.ForeignKey(
        to="self",
        related_name="duplicates",
        verbose_name=_("duplicated from"),
        help_text=_("original playlist this one was duplicated from"),
        # don't delete a playlist if the one it was duplicated from is hard deleted
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    users = models.ManyToManyField(
        to="User",
        through="PlaylistAccess",
        related_name="playlists",
        verbose_name=_("users"),
        help_text=_("users who have been granted access to this playlist"),
    )
    is_portable_to_playlist = models.BooleanField(
        default=True,
        help_text=_(
            "Are all resources in this playlist portable to any playlist in this consumer site"
        ),
    )
    is_portable_to_consumer_site = models.BooleanField(
        default=False,
        help_text=_(
            "Are all resources in this playlist portable to any playlist in other consumer sites"
        ),
    )
    portable_to = models.ManyToManyField(
        to="self",
        through="PlaylistPortability",
        verbose_name=_("portable to playlists"),
        help_text=_("Playlists to which the resources in this playlist are portable."),
        symmetrical=False,
        related_name="reachable_from",
        blank=True,
    )
    retention_duration = models.PositiveIntegerField(
        blank=True,
        null=True,
        help_text=_(
            "Duration in days after which the related objects should be deleted"
        ),
        verbose_name=_("retention duration in day"),
    )
    is_claimable = models.BooleanField(
        default=True,
        help_text=_("Allow LTI users to claim this playlist"),
        verbose_name=_("is claimable"),
    )

    objects = SafeDeleteManager(PlaylistQueryset)

    class Meta:
        """Options for the ``Playlist`` model."""

        db_table = "playlist"
        verbose_name = _("playlist")
        verbose_name_plural = _("playlists")
        constraints = [
            models.UniqueConstraint(
                fields=["lti_id", "consumer_site"],
                condition=models.Q(deleted=None),
                name="playlist_unique_idx",
            ),
            models.CheckConstraint(
                name="consumer_site_or_organization_check_idx",
                check=models.Q(
                    # In LTI context
                    models.Q(
                        # organization can be provided or not
                        consumer_site__isnull=False,
                        lti_id__isnull=False,
                    )
                    # In standalone site context
                    | models.Q(
                        consumer_site__isnull=True,
                        lti_id__isnull=True,
                        organization__isnull=False,
                    )
                ),
            ),
        ]

    def __str__(self):
        """Get the string representation of an instance."""
        result = f"{self.title}"
        if self.deleted:
            result = _("{:s} [deleted]").format(result)
        return result


class PlaylistPortability(BaseModel):
    """Model representing portability between playlists.

    ``through`` model between ``Playlist.portable_to`` and ``Playlist.reachable_from``.

    """

    # we allow deleting entries in this through table
    _safedelete_policy = HARD_DELETE

    source_playlist = models.ForeignKey(
        to=Playlist,
        related_name="portable_to_links",
        verbose_name=_("source playlist"),
        help_text=_("playlist that is portable."),
        # link is (soft-)deleted if source site is (soft-)deleted
        on_delete=models.CASCADE,
    )
    target_playlist = models.ForeignKey(
        to=Playlist,
        related_name="reachable_from_links",
        verbose_name=_("target playlist"),
        help_text=_("playlist to which portability is automatic."),
        # link is (soft-)deleted if target site is (soft-)deleted
        on_delete=models.CASCADE,
    )

    class Meta:
        """Options for the ``PlaylistPortability`` model."""

        db_table = "Playlist_portability"
        verbose_name = _("playlist portability")
        verbose_name_plural = _("playlist portabilities")
        constraints = [
            models.UniqueConstraint(
                fields=["source_playlist", "target_playlist"],
                condition=models.Q(deleted=None),
                name="playlist_portability_unique_idx",
            )
        ]

    def __str__(self):
        """Get the string representation of an instance."""
        kwargs = {"source": self.source_playlist, "target": self.target_playlist}
        if self.deleted:
            return _("{source} was portable to {target}").format(**kwargs)
        return _("{source} is portable to {target}").format(**kwargs)


class PlaylistAccess(BaseModel):
    """
    Model representing accesses to playlists that are granted to users.

    ``through`` model between ``Playlist.users`` and ``User.playlists``.
    """

    # we allow deleting entries in this through table
    _safedelete_policy = HARD_DELETE

    user = models.ForeignKey(
        to="User",
        related_name="playlist_accesses",
        verbose_name=_("user"),
        help_text=_("user who has access to the playlist"),
        # link is (soft-)deleted if user is (soft-)deleted
        on_delete=models.CASCADE,
    )
    playlist = models.ForeignKey(
        to="Playlist",
        related_name="user_accesses",
        verbose_name=_("playlist"),
        help_text=_("playlist to which the user has access"),
        # link is (soft-)deleted if playlist is (soft-)deleted
        on_delete=models.CASCADE,
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        verbose_name=_("role"),
        help_text=_("role granted to the user on the consumer site"),
        default=INSTRUCTOR,
    )

    class Meta:
        """Options for the ``PlaylistAccess`` model."""

        db_table = "playlist_access"
        verbose_name = _("playlist access")
        verbose_name_plural = _("playlist accesses")
        constraints = [
            models.UniqueConstraint(
                fields=["user", "playlist"],
                condition=models.Q(deleted=None),
                name="playlist_access_unique_idx",
            )
        ]


class RetentionDateObjectMixin(models.Model):
    """Mixin adding retention date fields and behaviors to playlist related resources."""

    retention_date = models.DateField(
        blank=True,
        null=True,
        help_text=_("Date when this playlist related object should be deleted"),
        verbose_name=_("retention date"),
    )

    def _handle_playlist_related_resource_expiration(self, is_created):
        """
        If the instance is being created, the function checks if the related playlist exists
        and if it has a retention duration.
        If it does, the function sets the `retention_date` of the instance to
        the current time plus the duration.

        If the instance is being updated, nothing should be done.

        If the instance is soft deleted. It calls `delete_s3_video` which is a celery task
        that will take care of deleting the video from S3.
        """
        # pylint: disable=protected-access

        if is_created:  # Creation
            playlist = self.playlist
            if (
                playlist and playlist.retention_duration
            ):  # Check if a related playlist is given
                self.retention_date = timezone.now().date() + timedelta(
                    days=playlist.retention_duration
                )
        else:  # Update or soft delete
            old_value = self.__class__.all_objects.get(pk=self.pk)
            if (
                old_value.deleted != self.deleted and self.deleted
            ):  # Soft delete behavior
                delete_s3_video.delay(str(self.pk))

    class Meta:
        """Options for the ``RetentionObjectMixin`` model."""

        abstract = True

    def save(self, *args, **kwargs):
        """
        Handle lifecycle configuration in S3.
        """
        self._handle_playlist_related_resource_expiration(self._state.adding)
        super().save(*args, **kwargs)
