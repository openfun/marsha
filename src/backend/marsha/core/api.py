"""Declare API endpoints with Django RestFramework viewsets."""
import hashlib
import hmac
import logging

from django.apps import apps
from django.conf import settings
from django.utils import timezone

import requests
from rest_framework import mixins, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.models import TokenUser

from .defaults import (
    PENDING,
    READY,
    SUBTITLE_SOURCE_MAX_SIZE,
    THUMBNAIL_SOURCE_MAX_SIZE,
    VIDEO_SOURCE_MAX_SIZE,
)
from .exceptions import MissingUserIdError
from .lti import LTIUser
from .models import Thumbnail, TimedTextTrack, Video
from .permissions import (
    IsResourceInstructorOrAdminUser,
    IsVideoRelatedInstructorTokenOrAdminUser,
    IsVideoToken,
)
from .serializers import (
    ThumbnailSerializer,
    TimedTextTrackSerializer,
    UpdateStateSerializer,
    VideoSerializer,
    XAPIStatementSerializer,
)
from .utils.s3_utils import get_s3_upload_policy_signature
from .utils.time_utils import to_timestamp
from .xapi import XAPI


logger = logging.getLogger(__name__)


@api_view(["POST"])
def update_state(request):
    """View handling AWS POST request to update the state of an object by key.

    Parameters
    ----------
    request : Type[django.http.request.HttpRequest]
        The request on the API endpoint, it should contain a payload with the following fields:
            - key: the key of an object in the source bucket as delivered in the upload policy,
            - state: state of the upload, should be either "ready" or "error",
            - signature: has of the payload salted with a shared secret to authenticate AWS.

    Returns
    -------
    Type[rest_framework.response.Response]
        HttpResponse acknowledging the success or failure of the state update operation.

    """
    serializer = UpdateStateSerializer(data=request.data)

    if serializer.is_valid() is not True:
        return Response(serializer.errors, status=400)

    # The signed message is the s3 object key
    msg = serializer.validated_data["key"]

    # Check if the provided signature is valid against any secret in our list
    #
    # We need to do this to support 2 or more versions of our infrastructure at the same time.
    # It then enables us to do updates and change the secret without incurring downtime.
    signature_is_valid = any(
        serializer.validated_data["signature"]
        == hmac.new(
            secret.encode("utf-8"), msg=msg.encode("utf-8"), digestmod=hashlib.sha256
        ).hexdigest()
        for secret in settings.UPDATE_STATE_SHARED_SECRETS
    )

    if not signature_is_valid:
        return Response("Forbidden", status=403)

    # Retrieve the elements from the key
    key_elements = serializer.get_key_elements()

    # Update the object targeted by the "object_id" and "resource_id"
    model = apps.get_model(app_label="core", model_name=key_elements["model_name"])

    updated = model.objects.filter(id=key_elements["object_id"]).update(
        **{
            # Only update `uploaded_on` if the upload was actually successful
            **(
                {"uploaded_on": key_elements["uploaded_on"]}
                if serializer.validated_data["state"] == READY
                else {}
            ),
            "upload_state": serializer.validated_data["state"],
        }
    )

    if updated:
        return Response({"success": True})

    return Response({"success": False}, status=404)


class VideoViewSet(
    mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet
):
    """Viewset for the API of the video object."""

    queryset = Video.objects.all()
    serializer_class = VideoSerializer
    permission_classes = [IsResourceInstructorOrAdminUser]

    @action(methods=["post"], detail=True, url_path="initiate-upload")
    # pylint: disable=unused-argument
    def initate_upload(self, request, pk=None):
        """Get an upload policy for a video.

        Calling the endpoint resets the upload state to `pending` and returns an upload policy to
        our AWS S3 source bucket.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint
        pk: string
            The primary key of the video

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse carrying the AWS S3 upload policy as a JSON object.

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
                ["content-length-range", 0, VIDEO_SOURCE_MAX_SIZE],
            ],
        )

        policy.update(
            {"key": key, "max_file_size": VIDEO_SOURCE_MAX_SIZE, "stamp": stamp}
        )

        # Reset the upload state of the video
        Video.objects.filter(pk=pk).update(upload_state=defaults.PENDING)

        return Response(policy)


class FileViewSet(
    mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet
):
    """Viewset for the API of the File object."""

    queryset = File.objects.all()
    serializer_class = FileSerializer
    permission_classes = [IsResourceInstructorOrAdminUser]

    @action(methods=["post"], detail=True, url_path="initiate-upload")
    # pylint: disable=unused-argument
    def initate_upload(self, request, pk=None):
        """Get an upload policy for a file.

        Calling the endpoint resets the upload state to `pending` and returns an upload policy to
        our AWS S3 source bucket.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint
        pk: string
            The primary key of the file

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse carrying the AWS S3 upload policy as a JSON object.

        """
        now = timezone.now()
        stamp = to_timestamp(now)

        file_to_upload = self.get_object()
        key = file_to_upload.get_source_s3_key(stamp=stamp)

        policy = get_s3_upload_policy_signature(
            now,
            [{"key": key}, ["content-length-range", 0, defaults.FILE_SOURCE_MAX_SIZE]],
        )

        policy.update(
            {"key": key, "max_file_size": defaults.FILE_SOURCE_MAX_SIZE, "stamp": stamp}
        )

        # Reset the upload state of the video
        File.objects.filter(pk=pk).update(upload_state=defaults.PENDING)

        return Response(policy)


class TimedTextTrackViewSet(
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Viewset for the API of the TimedTextTrack object."""

    serializer_class = TimedTextTrackSerializer

    def get_permissions(self):
        """Instantiate and return the list of permissions that this view requires."""
        if self.action == "metadata":
            permission_classes = [IsVideoToken]
        else:
            permission_classes = [IsVideoRelatedInstructorTokenOrAdminUser]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """Restrict list access to timed text tracks related to the video in the JWT token."""
        user = self.request.user
        if isinstance(user, TokenUser):
            return TimedTextTrack.objects.filter(video__id=user.id)
        return TimedTextTrack.objects.none()

    @action(methods=["post"], detail=True, url_path="initiate-upload")
    # pylint: disable=unused-argument
    def initiate_upload(self, request, pk=None):
        """Get an upload policy for a timed text track.

        Calling the endpoint resets the upload state to `pending` and returns an upload policy to
        our AWS S3 source bucket.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint
        pk: string
            The primary key of the timed text track

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse carrying the AWS S3 upload policy as a JSON object.

        """
        now = timezone.now()
        stamp = to_timestamp(now)

        timed_text_track = self.get_object()
        key = timed_text_track.get_source_s3_key(stamp=stamp)

        policy = get_s3_upload_policy_signature(
            now, [{"key": key}, ["content-length-range", 0, SUBTITLE_SOURCE_MAX_SIZE]]
        )

        policy.update(
            {"key": key, "max_file_size": SUBTITLE_SOURCE_MAX_SIZE, "stamp": stamp}
        )

        # Reset the upload state of the timed text track
        TimedTextTrack.objects.filter(pk=pk).update(upload_state=PENDING)

        return Response(policy)


