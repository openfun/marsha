"""Declare API endpoints for videos with Django RestFramework viewsets."""
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import OperationalError, transaction
from django.db.models import Q
from django.db.models.query import EmptyQuerySet
from django.http import Http404
from django.utils import timezone

from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action, api_view, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.models import TokenUser

from marsha.core.defaults import JITSI

from .. import defaults, forms, permissions, serializers, storage
from ..models import (
    Device,
    LivePairing,
    LiveRegistration,
    Playlist,
    SharedLiveMedia,
    Thumbnail,
    TimedTextTrack,
    Video,
)
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
from ..utils.s3_utils import create_presigned_post
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
        # The API is only reachable by admin users.
        context["can_return_live_info"] = True

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


class PairingChallengeThrottle(AnonRateThrottle):
    """Throttling for pairing challenge requests."""

    def get_ident(self, request):
        """Identify requests by box_id instead of IP"""
        try:
            box_id = request.data.get("box_id")
            Device.objects.get(pk=box_id)
            return box_id

        # UUIDField is validated, even with a get.
        # We must catch ValidationError then.
        except (Device.DoesNotExist, ValidationError):
            return None


@api_view(["POST"])
@throttle_classes([PairingChallengeThrottle])
def pairing_challenge(request):
    """View handling pairing challenge request to stream from an external device.

    Deletes expired LivePairing objects.

    Parameters
    ----------
    request : Type[django.http.request.HttpRequest]
        The request on the API endpoint, it must contains a payload with the following fields:
            - box_id: uuid from external device.
            - secret: generated pairing secret.

    Returns
    -------
    Type[rest_framework.response.Response]
        HttpResponse containing live video credentials.

    """
    LivePairing.objects.delete_expired()

    serializer = serializers.PairingChallengeSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"detail": "Invalid request."}, status=400)

    try:
        live_pairing = LivePairing.objects.get(secret=request.data.get("secret"))
    except LivePairing.DoesNotExist:
        return Response({"detail": "Secret not found."}, status=404)

    live_pairing.delete()

    if live_pairing.video.live_type != JITSI:
        return Response({"detail": "Matching video is not a Jitsi Live."}, status=400)

    Device.objects.get_or_create(id=request.data.get("box_id"))

    return Response(
        {"jitsi_url": f"https://{settings.JITSI_DOMAIN}/{live_pairing.video.id}"}
    )


