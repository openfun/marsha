"""Utils for direct upload to AWS S3."""
from django.conf import settings

import boto3
from botocore.client import Config


def create_presigned_post(conditions, fields, key):
    """Build the url and the form fields used for a presigned s3 post.

    Parameters
    ----------
    conditions : Type[List]
        A list of conditions to include in the policy.
        Each element can be either a list or a structure. For example:
        [
            {"acl": "public-read"},
            ["content-length-range", 2, 5],
            ["starts-with", "$success_action_redirect", ""]
        ]
        Conditions that are included may pertain to acl, content-length-range, Cache-Control,
        Content-Type, Content-Disposition, Content-Encoding, Expires, success_action_redirect,
        redirect, success_action_status, and/or x-amz-meta-.
        Note that if you include a condition, you must specify the a valid value in the fields
        dictionary as well.
        A value will not be added automatically to the fields dictionary based on the conditions.

    fields: Type[Dict]
        A dictionary of prefilled form fields to build on top of. Elements that may be included
        are acl, Cache-Control, Content-Type, Content-Disposition, Content-Encoding, Expires,
        success_action_redirect, redirect, success_action_status, and x-amz-meta-.
        Note that if a particular element is included in the fields dictionary it will not be
        automatically added to the conditions list. You must specify a condition for the element
        as well.

    key: string
        Key name, optionally add ${filename} to the end to attach the submitted filename.
        Note that key related conditions and fields are filled out for you and should not be
        included in the Fields or Conditions parameter.

    Returns
    -------
    Dictionary
        A dictionary with two elements: url and fields. Url is the url to post to. Fields is a
        dictionary filled with the form fields and respective values to use when submitting
        the post.

    """
    # Configure S3 client using signature V4
    s3_client = boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        config=Config(
            region_name=settings.AWS_S3_REGION_NAME,
            signature_version="s3v4",
        ),
    )

    acl = "private"
    fields.update({"acl": acl})

    return s3_client.generate_presigned_post(
        settings.AWS_SOURCE_BUCKET_NAME,
        key,
        Fields=fields,
        Conditions=[{"acl": acl}] + conditions,
        ExpiresIn=settings.AWS_UPLOAD_EXPIRATION_DELAY,
    )
