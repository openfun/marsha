"""Structure of TimedTextTrack related models API responses with DRF serializers."""

from django.conf import settings

from rest_framework import serializers

from marsha.core.defaults import AWS_STORAGE_BASE_DIRECTORY, CELERY_PIPELINE
from marsha.core.models import TimedTextTrack
from marsha.core.serializers.base import TimestampField
from marsha.core.storage.storage_class import file_storage
from marsha.core.utils import time_utils


class TimedTextTrackSerializer(serializers.ModelSerializer):
    """Serializer to display a timed text track model."""

    class Meta:  # noqa
        model = TimedTextTrack
        fields = (
            "active_stamp",
            "id",
            "is_ready_to_show",
            "mode",
            "language",
            "upload_state",
            "url",
            "source_url",
            "video",
        )
        read_only_fields = (
            "id",
            "active_stamp",
            "is_ready_to_show",
            "upload_state",
            "url",
            "video",
        )

    active_stamp = TimestampField(
        source="uploaded_on", required=False, allow_null=True, read_only=True
    )
    url = serializers.SerializerMethodField()
    source_url = serializers.SerializerMethodField()
    # Make sure video UUID is converted to a string during serialization
    video = serializers.PrimaryKeyRelatedField(
        read_only=True, pk_field=serializers.CharField()
    )
    is_ready_to_show = serializers.BooleanField(read_only=True)

    def to_internal_value(self, data):
        """Validate if the size is coherent with django settings."""
        max_file_size = settings.SUBTITLE_SOURCE_MAX_SIZE
        if "size" in data and int(data["size"]) > max_file_size:
            raise serializers.ValidationError(
                {"size": [f"File too large, max size allowed is {max_file_size} Bytes"]}
            )
        return super().to_internal_value(data)

    def create(self, validated_data):
        """Force the video field to the video of the JWT Token if any.

        Parameters
        ----------
        validated_data : dictionary
            Dictionary of the deserialized values of each field after validation.

        Returns
        -------
        dictionary
            The "validated_data" dictionary is returned after modification.

        """
        validated_data["video_id"] = self.context["video_id"]

        if "size" not in self.initial_data:
            raise serializers.ValidationError({"size": ["File size is required"]})

        return super().create(validated_data)

    def get_source_url(self, obj):
        """Source url of the timed text track.

        This is the url of the uploaded file without any modification.

        Parameters
        ----------
        obj : Type[models.TimedTextTrack]
            The timed text track that we want to serialize

        Returns
        -------
        string or None
            The url for the timed text track uploaded without modification.
            None if the timed text track is still not uploaded to S3 with success.

        """
        if not obj.uploaded_on or not obj.extension:
            return None

        stamp = time_utils.to_timestamp(obj.uploaded_on)

        if obj.process_pipeline == CELERY_PIPELINE:
            base = obj.get_storage_prefix()

            return file_storage.url(f"{base}/source.{obj.extension}")

        # Default fallback to location under "aws" directory
        base = obj.get_storage_prefix(base_dir=AWS_STORAGE_BASE_DIRECTORY)
        stamp = time_utils.to_timestamp(obj.uploaded_on)
        mode = f"_{obj.mode}" if obj.mode else ""

        return file_storage.url(f"{base}/source/{stamp}_{obj.language:s}{mode:s}")

    def get_url(self, obj):
        """Url of the timed text track.

        Parameters
        ----------
        obj : Type[models.TimedTextTrack]
            The timed text track that we want to serialize

        Returns
        -------
        string or None
            The url for the timed text track converted to vtt.
            None if the timed text track is still not uploaded to S3 with success.

        """
        if not obj.uploaded_on:
            return None

        if obj.process_pipeline == CELERY_PIPELINE:
            stamp = time_utils.to_timestamp(obj.uploaded_on)
            base = obj.get_storage_prefix()

            return file_storage.url(f"{base}/{stamp}.vtt")

        # Default fallback to location under "aws" directory
        base = obj.get_storage_prefix(base_dir=AWS_STORAGE_BASE_DIRECTORY)
        stamp = time_utils.to_timestamp(obj.uploaded_on)
        mode = f"_{obj.mode}" if obj.mode else ""

        return file_storage.url(f"{base}/{stamp}_{obj.language:s}{mode:s}.vtt")
