"""This module holds serializers and constants used across the Marsha project."""
import re

from django.core.exceptions import ValidationError

from rest_framework import serializers

from ..defaults import ERROR, HARVESTED, PROCESSING, READY, STATE_CHOICES
from ..models import TimedTextTrack
from ..utils import time_utils


UUID_REGEX = (
    "[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}"
)
EXTENSION_REGEX = '[^.\\/:*?&"<>|\r\n]+'
# This regex matches keys in AWS for videos, timed text tracks, thumbail and document
TIMED_TEXT_EXTENSIONS = "|".join(m[0] for m in TimedTextTrack.MODE_CHOICES)
KEY_PATTERN = (
    r"^{uuid:s}/(?P<model_name>video|thumbnail|timedtexttrack|document)/(?P<object_id>"
    r"{uuid:s})/(?P<stamp>[0-9]{{10}})(_[a-z-]{{2,10}}_({tt_ex}))?"
    # The extension is captured and is optional. If present and the resource has an extension
    # attribute we will save it in database.
    r"(\.(?P<extension>{extension:s}))?$"
).format(uuid=UUID_REGEX, tt_ex=TIMED_TEXT_EXTENSIONS, extension=EXTENSION_REGEX)
KEY_REGEX = re.compile(KEY_PATTERN)


class TimestampField(serializers.DateTimeField):
    """A serializer field to serialize/deserialize a datetime to a Unix timestamp."""

    def to_representation(self, value):
        """Convert a datetime value to a Unix timestamp.

        Parameters
        ----------
        value: Type[datetime.datetime]
            The datetime value to convert

        Returns
        -------
        integer or `None`
            Unix timestamp for the datetime value or `None`

        """
        return time_utils.to_timestamp(value) if value else None

    def to_internal_value(self, value):
        """Convert a Unix timestamp value to a timezone aware datetime.

        Parameters
        ----------
        value: Type[string|integer]
            The Unix timestamp to convert

        Returns
        -------
        datetime.datetime or `None`
            datetime instance corresponding to the Unix timestamp or `None`

        Raises
        ------
        ValidationError
            when the value passed in argument is not a valid timestamp

        """
        try:
            return super().to_internal_value(time_utils.to_datetime(value))
        except OverflowError as error:
            raise ValidationError(error) from error


class UpdateStateSerializer(serializers.Serializer):
    """A serializer to validate data submitted on the UpdateState API endpoint."""

    key = serializers.RegexField(KEY_REGEX)
    state = serializers.ChoiceField(
        tuple(c for c in STATE_CHOICES if c[0] in (PROCESSING, READY, ERROR, HARVESTED))
    )
    extraParameters = serializers.DictField()

    def get_key_elements(self):
        """Use a regex to parse elements from the key."""
        elements = KEY_REGEX.match(self.validated_data["key"]).groupdict()
        elements["uploaded_on"] = time_utils.to_datetime(elements["stamp"])
        return elements
