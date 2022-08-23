"""Structure of Thumbnail related models API responses with Django Rest Framework serializers."""
from django.conf import settings
from django.db.utils import IntegrityError

from rest_framework import serializers

from ..models import Thumbnail
from ..utils import time_utils
from .base import TimestampField


class ThumbnailSerializer(serializers.ModelSerializer):
    """Serializer to display a thumbnail."""

    class Meta:  # noqa
        model = Thumbnail
        fields = (
            "active_stamp",
            "id",
            "is_ready_to_show",
            "upload_state",
            "urls",
            "video",
        )
        read_only_fields = (
            "active_stamp",
            "id",
            "is_ready_to_show",
            "upload_state",
            "urls",
            "video",
        )

    active_stamp = TimestampField(
        source="uploaded_on", required=False, allow_null=True, read_only=True
    )
    video = serializers.PrimaryKeyRelatedField(
        read_only=True, pk_field=serializers.CharField()
    )
    is_ready_to_show = serializers.BooleanField(read_only=True)
    urls = serializers.SerializerMethodField()

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
        # user here is a video as it comes from the JWT
        # It is named "user" by convention in the `rest_framework_simplejwt` dependency we use.
        resource = self.context["request"].resource
        if not validated_data.get("video_id") and resource:
            validated_data["video_id"] = resource.id
        try:
            return super().create(validated_data)
        except IntegrityError as exc:
            raise serializers.ValidationError(
                {"video": ["Thumbnail with this Video already exists."]}
            ) from exc

    def to_representation(self, instance):
        """
        Object instance -> Dict of primitive datatypes.
        Depending if the serializer was instancianted with a Thumbnail
        model instance or not, we have to fetch it in the database to avoid error
        trying to work with a None instance in all the serializerMethodField
        of this serializer.
        """
        if isinstance(instance, Thumbnail):
            return super().to_representation(instance)

        try:
            thumbnail = instance.get()
            return super().to_representation(thumbnail)
        except Thumbnail.DoesNotExist:
            return None

    def get_urls(self, obj):
        """Urls of the thumbnail.

        Parameters
        ----------
        obj : Type[models.Thumbnail]
            The thumbnail that we want to serialize

        Returns
        -------
        Dict or None
            The urls for the thumbnail.
            None if the thumbnail is still not uploaded to S3 with success.

        """
        if obj.uploaded_on:
            base = f"{settings.AWS_S3_URL_PROTOCOL}://{settings.CLOUDFRONT_DOMAIN}/{obj.video.pk}"
            urls = {}
            stamp = time_utils.to_timestamp(obj.uploaded_on)
            for resolution in settings.VIDEO_RESOLUTIONS:
                urls[resolution] = f"{base}/thumbnails/{stamp}_{resolution}.jpg"
            return urls
        return None
