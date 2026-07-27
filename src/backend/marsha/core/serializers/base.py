"""This module holds serializers and constants used across the Marsha project."""

import re

from django.core.exceptions import ValidationError
from django.utils.text import slugify

from rest_framework import serializers
from rest_framework.fields import empty

from marsha.core.defaults import (
    COPYING,
    ERROR,
    HARVESTED,
    INFECTED,
    PROCESSING,
    READY,
    SCANNING,
    STATE_CHOICES,
)
from marsha.core.models import TimedTextTrack
from marsha.core.utils import time_utils
from marsha.core.utils.api_utils import get_uploadable_models_s3_mapping


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


class ReadOnlyModelSerializer(serializers.ModelSerializer):
    """A base serializer whose fields are all readonly."""

    def get_fields(self):
        """
        Returns a dictionary of {field_name: field_instance}
        where all fields are read-only.
        """
        fields = super().get_fields()
        for field in fields.values():
            field.read_only = True
        return fields


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


class ReadWritePrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    """
    A serializer field to serialize/deserialize complete related object.
    It allows serializing related foreign related object (many to one) for display purpose,
    while still allowing to use only its PK when editing (create or update).
    Examples (for the parent object, with this serializer for playlist):
     - GET will return
       ```
        {
            "id": "1",
            "title": "foo",
            "playlist": {
                "id": "1",
                "title": "bar",
                "lti_id": "course-v1:ufr+mathematics+00001"
            }
        }
       ```
     - while you can POST/PUT/PATCH with
       ```
        {
            "id": "1",
            "title": "foo",
            "playlist": 1
        }
       ```
    """

    def __init__(self, to_representation_serializer, **kwargs):
        """Init the serializer providing a serializer to use for the related object."""
        self.to_representation_serializer = to_representation_serializer
        super().__init__(**kwargs)

    def use_pk_only_optimization(self):
        """
        Do not use this optimization since we need to retrieve more data from the related object.
        """
        return False

    def to_internal_value(self, data):
        """
        Allow providing only the PK of the related object (nominal case) or extract the PK
        if the POSTed data are from a previous GET, giving all the object.

        This allows to provide input for the parent object like
        ```
        {
            "id": "1",
            "title": "foo",
            "playlist": 1
        }
        ```

        or
        ```
            {
                "id": "1",
                "title": "foo",
                "playlist": {
                    "id": "1",
                    "title": "bar",
                    "lti_id": "course-v1:ufr+mathematics+00001"
                }
            }
        ```
        """
        if isinstance(data, dict):
            return super().to_internal_value(data["id"])
        return super().to_internal_value(data)

    def run_validation(self, data=empty):
        """Validate data according to the same principle as the `to_internal_value` method."""
        if isinstance(data, dict):
            return super().run_validation(data["id"])
        return super().run_validation(data)

    def to_representation(self, value):
        """Use the provided serializer to serialize the related object."""
        return self.to_representation_serializer(value).data


class UpdateStateSerializer(serializers.Serializer):
    """A serializer to validate data submitted on the UpdateState API endpoint."""

    key = serializers.RegexField(KEY_REGEX)
    state = serializers.ChoiceField(
        tuple(
            c
            for c in STATE_CHOICES
            if c[0]
            in (PROCESSING, READY, ERROR, HARVESTED, SCANNING, INFECTED, COPYING)
        )
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
