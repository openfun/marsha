"""Declare API endpoints with Django RestFramework viewsets."""
import json
import logging
from mimetypes import guess_extension
from os.path import splitext

from django.apps import apps
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone

import requests
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.models import TokenUser

from . import defaults, forms, permissions, serializers
from .lti import LTIUser
from .models import Document, Organization, Playlist, Thumbnail, TimedTextTrack, Video
from .utils.api_utils import validate_signature
from .utils.medialive_utils import (
    create_live_stream,
    create_mediapackage_harvest_job,
    delete_aws_element_stack,
    start_live_channel,
    stop_live_channel,
)
from .utils.s3_utils import create_presigned_post
from .utils.time_utils import to_timestamp
from .utils.xmpp_utils import close_room, create_room
from .xapi import XAPI, XAPIStatement


logger = logging.getLogger(__name__)


class ObjectPkMixin:
    """
    Get the object primary key from the URL path.

    This is useful to avoid making extra requests using view.get_object() on
    a ViewSet when we only need the object's id, which is available in the URL.
    """

    def get_object_pk(self):
        """Get the object primary key from the URL path."""
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        return self.kwargs.get(lookup_url_kwarg)


class UserViewSet(viewsets.GenericViewSet):
    """ViewSet for all user-related interactions."""

    serializer_class = serializers.UserSerializer

    @action(detail=False, permission_classes=[])
    def whoami(self, request):
        """
        Get information on the current user.

        This is the only implemented user-related endpoint.
        """
        # If the user is not logged in, the request has no object. Return a 401 so the caller
        # knows they need to log in first.
        if (
            not request.user.is_authenticated
            or (request.user.id is None)
            or (request.user.id == "None")
        ):
            return Response(status=401)

        # Get an actual user object from the TokenUser id
        # pylint: disable=invalid-name
        User = get_user_model()
        try:
            user = User.objects.prefetch_related(
                "organization_accesses", "organization_accesses__organization"
            ).get(id=request.user.id)
        except User.DoesNotExist:
            return Response(status=401)

        return Response(data=self.get_serializer(user).data)


class OrganizationViewSet(ObjectPkMixin, viewsets.ModelViewSet):
    """ViewSet for all organization-related interactions."""

    permission_classes = [permissions.NotAllowed]
    queryset = Organization.objects.all()
    serializer_class = serializers.OrganizationSerializer

    def get_permissions(self):
        """
        Manage permissions for built-in DRF methods.

        Default to the actions' self defined permissions if applicable or
        to the ViewSet's default permissions.
        """
        if self.action in ["retrieve"]:
            permission_classes = [permissions.IsOrganizationAdmin]
        else:
            try:
                permission_classes = getattr(self, self.action).kwargs.get(
                    "permission_classes"
                )
            except AttributeError:
                permission_classes = self.permission_classes
        return [permission() for permission in permission_classes]


class PlaylistViewSet(ObjectPkMixin, viewsets.ModelViewSet):
    """ViewSet for all playlist-related interactions."""

    permission_classes = [permissions.NotAllowed]
    queryset = Playlist.objects.all()
    serializer_class = serializers.PlaylistSerializer

    def get_permissions(self):
        """
        Manage permissions for built-in DRF methods.

        Default to the actions' self defined permissions if applicable or
        to the ViewSet's default permissions.
        """
        if self.action in ["list"]:
            permission_classes = [IsAuthenticated]
        elif self.action in ["retrieve"]:
            permission_classes = [
                permissions.IsPlaylistAdmin | permissions.IsPlaylistOrganizationAdmin
            ]
        elif self.action in ["create"]:
            permission_classes = [permissions.IsParamsOrganizationAdmin]
        else:
            try:
                permission_classes = getattr(self, self.action).kwargs.get(
                    "permission_classes"
                )
            except AttributeError:
                permission_classes = self.permission_classes
        return [permission() for permission in permission_classes]

    def list(self, request, *args, **kwargs):
        """
        Return a list of playlists.

        By default, filtered to only return to the user what
        playlists they have access to.
        """
        queryset = self.get_queryset().filter(
            organization__users__id=self.request.user.id
        )

        organization_id = self.request.query_params.get("organization")
        if organization_id:
            queryset = queryset.filter(organization__id=organization_id)

        page = self.paginate_queryset(queryset.order_by("title"))
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset.order_by("title"), many=True)
        return Response(serializer.data)


