"""Declare API endpoints for videos with Django RestFramework viewsets."""
# pylint: disable=too-many-lines
from copy import deepcopy

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import OperationalError, transaction
from django.db.models import F, Func, Q, Value
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.module_loading import import_string

from boto3.exceptions import Boto3Error
import django_filters
from django_peertube_runner_connector.transcode import (
    VideoNotFoundError,
    transcode_video,
)
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import APIException, MethodNotAllowed
from rest_framework.response import Response

from marsha.core import defaults, forms, permissions, serializers, storage
from marsha.core.api.base import APIViewMixin, BulkDestroyModelMixin, ObjectPkMixin
from marsha.core.defaults import ENDED, JITSI
from marsha.core.metadata import VideoMetadata
from marsha.core.models import (
    ADMINISTRATOR,
    INSTRUCTOR,
    LivePairing,
    LiveSession,
    SharedLiveMedia,
    Video,
)
from marsha.core.services.video_participants import (
    VideoParticipantsException,
    add_participant_asking_to_join,
    move_participant_to_discussion,
    remove_participant_asking_to_join,
    remove_participant_from_discussion,
)
from marsha.core.services.video_recording import (
    VideoRecordingError,
    start_recording,
    stop_recording,
)
from marsha.core.utils import jitsi_utils
from marsha.core.utils.api_utils import validate_signature
from marsha.core.utils.medialive_utils import (
    ManifestMissingException,
    create_live_stream,
    create_mediapackage_harvest_job,
    delete_aws_element_stack,
    delete_mediapackage_channel,
    start_live_channel,
    stop_live_channel,
    update_id3_tags,
    wait_medialive_channel_is_created,
)
from marsha.core.utils.send_emails import (
    send_ready_to_convert_notification,
    send_vod_ready_notification,
)
from marsha.core.utils.time_utils import to_datetime, to_timestamp
from marsha.core.utils.xmpp_utils import close_room, create_room, reopen_room_for_vod
from marsha.websocket.utils import channel_layers_utils


# pylint: disable=too-many-public-methods


class VideoFilter(django_filters.FilterSet):
    """Filter for Video."""

    is_live = django_filters.BooleanFilter(method="filter_is_live")
    is_public = django_filters.BooleanFilter(field_name="is_public")
    playlist = django_filters.UUIDFilter(field_name="playlist__id")
    organization = django_filters.UUIDFilter(field_name="playlist__organization__id")

    class Meta:
        model = Video
        fields = {
            "title": [
                "exact",
                "iexact",
                "contains",
                "icontains",
                "startswith",
                "istartswith",
            ],
        }

    def filter_is_live(self, queryset, name, value):
        """Filter video which are live or not."""
        if value is None:
            return queryset

        if not isinstance(value, bool):
            raise ValidationError(
                f"Invalid value for {name} filter, must be a boolean."
            )

        if value:  # return only live videos
            return queryset.filter(Q(live_state__isnull=False) & ~Q(live_state=ENDED))

        return queryset.filter(Q(live_state__isnull=True) | Q(live_state=ENDED))


