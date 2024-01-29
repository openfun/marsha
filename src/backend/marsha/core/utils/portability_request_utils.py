"""Helpers to manage portability requests states consistently."""

from django.db.transaction import atomic

from marsha.core.models import PlaylistPortability, PortabilityRequestState


class PortabilityTransitionException(Exception):
    """Error occurs when a portability request state is not as expected."""


@atomic()
def accept_portability_request(portability_request):
    """Mark the portability requested as accepted and create the playlist portability"""
    if portability_request.state != PortabilityRequestState.PENDING.value:
        raise PortabilityTransitionException()
    portability_request.state = PortabilityRequestState.ACCEPTED.value
    portability_request.save(update_fields=("state",))

    PlaylistPortability.objects.get_or_create(
        source_playlist=portability_request.for_playlist,
        target_playlist=portability_request.from_playlist,
    )


def reject_portability_request(portability_request):
    """Mark the portability requested as rejected"""
    if portability_request.state != PortabilityRequestState.PENDING.value:
        raise PortabilityTransitionException()
    portability_request.state = PortabilityRequestState.REJECTED.value
    portability_request.save(update_fields=("state",))


def destroy_portability_request(portability_request):
    """Delete the portability request if not accepted/rejected"""
    if portability_request.state != PortabilityRequestState.PENDING.value:
        raise PortabilityTransitionException()
    portability_request.delete()
