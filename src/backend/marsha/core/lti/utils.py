"""Helpers to create a dedicated resources."""
from django.db.models import Q

from ..defaults import PENDING
from ..models import Playlist


class PortabilityError(Exception):
    """An error raised when trying to access a resource that is not portable."""


def get_selectable_resources(model, lti):
    """Filter resources available to a LTI select request.

    This function is generic and will use the `model` argument to filter resources.

    Parameters
    ----------
    lti : Type[LTI]

    model:
        The model we want to get.

    Returns
    -------
    A queryset of available model instances to the LTI request

    """
    if not (lti.is_instructor or lti.is_admin):
        return model.objects.none()

    consumer_site = lti.get_consumer_site()

    playlist_reachable_from = Playlist.objects.filter(
        portable_to__lti_id=lti.context_id,
        portable_to__consumer_site_id=consumer_site.id,
    )

    return model.objects.select_related("playlist").filter(
        # The resource exists in this playlist on this consumer site
        Q(playlist__lti_id=lti.context_id, playlist__consumer_site=consumer_site)
        # The resource exists in another consumer site to which it is portable because
        # its playlist is portable to the requested playlist
        | Q(model.get_ready_clause(), playlist__in=playlist_reachable_from)
    )


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
    consumer_site = lti.get_consumer_site()
    playlist_reachable_from = Playlist.objects.filter(
        portable_to__lti_id=lti.context_id,
        portable_to__consumer_site_id=consumer_site.id,
    )

    try:
        return model.objects.select_related("playlist").get(
            Q() if (lti.is_instructor or lti.is_admin) else model.get_ready_clause(),
            # The resource exists in this playlist on this consumer site
            Q(playlist__lti_id=lti.context_id, playlist__consumer_site=consumer_site)
            # The resource exists in another playlist of the same consumer site and is portable
            | Q(
                model.get_ready_clause(),
                playlist__is_portable_to_playlist=True,
                playlist__consumer_site=consumer_site,
            )
            # The resource exists in another consumer site to which it is portable because:
            # 1. its playlist is portable to all consumer sites
            | Q(model.get_ready_clause(), playlist__is_portable_to_consumer_site=True)
            # 2. its playlist is portable to the requested playlist
            | Q(model.get_ready_clause(), playlist__in=playlist_reachable_from)
            # 3. all playlists in the consumer site of the resource are portable to the
            #    requesting consumer site
            | Q(
                model.get_ready_clause(),
                playlist__consumer_site__in=consumer_site.reachable_from.all(),
            ),
            pk=lti.resource_id,
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
