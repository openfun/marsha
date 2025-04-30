"""Utils for direct upload to AWS S3."""

import re

from django.conf import settings
from django.utils import timezone

from storages.backends.s3 import S3Storage

from marsha.core.defaults import TMP_STORAGE_BASE_DIRECTORY
from marsha.core.models import Document
from marsha.core.utils.cloudfront_utils import get_cloudfront_private_key
from marsha.core.utils.s3_utils import create_presigned_post
from marsha.core.utils.time_utils import to_timestamp


PROTECTED_NAME_REGEX = re.compile(r"^/?tmp/.*$")


class S3FileStorage(S3Storage):
    """
    Storage class to handle s3 storage for Marsha files.
    """

    access_key = settings.STORAGE_S3_ACCESS_KEY
    secret_key = settings.STORAGE_S3_SECRET_KEY
    endpoint_url = settings.STORAGE_S3_ENDPOINT_URL
    region_name = settings.STORAGE_S3_REGION_NAME
    signature_version = "s3v4"

    bucket_name = settings.STORAGE_S3_BUCKET_NAME

    object_parameters = settings.STORAGE_S3_OBJECT_PARAMETERS

    custom_domain = settings.SCW_EDGE_SERVICE_DOMAIN
    url_protocol = "https:"

    if settings.CLOUDFRONT_SIGNED_URLS_ACTIVE:
        cloudfront_key_id = settings.CLOUDFRONT_SIGNED_PUBLIC_KEY_ID
        cloudfront_key = get_cloudfront_private_key()
        querystring_expire = settings.CLOUDFRONT_SIGNED_URLS_VALIDITY

    def url(self, name, parameters=None, expire=None, http_method=None):
        """
        Override the url method to remove signature part of the url if the resource
        is not protected.
        """
        url = super().url(
            name, parameters=parameters, expire=expire, http_method=http_method
        )

        if not PROTECTED_NAME_REGEX.match(name):
            # As explain in the _strip_signing_parameters docstring
            # Boto3 does not currently support generating URLs that are unsigned.
            # So if we want an unsign url we have to unsign it using this method.
            return self._strip_signing_parameters(url)

        return url


# pylint: disable=unused-argument
def initiate_object_videos_storage_upload(request, obj, conditions):
    """Get an upload policy for a video-related object.

    The object must implement the get_storage_prefix method.
    Returns an upload policy to our storage S3 source bucket.

    Returns
    -------
    Dictionary
        A dictionary with two elements: url and fields. Url is the url to post to. Fields is a
        dictionary filled with the form fields and respective values to use when submitting
        the post.

    """
    now = timezone.now()
    stamp = to_timestamp(now)

    key = obj.get_storage_prefix(stamp=stamp, base_dir=TMP_STORAGE_BASE_DIRECTORY)

    return create_presigned_post(
        conditions,
        {},
        key,
        S3FileStorage.bucket_name,
        "STORAGE_S3",
    )


# pylint: disable=unused-argument
def initiate_document_upload(request, pk, extension):
    """Get an upload policy for a document.

    Returns an upload policy to our AWS S3 source bucket.

    Returns
    -------
    Dictionary
        A dictionary with two elements: url and fields. Url is the url to post to. Fields is a
        dictionary filled with the form fields and respective values to use when submitting
        the post.

    """
    now = timezone.now()
    stamp = to_timestamp(now)

    document = Document.objects.get(pk=pk)
    key = document.get_source_s3_key(stamp=stamp, extension=extension)

    return create_presigned_post(
        [["content-length-range", 0, settings.DOCUMENT_SOURCE_MAX_SIZE]],
        {},
        key,
    )


# pylint: disable=unused-argument
def initiate_classroom_document_storage_upload(request, obj, filename, conditions):
    """Get an upload policy for a classroom document.

    The object must implement the get_storage_key method.
    Returns an upload policy to our storage S3 destination bucket.

    Returns
    -------
    Dictionary
        A dictionary with two elements: url and fields. Url is the url to post to. Fields is a
        dictionary filled with the form fields and respective values to use when submitting
        the post.

    """
    key = obj.get_storage_key(filename=filename)

    return create_presigned_post(
        conditions,
        {},
        key,
        S3FileStorage.bucket_name,
        "STORAGE_S3",
    )


# pylint: disable=unused-argument
def initiate_deposited_file_storage_upload(request, obj, filename, conditions):
    """Get an upload policy for a deposited file.

    The object must implement the get_storage_key method.
    Returns an upload policy to our storage S3 destination bucket.

    Returns
    -------
    Dictionary
        A dictionary with two elements: url and fields. Url is the url to post to. Fields is a
        dictionary filled with the form fields and respective values to use when submitting
        the post.

    """
    key = obj.get_storage_key(filename=filename)

    return create_presigned_post(
        conditions,
        {},
        key,
        S3FileStorage.bucket_name,
        "STORAGE_S3",
    )
