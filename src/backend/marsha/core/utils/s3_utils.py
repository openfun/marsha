"""Utils for direct upload to AWS S3."""
from typing import Literal

from django.conf import settings

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError


def get_aws_s3_client():
    """Return a boto3 s3 client connected to AWS."""

    # Configure S3 client using signature V4
    return boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        config=Config(
            region_name=settings.AWS_S3_REGION_NAME,
            signature_version="s3v4",
        ),
    )


def get_videos_s3_client():
    """Return a boto3 s3 client connected to Videos S3."""

    return boto3.client(
        "s3",
        aws_access_key_id=settings.VIDEOS_STORAGE_S3_ACCESS_KEY,
        aws_secret_access_key=settings.VIDEOS_STORAGE_S3_SECRET_KEY,
        endpoint_url=settings.VIDEOS_STORAGE_S3_ENDPOINT_URL,
        config=Config(
            region_name=settings.VIDEOS_STORAGE_S3_REGION_NAME,
            signature_version="s3v4",
        ),
    )


ClientType = Literal["AWS", "VIDEOS_S3"]


def get_s3_client(client_type: ClientType):
    """Return a boto3 s3 client depending on the client type.

     Parameters
    ----------
    client_type: Type[ClientType]
        The type of client to return. Can be AWS or VIDEO_S3.

    Returns
    -------
    boto3.client
        A boto3 s3 client connected to the right service.

    """
    if client_type == "AWS":
        return get_aws_s3_client()
    if client_type == "VIDEOS_S3":
        return get_videos_s3_client()
    raise ValueError(f"Unknown s3 client type: {client_type}")


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
        Note that if you include a condition, you must specify a valid value in the fields'
        dictionary as well.
        A value will not be added automatically to the fields dictionary based on the conditions.

    fields: Type[Dict]
        A dictionary of prefilled form fields to build on top of. Elements that may be included
        are acl, Cache-Control, Content-Type, Content-Disposition, Content-Encoding, Expires,
        success_action_redirect, redirect, success_action_status, and x-amz-meta-.
        Note that if a particular element is included in the fields' dictionary it will not be
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

def update_expiration_date(key, expiration_date):
    """
    Updates the expiration date for a given key in an S3 bucket.

    Parameters:
        key (str): The key of the object in the S3 bucket.
        expiration_date (datetime): The new expiration date for the object.
    """
    s3_client = boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        config=Config(
            region_name=settings.AWS_S3_REGION_NAME,
            signature_version="s3v4",
        ),
    )

    try:
        response = s3_client.get_bucket_lifecycle_configuration(
            Bucket=settings.AWS_DESTINATION_BUCKET_NAME
        )
        current_config = response.get("Rules", [])
    except ClientError as client_error:
        if client_error.response["Error"]["Code"] == "NoSuchLifecycleConfiguration":
            # Handle when the bucket does not have a lifecycle configuration yet
            current_config = []
        else:
            raise client_error

    if expiration_date:
        # Update the expiration date
        expiration_date_config = {"Date": expiration_date.strftime("%Y-%m-%d")}
        rule_key_expiration_date_config = {
            "ID": key,
            "Filter": {"Prefix": key},
            "Status": "Enabled",
            "Expiration": expiration_date_config,
        }

        is_update = False
        for rule in current_config:
            if rule["ID"] == key:
                is_update = True
                rule["Expiration"] = expiration_date_config
                break
        if not is_update:
            current_config.append(rule_key_expiration_date_config)
    else:
        # Remove the expiration date
        current_config = [rule for rule in current_config if rule.get("ID") != key]

    # Update the lifecycle configuration for the bucket
    s3_client.put_bucket_lifecycle_configuration(
        Bucket=settings.AWS_DESTINATION_BUCKET_NAME,
        LifecycleConfiguration={"Rules": current_config},
    )
