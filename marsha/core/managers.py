"""This module holds the managers for the marsha models."""

from django.contrib.auth.models import UserManager as DefaultUserManager

from safedelete.managers import SafeDeleteManager


class UserManager(DefaultUserManager, SafeDeleteManager):
    """Extends the default manager for users with the one for soft-deletion."""

    pass
