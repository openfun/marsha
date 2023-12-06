"""Utils for local upload."""


from django.urls import reverse
from django.utils import timezone

from marsha.core.defaults import TMP_VIDEOS_STORAGE_BASE_DIRECTORY
from marsha.core.utils.time_utils import to_timestamp


# pylint: disable=unused-argument
def initiate_object_videos_storage_upload(request, obj, conditions):
    """Get an upload policy for a video.

    Returns an upload policy for dummy video backend.

    Parameters
    ----------
    request : Type[django.http.request.HttpRequest]
        The request on the API endpoint
    pk: string
        The primary key of the video

    Returns
    -------
    Dictionary
        A dictionary with two elements: url and fields. Url is the url to post to. Fields is a
        dictionary filled with the form fields and respective values to use when submitting
        the post.

    """
    now = timezone.now()
    stamp = to_timestamp(now)
    key = obj.get_videos_storage_prefix(
        stamp=stamp, base_dir=TMP_VIDEOS_STORAGE_BASE_DIRECTORY
    )
    return {
        "fields": {
            "key": key,
        },
        "url": request.build_absolute_uri(
            reverse(
                "local-videos-storage-upload",
                args=[obj.pk, stamp, obj.__class__.__name__],
            )
        ),
    }
