"""Utils for dummy upload."""

from django.urls import reverse


# pylint: disable=unused-argument
def initiate_object_videos_storage_upload(request, obj, conditions):
    """Get an upload policy for a video.

    Returns an upload policy for dummy video backend.

    Returns
    -------
    Dictionary
        A dictionary with two elements: url and fields. Url is the url to post to. Fields is a
        dictionary filled with the form fields and respective values to use when submitting
        the post.

    """
    return {
        "fields": {},
        "url": request.build_absolute_uri(
            reverse("local-videos-storage-upload", args=[obj.pk])
        ),
    }


# pylint: disable=unused-argument
def initiate_document_storage_upload(request, obj, filename, conditions):
    """Get an upload policy for a document.

    Returns an upload policy for dummy document backend.

    Returns
    -------
    Dictionary
        A dictionary with two elements: url and fields. Url is the url to post to. Fields is a
        dictionary filled with the form fields and respective values to use when submitting
        the post.

    """
    return {
        "fields": {},
        "url": request.build_absolute_uri(
            reverse("local-document-upload", args=[obj.pk])
        ),
    }