@api_view(["POST"])
def update_state(request):
    """View handling AWS POST request to update the state of an object by key.

    Parameters
    ----------
    request : Type[django.http.request.HttpRequest]
        The request on the API endpoint, it should contain a payload with the following fields:
            - key: the key of an object in the source bucket as delivered in the upload policy,
            - state: state of the upload, should be either "ready" or "error",
            - extraParameters: Dict containing arbitrary data sent from AWS Lambda.

    Returns
    -------
    Type[rest_framework.response.Response]
        HttpResponse acknowledging the success or failure of the state update operation.

    """
    msg = request.body
    serializer = serializers.UpdateStateSerializer(data=request.data)

    if serializer.is_valid() is not True:
        return Response(serializer.errors, status=400)

    # Check if the provided signature is valid against any secret in our list
    if not validate_signature(request.headers.get("X-Marsha-Signature"), msg):
        return Response("Forbidden", status=403)

    # Retrieve the elements from the key
    key_elements = serializer.get_key_elements()

    # Update the object targeted by the "object_id" and "resource_id"
    model = apps.get_model(app_label="core", model_name=key_elements["model_name"])

    extra_parameters = serializer.validated_data["extraParameters"]
    if (
        serializer.validated_data["state"] == defaults.READY
        and hasattr(model, "extension")
        and "extension" not in extra_parameters
    ):
        # The extension is part of the s3 key name and added in this key
        # when generated by the initiate upload
        extra_parameters["extension"] = key_elements.get("extension")

    try:
        object_instance = model.objects.get(id=key_elements["object_id"])
    except model.DoesNotExist:
        return Response({"success": False}, status=404)

    object_instance.update_upload_state(
        upload_state=serializer.validated_data["state"],
        uploaded_on=key_elements.get("uploaded_on")
        if serializer.validated_data["state"] in [defaults.READY, defaults.HARVESTED]
        else None,
        **extra_parameters,
    )

    return Response({"success": True})


