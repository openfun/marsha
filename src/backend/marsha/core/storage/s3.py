"""Utils for direct upload to AWS S3."""
from django.conf import settings
from django.utils import timezone

from ..models import Video
from ..utils.s3_utils import create_presigned_post
from ..utils.time_utils import to_timestamp


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