class LiveRegistrationViewSet(
    ObjectPkMixin,
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Viewset for the API of the LiveRegistration object."""

    permission_classes = [permissions.IsVideoToken]
    queryset = LiveRegistration.objects.all()
    serializer_class = serializers.LiveRegistrationSerializer

    def get_queryset(self):
        """Restrict access to liveRegistration with data contained in the JWT token.

        Access is restricted to liveRegistration related to the video and context_id present in
        the JWT token. Email or user id from the token can be used as well depending on the role.
        """
        user = self.request.user

        if user.token.payload:
            consumer_site = (
                Playlist.objects.get(
                    lti_id=user.token.payload["context_id"]
                ).consumer_site
                if user.token.payload.get("context_id")
                else None
            )
            filters = {"consumer_site": consumer_site, "video__id": user.id}
            if self.kwargs.get("pk"):
                filters["pk"] = self.kwargs["pk"]

            # admin and instructors can access all registrations from the same consumer site
            if user.token.payload.get("roles") and any(
                role in ["administrator", "instructor"]
                for role in user.token.payload["roles"]
            ):
                return LiveRegistration.objects.filter(**filters)
            # others can only read their registration
            if user.token.payload.get("user"):
                if user.token.payload["user"].get("email"):
                    filters["email"] = user.token.payload["user"]["email"]
                    # check first if a liveRegistration exists with the email in the token
                    live_registration = LiveRegistration.objects.filter(**filters)
                    if live_registration:
                        return live_registration

                    filters.pop("email", None)
                # token has email or not, user has access to this registration if it's the right
                # combination of lti_user_id and consumer_site
                if user.token.payload["user"].get("id") and user.token.payload.get(
                    "context_id"
                ):
                    filters["lti_user_id"] = user.token.payload["user"]["id"]
                    return LiveRegistration.objects.filter(**filters)

        return LiveRegistration.objects.none()


class TimedTextTrackViewSet(ObjectPkMixin, viewsets.ModelViewSet):
    """Viewset for the API of the TimedTextTrack object."""

    permission_classes = [permissions.NotAllowed]
    queryset = TimedTextTrack.objects.all()
    serializer_class = serializers.TimedTextTrackSerializer

    def get_permissions(self):
        """Instantiate and return the list of permissions that this view requires."""
        if self.action == "metadata":
            permission_classes = [permissions.IsVideoToken]
        elif self.action in ["create", "list"]:
            permission_classes = [
                permissions.IsTokenInstructor
                | permissions.IsTokenAdmin
                | permissions.IsParamsVideoAdminThroughOrganization
                | permissions.IsParamsVideoAdminThroughPlaylist
            ]
        else:
            permission_classes = [
                permissions.IsTokenResourceRouteObjectRelatedVideo
                & permissions.IsTokenInstructor
                | permissions.IsTokenResourceRouteObjectRelatedVideo
                & permissions.IsTokenAdmin
                | permissions.IsRelatedVideoPlaylistAdmin
                | permissions.IsRelatedVideoOrganizationAdmin
            ]
        return [permission() for permission in permission_classes]

    def list(self, request, *args, **kwargs):
        """List timed text tracks through the API."""
        queryset = self.get_queryset()
        # If the "user" is just representing a resource and not an actual user profile, restrict
        # the queryset to tracks linked to said resource
        user = self.request.user
        if isinstance(user, TokenUser) and (
            not user.token.get("user")
            or user.token.get("user", {}).get("id") != user.token.get("resource_id")
        ):
            queryset = queryset.filter(video__id=user.id)

        # Apply the video filter if appropriate
        video = request.query_params.get("video")
        if video is not None:
            queryset = queryset.filter(video__id=video)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

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


class SharedLiveMediaViewSet(ObjectPkMixin, viewsets.ModelViewSet):
    """Viewset for the API of the SharedLiveMedia object."""

    permission_classes = [permissions.NotAllowed]
    queryset = SharedLiveMedia.objects.all()
    serializer_class = serializers.SharedLiveMediaSerializer

    def get_serializer_context(self):
        """Extra context provided to the serializer class."""
        context = super().get_serializer_context()

        user = self.request.user
        # If the user is a JWT token and has roles check if roles are admin or instructor
        if (
            isinstance(user, TokenUser)
            and user.token.get("roles")
            and (
                bool(LTI_ROLES[ADMINISTRATOR] & set(user.token.get("roles")))
                or bool(LTI_ROLES[INSTRUCTOR] & set(user.token.get("roles")))
            )
        ):
            context.update({"is_admin": True})

        return context

    def get_permissions(self):
        """Instantiate and return the list of permissions that this view requires."""
        if self.action in ["create", "list"]:
            permission_classes = [
                permissions.IsTokenInstructor
                | permissions.IsTokenAdmin
                | permissions.IsParamsVideoAdminThroughOrganization
                | permissions.IsParamsVideoAdminThroughPlaylist
            ]
        elif self.action in ["retrieve"]:
            permission_classes = [
                permissions.IsTokenResourceRouteObjectRelatedVideo
                | permissions.IsRelatedVideoPlaylistAdmin
                | permissions.IsRelatedVideoOrganizationAdmin
            ]
        else:
            permission_classes = [
                permissions.IsTokenResourceRouteObjectRelatedVideo
                & (permissions.IsTokenInstructor | permissions.IsTokenAdmin)
                | permissions.IsRelatedVideoPlaylistAdmin
                | permissions.IsRelatedVideoOrganizationAdmin
            ]
        return [permission() for permission in permission_classes]

    def list(self, request, *args, **kwargs):
        """List shared live media through the API."""
        queryset = self.get_queryset().none()
        # If the "user" is just representing a resource and not an actual user profile,
        # restrict the queryset to tracks linked to said resource
        user = self.request.user
        if isinstance(user, TokenUser) and (
            not user.token.get("user")
            or user.token.get("user", {}).get("id") != user.token.get("resource_id")
        ):
            queryset = (
                self.get_queryset().filter(video__id=user.id).order_by("created_on")
            )

        # find the video filter
        video = request.query_params.get("video")
        if video is not None:
            if isinstance(queryset, EmptyQuerySet):
                queryset = self.get_queryset()
            queryset = queryset.filter(video__id=video).order_by("created_on")

        paginated_queryset = self.paginate_queryset(queryset)
        if paginated_queryset is not None:
            paginated_serializer = self.get_serializer(paginated_queryset, many=True)
            return self.get_paginated_response(paginated_serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(methods=["post"], detail=True, url_path="initiate-upload")
    # pylint: disable=unused-argument
    def initiate_upload(self, request, pk=None):
        """Get an upload policy for a shared live media.

        Calling the endpoint resets the upload state to `pending` and returns an upload policy to
        our AWS S3 source bucket.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint
        pk: string
            The primary key of the shared live media

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse carrying the AWS S3 upload policy as a JSON object.

        """
        serializer = serializers.SharedLiveMediaInitiateUploadSerializer(
            data=request.data
        )

        if serializer.is_valid() is not True:
            return Response(serializer.errors, status=400)

        now = timezone.now()
        stamp = to_timestamp(now)

        shared_live_media = self.get_object()
        key = shared_live_media.get_source_s3_key(
            stamp=stamp, extension=serializer.validated_data["extension"]
        )

        presigned_post = create_presigned_post(
            [
                ["eq", "$Content-Type", serializer.validated_data["mimetype"]],
                ["content-length-range", 0, settings.SHARED_LIVE_MEDIA_SOURCE_MAX_SIZE],
            ],
            {},
            key,
        )

        # Reset the upload state of the shared live media
        SharedLiveMedia.objects.filter(pk=pk).update(upload_state=defaults.PENDING)

        return Response(presigned_post)
