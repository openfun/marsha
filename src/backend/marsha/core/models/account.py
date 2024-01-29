"""This module holds the models for the marsha project."""

import secrets
import string

from django.contrib.auth.models import AbstractUser, UserManager as DefaultUserManager
from django.contrib.sites.models import _simple_domain_name_validator
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _

from safedelete import HARD_DELETE
from safedelete.managers import SafeDeleteManager

from marsha.core.defaults import FEATURES_CHOICES, RESOURCES_CHOICES
from marsha.core.fields import InvertedArrayField
from marsha.core.models.base import BaseModel


OAUTH_CONSUMER_KEY_CHARS = string.ascii_uppercase + string.digits
OAUTH_CONSUMER_KEY_SIZE = 20
SHARED_SECRET_CHARS = string.ascii_letters + string.digits + "!#$%&*+-=?@^_"
SHARED_SECRET_SIZE = 40

ADMINISTRATOR, INSTRUCTOR, STUDENT, LEARNER, NONE = (
    "administrator",
    "instructor",
    "student",
    "learner",
    "none",
)
LTI_ROLES = {
    ADMINISTRATOR: {"administrator"},
    INSTRUCTOR: {"instructor", "teacher", "staff"},
    STUDENT: {"student", "learner"},
    NONE: {"none"},
}
ROLE_CHOICES = (
    (ADMINISTRATOR, _("administrator")),
    (INSTRUCTOR, _("instructor")),
    (STUDENT, _("student")),
)


class UserManager(DefaultUserManager, SafeDeleteManager):
    """Extends the default manager for users with the one for soft-deletion."""


class User(BaseModel, AbstractUser):
    """Model representing a user that can be authenticated to act on the Marsha instance."""

    objects = UserManager()

    class Meta:
        """Options for the ``User`` model."""

        db_table = "user"
        verbose_name = _("user")
        verbose_name_plural = _("users")

    def __str__(self):
        """Get the string representation of an instance."""
        result = f"{self.username}"
        if self.email:
            result += f" ({self.email})"
        if self.deleted:
            result += _(" [deleted]")
        return result


