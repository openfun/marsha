"""Specific classroom related simple JWT helpers."""
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from marsha.core.models import NONE
from marsha.core.simple_jwt.tokens import ResourceAccessToken


def create_classroom_stable_invite_jwt(classroom, role=NONE, permissions=None):
    """Create a resource JWT to be used in classroom invite links.

    Parameters
    ----------
    classroom : Type[models.Classroom]
        The classroom for which we want to create a JWT.

    role : str
        The role to use in the JWT. If not set, the no role is used.

    permissions : dict
        The permissions to use in the JWT. If not set, no permissions are used.

    Returns
    -------
    ResourceAccessToken
        The JWT.

    """
    resource_jwt = ResourceAccessToken.for_resource_id(
        resource_id=str(classroom.id),
        session_id=f"{classroom.id}-invite",
        roles=[role],
        permissions=permissions or {},
    )

    # Set a fixed JWT ID
    resource_jwt.set_jti(
        f"classroom-invite-{classroom.id}-{classroom.created_on.strftime('%Y-%m-%d')}"
    )

    # Set a fixed validity beginning: the classroom creation date
    resource_jwt.set_iat(at_time=classroom.created_on)

    # Determine the validity end:
    # - if the classroom has a starting date, the JWT is valid
    #   until the starting date plus two days
    # - if the classroom has no starting date, the JWT is valid
    #   for a month **starting now** (not on classroom creation)
    if classroom.starting_at:
        validity_end = classroom.starting_at + timedelta(days=2)
    else:
        validity_end = timezone.now().replace(
            hour=0, minute=0, second=0, microsecond=0
        ) + timedelta(days=settings.BBB_INVITE_JWT_DEFAULT_DAYS_DURATION)

    resource_jwt.set_exp(
        from_time=classroom.created_on,
        lifetime=validity_end - classroom.created_on,
    )

    return resource_jwt