class VideoViewSet(ObjectPkMixin, viewsets.ModelViewSet):
    """Viewset for the API of the video object."""

    queryset = Video.objects.all()
    serializer_class = serializers.VideoSerializer
    permission_classes = [permissions.NotAllowed]

    def get_permissions(self):
        """
        Manage permissions for built-in DRF methods.

        Default to the actions' self defined permissions if applicable or
        to the ViewSet's default permissions.
        """
        if self.action in ["retrieve", "partial_update", "update"]:
            permission_classes = [
                permissions.IsTokenResourceRouteObject & permissions.IsTokenInstructor
                | permissions.IsTokenResourceRouteObject & permissions.IsTokenAdmin
                | permissions.IsVideoPlaylistAdmin
                | permissions.IsVideoOrganizationAdmin
            ]
        elif self.action in ["list"]:
            permission_classes = [IsAuthenticated]
        elif self.action in ["create"]:
            permission_classes = [
                permissions.IsParamsPlaylistAdmin
                | permissions.IsParamsPlaylistAdminThroughOrganization
            ]
        elif self.action in ["destroy"]:
            permission_classes = [
                permissions.IsVideoPlaylistAdmin | permissions.IsVideoOrganizationAdmin
            ]
        else:
            try:
                permission_classes = (
                    getattr(self, self.action).kwargs.get("permission_classes")
                    if self.action
                    else self.permission_classes
                )
            except AttributeError:
                permission_classes = self.permission_classes
        return [permission() for permission in permission_classes]

    def get_serializer_context(self):
        """Extra context provided to the serializer class."""
        context = super().get_serializer_context()
        # The API is only reachable by admin users.
        context["can_return_live_info"] = True

        user = self.request.user
        if isinstance(user, TokenUser):
            context["roles"] = user.token.payload.get("roles", [])
            context["user_id"] = user.token.payload.get("user_id", None)

        return context

    def create(self, request, *args, **kwargs):
        """Create one video based on the request payload."""
        try:
            form = forms.VideoForm(request.data)
            video = form.save()
        except ValueError:
            return Response({"errors": [dict(form.errors)]}, status=400)

        serializer = self.get_serializer(video)

        return Response(serializer.data, status=201)

    def list(self, request, *args, **kwargs):
        """List videos through the API."""
        # Limit the queryset to the playlists the user has access directly or through
        # an access they have to an organization
        queryset = self.get_queryset().filter(
            Q(playlist__user_accesses__user__id=request.user.id)
            | Q(playlist__organization__user_accesses__user__id=request.user.id)
        )

        playlist = request.query_params.get("playlist")
        if playlist is not None:
            queryset = queryset.filter(playlist__id=playlist)

        organization = request.query_params.get("organization")
        if organization is not None:
            queryset = queryset.filter(playlist__organization__id=organization)

        queryset = queryset.order_by("title")

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(
        methods=["post"],
        detail=True,
        url_path="initiate-upload",
        permission_classes=[
            permissions.IsTokenResourceRouteObject & permissions.IsTokenInstructor
            | permissions.IsTokenResourceRouteObject & permissions.IsTokenAdmin
            | permissions.IsVideoPlaylistAdmin
            | permissions.IsVideoOrganizationAdmin
        ],
    )
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

        presigned_post = create_presigned_post(
            [
                ["starts-with", "$Content-Type", "video/"],
                ["content-length-range", 0, settings.VIDEO_SOURCE_MAX_SIZE],
            ],
            {},
            key,
        )

        # Reset the upload state of the video
        Video.objects.filter(pk=pk).update(upload_state=defaults.PENDING)

        return Response(presigned_post)

    @action(
        methods=["post"],
        detail=True,
        url_path="initiate-live",
        permission_classes=[
            permissions.IsTokenResourceRouteObject & permissions.IsTokenInstructor
            | permissions.IsTokenResourceRouteObject & permissions.IsTokenAdmin
        ],
    )
    # pylint: disable=unused-argument
    def initiate_live(
        self,
        request,
        pk=None,
    ):
        """Create a live stack on AWS ready to stream.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint
        pk: string
            The primary key of the video

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse with the serialized video.
        """
        serializer = serializers.InitLiveStateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        stamp = to_timestamp(now)

        video = self.get_object()
        key = f"{video.pk}_{stamp}"

        live_info = create_live_stream(key)
        live_info.update({"type": serializer.validated_data["type"]})

        Video.objects.filter(pk=pk).update(
            live_info=live_info,
            upload_state=defaults.PENDING,
            live_state=defaults.CREATING,
            uploaded_on=None,
        )

        video.refresh_from_db()
        serializer = self.get_serializer(video)

        return Response(serializer.data)

    @action(
        methods=["post"],
        detail=True,
        url_path="start-live",
        permission_classes=[
            permissions.IsTokenResourceRouteObject & permissions.IsTokenInstructor
            | permissions.IsTokenResourceRouteObject & permissions.IsTokenAdmin
        ],
    )
    # pylint: disable=unused-argument
    def start_live(self, request, pk=None):
        """Start a medialive channel on AWS.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint
        pk: string
            The primary key of the video

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse with the serialized video.
        """
        video = self.get_object()

        if video.live_state is None:
            return Response({"error": "Call initiate-live before starting a live"}, 400)

        if video.live_state != defaults.IDLE:
            return Response(
                {
                    "error": (
                        f"Impossible to start live video. Current status is {video.live_state}"
                    )
                },
                400,
            )

        start_live_channel(video.live_info.get("medialive").get("channel").get("id"))
        if settings.LIVE_CHAT_ENABLED:
            create_room(video.id)

        video.live_state = defaults.STARTING
        video.save()
        serializer = self.get_serializer(video)

        return Response(serializer.data)

    @action(
        methods=["post"],
        detail=True,
        url_path="stop-live",
        permission_classes=[
            permissions.IsTokenResourceRouteObject & permissions.IsTokenInstructor
            | permissions.IsTokenResourceRouteObject & permissions.IsTokenAdmin
        ],
    )
    # pylint: disable=unused-argument
    def stop_live(self, request, pk=None):
        """Stop a medialive channel on AWS.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint
        pk: string
            The primary key of the video

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse with the serialized video.
        """
        video = self.get_object()

        if video.live_state is None:
            return Response({"error": "Impossible to stop a non live video."}, 400)

        if video.live_state != defaults.RUNNING:
            return Response(
                {
                    "error": f"Impossible to stop live video. Current status is {video.live_state}"
                },
                400,
            )

        stop_live_channel(video.live_info.get("medialive").get("channel").get("id"))

        video.live_state = defaults.STOPPING
        video.save()
        serializer = self.get_serializer(video)

        return Response(serializer.data)

    @action(
        methods=["patch"],
        detail=True,
        url_path="update-live-state",
        permission_classes=[],
    )
    # pylint: disable=unused-argument
    def update_live_state(
        self,
        request,
        pk=None,
    ):
        """View handling AWS POST request to update the video live state.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint, it should contain a payload with the following fields:
                - state: state of the live, should be "live" or "stopped",
        pk: string
            The primary key of the video

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse acknowledging the success or failure of the live state update operation.

        """
        now = timezone.now()
        stamp = to_timestamp(now)
        msg = request.body
        serializer = serializers.UpdateLiveStateSerializer(data=request.data)

        if serializer.is_valid() is not True:
            return Response(serializer.errors, status=400)

        # Check if the provided signature is valid against any secret in our list
        if not validate_signature(request.headers.get("X-Marsha-Signature"), msg):
            return Response("Forbidden", status=403)

        # Load the video first to return a 404 if not existing
        video = self.get_object()

        # Try to update the video with the new live state. If the video has already this live state
        # we are in a concurrent request and only the first one should be accepted.
        updated_rows = Video.objects.filter(
            ~Q(live_state=serializer.validated_data["state"]),
            pk=video.pk,
        ).update(live_state=serializer.validated_data["state"])

        if updated_rows == 0:
            # State was alreay updated by an earlier request, we can stop the process here
            # If we return a status different than 200 the lambda will retry
            # to update the live state several times.
            return Response({"success": True})

        video.refresh_from_db()

        live_info = video.live_info
        live_info.update(
            {"cloudwatch": {"logGroupName": serializer.validated_data["logGroupName"]}}
        )

        if video.live_state == defaults.RUNNING:
            live_info.update({"started_at": stamp})
            video.live_info = live_info

        if video.live_state == defaults.STOPPED:
            live_info.update({"stopped_at": stamp})
            video.upload_state = defaults.HARVESTING
            video.live_info = live_info
            create_mediapackage_harvest_job(video)
            delete_aws_element_stack(video)
            if settings.LIVE_CHAT_ENABLED:
                close_room(video.id)

        video.save()

        return Response({"success": True})


