"""Declare API endpoints for pairing challenge with Django RestFramework viewsets."""

from django.conf import settings
from django.core.exceptions import ValidationError

from rest_framework.decorators import api_view, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from marsha.core import serializers
from marsha.core.defaults import JITSI
from marsha.core.models import Device, LivePairing


class PairingChallengeThrottle(AnonRateThrottle):
    """Throttling for pairing challenge requests."""

    def get_ident(self, request):
        """Identify requests by box_id instead of IP"""
        try:
            box_id = request.data.get("box_id")
            Device.objects.get(pk=box_id)
            return box_id

        # UUIDField is validated, even with a get.
        # We must catch ValidationError then.
        except (Device.DoesNotExist, ValidationError):
            return None


@api_view(["POST"])
@throttle_classes([PairingChallengeThrottle])
def pairing_challenge(request):
    """View handling pairing challenge request to stream from an external device.

    Deletes expired LivePairing objects.

    Parameters
    ----------
    request : Type[django.http.request.HttpRequest]
        The request on the API endpoint, it must contain a payload with the following fields:
            - box_id: uuid from external device.
            - secret: generated pairing secret.

    Returns
    -------
    Type[rest_framework.response.Response]
        HttpResponse containing live video credentials.

    """
    LivePairing.objects.delete_expired()

    serializer = serializers.PairingChallengeSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"detail": "Invalid request."}, status=400)

    try:
        live_pairing = LivePairing.objects.get(secret=request.data.get("secret"))
    except LivePairing.DoesNotExist:
        return Response({"detail": "Secret not found."}, status=404)

    live_pairing.delete()

    if live_pairing.video.live_type != JITSI:
        return Response({"detail": "Matching video is not a Jitsi Live."}, status=400)

    Device.objects.get_or_create(id=request.data.get("box_id"))

    return Response(
        {"jitsi_url": f"https://{settings.JITSI_DOMAIN}/{live_pairing.video.id}"}
    )
