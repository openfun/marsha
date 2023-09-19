"""Helpers to create a dedicated resources."""
from django.core.exceptions import FieldDoesNotExist, ValidationError
from django.db.models import Q
from django.utils.translation import gettext as _

from ..defaults import PENDING
from ..models import (
    ADMINISTRATOR,
    ConsumerSiteAccess,
    OrganizationAccess,
    Playlist,
    PlaylistAccess,
)


class ResourceException(BaseException):
    """Wrapper to normalize exceptions caught in views."""

    def __init__(self, message="", status_code=None):
        self.message = message
        self.status_code = status_code

    def __str__(self):
        return (
            f"{self.status_code}: {self.message}" if self.status_code else self.message
        )


class PortabilityError(Exception):
    """An error raised when trying to access a resource that is not portable."""


def field_exists_on_model(model, field_name):
    """Simple function to test whether a field exist on a model."""
    try:
        model._meta.get_field(field_name)  # will raise if field does not exist
    except FieldDoesNotExist:
        return False
    return True


def get_selectable_resources(model, lti):
    """Filter resources available to an LTI select request.

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
    """Get or Create a resource targeted by an LTI request.

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

    queryset = model.objects.select_related("playlist")
    if hasattr(queryset, "annotate_can_edit"):  # for video only for now
        queryset = queryset.annotate_can_edit(
            "", force_value=lti.is_instructor or lti.is_admin
        )

    try:
        instance = queryset.get(
            Q() if (lti.is_instructor or lti.is_admin) else model.get_ready_clause(),
            # The resource exists in this playlist on this consumer site
            Q(playlist__lti_id=lti.context_id, playlist__consumer_site=consumer_site)
            # The resource exists in another playlist of the same consumer site and is portable
            | Q(
                playlist__is_portable_to_playlist=True,
                playlist__consumer_site=consumer_site,
            )
            # The resource exists in another consumer site to which it is portable because:
            # 1. its playlist is portable to all consumer sites
            | Q(playlist__is_portable_to_consumer_site=True)
            # 2. its playlist is portable to the requested playlist
            | Q(playlist__in=playlist_reachable_from)
            # 3. all playlists in the consumer site of the resource are portable to the
            #    requesting consumer site
            | Q(playlist__consumer_site__in=consumer_site.reachable_from.all()),
            pk=lti.resource_id,
        )
        if (
            hasattr(instance, "last_lti_url")
            and lti.origin_url
            and instance.last_lti_url != lti.origin_url
        ):
            instance.last_lti_url = lti.origin_url
            instance.save(update_fields=["last_lti_url"])
        return instance
    except model.DoesNotExist:
        pass

    if not (lti.is_instructor or lti.is_admin):
        return None

    try:
        resource = queryset.get(pk=lti.resource_id)
    except model.DoesNotExist:
        pass
    else:
        raise PortabilityError(
            f"The {model.__name__} ID {resource.id} already exists but is not portable to your "
            f"playlist ({lti.context_id}) and/or consumer site ({lti.get_consumer_site().domain})."
        )

    playlist, _created = Playlist.objects.get_or_create(
        lti_id=lti.context_id,
        consumer_site=lti.get_consumer_site(),
        defaults={"title": lti.context_title},
    )

    default_attributes = {
        "pk": lti.resource_id,
        "lti_id": lti.resource_link_id,
        "playlist": playlist,
    }

    # Apply attributes when the resource allows it
    specific_attributes = (
        ("upload_state", PENDING),
        ("show_download", lti.get_consumer_site().video_show_download_default),
        ("last_lti_url", lti.origin_url),
    )
    for field_name, field_value in specific_attributes:
        if field_exists_on_model(model, field_name):
            default_attributes[field_name] = field_value

    try:
        # Create resource
        new_resource = model.objects.create(**default_attributes)
    except ValidationError:
        # resource must be deleted
        raise ResourceException(
            message=_("Resource has been deleted."), status_code=410
        ) from None

    if hasattr(queryset, "annotate_can_edit"):  # for video only for now
        new_resource.can_edit = True

    return new_resource


def get_resource_closest_owners_and_playlist(model, resource_id):
    """
    Determines the most likely owner of the playlist resource to answer to a portability request.

    Parameters
    ----------
    model:
        The model we want to request portability to.

    resource_id: str
        The id of the resource we want to request portability to.

    Returns
    -------
    tuple(list[str], str), the list of owners PK and the playlist ID.
    """
    try:
        playlist_id, playlist_owner = model.objects.filter(pk=resource_id).values_list(
            "playlist_id",
            "playlist__created_by_id",
        )[0]
        if playlist_owner:
            return [playlist_owner], playlist_id
    except IndexError:
        return [], None

    playlist_admins = PlaylistAccess.objects.filter(
        playlist_id=playlist_id,
        role__in=[ADMINISTRATOR],
    ).values_list("user_id", flat=True)
    if playlist_admins:
        return playlist_admins, playlist_id

    organization_admins = OrganizationAccess.objects.filter(
        organization__playlists__id=playlist_id,
        role__in=[ADMINISTRATOR],
    ).values_list("user_id", flat=True)
    if organization_admins:
        return organization_admins, playlist_id

    consumer_site_admins = ConsumerSiteAccess.objects.filter(
        consumer_site__playlists__id=playlist_id,
        role__in=[ADMINISTRATOR],
    ).values_list("user_id", flat=True)
    if consumer_site_admins:
        return consumer_site_admins, playlist_id

    # We don't go through:
    # `playlist__organization__consumer_sites__users`
    # nor `playlist__consumer_site__organizations__users`
    return [], playlist_id
