"""Utils for local upload."""


from django.urls import reverse
from django.utils import timezone

from marsha.core.utils.time_utils import to_timestamp


# pylint: disable=unused-argument
def initiate_video_upload(request, pk):
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

    return {
        "fields": {
            "key": f"tmp/{pk}/video/{stamp}",
        },
        "url": request.build_absolute_uri(
            reverse("local-video-upload", args=[pk, stamp])
        ),
    }