class DocumentViewSet(
    ObjectPkMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Viewset for the API of the Document object."""

    queryset = Document.objects.all()
    serializer_class = serializers.DocumentSerializer
    permission_classes = [
        permissions.IsTokenResourceRouteObject & permissions.IsTokenInstructor
        | permissions.IsTokenResourceRouteObject & permissions.IsTokenAdmin
    ]

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
            The primary key of the Document instance

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse carrying the AWS S3 upload policy as a JSON object.

        """
        serializer = serializers.InitiateUploadSerializer(data=request.data)

        if serializer.is_valid() is not True:
            return Response(serializer.errors, status=400)

        now = timezone.now()
        stamp = to_timestamp(now)

        extension = splitext(serializer.validated_data["filename"])[
            1
        ] or guess_extension(serializer.validated_data["mimetype"])

        document = self.get_object()
        key = document.get_source_s3_key(stamp=stamp, extension=extension)

        presigned_post = create_presigned_post(
            [["content-length-range", 0, settings.DOCUMENT_SOURCE_MAX_SIZE]],
            {},
            key,
        )

        # Reset the upload state of the document
        Document.objects.filter(pk=pk).update(upload_state=defaults.PENDING)

        return Response(presigned_post)


class TimedTextTrackViewSet(ObjectPkMixin, viewsets.ModelViewSet):
    """Viewset for the API of the TimedTextTrack object."""

    permission_classes = [permissions.NotAllowed]
    serializer_class = serializers.TimedTextTrackSerializer

    def get_permissions(self):
        """Instantiate and return the list of permissions that this view requires."""
        if self.action == "metadata":
            permission_classes = [permissions.IsVideoToken]
        elif self.action in ["create", "list"]:
            # NB: list should be restricted by queryset, not resource id
            permission_classes = [
                permissions.IsTokenInstructor | permissions.IsTokenAdmin
            ]
        else:
            permission_classes = [
                permissions.IsTokenResourceRouteObjectRelatedVideo
                & permissions.IsTokenInstructor
                | permissions.IsTokenResourceRouteObjectRelatedVideo
                & permissions.IsTokenAdmin
            ]
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

        presigned_post = create_presigned_post(
            [["content-length-range", 0, settings.SUBTITLE_SOURCE_MAX_SIZE]],
            {},
            key,
        )

        # Reset the upload state of the timed text track
        TimedTextTrack.objects.filter(pk=pk).update(upload_state=defaults.PENDING)

        return Response(presigned_post)


class ThumbnailViewSet(
    ObjectPkMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Viewset for the API of the Thumbnail object."""

    permission_classes = [permissions.NotAllowed]
    serializer_class = serializers.ThumbnailSerializer

    def get_permissions(self):
        """Instantiate and return the list of permissions that this view requires."""
        if self.action == "create":
            permission_classes = [
                permissions.IsTokenInstructor | permissions.IsTokenAdmin
            ]
        else:
            permission_classes = [
                permissions.IsTokenResourceRouteObjectRelatedVideo
                & permissions.IsTokenInstructor
                | permissions.IsTokenResourceRouteObjectRelatedVideo
                & permissions.IsTokenAdmin
            ]
        return [permission() for permission in permission_classes]

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

        presigned_post = create_presigned_post(
            [
                ["starts-with", "$Content-Type", "image/"],
                ["content-length-range", 0, settings.THUMBNAIL_SOURCE_MAX_SIZE],
            ],
            {},
            key,
        )

        # Reset the upload state of the thumbnail
        Thumbnail.objects.filter(pk=pk).update(upload_state=defaults.PENDING)

        return Response(presigned_post)


class XAPIStatementView(APIView):
    """Viewset managing xAPI requests."""

    permission_classes = [permissions.IsVideoToken]
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

        # xapi statements are sent to a consumer-site-specific logger. We assume that the logger
        # name respects the following convention: "xapi.[consumer site domain]",
        # _e.g._ `xapi.foo.education` for the `foo.education` consumer site domain. Note that this
        # logger should be defined in your settings with an appropriate handler and formatter.
        xapi_logger = logging.getLogger(f"xapi.{consumer_site.domain}")

        # xapi statement sent by the client but incomplete
        partial_xapi_statement = serializers.XAPIStatementSerializer(data=request.data)
        if not partial_xapi_statement.is_valid():
            return Response(partial_xapi_statement.errors, status=400)

        # xapi statement enriched with video and lti_user informations
        xapi_statement = XAPIStatement(
            video, partial_xapi_statement.validated_data, lti_user
        )

        # Log the statement in the xapi logger
        xapi_logger.info(json.dumps(xapi_statement.get_statement()))

        if not consumer_site.lrs_url or not consumer_site.lrs_auth_token:
            return Response(
                {"reason": "LRS is not configured. This endpoint is not usable."},
                status=501,
            )

        xapi = XAPI(
            consumer_site.lrs_url,
            consumer_site.lrs_auth_token,
            consumer_site.lrs_xapi_version,
        )

        try:
            xapi.send(xapi_statement)
        # pylint: disable=invalid-name
        except requests.exceptions.HTTPError as e:
            message = "Impossible to send xAPI request to LRS."
            logger.critical(
                message,
                extra={"response": e.response.text, "status": e.response.status_code},
            )
            return Response({"status": message}, status=501)

        return Response(status=204)
