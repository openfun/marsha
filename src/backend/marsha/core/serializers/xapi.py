"""Structure of our XAPI responses with Django Rest Framework serializers."""
import re
import uuid

from django.core.exceptions import ValidationError

from rest_framework import serializers

from .base import UUID_REGEX


class ExtensionSerializer(serializers.Serializer):
    """Validate the context in a xAPI statement."""

    extensions = serializers.DictField()


class VerbSerializer(serializers.Serializer):
    """Validate the verb in a xAPI statement."""

    id = serializers.URLField()

    display = serializers.DictField()


class XAPIStatementSerializer(serializers.Serializer):
    """A serializer to validate a xAPI statement."""

    verb = VerbSerializer()
    context = ExtensionSerializer()
    result = ExtensionSerializer(required=False)

    id = serializers.RegexField(
        re.compile("^{uuid}$".format(uuid=UUID_REGEX)),
        required=False,
        default=str(uuid.uuid4()),
    )

    def validate(self, attrs):
        """Check if there is no extra arguments in the submitted payload."""
        unknown_keys = set(self.initial_data.keys()) - set(self.fields.keys())
        if unknown_keys:
            raise ValidationError("Got unknown fields: {}".format(unknown_keys))
        return attrs
