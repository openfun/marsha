"""This module holds serializers and constants used across the Marsha project."""
from datetime import timedelta
import re

from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.utils.text import slugify

from rest_framework import serializers

from ..defaults import ERROR, HARVESTED, PROCESSING, READY, STATE_CHOICES
from ..models import TimedTextTrack
from ..utils import cloudfront_utils, time_utils
from ..utils.api_utils import get_uploadable_models_s3_mapping


UUID_REGEX = (
    "[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}"
)
EXTENSION_REGEX = '[^.\\/:*?&"<>|\r\n]+'
TIMED_TEXT_EXTENSIONS = "|".join(m[0] for m in TimedTextTrack.MODE_CHOICES)
MODEL_REGEX = "|".join(get_uploadable_models_s3_mapping().keys())
KEY_PATTERN = (
    r"^{uuid:s}/(?P<model_name>{models:s})/"
    r"(?P<object_id>{uuid:s})/(?P<stamp>[0-9]{{10}})(_[a-z-]{{2,10}}_({tt_ex}))?"
    # The extension is captured and is optional. If present and the resource has an extension
    # attribute we will save it in database.
    r"(\.(?P<extension>{extension:s}))?$"
).format(
    uuid=UUID_REGEX,
    tt_ex=TIMED_TEXT_EXTENSIONS,
    extension=EXTENSION_REGEX,
    models=MODEL_REGEX,
)
KEY_REGEX = re.compile(KEY_PATTERN)


def get_video_cloudfront_url_params(video_id):
    """
    Generate the policy and sign it to allow to access to all resources for a given video id.
    """
    resource = (
        f"{settings.AWS_S3_URL_PROTOCOL}://{settings.CLOUDFRONT_DOMAIN}/{video_id}/*"
    )
    cache_key = f"cloudfront_signed_url:video:{video_id}:{resource}"
    date_less_than = timezone.now() + timedelta(
        seconds=settings.CLOUDFRONT_SIGNED_URLS_VALIDITY
    )
    if (params := cache.get(cache_key)) is None:
        params = cloudfront_utils.generate_cloudfront_urls_signed_parameters(
            resource, date_less_than=date_less_than
        )
        cache.set(cache_key, params, settings.CLOUDFRONT_SIGNED_URL_CACHE_DURATION)

    return params


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


class UploadableFileWithExtensionSerializerMixin:
    """Set of function used by uploadable files managing an extension."""

    def _get_filename(self, title, extension=None, prefix=None):
        """Filename of an object.

        Parameters
        ----------
        title : Type[string]
            The raw object title

        extension: Type[string]
            The file extension if any

        prefix: Type[string]
            The file prefix if any

        Returns
        -------
        String
            The document's filename

        """

        prefix = f"{slugify(prefix)}_" if prefix else ""

        extension = f".{extension}" if extension else ""

        return f"{prefix}{slugify(title)}{extension}"

    def validate_title(self, value):
        """Force extension removal in the title field (if any).

        Parameters
        ----------
        value : Type[string]
            the value sent in the request

        Returns
        -------
        String
            The title without the extension if there is one.

        """
        # pylint: disable=consider-using-f-string
        match = re.match(
            r"^(?P<title>.*)(\.{extension_regex:s})$".format(
                extension_regex=EXTENSION_REGEX
            ),
            value,
        )
        if match:
            return match.group("title")

        return value
