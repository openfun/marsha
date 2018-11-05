"""This module holds the models for the marsha project."""
import random
import string

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

from safedelete import HARD_DELETE

from marsha.core.managers import UserManager

from .base import BaseModel, NonDeletedUniqueIndex


OAUTH_CONSUMER_KEY_CHARS = string.ascii_uppercase + string.digits
OAUTH_CONSUMER_KEY_SIZE = 20
SHARED_SECRET_CHARS = string.ascii_letters + string.digits + "!#$%&*+-=?@^_"
SHARED_SECRET_SIZE = 40

ADMINISTRATOR, INSTRUCTOR, STUDENT = ("administrator", "instructor", "student")
LTI_ROLES = {
    INSTRUCTOR: {"instructor", "teacher", "staff"},
    STUDENT: {"student", "learner"},
}
ROLE_CHOICES = (
    (ADMINISTRATOR, _("administrator")),
    (INSTRUCTOR, _("instructor")),
    (STUDENT, _("student")),
)


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
        if not self.oauth_consumer_key:
            self.oauth_consumer_key = "".join(
                random.choice(OAUTH_CONSUMER_KEY_CHARS)
                for _ in range(OAUTH_CONSUMER_KEY_SIZE)
            )
        if not self.shared_secret:
            self.shared_secret = "".join(
                random.choice(SHARED_SECRET_CHARS) for _ in range(SHARED_SECRET_SIZE)
            )
        super().save(*args, **kwargs)


class ConsumerSite(BaseModel):
    """Model representing an external site with access to the Marsha instance."""

    name = models.CharField(
        max_length=255, verbose_name=_("name"), help_text=_("Name of the site")
    )
    users = models.ManyToManyField(
        to=User,
        through="ConsumerSiteAccess",
        verbose_name=_("users"),
        help_text=_("users who have been granted access to this consumer site"),
    )

    class Meta:
        """Options for the ``ConsumerSite`` model."""

        db_table = "consumer_site"
        verbose_name = _("consumer site")
        verbose_name_plural = _("consumer sites")

    def __str__(self):
        """Get the string representation of an instance."""
        result = f"{self.name}"
        if self.deleted:
            result += _(" [deleted]")
        return result


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
        indexes = [NonDeletedUniqueIndex(["user", "consumer_site"])]

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
        indexes = [NonDeletedUniqueIndex(["consumer_site", "organization"])]

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
        indexes = [NonDeletedUniqueIndex(["user", "organization"])]

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