class VideoViewSet(
    APIViewMixin, ObjectPkMixin, viewsets.ModelViewSet, BulkDestroyModelMixin
):
    """Viewset for the API of the video object."""

    queryset = (
        Video.objects.all()
        .select_related("playlist", "active_shared_live_media")
        .prefetch_related("shared_live_medias", "timedtexttracks", "thumbnail")
    )
    serializer_class = serializers.VideoSerializer
    permission_classes = [permissions.NotAllowed]
    metadata_class = VideoMetadata
    filter_backends = [
        filters.OrderingFilter,
        django_filters.rest_framework.DjangoFilterBackend,
    ]
    ordering_fields = ["created_on", "title"]
    ordering = ["title"]
    filterset_class = VideoFilter

    def get_permissions(self):
        """
        Retrieve the action related permissions to determine whether
        the current user has the authorization to access endpoint.
        """
        if self.action in ["retrieve"]:
            # DEV WARNING: please ensure to also update the permissions in the
            # `VideoConsumer` websocket consumer.
            permission_classes = [
                # With LTI: anyone with a valid token for the video can access
                permissions.IsPlaylistTokenMatchingRouteObject
                # With standalone site, only playlist admin or organization admin can access
                | permissions.IsObjectPlaylistAdminOrInstructor
                | permissions.IsObjectPlaylistOrganizationAdmin
            ]
        elif self.action in ["list", "metadata"]:
            # Anyone authenticated can list videos (results are filtered in action)
            # or access metadata
            permission_classes = [permissions.UserOrPlaylistIsAuthenticated]
        elif self.action in ["create"]:
            permission_classes = [
                # With standalone site, only playlist admin or organization admin can access
                permissions.IsParamsPlaylistAdminOrInstructor
                | permissions.IsParamsPlaylistAdminThroughOrganization
                # With LTI: playlist admin or instructor admin can access
                | (
                    permissions.IsPlaylistToken
                    & (permissions.IsTokenInstructor | permissions.IsTokenAdmin)
                )
            ]
        elif self.action in ["destroy", "bulk_destroy"]:
            # Not available in LTI
            # For standalone site, only playlist admin or organization admin can access
            permission_classes = [
                permissions.IsAuthenticated
                & (
                    permissions.IsObjectPlaylistAdminOrInstructor
                    | permissions.IsObjectPlaylistOrganizationAdmin
                )
            ]
        elif self.action in ["initiate_live"]:
            permission_classes = [
                # With LTI: playlist admin or instructor admin or playlist access can access
                (
                    permissions.IsPlaylistTokenMatchingRouteObject
                    & (permissions.IsTokenInstructor | permissions.IsTokenAdmin)
                )
                # With standalone site, only playlist admin or instructor
                # and organization admin can access
                | permissions.IsObjectPlaylistAdminOrInstructor
                | permissions.IsObjectPlaylistOrganizationAdmin
            ]
        elif self.action in [
            "partial_update",
            "update",
            "initiate_upload",
            "start_live",
            "stop_live",
            "harvest_live",
            "live_to_vod",
            "pairing_secret",
            "start_sharing",
            "navigate_sharing",
            "end_sharing",
            "participants_asking_to_join",
            "participants_in_discussion",
            "start_recording",
            "stop_recording",
            "stats",
            "jitsi_info",
            "upload_ended",
        ]:
            permission_classes = [
                # With LTI: playlist admin or instructor admin can access
                permissions.IsPlaylistTokenMatchingRouteObject
                & (permissions.IsTokenInstructor | permissions.IsTokenAdmin)
                # With standalone site, playlist admin or instructor can access
                | permissions.IsObjectPlaylistAdminOrInstructor
                | permissions.IsObjectPlaylistOrganizationAdmin
            ]
        elif self.action in ["update_live_state"]:
            # This endpoint is only used by the AWS lambda function
            permission_classes = []
        elif self.action is None:
            if self.request.method not in self.allowed_methods:
                raise MethodNotAllowed(self.request.method)
            permission_classes = self.permission_classes
        else:
            # When here it means we forgot to define a permission for a new action
            # We enforce the permission definition in this method to have a clearer view
            raise NotImplementedError(f"Action '{self.action}' is not implemented.")
        return [permission() for permission in permission_classes]

    def _get_list_queryset(self):
        """Build the queryset used on the list action."""
        user_id = self.request.user.id

        queryset = (
            super()
            .get_queryset()
            .filter(
                Q(
                    playlist__user_accesses__user__id=user_id,
                    playlist__user_accesses__role__in=[
                        ADMINISTRATOR,
                        INSTRUCTOR,
                    ],
                )
                | Q(
                    playlist__organization__user_accesses__user__id=user_id,
                    playlist__organization__user_accesses__role=ADMINISTRATOR,
                )
            )
        )

        return queryset.distinct()

    def _get_bulk_destroy_queryset(self):
        """Build the queryset used on the bulk_destroy action."""
        user_id = self.request.user.id

        queryset = (
            super()
            .get_queryset()
            .filter(
                (
                    Q(
                        playlist__user_accesses__user__id=user_id,
                        playlist__user_accesses__role__in=[ADMINISTRATOR, INSTRUCTOR],
                    )
                )
                | (
                    Q(
                        playlist__organization__user_accesses__user__id=user_id,
                        playlist__organization__user_accesses__role=ADMINISTRATOR,
                    )
                )
            )
        )

        return queryset.distinct()

    def get_queryset(self):
        """Redefine the queryset to use based on the current action."""
        queryset = super().get_queryset()

        if self.action in ["list"]:
            queryset = self._get_list_queryset()

        if self.action in ["bulk_destroy"]:
            queryset = self._get_bulk_destroy_queryset()

        if self.request.resource is not None:
            # If the request comes from an LTI resource, we force the annotation
            # of the can_edit field depending on the user role.
            return queryset.annotate_can_edit(
                "", force_value=self.get_serializer_context()["is_admin"]
            )

        if self.request.user.id is not None:
            return queryset.annotate_can_edit(str(self.request.user.id))

        return queryset

    def get_serializer_context(self):
        """Extra context provided to the serializer class."""
        context = super().get_serializer_context()

        if self.request and self.request.resource:
            context.update(self.request.resource.token.payload)
            admin_role_permission = permissions.IsTokenAdmin()
            instructor_role_permission = permissions.IsTokenInstructor()

            context["is_admin"] = bool(
                admin_role_permission.has_permission(request=self.request, view=None)
                or instructor_role_permission.has_permission(
                    request=self.request, view=None
                )
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
        update_id3_tags(serializer.instance)

    def create(self, request, *args, **kwargs):
        """Create one video based on the request payload."""
        try:
            form = forms.VideoForm(request.data)
            video = form.save()
        except ValueError:
            return Response({"errors": [dict(form.errors)]}, status=400)

        # Fake the annotation
        video.can_edit = True
        serializer = self.get_serializer(video)

        return Response(serializer.data, status=201)

    @action(methods=["post"], detail=True, url_path="initiate-upload")
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
        # Ensure object exists and user has access to it
        self.get_object()

        serializer = serializers.VideoUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        response = storage.get_initiate_backend().initiate_video_upload(request, pk)

        # Reset the upload state of the video (don't use get_object()
        # as it does not lock the row)
        Video.objects.filter(pk=pk).update(upload_state=defaults.PENDING)

        return Response(response)

    @action(methods=["post"], detail=True, url_path="upload-ended")
    # pylint: disable=unused-argument
    def upload_ended(self, request, pk=None):
        """Notify the API that the video upload has ended.

        Calling the endpoint will start the transcoding process of the video.
        The request should have a file_key in the body, which is the key of the
        uploaded file. It will be used in the transcoding process to name
        the generated files, and set the uploaded_on property.

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
        # Ensure object exists and user has access to it
        video = self.get_object()

        serializer = serializers.VideoUploadEndedSerializer(
            data=request.data, context={"pk": pk}
        )
        serializer.is_valid(raise_exception=True)

        file_key = serializer.validated_data["file_key"]
        # The file_key have the "tmp/{video_pk}/video/{stamp}" format
        stamp = file_key.split("/")[-1]

        # Launch the PeerTube transcoding process
        if settings.TRANSCODING_CALLBACK_DOMAIN:
            domain = settings.TRANSCODING_CALLBACK_DOMAIN
        else:
            domain = f"{request.scheme}://{request.get_host()}"
        try:
            transcode_video(
                file_path=file_key,
                destination=video.get_videos_storage_prefix(stamp=stamp),
                base_name=stamp,
                domain=domain,
            )
        except VideoNotFoundError:
            return Response(status=404)

        video.upload_state = defaults.PROCESSING
        video.save(update_fields=["upload_state"])

        channel_layers_utils.dispatch_video(video, to_admin=True)
        serializer = self.get_serializer(video)

        return Response(serializer.data)

    @action(
        methods=["post"],
        detail=True,
        url_path="initiate-live",
    )
    # pylint: disable=unused-argument
    def initiate_live(self, request, pk=None):
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
        video = self.get_object()  # test permissions at the beginning

        serializer = serializers.InitLiveStateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        video.live_type = serializer.validated_data["type"]
        video.upload_state = defaults.PENDING
        video.live_state = defaults.IDLE
        video.uploaded_on = None

        video.save()
        # Dispatch only for admin users. No student should be connected on the video at this point.
        channel_layers_utils.dispatch_video(video, to_admin=True)
        serializer = self.get_serializer(video)

        return Response(serializer.data)

    @action(methods=["post"], detail=True, url_path="start-live")
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

        # The live_state at the beginning of the start live action is saved in order to
        # use it later
        original_live_state = video.live_state

        # dispatch earlier in the websocket that the live is starting and force
        # to save it in an atomic transaction.
        with transaction.atomic():
            video.live_state = defaults.STARTING
            video.save(update_fields=("live_state",))
            if settings.LIVE_CHAT_ENABLED:
                create_room(video.id)
            channel_layers_utils.dispatch_video_to_groups(video)

        try:
            if video.live_info is None or original_live_state == defaults.HARVESTED:
                now = timezone.now()
                stamp = to_timestamp(now)
                key = f"{video.pk}_{stamp}"
                video.live_info = create_live_stream(key)
                wait_medialive_channel_is_created(
                    video.get_medialive_channel().get("id")
                )

            start_live_channel(video.get_medialive_channel().get("id"))
        except Boto3Error as start_live_channel_exception:
            # If something went wrong with aws, we rollback to the original live state
            video.live_state = original_live_state
            video.save(update_fields=("live_state",))
            channel_layers_utils.dispatch_video_to_groups(video)

            # Dispatch the rollbacked state to the websocket
            raise APIException(
                "Something went wrong with AWS when starting live channel"
            ) from start_live_channel_exception

        # if the video has been harvested, we need to reset its recordings
        # and its related live attendances
        if original_live_state == defaults.HARVESTED:
            video.recording_slices = []
            LiveSession.objects.filter(video=video).update(live_attendance=None)

        video.upload_state = defaults.PENDING
        video.resolutions = None
        video.save(
            update_fields=(
                "live_info",
                "recording_slices",
                "resolutions",
                "upload_state",
            )
        )

        channel_layers_utils.dispatch_video_to_groups(video)

        serializer = self.get_serializer(video)
        return Response(serializer.data)

    @action(methods=["post"], detail=True, url_path="stop-live")
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

        # only store email if the live was recording
        try:
            live_stopped_with_email = (
                get_user_model().objects.get(pk=request.user.pk).email
            )
        except get_user_model().DoesNotExist:
            live_stopped_with_email = request.user.token.get("user").get("email")
        if live_stopped_with_email:
            video.live_info.update({"live_stopped_with_email": live_stopped_with_email})
        video.save()
        channel_layers_utils.dispatch_video_to_groups(video)
        serializer = self.get_serializer(video)

        update_id3_tags(video)
        return Response(serializer.data)

    @action(methods=["post"], detail=True, url_path="harvest-live")
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
            video.transcode_pipeline = defaults.AWS_PIPELINE
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

    @action(methods=["post"], detail=True, url_path="live-to-vod")
    # pylint: disable=unused-argument
    def live_to_vod(self, request, pk=None):
        """Transforms a harvested live to a VOD.

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

        if settings.LIVE_CHAT_ENABLED:
            reopen_room_for_vod(video.id)

        channel_layers_utils.dispatch_video_to_groups(video)

        serializer = self.get_serializer(video)
        return Response(serializer.data)

    @action(methods=["patch"], detail=True, url_path="update-live-state")
    # pylint: disable=unused-argument
    def update_live_state(self, request, pk=None):
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
            update_id3_tags(video)

            # if keys with no timeout were cached for this video, it needs to be reinitialized
            key_cache_video = f"{defaults.VIDEO_ATTENDANCE_KEY_CACHE}{video.id}"
            if list_keys := cache.get(key_cache_video, None):
                cache.delete_many(list_keys)
                cache.delete(key_cache_video)

        if serializer.validated_data["state"] == defaults.STOPPED:
            video.live_state = defaults.STOPPED
            live_info.update({"stopped_at": stamp})
            video.live_info = live_info
            send_ready_to_convert_notification(video)

        if serializer.validated_data["state"] == defaults.HARVESTED:
            video.live_state = defaults.HARVESTED
            video.resolutions = serializer.validated_data["extraParameters"].get(
                "resolutions"
            )
            live_info = {
                "started_at": video.live_info.get("started_at"),
                "stopped_at": video.live_info.get("stopped_at"),
            }
            video.uploaded_on = to_datetime(
                serializer.validated_data["extraParameters"].get("uploaded_on")
            )
            send_vod_ready_notification(video)

        video.live_info = live_info
        video.save()

        channel_layers_utils.dispatch_video_to_groups(video)

        return Response({"success": True})

    @action(methods=["get"], detail=True, url_path="pairing-secret")
    # pylint: disable=unused-argument
    def pairing_secret(self, request, pk=None):
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
        video = self.get_object()  # test permissions at the beginning

        LivePairing.objects.delete_expired()

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

    @action(methods=["patch"], detail=True, url_path="start-sharing")
    # pylint: disable=unused-argument
    def start_sharing(self, request, pk=None):
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
        update_id3_tags(video)
        return Response(serializer.data)

    @action(methods=["patch"], detail=True, url_path="navigate-sharing")
    # pylint: disable=unused-argument
    def navigate_sharing(self, request, pk=None):
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
        update_id3_tags(video)

        return Response(serializer.data)

    @action(methods=["patch"], detail=True, url_path="end-sharing")
    # pylint: disable=unused-argument
    def end_sharing(self, request, pk=None):
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
        update_id3_tags(video)
        return Response(serializer.data)

    @action(
        methods=["post", "delete"],
        detail=True,
        url_path="participants-asking-to-join",
    )
    # pylint: disable=unused-argument
    def participants_asking_to_join(self, request, pk=None):
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
        video = self.get_object()  # test permissions at the beginning

        participant_serializer = serializers.ParticipantSerializer(data=request.data)
        if not participant_serializer.is_valid():
            return Response(
                participant_serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

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
    )
    # pylint: disable=unused-argument
    def participants_in_discussion(self, request, pk=None):
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
        video = self.get_object()  # test permissions at the beginning

        participant_serializer = serializers.ParticipantSerializer(data=request.data)

        if not participant_serializer.is_valid():
            return Response(
                participant_serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

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

    @action(methods=["patch"], detail=True, url_path="start-recording")
    # pylint: disable=unused-argument
    def start_recording(self, request, pk=None):
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

    @action(methods=["patch"], detail=True, url_path="stop-recording")
    # pylint: disable=unused-argument
    def stop_recording(self, request, pk=None):
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

    @action(methods=["get"], detail=True, url_path="stats")
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

    @action(methods=["get"], detail=True, url_path="jitsi")
    # pylint: disable=unused-argument
    def jitsi_info(self, request, pk=None):
        """
        Generate a dictionary containing all info needed to connect to jisti.
        This endpoint is only fetchable for an admin or instructor
        If the moderator querystring is present, it will be used, otherwise False
        is used in the token for the moderator parameter.
        """

        video = self.get_object()

        if not video.is_live:
            return Response({"detail": "not a live video"}, status=400)

        if not video.live_type == JITSI:
            return Response({"detail": "not a jitsi live"}, status=400)

        serializer = serializers.JitsiModeratorSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        jitsi_info = jitsi_utils.generate_jitsi_info(
            video, serializer.validated_data["moderator"]
        )

        return Response(jitsi_info)