class LTIPassport(BaseModel):
    """
    Model representing an LTI passport for LTI consumers to interact with Marsha.

    An LTI passport stores credentials that can be used by an LTI consumer to interact with
    Marsha acting as an LTI provider.

    A passport can be granted for:
    - a playlist: to be used when we trust an instructor. A playlist pre-exists in Marsha. The
        course instructor receives credentials and associates them at the level of his/her
        course to handle the course videos inside the playlist.
    - a consumer site: to be used when we trust the administrator of a VLE (virtual learning
        environment). The administrator receives credentials and associates them at the level
        of the VLE so that all instructors on the VLE can handle their videos inside playlists
        that will be created on the fly.
    """

    oauth_consumer_key = models.CharField(
        max_length=255,
        verbose_name=_("oauth consumer key"),
        unique=True,
        help_text=_(
            "oauth consumer key to authenticate an LTI consumer on the LTI provider"
        ),
        editable=False,
    )
    shared_secret = models.CharField(
        max_length=255,
        verbose_name=_("shared secret"),
        help_text=_("LTI Shared secret"),
        editable=False,
    )
    consumer_site = models.ForeignKey(
        to="ConsumerSite",
        related_name="lti_passport_scopes",
        # don't delete an LTI passport if the related consumer site is hard deleted
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    playlist = models.ForeignKey(
        to="Playlist",
        related_name="lti_passport_scopes",
        # don't delete an LTI passport if the related playlist site is hard deleted
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    created_by = models.ForeignKey(
        to=User,
        related_name="lti_passports",
        # don't delete an LTI passport if the user who created it is hard deleted
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        editable=False,
    )
    is_enabled = models.BooleanField(
        verbose_name=_("is enabled"),
        help_text=_("whether the passport is enabled"),
        default=True,
    )

    class Meta:
        """Options for the ``LTIPassport`` model."""

        db_table = "lti_passport"
        verbose_name = _("LTI passport")
        verbose_name_plural = _("LTI passports")

    def __str__(self):
        """Get the string representation of an instance."""
        # pylint: disable=consider-using-f-string
        result = "{key:s}{type:s}".format(
            key=self.oauth_consumer_key,
            type=(
                " [cs]"
                if self.consumer_site_id
                else " [pl]" if self.playlist_id else ""
            ),
        )
        if self.deleted:
            result = _("{:s}[deleted]").format(result)
        return result

    def clean(self):
        """Clean instance fields before saving."""
        if self.consumer_site and self.playlist:
            message = _(
                "You should set either a Consumer Site or a Playlist, but not both."
            )
            raise ValidationError({"__all__": [message]})
        if not (self.consumer_site or self.playlist):
            raise ValidationError(
                {"__all__": [_("You must set either a Consumer Site or a Playlist.")]}
            )
        return super().clean()

    # pylint: disable=arguments-differ
    def save(self, *args, **kwargs):
        """Generate the oauth consumer key and shared secret randomly upon creation.

        Parameters
        ----------
        args : list
            Passed onto parent's `save` method
        kwargs: dict
            Passed onto parent's `save` method

        """
        self.full_clean()
        if not self.oauth_consumer_key:
            self.oauth_consumer_key = "".join(
                secrets.choice(OAUTH_CONSUMER_KEY_CHARS)
                for _ in range(OAUTH_CONSUMER_KEY_SIZE)
            )
        if not self.shared_secret:
            self.shared_secret = "".join(
                secrets.choice(SHARED_SECRET_CHARS) for _ in range(SHARED_SECRET_SIZE)
            )
        super().save(*args, **kwargs)


class ConsumerSite(BaseModel):
    """Model representing an external site with access to the Marsha instance."""

    name = models.CharField(
        max_length=50,
        verbose_name=_("display name"),
        help_text=_("name of the consumer site."),
    )
    domain = models.CharField(
        max_length=100,
        verbose_name=_("domain name"),
        help_text=_("base domain allowed for consumer site."),
        validators=[_simple_domain_name_validator],
    )
    portable_to = models.ManyToManyField(
        to="self",
        through="ConsumerSitePortability",
        verbose_name=_("portable to"),
        help_text=_(
            "consumer sites to which all resources in this consumer site are portable."
        ),
        symmetrical=False,
        related_name="reachable_from",
        blank=True,
    )
    users = models.ManyToManyField(
        to=User,
        through="ConsumerSiteAccess",
        verbose_name=_("users"),
        help_text=_("users who have been granted access to this consumer site."),
    )

    lrs_auth_token = models.TextField(
        verbose_name=_("LRS authentication token"),
        help_text=_("LRS authentication token used to communicate with a remote LRS"),
        blank=True,
    )

    lrs_url = models.CharField(
        max_length=150,
        verbose_name=_("LRS url"),
        help_text=_("LRS url used to communicate with a remote LRS"),
        blank=True,
    )

    lrs_xapi_version = models.CharField(
        max_length=10,
        verbose_name=_("xAPI version"),
        help_text=_("xAPI version used by the remote LRS server"),
        blank=True,
    )

    video_show_download_default = models.BooleanField(
        default=True,
        verbose_name=_("show video download"),
        help_text=_(
            "default value used for every newly created video to determine"
            " if the links to download a video are shown by default."
        ),
    )

    # list of resources that are active for this consumer site
    # stored as a list of inactive resources
    inactive_resources = InvertedArrayField(
        models.CharField(
            choices=RESOURCES_CHOICES,
            max_length=100,
            blank=True,
            null=True,
        ),
        verbose_name=_("active resources"),
        help_text=_("list of resources that are active for this consumer site."),
        default=list,
        blank=True,
    )

    # list of features that are active for this consumer site
    # stored as a list of inactive features
    inactive_features = InvertedArrayField(
        models.CharField(
            choices=FEATURES_CHOICES,
            max_length=100,
            blank=True,
            null=True,
        ),
        verbose_name=_("active features"),
        help_text=_("list of features that are active for this consumer site."),
        default=list,
        blank=True,
    )

    class Meta:
        """Options for the ``ConsumerSite`` model."""

        db_table = "consumer_site"
        verbose_name = _("consumer site")
        verbose_name_plural = _("consumer sites")

    def __str__(self):
        """Get the string representation of an instance."""
        result = f"{self.name} ({self.domain})"
        if self.deleted:
            result = _("{:s} [deleted]").format(result)
        return result


class ConsumerSitePortability(BaseModel):
    """Model representing portability between consumer sites.

    ``through`` model between ``ConsumerSite.portable_to`` and ``ConsumerSite.reachable_from``.

    """

    # we allow deleting entries in this through table
    _safedelete_policy = HARD_DELETE

    source_site = models.ForeignKey(
        to=ConsumerSite,
        related_name="portable_to_links",
        verbose_name=_("source site"),
        help_text=_("consumer site that is portable."),
        # link is (soft-)deleted if source site is (soft-)deleted
        on_delete=models.CASCADE,
    )
    target_site = models.ForeignKey(
        to=ConsumerSite,
        related_name="reachable_from_links",
        verbose_name=_("target site"),
        help_text=_("consumer site to which portability is automatic."),
        # link is (soft-)deleted if target site is (soft-)deleted
        on_delete=models.CASCADE,
    )

    class Meta:
        """Options for the ``ConsumerSitePortability`` model."""

        db_table = "consumersite_portability"
        verbose_name = _("consumer site portability")
        verbose_name_plural = _("consumer site portabilities")
        constraints = [
            models.UniqueConstraint(
                fields=["source_site", "target_site"],
                condition=models.Q(deleted=None),
                name="consumersite_portability_unique_idx",
            )
        ]

    def __str__(self):
        """Get the string representation of an instance."""
        kwargs = {"source": self.source_site, "target": self.target_site}
        if self.deleted:
            return _("{source} was portable to {target}").format(**kwargs)
        return _("{source} is portable to {target}").format(**kwargs)


class ConsumerSiteAccess(BaseModel):
    """Model representing accesses to a consumer site that are granted to users."""

    # we allow deleting entries in this through table
    _safedelete_policy = HARD_DELETE

    user = models.ForeignKey(
        to=User,
        related_name="consumersite_accesses",
        verbose_name=_("user"),
        help_text=_("user with access to the consumer site"),
        # link is (soft-)deleted if user is (soft-)deleted
        on_delete=models.CASCADE,
    )
    consumer_site = models.ForeignKey(
        to=ConsumerSite,
        related_name="user_accesses",
        verbose_name=_("site"),
        help_text=_("consumer site to which the user has access"),
        # link is (soft-)deleted if site is (soft-)deleted
        on_delete=models.CASCADE,
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        verbose_name=_("role"),
        help_text=_("role granted to the user on the consumer site"),
        default=ADMINISTRATOR,
    )

    class Meta:
        """Options for the ``ConsumerSiteAccess`` model."""

        db_table = "consumersite_access"
        verbose_name = _("consumer site access")
        verbose_name_plural = _("consumer site accesses")
        constraints = [
            models.UniqueConstraint(
                fields=["user", "consumer_site"],
                condition=models.Q(deleted=None),
                name="consumersite_access_unique_idx",
            )
        ]

    def __str__(self):
        """Get the string representation of an instance."""
        kwargs: dict = {
            "user": self.user,
            "consumer_site": self.consumer_site,
            "role": self.get_role_display(),
        }
        if self.deleted:
            return _("{user} was {role} of {consumer_site}").format(**kwargs)
        return _("{user} is {role} of {consumer_site}").format(**kwargs)


class Organization(BaseModel):
    """Model representing an organization to manage its playlists on one or many sites."""

    name = models.CharField(
        max_length=255, verbose_name=_("name"), help_text=_("name of the organization")
    )
    consumer_sites = models.ManyToManyField(
        to=ConsumerSite,
        through="ConsumerSiteOrganization",
        related_name="organizations",
        verbose_name="consumer sites",
        help_text=_("consumer sites on which this organization is present"),
    )
    users = models.ManyToManyField(
        to=User,
        through="OrganizationAccess",
        verbose_name=_("users"),
        help_text=_("users who have been granted access to this organization"),
    )

    # list of resources that are active for this consumer site
    # stored as a list of inactive resources
    inactive_resources = InvertedArrayField(
        models.CharField(
            choices=RESOURCES_CHOICES,
            max_length=100,
            blank=True,
            null=True,
        ),
        verbose_name=_("active resources"),
        help_text=_("list of resources that are active for this organization."),
        default=list,
        blank=True,
    )

    # list of features that are active for this consumer site
    # stored as a list of inactive features
    inactive_features = InvertedArrayField(
        models.CharField(
            choices=FEATURES_CHOICES,
            max_length=100,
            blank=True,
            null=True,
        ),
        verbose_name=_("active features"),
        help_text=_("list of features that are active for this organization."),
        default=list,
        blank=True,
    )

    class Meta:
        """Options for the ``Organization`` model."""

        db_table = "organization"
        verbose_name = _("organization")
        verbose_name_plural = _("organizations")

    def __str__(self):
        """Get the string representation of an instance."""
        result = f"{self.name}"
        if self.deleted:
            result += _(" [deleted]")
        return result


class ConsumerSiteOrganization(BaseModel):
    """Model representing organizations in sites.

    ``through`` model between ``Organization.sites`` and ``ConsumerSite.organizations``.

    """

    # we allow deleting entries in this through table
    _safedelete_policy = HARD_DELETE

    consumer_site = models.ForeignKey(
        to=ConsumerSite,
        related_name="organizations_links",
        verbose_name=_("site"),
        help_text=_("consumer site having this organization"),
        # link is (soft-)deleted if site is (soft-)deleted
        on_delete=models.CASCADE,
    )
    organization = models.ForeignKey(
        to=Organization,
        related_name="sites_links",
        verbose_name=_("organization"),
        help_text=_("organization in this consumer site"),
        # link is (soft-)deleted if organization is (soft-)deleted
        on_delete=models.CASCADE,
    )

    class Meta:
        """Options for the ``ConsumerSiteOrganization`` model."""

        db_table = "consumersite_organization"
        verbose_name = _("organization in consumer site")
        verbose_name_plural = _("organizations in consumer sites")
        constraints = [
            models.UniqueConstraint(
                fields=["consumer_site", "organization"],
                condition=models.Q(deleted=None),
                name="consumersite_organization_unique_idx",
            )
        ]

    def __str__(self):
        """Get the string representation of an instance."""
        kwargs = {
            "organization": self.organization,
            "consumer_site": self.consumer_site,
        }
        if self.deleted:
            return _("{organization} was in {consumer_site}").format(**kwargs)
        return _("{organization} is in {consumer_site}").format(**kwargs)


class OrganizationAccess(BaseModel):
    """
    Model representing accesses to an organization that are granted to users.

    ``through`` model between ``Organization.users`` and ``User.linked_organizations``.

    """

    # we allow deleting entries in this through table
    _safedelete_policy = HARD_DELETE

    user = models.ForeignKey(
        to=User,
        related_name="organization_accesses",
        verbose_name=_("user"),
        help_text=_("user who has access to the organization"),
        # link is (soft-)deleted if user is (soft-)deleted
        on_delete=models.CASCADE,
    )
    organization = models.ForeignKey(
        to=Organization,
        related_name="user_accesses",
        verbose_name=_("organization"),
        help_text=_("organization to which the user has access"),
        # link is (soft-)deleted if organization is (soft-)deleted
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
        """Options for the ``OrganizationManager`` model."""

        db_table = "organization_access"
        verbose_name = _("organization access")
        verbose_name_plural = _("organization accesses")
        constraints = [
            models.UniqueConstraint(
                fields=["user", "organization"],
                condition=models.Q(deleted=None),
                name="organization_access_unique_idx",
            )
        ]

    def __str__(self):
        """Get the string representation of an instance."""
        kwargs = {
            "user": self.user,
            "organization": self.organization,
            "role": self.get_role_display(),
        }
        if self.deleted:
            return _("{user} was {role} of {organization}").format(**kwargs)

        return _("{user} is {role} of {organization}").format(**kwargs)


class LtiUserAssociation(BaseModel):
    """Model linking an LTI authenticated user to a marsha user."""

    lti_user_id = models.CharField(
        max_length=255,
        verbose_name=_("LTI user ID"),
        help_text=_("LMS user ID"),
        db_index=True,
    )
    consumer_site = models.ForeignKey(
        to=ConsumerSite,
        related_name="lti_user_associations",
        verbose_name=_("consumer site"),
        help_text=_("consumer site related to this user association"),
        on_delete=models.CASCADE,
    )
    user = models.ForeignKey(
        to=User,
        related_name="lti_user_associations",
        verbose_name=_("user"),
        help_text=_("user related to this user association"),
        on_delete=models.CASCADE,
    )

    class Meta:
        """Options for the ``LtiUserAssociation`` model."""

        db_table = "lti_user_association"
        verbose_name = _("LTI user association")
        verbose_name_plural = _("LTI user associations")
        constraints = [
            models.UniqueConstraint(
                fields=["lti_user_id", "consumer_site"],
                condition=models.Q(deleted=None),
                name="lti_user_association_unique_per_consumer_site_idx",
            )
        ]

    def __str__(self):
        """Get the string representation of an instance."""
        result = f"{self.consumer_site_id}_{self.lti_user_id} -> {self.user_id}"
        if self.deleted:
            result += _(" [deleted]")
        return result
