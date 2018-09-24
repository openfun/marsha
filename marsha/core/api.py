"""Declare API endpoints with Django RestFramework viewsets."""
from django.utils import timezone

from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .defaults import SUBTITLE_SOURCE_MAX_SIZE, VIDEO_SOURCE_MAX_SIZE
from .models import SubtitleTrack, Video
from .permissions import IsRelatedVideoTokenOrAdminUser, IsVideoTokenOrAdminUser
from .serializers import SubtitleTrackSerializer, VideoSerializer
from .utils.s3_utils import get_s3_upload_policy_signature
from .utils.time_utils import to_timestamp


class VideoViewSet(
    mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet
):
    """Viewset for the API of the video object."""

    queryset = Video.objects.all()
    serializer_class = VideoSerializer
    permission_classes = [IsVideoTokenOrAdminUser]

    @action(methods=["get"], detail=True, url_path="upload-policy")
    # pylint: disable=unused-argument
    def upload_policy(self, request, pk=None):
        """Get a policy for direct upload of a video to our AWS S3 source bucket.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint
        pk: string
            The primary key of the video

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse carrying the policy as a JSON object.

        """
        now = timezone.now()
        stamp = to_timestamp(now)

        video = self.get_object()
        key = video.get_source_s3_key(stamp=stamp)

        policy = get_s3_upload_policy_signature(
            now,
            [
                {"key": key},
                ["starts-with", "$Content-Type", "video/"],
                ["starts-with", "$x-amz-meta-jwt", ""],
                ["content-length-range", 0, VIDEO_SOURCE_MAX_SIZE],
            ],
        )

        policy.update(
            {"key": key, "max_file_size": VIDEO_SOURCE_MAX_SIZE, "stamp": stamp}
        )

        return Response(policy)


class SubtitleTrackViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Viewset for the API of the subtitle object."""

    queryset = SubtitleTrack.objects.all()
    serializer_class = SubtitleTrackSerializer
    permission_classes = [IsRelatedVideoTokenOrAdminUser]

    @action(methods=["get"], detail=True, url_path="upload-policy")
    # pylint: disable=unused-argument
    def upload_policy(self, request, pk=None):
        """Get a policy for direct upload of a subtitle track to our AWS S3 source bucket.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint
        pk: string
            The primary key of the subtitle track

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse carrying the policy as a JSON object.

        """
        now = timezone.now()
        stamp = to_timestamp(now)

        subtitle_track = self.get_object()
        key = subtitle_track.get_source_s3_key(stamp=stamp)

        policy = get_s3_upload_policy_signature(
            now, [{"key": key}, ["content-length-range", 0, SUBTITLE_SOURCE_MAX_SIZE]]
        )

        policy.update(
            {"key": key, "max_file_size": SUBTITLE_SOURCE_MAX_SIZE, "stamp": stamp}
        )

        return Response(policy)
