"""Helpers to create a dedicated resources."""
from django.db.models import Q

from ..defaults import PENDING
from ..models import Playlist


class PortabilityError(Exception):
    """An error raised when trying to access a resource that is not portable."""


def get_or_create_resource(model, lti):
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
    # If the resource already exists, retrieve it from database
    filter_kwargs = (
        {} if (lti.is_instructor or lti.is_admin) else {"uploaded_on__isnull": False}
    )
    try:
        return model.objects.select_related("playlist").get(
            Q(playlist__lti_id=lti.context_id)
            | Q(playlist__is_portable_to_playlist=True, uploaded_on__isnull=False),
            Q(playlist__consumer_site=lti.get_consumer_site())
            | Q(playlist__is_portable_to_consumer_site=True, uploaded_on__isnull=False)
            | Q(
                playlist__consumer_site__in=lti.get_consumer_site().reachable_from.all(),
                uploaded_on__isnull=False,
            ),
            pk=lti.resource_id,
            **filter_kwargs,
        )
    except model.DoesNotExist:
        pass

    if not (lti.is_instructor or lti.is_admin):
        return None

    try:
        resource = model.objects.get(pk=lti.resource_id)
    except model.DoesNotExist:
        pass
    else:
        raise PortabilityError(
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
