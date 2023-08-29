"""Live session services."""
from marsha.core.models import ConsumerSite, LiveSession, User, Video
from marsha.core.models.account import NONE


class NotLtiTokenException(Exception):
    """Raised when the submitted token is not an LTI one."""


class NotPublicTokenException(Exception):
    """Raised when the submitted token is not a public one."""


def is_lti_token(token):
    """Read the token and confirms if the user is identified by LTI"""

    return (
        token.payload
        and token.payload.get("context_id")
        and token.payload.get("consumer_site")
        and token.payload.get("user")
        and token.payload["user"].get("id")
    )


def is_public_token(token):
    """Read the token and check it was made to fetch a public resource."""
    return (
        token.payload
        and token.payload.get("roles") == [NONE]
        and token.payload.get("context_id") is None
        and token.payload.get("consumer_site") is None
    )


def get_livesession_from_lti(token, video_id=None):
    """Get or create livesession for an LTI connection."""
    if not is_lti_token(token):
        raise NotLtiTokenException()

    video = Video.objects.get(pk=video_id)
    token_user = token.payload.get("user")
    consumer_site = ConsumerSite.objects.get(pk=token.payload["consumer_site"])

    return LiveSession.objects.get_or_create(
        consumer_site=consumer_site,
        lti_id=token.payload.get("context_id"),
        lti_user_id=token_user.get("id"),
        video=video,
        defaults={
            "email": token_user.get("email"),
            "username": token_user.get("username"),
        },
    )


def get_livesession_from_anonymous_id(video_id, anonymous_id):
    """Get or create a livesession for an anonymous id"""
    video = Video.objects.get(pk=video_id)

    return LiveSession.objects.get_or_create(video=video, anonymous_id=anonymous_id)


def get_livesession_from_user_id(video_id, user_id):
    """Get or create a livesession for an anonymous id"""
    video = Video.objects.get(pk=video_id)
    user = User.objects.get(pk=user_id)

    return LiveSession.objects.get_or_create(video=video, user=user)
