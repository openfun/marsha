"""Utils for direct upload to AWS S3."""
from base64 import b64encode
from datetime import timedelta
import hashlib
import hmac
import json

from django.conf import settings


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


def get_s3_upload_policy_signature(now, conditions):
    """Build a S3 policy to allow uploading a video to our video source bucket.

    Parameters
    ----------
    conditions : Type[List]
        A list of extra conditions to impose on the uploaded file on top of the basic conditions
        that apply to all our objects and hardcoded in the present function.
        See AWS documentation for more details:
        https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-HTTPPOSTConstructPolicy.html

    Returns
    -------
    Dictionary
        A dictionary including the basic conditions imposed to all our objects and the computed
        signautre.

    """
    acl = "private"
    expires_at = now + timedelta(seconds=settings.AWS_UPLOAD_EXPIRATION_DELAY)
    x_amz_algorithm = "AWS4-HMAC-SHA256"
    x_amz_credential = "{key:s}/{date:%Y%m%d}/{region:s}/s3/aws4_request".format(
        date=now, key=settings.AWS_ACCESS_KEY_ID, region=settings.AWS_S3_REGION_NAME
    )
    x_amz_date = now.strftime("%Y%m%dT%H%M%SZ")

    policy = {
        "expiration": expires_at.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        "conditions": [
            {"acl": acl},
            {"bucket": settings.AWS_SOURCE_BUCKET_NAME},
            {"x-amz-credential": x_amz_credential},
            {"x-amz-algorithm": x_amz_algorithm},
            {"x-amz-date": x_amz_date},
        ]
        + conditions,
    }

    policy_b64 = b64encode(
        json.dumps(policy).replace("\n", "").replace("\r", "").encode()
    )

    signature_key = get_signature_key(
        settings.AWS_SECRET_ACCESS_KEY,
        now.strftime("%Y%m%d"),
        settings.AWS_S3_REGION_NAME,
        "s3",
    )

    signature = hmac.new(signature_key, policy_b64, hashlib.sha256).hexdigest()

    return {
        "acl": acl,
        "bucket": settings.AWS_SOURCE_BUCKET_NAME,
        "policy": policy_b64,
        "s3_endpoint": get_s3_endpoint(settings.AWS_S3_REGION_NAME),
        "x_amz_algorithm": x_amz_algorithm,
        "x_amz_credential": x_amz_credential,
        "x_amz_date": x_amz_date,
        "x_amz_expires": settings.AWS_UPLOAD_EXPIRATION_DELAY,
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
