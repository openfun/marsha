"""Utils used by the api module."""
import hashlib
import hmac

from django.conf import settings
from django.utils.crypto import salted_hmac


def validate_signature(signature, message):
    """Check if the provided signature is valid against any secret in our list.

    We need to do this to support 2 or more versions of our infrastructure at the same time.
    It then enables us to do updates and change the secret without incurring downtime.

    Parameters
    ----------
    signature: string
        The signature to validate.

    message: string
        The signed message to compare with the signature.

    Return
    ------
    Boolean
        Return true if the signature is valid. False otherwise.
    """
    return any(
        signature == generate_hash(secret, message)
        for secret in settings.UPDATE_STATE_SHARED_SECRETS
    )


def generate_hash(secret, message):
    """Generate a hash given a secret and a message.

    Parameters
    ----------
    secret: string
        The secret to use.

    message: string
        The message to hash.

    Return
    ------
    String
       Return a computed hash
    """
    return hmac.new(
        secret.encode("utf-8"), msg=message, digestmod=hashlib.sha256
    ).hexdigest()


def generate_salted_hmac(secret, key):
    """Generate a salted_hmac with secret and key"""
    return salted_hmac(secret, key, algorithm="sha256").hexdigest()
