"""Utils for jitsi"""

from datetime import timedelta

from django.conf import settings
from django.utils import timezone

import jwt


def create_payload(room, moderator=True):
    """Create the payload so that it contains each information jitsi requires"""
    token_payload = {
        "context": {
            "user": {
                "affiliation": "owner" if moderator else "member",
            },
        },
        "exp": timezone.now()
        + timedelta(seconds=settings.JITSI_JWT_TOKEN_EXPIRATION_SECONDS),
        "iat": timezone.now(),
        "moderator": moderator,
        "aud": "jitsi",
        "iss": settings.JITSI_JWT_APP_ID,
        "sub": settings.JITSI_DOMAIN,
        "room": room,
    }

    return token_payload


def generate_token(room, moderator):
    """Generate the access token that will give access to the room"""
    token_payload = create_payload(room=room, moderator=moderator)
    token = jwt.encode(
        token_payload,
        settings.JITSI_JWT_APP_SECRET,
        algorithm="HS256",
    )

    return token


def generate_jitsi_info(video, moderator):
    """Generate all information needed to connect to a jitsi instance."""
    jitsi = {
        "external_api_url": settings.JITSI_EXTERNAL_API_URL,
        "domain": settings.JITSI_DOMAIN,
        "config_overwrite": settings.JITSI_CONFIG_OVERWRITE,
        "interface_config_overwrite": settings.JITSI_INTERFACE_CONFIG_OVERWRITE,
        "room_name": str(video.pk),
    }
    if settings.JITSI_JWT_APP_ID and settings.JITSI_JWT_APP_SECRET:
        jitsi["token"] = generate_token(str(video.pk), moderator)

    return jitsi
