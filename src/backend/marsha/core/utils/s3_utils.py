"""Utils for direct upload to AWS S3."""
from typing import Literal

from django.conf import settings

import boto3
from botocore.client import Config


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


def create_presigned_post(
    conditions,
    fields,
    key,
    bucket_name=settings.AWS_SOURCE_BUCKET_NAME,
    client_type: ClientType = "AWS",
):
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

    bucket_name: Type[String]
        The name of the bucket to post to. If not specified, it will default to the
        settings.AWS_SOURCE_BUCKET_NAME.

    client_type: Type[ClientType]
        The type of client to use. Can be "AWS" or "VIDEOS_S3". If not specified, it will default
        to "AWS".

    Returns
    -------
    Dictionary
        A dictionary with two elements: url and fields. Url is the url to post to. Fields is a
        dictionary filled with the form fields and respective values to use when submitting
        the post.

    """
    s3_client = get_s3_client(client_type)

    acl = "private"
    fields.update({"acl": acl})

    return s3_client.generate_presigned_post(
        bucket_name,
        key,
        Fields=fields,
        Conditions=[{"acl": acl}] + conditions,
        ExpiresIn=settings.AWS_UPLOAD_EXPIRATION_DELAY,
    )


def move_s3_directory(
    key: str, destination: str, client_type: ClientType, bucket_name: str
):
    """
    Move the content of a directory with `key` prefix to a "destination" folder
    in an S3 bucket.

    Parameters:
        key (str): The key of folder in the S3 bucket.
        destination (str): The destination folder in the S3 bucket without a
        `/` at the end.
        s3_client (boto3.client): The type of client to use.
        bucket_name (str): The name of the bucket.
    """
    s3_client = get_s3_client(client_type)

    # First, we ned to get the list of objects in the folder
    objects = s3_client.list_objects_v2(Bucket=bucket_name, Prefix=key)

    if "Contents" not in objects:
        # No need to copy or delete anything
        return

    # Second, we need to copy each object to the "to_delete" folder
    for obj in objects["Contents"]:
        copy_source = {"Bucket": bucket_name, "Key": obj["Key"]}
        s3_client.copy(copy_source, bucket_name, f"{destination}/{obj['Key']}")

    # Finally, we need to bulk delete each files in the folder
    s3_client.delete_objects(
        Bucket=bucket_name,
        Delete={"Objects": [{"Key": obj["Key"]} for obj in objects["Contents"]]},
    )
