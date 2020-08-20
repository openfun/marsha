"""Utils used by the api module."""
import hashlib
import hmac

from django.conf import settings


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
        signature
        == hmac.new(
            secret.encode("utf-8"), msg=message, digestmod=hashlib.sha256
        ).hexdigest()
        for secret in settings.UPDATE_STATE_SHARED_SECRETS
    )
