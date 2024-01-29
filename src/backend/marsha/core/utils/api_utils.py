"""Utils used by the api module."""

from functools import cache
import hashlib
import hmac

import django.apps
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


@cache
def get_uploadable_models_s3_mapping():
    """
    Generates a map between the S3 key model identifier and Django models.
    Used in the update_state API called when the lamda "convert" notify us it has done its job

    This must always be used after all applications are loaded
    (`django.apps.apps.get_models` takes care of that assertion).

    Return
    ------
    dict
        The returned dict looks like

        ```
        {
            "document": marsha.core.models.Document,
            "sharedlivemedia": marsha.core.models.SharedLiveMedia,
            "thumbnail": marsha.core.models.Thumbnail,
            "timedtexttrack": marsha.core.models.TimedTextTrack,
            "video": marsha.core.models.Video,
        }
        ```
    """
    all_models = django.apps.apps.get_models()
    return {
        model.S3_IDENTIFIER: model
        for model in all_models
        if getattr(model, "S3_IDENTIFIER", None) is not None
    }
