"""Utils for dummy upload."""
from django.urls import reverse


def initiate_upload(request, pk):
    """Get an upload policy for an object.

    Returns an upload policy for dummy storage backend.

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
    return {
        "fields": {},
        "url": request.build_absolute_uri(reverse("local-upload", args=[pk])),
    }


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
    return initiate_upload(request, pk)
