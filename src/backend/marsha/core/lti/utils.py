"""Helpers to create a dedicated resources."""
from django.db.models import Q

from pylti.common import LTIException

from ..defaults import PENDING, READY
from ..models import Document, Playlist, Video


def _get_or_create_resource(model, lti):
    """Get or Create a resource targeted by a LTI request.

    This function is generic and will use the `model` argument to create
    the wanted resource.

    Create the playlist if it does not pre-exist (it can only happen with consumer site scope
    passports).

    Parameters
    ----------
    lti : Type[LTI]

    model:
        The model we want to get or create.

    Raises
    ------
    LTIException
        Exception raised if the request does not contain a context id (playlist).

    Returns
    -------
    An instance of the model targeted by the LTI request or None

    """
    lti.verify()
    try:
        assert lti.context_id
    except AssertionError:
        raise LTIException("A context ID is required.")

    # If the video already exists, retrieve it from database
    filter_kwargs = {"upload_state": READY} if not lti.is_instructor else {}
    try:
        return model.objects.get(
            Q(playlist__lti_id=lti.context_id)
            | Q(playlist__is_portable_to_playlist=True, upload_state=READY),
            Q(playlist__consumer_site=lti.get_consumer_site())
            | Q(playlist__is_portable_to_consumer_site=True, upload_state=READY)
            | Q(
                playlist__consumer_site__in=lti.get_consumer_site().reachable_from.all(),
                upload_state=READY,
            ),
            pk=lti.resource_id,
            **filter_kwargs,
        )
    except model.DoesNotExist:
        pass

    if not lti.is_instructor:
        return None

    try:
        resource = model.objects.get(pk=lti.resource_id)
    except model.DoesNotExist:
        pass
    else:
        raise LTIException(
            "The {!s} ID {!s} already exists but is not portable to your playlist ({!s}) "
            "and/or consumer site ({!s}).".format(
                model.__name__,
                resource.id,
                lti.context_id,
                lti.get_consumer_site().domain,
            )
        )

    playlist, _ = Playlist.objects.get_or_create(
        lti_id=lti.context_id,
        consumer_site=lti.get_consumer_site(),
        defaults={"title": lti.context_title},
    )

    return model.objects.create(
        pk=lti.resource_id,
        lti_id=lti.resource_link_id,
        playlist=playlist,
        upload_state=PENDING,
        title=lti.resource_link_title,
        show_download=lti.get_consumer_site().video_show_download_default,
    )


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
    return _get_or_create_resource(Video, lti)


def get_or_create_document(lti):
    """Get or create the document targeted by the LTI launch request.

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
    core.models.video.Document
        The document instance targeted by the launch url or None.

    """
    return _get_or_create_resource(Document, lti)
