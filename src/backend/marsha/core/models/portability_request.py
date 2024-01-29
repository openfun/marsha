"""This module holds the model for portability requests."""

from functools import reduce
from operator import or_

from django.db import models
from django.db.models import Q
from django.utils.translation import gettext_lazy as _, pgettext_lazy

from safedelete import HARD_DELETE
from safedelete.managers import SafeDeleteManager
from safedelete.queryset import SafeDeleteQueryset

from marsha.core.models.account import ADMINISTRATOR, ConsumerSite, User
from marsha.core.models.base import BaseModel
from marsha.core.models.playlist import Playlist


class PortabilityRequestState(models.TextChoices):
    """The state of the portability request."""

    PENDING = "pending", pgettext_lazy("portability request", "pending")
    ACCEPTED = "accepted", pgettext_lazy("portability request", "accepted")
    REJECTED = "rejected", pgettext_lazy("portability request", "rejected")


class PortabilityRequestQueryset(SafeDeleteQueryset):
    """A queryset to provide helper for querying portability requests."""

    def annotate_can_accept_or_reject(self, user_id, force_value=None):
        """
        Annotate the queryset with a boolean indicating if the user can act
        on the portability request.
        Required for the PortabilityRequestSerializer serializer.

        Parameters
        ----------
        user_id : str
            The user ID to filter portability requests for.
            We use the user ID here because it can be provided from UserToken

        force_value : optional[bool]
            If set, force the value of the annotation to `force_value`.
            Useful to avoid heavy request when we already know the answer.

        Returns
        -------
        QuerySet
            The annotated queryset.
        """
        if force_value is not None:
            return self.annotate(
                can_accept_or_reject=models.Value(
                    force_value, output_field=models.BooleanField()
                ),
            )

        return self.annotate(
            can_accept_or_reject=models.Case(
                models.When(
                    Q(
                        reduce(
                            or_,
                            PortabilityRequestManager.regarding_user_id_or_filters(
                                user_id
                            ),
                            Q(),
                        ),
                        state=PortabilityRequestState.PENDING.value,
                    ),
                    then=models.Value(True),
                ),
                default=models.Value(False),
                output_field=models.BooleanField(),
            )
        )


class PortabilityRequestManager(SafeDeleteManager):
    """Custom manager for portability requests."""

    @classmethod
    def regarding_user_id_or_filters(cls, user_id):
        """
        Get the Q filters to select the portability request a user is related to.
        """
        return [
            # Is owner of the linked playlist
            Q(for_playlist__created_by_id=user_id),
            # Has admin role on playlist
            Q(
                for_playlist__user_accesses__user_id=user_id,
                for_playlist__user_accesses__role=ADMINISTRATOR,
            ),
            # Has admin role on organization
            Q(
                for_playlist__organization__user_accesses__user_id=user_id,
                for_playlist__organization__user_accesses__role=ADMINISTRATOR,
            ),
            # Has admin role on consumer site
            Q(
                for_playlist__consumer_site__user_accesses__user_id=user_id,
                for_playlist__consumer_site__user_accesses__role=ADMINISTRATOR,
            ),
        ]

    def regarding_user_id(self, user_id, include_owned_requests=False, **kwargs):
        """
        Return portability requests related to a user.

        Parameters
        ----------
        user_id : str
            The user ID to filter portability requests for.
            We use the user ID here because it can be provided from UserToken

        include_owned_requests : bool
            If True, include portability requests owned by the user.

        kwargs : dict
            Additional filters to apply to the queryset.
        """
        if include_owned_requests:
            return self.filter(
                Q(from_user_id=user_id)
                | reduce(or_, self.regarding_user_id_or_filters(user_id), Q()),
                **kwargs,
            ).distinct()

        return self.filter(
            reduce(or_, self.regarding_user_id_or_filters(user_id), Q()), **kwargs
        ).distinct()


class PortabilityRequest(BaseModel):
    """
    Model representing a portability request for a specific resource.

    We only store the resource asked for portability for information purpose
    because it's actually the playlist which will be ported (for now).
    """

    # portability requests should have a quite short lifetime
    _safedelete_policy = HARD_DELETE

    for_playlist = models.ForeignKey(
        to=Playlist,
        related_name="portability_requests",
        verbose_name=_("for playlist"),
        help_text=_("playlist which portability is asked for"),
        on_delete=models.CASCADE,
    )

    from_playlist = models.ForeignKey(
        to=Playlist,
        related_name="portability_requesting_access",
        verbose_name=_("from playlist"),
        help_text=_("playlist requesting the access"),
        on_delete=models.CASCADE,
    )
    from_lti_consumer_site = models.ForeignKey(
        to=ConsumerSite,
        related_name="portability_requests",
        verbose_name=_("consumer site"),
        help_text=_("the requesting user's LTI consumer site"),
        on_delete=models.CASCADE,
    )
    from_lti_user_id = models.CharField(
        max_length=255,
        verbose_name=_("resource model"),
        help_text=_("the requesting user's LTI user ID"),
    )
    from_user = models.ForeignKey(
        to=User,
        related_name="portability_requests",
        verbose_name=_("user"),
        help_text=_("Marsha user requesting the portability"),
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )

    state = models.CharField(
        default=PortabilityRequestState.PENDING.value,
        max_length=20,
        verbose_name=_("request state"),
        help_text=_("state of the request"),
        choices=PortabilityRequestState.choices,
    )
    updated_by_user = models.ForeignKey(
        to=User,
        related_name="actioned_portability_requests",
        verbose_name=_("updated by user"),
        help_text=_("Marsha user who accepted or rejected the request"),
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )

    objects = PortabilityRequestManager(PortabilityRequestQueryset)

    class Meta:
        """Options for the ``PortabilityRequest`` model."""

        db_table = "portability_request"
        verbose_name = _("portability request")
        verbose_name_plural = _("portability requests")
        unique_together = (("for_playlist", "from_playlist"),)

    def __str__(self):
        """Get the string representation of a portability request."""
        return (
            f"Portability request from {self.from_playlist!s} for {self.for_playlist!s}"
        )
