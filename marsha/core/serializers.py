"""Define the structure of our API responses with Django Rest Framework serializers."""
from django.conf import settings

from rest_framework import serializers

from .models import Video


class VideoSerializer(serializers.ModelSerializer):
    """Serializer to display a video model with all its resolution options."""

    class Meta:  # noqa
        model = Video
        fields = ("id", "title", "description", "urls")
        read_only_fields = ("id",)

    urls = serializers.SerializerMethodField()

    def get_urls(self, obj):
        """Urls of the video for each type of encoding and in each resolution.

        Parameters
        ----------
        obj : Type[models.Video]
            The video that we want to serialize

        Returns
        -------
        Dictionary
            A dictionary of all urls for:
                - mp4 encodings of the video in each resolution
                - jpeg thumbnails of the video in each resolution

        """
        urls = {"mp4": {}, "thumbnails": {}}

        for resolution in settings.VIDEO_RESOLUTIONS:
            urls["mp4"][str(resolution)] = "{!s}/mp4/{!s}_{:d}.mp4".format(
                obj.playlist.id, obj.id, resolution
            )
            urls["thumbnails"][
                str(resolution)
            ] = "{!s}/thumbnails/{!s}_{:d}.0000000.jpg".format(
                obj.playlist.id, obj.id, resolution
            )
        return urls
