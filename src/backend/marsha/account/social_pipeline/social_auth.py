"""Marsha's specific Python Social Auth pipeline steps for authentication."""

from social_core.pipeline.social_auth import (
    associate_by_email as social_associate_by_email,
    auth_allowed as social_auth_allowed,
    social_details as social_social_details,
)
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


def social_details(backend, details, response, *args, **kwargs):
    """
    Update user details to use the full name attribute
    when first name or last name is not provided.
    """
    results_dict = social_social_details(backend, details, response, *args, **kwargs)

    if backend.name != "saml_fer":
        return results_dict

    details = results_dict["details"]
    first_name = details.get("first_name", "")
    last_name = details.get("last_name", "")
    fullname = details.get("fullname", "")

    # Clean values, just in case. None values may become empty strings
    first_name = first_name.strip() if first_name else ""
    last_name = last_name.strip() if last_name else ""
    fullname = fullname.strip() if fullname else ""

    if not (first_name and last_name):
        # details is a reference, this updates results_dict["details"]
        details["first_name"] = ""
        details["last_name"] = fullname

    return results_dict


def associate_by_email(backend, details, *args, user=None, **kwargs):
    """
    Associates user by email when the RENATER_FER_SAML feature is enabled.
    """
    if not waffle.switch_is_active(RENATER_FER_SAML):
        return None

    return social_associate_by_email(backend, details, user, *args, **kwargs)
