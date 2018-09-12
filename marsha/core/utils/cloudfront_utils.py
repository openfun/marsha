"""
Utils to sign CloudFront urls and cookies.

Following boto3's documentation to sign CloudFront urls
https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/cloudfront.html
"""
from django.conf import settings

from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding


class MissingRSAKey(Exception):
    """Exception raised when an RSA key is missing."""

    pass


def rsa_signer(message):
    """Sign a message with an rsa key pair found on the file system for CloudFront signed urls.

    Parameters
    ----------
    message : Type[string]
        the message for which we want to compute a signature

    Returns
    -------
    string
        The rsa signature

    """
    try:
        with open(settings.CLOUDFRONT_PRIVATE_KEY_PATH, "rb") as key_file:
            private_key = serialization.load_pem_private_key(
                key_file.read(), password=None, backend=default_backend()
            )
    except FileNotFoundError:
        raise MissingRSAKey()

    return private_key.sign(message, padding.PKCS1v15(), hashes.SHA1())
