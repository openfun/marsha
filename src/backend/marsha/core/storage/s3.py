"""Utils for direct upload to AWS S3."""
from django.conf import settings
from django.utils import timezone

from marsha.core.models import Document, Video
from marsha.core.utils.s3_utils import create_presigned_post
from marsha.core.utils.time_utils import to_timestamp


# pylint: disable=unused-argument
def initiate_video_upload(request, pk):
    """Get an upload policy for a video.

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

    video = Video.objects.get(pk=pk)
    key = video.get_source_s3_key(stamp=stamp)

    return create_presigned_post(
        [
            ["starts-with", "$Content-Type", "video/"],
            ["content-length-range", 0, settings.VIDEO_SOURCE_MAX_SIZE],
        ],
        {},
        key,
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
