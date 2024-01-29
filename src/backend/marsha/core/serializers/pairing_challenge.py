"""Structure of LivePairing related models API responses with Django Rest Framework serializers."""

from django.conf import settings

from rest_framework import serializers

from marsha.core.models import LivePairing


class LivePairingSerializer(serializers.ModelSerializer):
    """Serializer for LivePairing model."""

    class Meta:  # noqa
        model = LivePairing
        fields = ("secret", "expires_in")
        read_only_fields = ("secret", "expires_in")

    expires_in = serializers.SerializerMethodField()

    # pylint: disable=unused-argument
    def get_expires_in(self, obj):
        """Returns LivePairing expiration setting."""
        return settings.LIVE_PAIRING_EXPIRATION_SECONDS


class PairingChallengeSerializer(serializers.Serializer):
    """A serializer to validate data submitted on the PairingChallenge API endpoint."""

    box_id = serializers.UUIDField()
    secret = serializers.CharField(min_length=6, max_length=6)
