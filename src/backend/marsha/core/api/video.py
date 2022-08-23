"""Declare API endpoints for videos with Django RestFramework viewsets."""
# We don't enforce arguments documentation in tests
# pylint: disable=too-many-lines
from copy import deepcopy

from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import OperationalError, transaction
from django.db.models import F, Func, Q, Value
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.module_loading import import_string

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from marsha.core.defaults import JITSI
from marsha.websocket.utils import channel_layers_utils

from .. import defaults, forms, permissions, serializers, storage
from ..models import LivePairing, LiveSession, SharedLiveMedia, Video
from ..services.video_participants import (
    VideoParticipantsException,
    add_participant_asking_to_join,
    move_participant_to_discussion,
    remove_participant_asking_to_join,
    remove_participant_from_discussion,
)
from ..services.video_recording import (
    VideoRecordingError,
    start_recording,
    stop_recording,
)
from ..utils import time_utils
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
from .base import APIViewMixin, ObjectPkMixin


# pylint: disable=too-many-public-methods


class VideoViewSet(APIViewMixin, ObjectPkMixin, viewsets.ModelViewSet):
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
        elif self.action in ["list", "metadata"]:
            permission_classes = [IsAuthenticated]
        elif self.action in ["create"]:
            permission_classes = [
                permissions.IsParamsPlaylistAdmin
                | permissions.IsParamsPlaylistAdminThroughOrganization
                | (
                    permissions.HasPlaylistToken
                    & (permissions.IsTokenInstructor | permissions.IsTokenAdmin)
                )
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

        if self.request.resource:
            context.update(self.request.resource.token.payload)
            admin_role_permission = permissions.IsTokenAdmin()
            instructor_role_permission = permissions.IsTokenInstructor()

            context["is_admin"] = admin_role_permission.has_permission(
                request=self.request, view=None
            ) or instructor_role_permission.has_permission(
                request=self.request, view=None
            )

        return context

    def perform_update(self, serializer):
        instance = self.get_object()
        super().perform_update(serializer)

        # if the starting_at time has changed, add flag to livesessions that have subscribed
        if (
            serializer.instance.is_scheduled
            and serializer.instance.starting_at != instance.starting_at
        ):
            LiveSession.objects.filter(
                should_send_reminders=True,
                is_registered=True,
                video=serializer.instance,
            ).exclude(  # exclude current ones already tagged
                must_notify__overlap=[
                    settings.REMINDER_DATE_UPDATED,
                ]
            ).exclude(
                reminders__overlap=[
                    settings.REMINDER_DATE_UPDATED,  # exclude current ones getting updated
                    settings.REMINDER_ERROR,
                ]
            ).update(
                must_notify=Func(
                    F("must_notify"),
                    Value(settings.REMINDER_DATE_UPDATED),
                    function="array_append",
                    arity=2,
                )
            )
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
            | permissions.HasPlaylistToken
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
        # Dispatch only for admin users. No student should be connected on the video at this point.
        channel_layers_utils.dispatch_video(video, to_admin=True)
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

        if video.live_state not in [
            defaults.IDLE,
            defaults.STOPPED,
            defaults.HARVESTED,
        ]:
            return Response(
                {
                    "error": (
                        f"Impossible to start live video. Current status is {video.live_state}"
                    )
                },
                400,
            )

        # dispatch earlier in the websocket that the live is starting without saving it
        tmp_video = deepcopy(video)
        tmp_video.live_state = defaults.STARTING
        if settings.LIVE_CHAT_ENABLED:
            create_room(video.id)
        channel_layers_utils.dispatch_video_to_groups(tmp_video)
        del tmp_video

        if video.live_info is None or video.live_state == defaults.HARVESTED:
            now = timezone.now()
            stamp = to_timestamp(now)
            key = f"{video.pk}_{stamp}"
            video.live_info = create_live_stream(key)
            wait_medialive_channel_is_created(video.get_medialive_channel().get("id"))

        start_live_channel(video.get_medialive_channel().get("id"))

        # if the video has been harvested, we need to reset its recordings
        # and its related live attendances
        if video.live_state == defaults.HARVESTED:
            video.recording_slices = []
            LiveSession.objects.filter(video=video).update(live_attendance=None)

        video.live_state = defaults.STARTING
        video.upload_state = defaults.PENDING
        video.resolutions = None
        video.save()

        channel_layers_utils.dispatch_video_to_groups(video)

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
        if video.is_recording:
            stop_recording(video)
        video.save()
        channel_layers_utils.dispatch_video_to_groups(video)
        serializer = self.get_serializer(video)

        return Response(serializer.data)

    @action(
        methods=["post"],
        detail=True,
        url_path="harvest-live",
        permission_classes=[
            permissions.IsTokenResourceRouteObject & permissions.IsTokenInstructor
            | permissions.IsTokenResourceRouteObject & permissions.IsTokenAdmin
        ],
    )
    # pylint: disable=unused-argument
    def harvest_live(self, request, pk=None):
        """harvest a medialive channel on AWS and delete its stack.

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
            return Response({"error": "Impossible to harvest a non live video."}, 400)

        if video.live_state != defaults.STOPPED:
            return Response(
                {
                    "error": (
                        "Live video must be stopped before harvesting it."
                        f" Current status is {video.live_state}"
                    )
                },
                400,
            )

        if not video.recording_slices:
            return Response(
                {"error": "Live video must be recording before harvesting it."}, 400
            )

        # dispatch earlier in the websocket that the live is harvesting without saving it
        tmp_video = deepcopy(video)
        tmp_video.live_state = defaults.HARVESTING
        channel_layers_utils.dispatch_video_to_groups(tmp_video)
        del tmp_video

        if video.is_recording:
            stop_recording(video)

        delete_aws_element_stack(video)
        if settings.LIVE_CHAT_ENABLED:
            close_room(video.id)

        try:
            create_mediapackage_harvest_job(video)
            video.live_state = defaults.HARVESTING
        except ManifestMissingException:
            delete_mediapackage_channel(video.get_mediapackage_channel().get("id"))
            video.upload_state = defaults.PENDING
            video.live_state = defaults.STOPPED
            video.live_info = {
                "started_at": video.live_info.get("started_at"),
                "stopped_at": video.live_info.get("stopped_at"),
            }

        video.save()
        channel_layers_utils.dispatch_video_to_groups(video)
        serializer = self.get_serializer(video)

        return Response(serializer.data)

    @action(
        methods=["post"],
        detail=True,
        url_path="live-to-vod",
        permission_classes=[
            permissions.IsTokenResourceRouteObject & permissions.IsTokenInstructor
            | permissions.IsTokenResourceRouteObject & permissions.IsTokenAdmin
        ],
    )
    # pylint: disable=unused-argument
    def live_to_vod(self, request, pk=None):
        """Transforms an harvested live to a VOD.

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

        if video.live_state != defaults.HARVESTED:
            return Response(
                {
                    "error": (
                        "Live video must be harvested before transforming it to VOD."
                        f" Current status is {video.live_state}"
                    )
                },
                400,
            )

        video.live_state = defaults.ENDED
        video.upload_state = defaults.READY
        video.save()

        channel_layers_utils.dispatch_video_to_groups(video)

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
            live_info.update({"started_at": stamp})
            live_info.pop("stopped_at", None)

            # if keys with no timeout were cached for this video, it needs to be reinitialized
            key_cache_video = f"{defaults.VIDEO_ATTENDANCE_KEY_CACHE}{video.id}"
            if list_keys := cache.get(key_cache_video, None):
                cache.delete_many(list_keys)
                cache.delete(key_cache_video)

        if serializer.validated_data["state"] == defaults.STOPPED:
            video.live_state = defaults.STOPPED
            live_info.update({"stopped_at": stamp})
            video.live_info = live_info

        if serializer.validated_data["state"] == defaults.HARVESTED:
            video.live_state = defaults.HARVESTED
            video.resolutions = serializer.validated_data["extraParameters"].get(
                "resolutions"
            )
            live_info = {
                "started_at": video.live_info.get("started_at"),
                "stopped_at": video.live_info.get("stopped_at"),
            }
            video.uploaded_on = time_utils.to_datetime(
                serializer.validated_data["extraParameters"].get("uploaded_on")
            )

        video.live_info = live_info
        video.save()

        channel_layers_utils.dispatch_video_to_groups(video)

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

    @action(
        methods=["patch"],
        detail=True,
        url_path="start-sharing",
        permission_classes=[
            permissions.IsTokenResourceRouteObject
            & (permissions.IsTokenInstructor | permissions.IsTokenAdmin)
        ],
    )
    # pylint: disable=unused-argument
    def start_sharing(
        self,
        request,
        pk=None,
    ):
        """Starts a media live sharing in a live stream.

        Broadcasts a xmpp message to all users in the video room.

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
        if video.active_shared_live_media_id is not None:
            return Response({"detail": "Video is already sharing."}, status=400)

        sharedlivemedia = get_object_or_404(
            SharedLiveMedia,
            id=request.data.get("sharedlivemedia"),
            video=video,
        )
        if sharedlivemedia.upload_state != defaults.READY:
            return Response({"detail": "Shared live media is not ready."}, status=400)

        video.active_shared_live_media = sharedlivemedia
        video.active_shared_live_media_page = 1
        video.save()
        serializer = self.get_serializer(video)

        channel_layers_utils.dispatch_video_to_groups(video)
        return Response(serializer.data)

    @action(
        methods=["patch"],
        detail=True,
        url_path="navigate-sharing",
        permission_classes=[
            permissions.IsTokenResourceRouteObject
            & (permissions.IsTokenInstructor | permissions.IsTokenAdmin)
        ],
    )
    # pylint: disable=unused-argument
    def navigate_sharing(
        self,
        request,
        pk=None,
    ):
        """Changes page of the media live shared in a live stream.

        Broadcasts a xmpp message to all users in the video room.

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

        if not video.active_shared_live_media:
            return Response({"detail": "No shared live media."}, status=400)

        try:
            target_page = int(request.data.get("target_page"))
        except TypeError:
            return Response({"detail": "Invalid page number."}, status=400)

        if target_page > video.active_shared_live_media.nb_pages:
            return Response({"detail": "Page does not exist."}, status=400)

        video.active_shared_live_media_page = target_page
        video.save()
        serializer = self.get_serializer(video)

        channel_layers_utils.dispatch_video_to_groups(video)
        return Response(serializer.data)

    @action(
        methods=["patch"],
        detail=True,
        url_path="end-sharing",
        permission_classes=[
            permissions.IsTokenResourceRouteObject
            & (permissions.IsTokenInstructor | permissions.IsTokenAdmin)
        ],
    )
    # pylint: disable=unused-argument
    def end_sharing(
        self,
        request,
        pk=None,
    ):
        """Ends the media live sharing in a live stream.

        Broadcasts a xmpp message to all users in the video room.

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
        if not video.active_shared_live_media:
            return Response({"detail": "No shared live media."}, status=400)

        video.active_shared_live_media = None
        video.active_shared_live_media_page = None
        video.save()

        serializer = self.get_serializer(video)
        channel_layers_utils.dispatch_video_to_groups(video)
        return Response(serializer.data)

    @action(
        methods=["post", "delete"],
        detail=True,
        url_path="participants-asking-to-join",
        permission_classes=[
            permissions.IsTokenResourceRouteObject
            & (permissions.IsTokenInstructor | permissions.IsTokenAdmin)
        ],
    )
    # pylint: disable=unused-argument
    def participants_asking_to_join(
        self,
        request,
        pk=None,
    ):
        """Adds and deletes a participant asking to join a live stream.

        Broadcasts a xmpp message to all users in the video room.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint, it should contain a payload with a participant.
        pk: string
            The primary key of the video

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse with the serialized video.
        """

        participant_serializer = serializers.ParticipantSerializer(data=request.data)
        if not participant_serializer.is_valid():
            return Response(
                participant_serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

        video = self.get_object()
        try:
            if request.method == "POST":
                add_participant_asking_to_join(
                    video, participant_serializer.validated_data
                )
            elif request.method == "DELETE":
                remove_participant_asking_to_join(
                    video, participant_serializer.validated_data
                )
        except VideoParticipantsException as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(video)
        channel_layers_utils.dispatch_video_to_groups(video)
        return Response(serializer.data)

    @action(
        methods=["post", "delete"],
        detail=True,
        url_path="participants-in-discussion",
        permission_classes=[
            permissions.IsTokenResourceRouteObject
            & (permissions.IsTokenInstructor | permissions.IsTokenAdmin)
        ],
    )
    # pylint: disable=unused-argument
    def participants_in_discussion(
        self,
        request,
        pk=None,
    ):
        """Adds and deletes a participant who have joined a live stream.

        Broadcasts a xmpp message to all users in the video room.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint, it should contain a payload with a participant.
        pk: string
            The primary key of the video

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse with the serialized video.
        """

        participant_serializer = serializers.ParticipantSerializer(data=request.data)

        if not participant_serializer.is_valid():
            return Response(
                participant_serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

        video = self.get_object()
        try:
            if request.method == "POST":
                move_participant_to_discussion(
                    video, participant_serializer.validated_data
                )
            elif request.method == "DELETE":
                remove_participant_from_discussion(
                    video, participant_serializer.validated_data
                )
        except VideoParticipantsException as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(video)
        channel_layers_utils.dispatch_video_to_groups(video)
        return Response(serializer.data)

    @action(
        methods=["patch"],
        detail=True,
        url_path="start-recording",
        permission_classes=[
            permissions.IsTokenResourceRouteObject
            & (permissions.IsTokenInstructor | permissions.IsTokenAdmin)
        ],
    )
    # pylint: disable=unused-argument
    def start_recording(
        self,
        request,
        pk=None,
    ):
        """Starts video recording.

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
        try:
            start_recording(video)
        except VideoRecordingError as error:
            return Response({"detail": str(error)}, status=400)

        channel_layers_utils.dispatch_video_to_groups(video)

        serializer = self.get_serializer(video)
        return Response(serializer.data)

    @action(
        methods=["patch"],
        detail=True,
        url_path="stop-recording",
        permission_classes=[
            permissions.IsTokenResourceRouteObject
            & (permissions.IsTokenInstructor | permissions.IsTokenAdmin)
        ],
    )
    # pylint: disable=unused-argument
    def stop_recording(
        self,
        request,
        pk=None,
    ):
        """Stops video recording.

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
        try:
            stop_recording(video)
        except VideoRecordingError as error:
            return Response({"detail": str(error)}, status=400)

        channel_layers_utils.dispatch_video_to_groups(video)

        serializer = self.get_serializer(video)
        return Response(serializer.data)

    @action(
        methods=["get"],
        detail=True,
        url_path="stats",
        permission_classes=[
            permissions.IsTokenResourceRouteObject
            & (permissions.IsTokenInstructor | permissions.IsTokenAdmin)
        ],
    )
    # pylint: disable=unused-argument
    def stats(self, request, pk=None):
        """
        Compute the stats for a given video.
        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint
        pk: string
            The primary key of the video

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse with the computed stats.
        """
        video = self.get_object()
        stat_backend = import_string(settings.STAT_BACKEND)
        data = stat_backend(video, **settings.STAT_BACKEND_SETTINGS)

        return Response(data=data, content_type="application/json")
