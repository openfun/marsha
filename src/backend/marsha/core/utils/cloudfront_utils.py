"""
Utils to sign CloudFront urls and cookies.

Following boto3's documentation to sign CloudFront urls
https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/cloudfront.html
"""
import base64

from django.conf import settings

from botocore.signers import CloudFrontSigner
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding


class MissingRSAKey(Exception):
    """Exception raised when an RSA key is missing."""


def rsa_signer(message):
    """Sign a message with an RSA key pair found on the file system for CloudFront signed urls.

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
    except FileNotFoundError as exc:
        raise MissingRSAKey() from exc

    # The following line is excluded from bandit security check because cloudfront supports
    # only sha1 hash for signed URLs.
    return private_key.sign(message, padding.PKCS1v15(), hashes.SHA1())  # nosec


def generate_cloudfront_urls_signed_parameters(resource, date_less_than):
    """
    Generate all parameters use by a cloudfront signed url.
    Mainly extracted from CloudFrontSigner class.
    """
    cloudfront_signer = CloudFrontSigner(
        settings.CLOUDFRONT_SIGNED_PUBLIC_KEY_ID,
        rsa_signer,
    )
    policy = cloudfront_signer.build_policy(
        resource=resource, date_less_than=date_less_than
    ).encode("utf8")
    signature = cloudfront_signer.rsa_signer(policy)
    return [
        f"Policy={_url_b64encode(policy).decode('utf8')}",
        f"Signature={_url_b64encode(signature).decode('utf8')}",
        f"Key-Pair-Id={cloudfront_signer.key_id}",
    ]


def build_signed_url(base_url, extra_params):
    """
    Build an url by concatenating the base url and the parameters needed to sign it.
    Extracted from CloudFrontSigner class
    """
    separator = "&" if "?" in base_url else "?"
    return base_url + separator + "&".join(extra_params)


def _url_b64encode(data):
    """Extracted from CloudFrontSigner class"""
    # Required by CloudFront. See also:
    # http://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-linux-openssl.html
    return (
        base64.b64encode(data)
        .replace(b"+", b"-")
        .replace(b"=", b"_")
        .replace(b"/", b"~")
    )
