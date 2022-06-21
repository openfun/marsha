"""Marsha's specific Python Social Auth pipeline steps for authentication."""
from social_core.pipeline.social_auth import auth_allowed as social_auth_allowed
import waffle

from marsha.core.defaults import RENATER_FER_SAML


def auth_allowed(backend, details, response, *args, **kwargs):
    """
    Tests the Waffle switch to reject authentication when disabled.

    We explicitly look for the backend because we don't want to generate the switch
    name as it is used in other places.
    """
    if backend.name == "saml_fer" and not waffle.switch_is_active(RENATER_FER_SAML):
        return False
    return social_auth_allowed(backend, details, response, *args, **kwargs)
