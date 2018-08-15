"""Utils for the ``core`` app of the Marsha project."""
from base64 import b64encode
from datetime import timedelta
import hashlib
import hmac
import json

from django.conf import settings
from django.utils import timezone

from .defaults import AWS_UPLOAD_EXPIRATION_DELAY, VIDEO_SOURCE_MAX_SIZE


def sign(key, message):
    """Return a SHA256 hmac updated with the message.

    Parameters
    ----------
    key : string
        The starting key for the hash.
    message : string
        The message being hashed into the hmac object

    Returns
    -------
    string
        The hash value resulting from the SHA256 hash of the message.

    """
    return hmac.new(key, message.encode("utf-8"), hashlib.sha256).digest()


def get_signature_key(secret_key, date_stamp, region_name, service_name):
    """AWS Signature v4 Key derivation function.

    We need an algorithm to generate a signing key to sign our policy document. In signature
    version 4, the signing key is derived from the secret access key, which improves the security
    of the secret access key.

    Parameters
    ----------
    secret_key : string
        The key to be signed
    date_stamp : string
        The date at which the policy is signed with a format "%Y%m%d"
    region_name : string
        The AWS region name
    service_name : string
        The AWS service name

    Returns
    -------
    string
        Hash value representing the AWS v4 signature.

    See: http://docs.aws.amazon.com/general/latest/gr/signature-v4-examples.html

    """
    k_date = sign(("AWS4" + secret_key).encode("utf-8"), date_stamp)
    k_region = sign(k_date, region_name)
    k_service = sign(k_region, service_name)
    k_signing = sign(k_service, "aws4_request")
    return k_signing


def get_s3_policy(bucket, key):
    """Build a S3 policy to allow uploading a video to our video source bucket.

    Parameters
    ----------
    bucket : string
        The name of the S3 bucket to which we want to upload a video.
    key : string
        The S3 bucket key at which we want to allow uploading a video.

    Returns
    -------
    Tuple[string, string]
        A tuple of the policy and its signature both encoded in b64.

    """
    now = timezone.now()

    expires_at = now + timedelta(seconds=AWS_UPLOAD_EXPIRATION_DELAY)
    acl = "private"
    x_amz_algorithm = "AWS4-HMAC-SHA256"
    x_amz_credential = "{key:s}/{date:%Y%m%d}/{region:s}/s3/aws4_request".format(
        date=now, key=settings.AWS_ACCESS_KEY_ID, region=settings.AWS_DEFAULT_REGION
    )
    x_amz_date = now.strftime("%Y%m%dT%H%M%SZ")

    policy = {
        "expiration": expires_at.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        "conditions": [
            {"bucket": bucket},
            {"key": key},
            {"acl": acl},
            ["starts-with", "$Content-Type", "video/"],
            ["content-length-range", 0, VIDEO_SOURCE_MAX_SIZE],
            {"x-amz-credential": x_amz_credential},
            {"x-amz-algorithm": x_amz_algorithm},
            {"x-amz-date": x_amz_date},
        ],
    }

    policy_b64 = b64encode(
        json.dumps(policy).replace("\n", "").replace("\r", "").encode()
    )

    signature_key = get_signature_key(
        settings.AWS_SECRET_ACCESS_KEY,
        now.strftime("%Y%m%d"),
        settings.AWS_DEFAULT_REGION,
        "s3",
    )

    signature = hmac.new(signature_key, policy_b64, hashlib.sha256).hexdigest()

    return {
        "acl": acl,
        "bucket": bucket,
        "key": key,
        "max_file_size": VIDEO_SOURCE_MAX_SIZE,
        "policy": policy_b64,
        "s3_endpoint": get_s3_endpoint(settings.AWS_DEFAULT_REGION),
        "x_amz_algorithm": x_amz_algorithm,
        "x_amz_credential": x_amz_credential,
        "x_amz_date": x_amz_date,
        "x_amz_expires": AWS_UPLOAD_EXPIRATION_DELAY,
        "x_amz_signature": signature,
    }


def get_s3_endpoint(region):
    """Return the S3 endpoint domain for the region.

    Parameters
    ----------
    region : string
        One of the regions among Amazon AWS hosting regions (e.g. "us-east-1").

    Returns
    -------
    string
        The full domain of the S3 endpoint for the region passed in argument.

    """
    if region == "us-east-1":
        return "s3.amazonaws.com"
    return "s3.{:s}.amazonaws.com".format(region)