class ThumbnailViewSet(
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Viewset for the API of the Thumbnail object."""

    permission_classes = [IsVideoRelatedInstructorTokenOrAdminUser]
    serializer_class = ThumbnailSerializer

    def get_queryset(self):
        """Restrict list access to thumbnail related to the video in the JWT token."""
        user = self.request.user
        if isinstance(user, TokenUser):
            return Thumbnail.objects.filter(video__id=user.id)
        return Thumbnail.objects.none()

    @action(methods=["post"], detail=True, url_path="initiate-upload")
    # pylint: disable=unused-argument
    def initiate_upload(self, request, pk=None):
        """Get an upload policy for a thumbnail.

        Calling the endpoint resets the upload state to `pending` and returns an upload policy to
        our AWS S3 source bucket.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint
        pk: string
            The primary key of the thumbnail

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse carrying the AWS S3 upload policy as a JSON object.

        """
        now = timezone.now()
        stamp = to_timestamp(now)

        thumbnail = self.get_object()
        key = thumbnail.get_source_s3_key(stamp=stamp)

        policy = get_s3_upload_policy_signature(
            now,
            [
                {"key": key},
                ["starts-with", "$Content-Type", "image/"],
                ["content-length-range", 0, THUMBNAIL_SOURCE_MAX_SIZE],
            ],
        )

        policy.update(
            {"key": key, "max_file_size": THUMBNAIL_SOURCE_MAX_SIZE, "stamp": stamp}
        )

        # Reset the upload state of the thumbnail
        Thumbnail.objects.filter(pk=pk).update(upload_state=PENDING)

        return Response(policy)


class XAPIStatementView(APIView):
    """Viewset managing xAPI requests."""

    permission_classes = [IsVideoToken]
    http_method_names = ["post"]

    def post(self, request):
        """Send a xAPI statement to a defined LRS.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint.
            It contains a JSON representing part of the xAPI statement

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse to reflect if the XAPI request failed or is successful

        """
        user = request.user
        lti_user = LTIUser(user)
        try:
            video = Video.objects.get(pk=user.id)
        except Video.DoesNotExist:
            return Response(
                {"reason": "video with id {id} does not exist".format(id=user.id)},
                status=404,
            )

        consumer_site = video.playlist.consumer_site

        lrs_url = consumer_site.lrs_url or getattr(settings, "LRS_URL", "")
        lrs_auth_token = consumer_site.lrs_auth_token or getattr(
            settings, "LRS_AUTH_TOKEN", ""
        )
        lrs_xapi_version = consumer_site.lrs_xapi_version or getattr(
            settings, "LRS_XAPI_VERSION", ""
        )

        if not lrs_url or not lrs_auth_token:
            return Response(
                {"reason": "LRS is not configured. This endpoint is not usable."},
                status=501,
            )

        xapi_statement = XAPIStatementSerializer(data=request.data)

        if not xapi_statement.is_valid():
            return Response(xapi_statement.errors, status=400)

        xapi = XAPI(lrs_url, lrs_auth_token, lrs_xapi_version)

        try:
            xapi.send(video, xapi_statement.validated_data, lti_user)
        # pylint: disable=invalid-name
        except requests.exceptions.HTTPError as e:
            message = "Impossible to send xAPI request to LRS."
            logger.critical(
                message,
                extra={"response": e.response.text, "status": e.response.status_code},
            )
            return Response({"status": message}, status=501)
        # pylint: disable=invalid-name
        except MissingUserIdError:
            return Response({"status": "Impossible to identify the actor."}, status=400)

        return Response(status=204)
