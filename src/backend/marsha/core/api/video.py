"""Declare API endpoints for videos with Django RestFramework viewsets."""
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import OperationalError, transaction
from django.db.models import Q
from django.http import Http404
from django.utils import timezone

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.models import TokenUser

from marsha.core.defaults import JITSI
from marsha.websocket.utils import channel_layers_utils

from .. import defaults, forms, permissions, serializers, storage
from ..models import LivePairing, Video
from ..utils.api_utils import validate_signature
from ..utils.medialive_utils import (
    ManifestMissingException,
    create_live_stream,
    create_mediapackage_harvest_job,
    delete_aws_element_stack,
    delete_mediapackage_channel,
    start_live_channel,
    stop_live_channel,
    wait_medialive_channel_is_created,
)
from ..utils.time_utils import to_timestamp
from ..utils.xmpp_utils import close_room, create_room
from .base import ObjectPkMixin


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
        if self.action in ["partial_update", "update"]:
            permission_classes = [
                permissions.IsTokenResourceRouteObject & permissions.IsTokenInstructor
                | permissions.IsTokenResourceRouteObject & permissions.IsTokenAdmin
                | permissions.IsVideoPlaylistAdmin
                | permissions.IsVideoOrganizationAdmin
            ]
        elif self.action in ["retrieve"]:
            permission_classes = [
                permissions.IsTokenResourceRouteObject
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

        user = self.request.user
        if isinstance(user, TokenUser):
            context.update(user.token.payload)
            admin_role_permission = permissions.IsTokenAdmin()
            instructor_role_permission = permissions.IsTokenInstructor()

            context["is_admin"] = admin_role_permission.has_permission(
                request=self.request, view=None
            ) or instructor_role_permission.has_permission(
                request=self.request, view=None
            )

        return context

    def perform_update(self, serializer):
        super().perform_update(serializer)
        channel_layers_utils.dispatch_video_to_groups(serializer.instance)

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
    def initiate_upload(self, request, pk=None):
        """Get an upload policy for a video.

        Calling the endpoint resets the upload state to `pending` and returns an upload policy to
        selected video backend.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint
        pk: string
            The primary key of the video

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse carrying the upload policy as a JSON object.

        """
        response = storage.get_initiate_backend().initiate_video_upload(request, pk)

        # Reset the upload state of the video
        Video.objects.filter(pk=pk).update(upload_state=defaults.PENDING)

        return Response(response)

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

        video = self.get_object()

        video.live_type = serializer.validated_data["type"]
        video.upload_state = defaults.PENDING
        video.live_state = defaults.IDLE
        video.uploaded_on = None

        video.save()
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

        if video.live_state not in [defaults.IDLE, defaults.PAUSED]:
            return Response(
                {
                    "error": (
                        f"Impossible to start live video. Current status is {video.live_state}"
                    )
                },
                400,
            )

        if video.live_info is None:
            now = timezone.now()
            stamp = to_timestamp(now)
            key = f"{video.pk}_{stamp}"
            video.live_info = create_live_stream(key)
            if settings.LIVE_CHAT_ENABLED:
                create_room(video.id)
            wait_medialive_channel_is_created(video.get_medialive_channel().get("id"))

        start_live_channel(video.get_medialive_channel().get("id"))

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

        stop_live_channel(video.get_medialive_channel().get("id"))

        video.live_state = defaults.STOPPING
        video.live_info.update({"paused_at": to_timestamp(timezone.now())})
        video.save()
        serializer = self.get_serializer(video)

        return Response(serializer.data)

    @action(
        methods=["post"],
        detail=True,
        url_path="end-live",
        permission_classes=[
            permissions.IsTokenResourceRouteObject & permissions.IsTokenInstructor
            | permissions.IsTokenResourceRouteObject & permissions.IsTokenAdmin
        ],
    )
    # pylint: disable=unused-argument
    def end_live(self, request, pk=None):
        """end a medialive channel on AWS and delete its stack.

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

        if video.live_state not in [defaults.IDLE, defaults.PAUSED]:
            return Response(
                {
                    "error": (
                        "Live video must be stopped before deleting it."
                        f" Current status is {video.live_state}"
                    )
                },
                400,
            )

        if video.live_state == defaults.IDLE:
            video.upload_state = defaults.DELETED
            video.live_state = None
            video.live_info = None
            video.live_type = None
            video.save()
            serializer = self.get_serializer(video)

            return Response(serializer.data)

        delete_aws_element_stack(video)
        if settings.LIVE_CHAT_ENABLED:
            close_room(video.id)
        try:
            create_mediapackage_harvest_job(video)
            video.live_state = defaults.STOPPED
            video.upload_state = defaults.HARVESTING
        except ManifestMissingException:
            delete_mediapackage_channel(video.get_mediapackage_channel().get("id"))
            video.upload_state = defaults.DELETED
            video.live_state = None
            video.live_info = None
            video.live_type = None

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

        with transaction.atomic():
            try:
                video = Video.objects.select_for_update(nowait=True).get(pk=pk)
            except Video.DoesNotExist as video_does_not_exists:
                raise Http404 from video_does_not_exists
            except OperationalError:
                return Response({"success": True})

            request_ids = video.live_info.get("medialive", {}).get("request_ids", [])
            if serializer.validated_data["requestId"] in request_ids:
                return Response({"success": True})

            request_ids.append(serializer.validated_data["requestId"])
            video.live_info["medialive"].update({"request_ids": request_ids})
            video.save()

        live_info = video.live_info
        live_info.update(
            {"cloudwatch": {"logGroupName": serializer.validated_data["logGroupName"]}}
        )

        if serializer.validated_data["state"] == defaults.RUNNING:
            video.live_state = defaults.RUNNING
            live_info.pop("paused_at", None)
            if live_info.get("started_at") is None:
                live_info.update({"started_at": stamp})

        if serializer.validated_data["state"] == defaults.STOPPED:
            video.live_state = defaults.PAUSED
            live_info.update({"stopped_at": stamp})
            video.live_info = live_info

        video.live_info = live_info
        video.save()

        return Response({"success": True})

    @action(
        methods=["get"],
        detail=True,
        url_path="pairing-secret",
        permission_classes=[
            permissions.IsTokenResourceRouteObject
            & (permissions.IsTokenInstructor | permissions.IsTokenAdmin)
        ],
    )
    # pylint: disable=unused-argument
    def pairing_secret(
        self,
        request,
        pk=None,
    ):
        """Generate a secret for pairing an external device to a live stream.

        Deletes expired LivePairing objects.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint
        pk: string
            The primary key of the video

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse with the generated secret.
        """
        LivePairing.objects.delete_expired()

        video = self.get_object()
        if video.live_type != JITSI:
            return Response(
                {"detail": "Matching video is not a Jitsi Live."}, status=400
            )

        try:
            live_pairing = LivePairing.objects.get(video=video)
        except LivePairing.DoesNotExist:
            live_pairing = LivePairing(video=video)

        for _ in range(2):
            try:
                live_pairing.generate_secret()
                live_pairing.save()
                break
            except ValidationError:
                pass

        serializer = serializers.LivePairingSerializer(instance=live_pairing)
        return Response(serializer.data)
