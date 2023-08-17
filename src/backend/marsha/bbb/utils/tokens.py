"""Specific classroom related simple JWT helpers."""
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from marsha.core.models import INSTRUCTOR, NONE
from marsha.core.simple_jwt.tokens import PlaylistAccessToken


def create_classroom_stable_invite_jwt(classroom, role=NONE, permissions=None):
    """Create a playlist JWT to be used in classroom invite links.

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
    PlaylistAccessToken
        The JWT.

    """
    playlist_jwt = PlaylistAccessToken.for_playlist_id(
        playlist_id=str(classroom.playlist_id),
        session_id=f"{classroom.id}-invite",
        roles=[role],
        permissions=permissions or {},
    )

    # Set a fixed JWT ID
    playlist_jwt.set_jti(
        f"classroom-invite-{classroom.id}-{classroom.created_on.strftime('%Y-%m-%d')}"
    )

    # Set a fixed validity beginning: the classroom creation date
    playlist_jwt.set_iat(at_time=classroom.created_on)

    duration = settings.BBB_INVITE_JWT_DEFAULT_DAYS_DURATION
    if role == INSTRUCTOR:
        duration = settings.BBB_INVITE_JWT_INSTRUCTOR_DAYS_DURATION
    validity_end = timezone.now().replace(
        hour=0, minute=0, second=0, microsecond=0
    ) + timedelta(days=duration)

    playlist_jwt.set_exp(
        from_time=classroom.created_on,
        lifetime=validity_end - classroom.created_on,
    )

    return playlist_jwt
