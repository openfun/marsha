"""Helpers to create a dedicated resources."""
from django.db.models import Q

from pylti.common import LTIException

from ..defaults import PENDING, READY
from ..models import Playlist, Video


def get_or_create_video(lti):
    """Get or create the video targeted by the LTI launch request.

    Create the playlist if it does not pre-exist (it can only happen with consumer site scope
    passports).

    Parameters
    ----------
    lti : Type[LTI]

    Raises
    ------
    LTIException
        Exception raised if the request does not contain a context id (playlist).

    Returns
    -------
    core.models.video.Video
        The video instance targeted by the launch url or None.

    """
    # Make sure LTI verification has run successfully. It raises an LTIException otherwise.
    consumer_site = lti.verify()

    try:
        assert lti.context_id
    except AssertionError:
        raise LTIException("A context ID is required.")

    # If the video already exists, retrieve it from database
    filter_kwargs = {"upload_state": READY} if not lti.is_instructor else {}
    try:
        return Video.objects.get(
            Q(playlist__lti_id=lti.context_id)
            | Q(playlist__is_portable_to_playlist=True, upload_state=READY),
            Q(playlist__consumer_site=consumer_site)
            | Q(playlist__is_portable_to_consumer_site=True, upload_state=READY)
            | Q(
                playlist__consumer_site__in=consumer_site.reachable_from.all(),
                upload_state=READY,
            ),
            pk=lti.resource_id,
            **filter_kwargs,
        )
    except Video.DoesNotExist:
        pass

    # If we didn't find any existing video, we will only create a new video if the
    # request comes from an instructor
    if not lti.is_instructor:
        return None

    # Check that the video does not already exist (possible in another playlist and/or
    # on another consumer site if it is not portable or not ready).
    try:
        video = Video.objects.get(pk=lti.resource_id)
    except Video.DoesNotExist:
        pass
    else:
        raise LTIException(
            "The video ID {!s} already exists but is not portable to your playlist ({!s}) "
            "and/or consumer site ({!s}).".format(
                video.id, lti.context_id, consumer_site.domain
            )
        )

    # Creating the video...
    # - Get the playlist if it exists or create it
    playlist, _ = Playlist.objects.get_or_create(
        lti_id=lti.context_id,
        consumer_site=consumer_site,
        defaults={"title": lti.context_title},
    )

    # Create the video, pointing to the file from the origin video if any
    return Video.objects.create(
        pk=lti.resource_id,
        lti_id=lti.resource_link_id,
        playlist=playlist,
        upload_state=PENDING,
        title=lti.resource_link_title,
        show_download=consumer_site.video_show_download_default,
    )
