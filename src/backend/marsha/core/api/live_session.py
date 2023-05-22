"""Declare API endpoints for live session with Django RestFramework viewsets."""
from logging import getLogger
import smtplib

from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail
from django.db.models import Q
from django.db.utils import IntegrityError
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from django.utils.translation import gettext as _, override

import django_filters
from rest_framework import filters, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import MethodNotAllowed
from rest_framework.response import Response
from rest_framework.throttling import SimpleRateThrottle
from sentry_sdk import capture_exception

from marsha.core.defaults import VIDEO_ATTENDANCE_KEY_CACHE

from .. import permissions, serializers
from ..models import ConsumerSite, LiveSession, Video
from ..services.live_session import (
    get_livesession_from_anonymous_id,
    get_livesession_from_lti,
    get_livesession_from_user_id,
    is_lti_token,
)
from .base import (
    APIViewMixin,
    ObjectPkMixin,
    ObjectRelatedMixin,
    ObjectVideoRelatedMixin,
)


logger = getLogger(__name__)


class LiveSessionFilter(django_filters.FilterSet):
    """Filter for LiveSession."""

    class Meta:
        model = LiveSession
        fields = ["is_registered", "anonymous_id"]


class LiveSessionThrottle(SimpleRateThrottle):
    """Throttling for liveSession list requests."""

    scope = "live_session"

    def get_cache_key(self, request, view):
        if request.query_params.get("anonymous_id"):
            return self.cache_format % {
                "scope": self.scope,
                "ident": self.get_ident(request),
            }
        return None


class LiveSessionViewSet(
    APIViewMixin,
    ObjectPkMixin,
    ObjectRelatedMixin,
    ObjectVideoRelatedMixin,
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Viewset for the API of the LiveSession object."""

    permission_classes = [permissions.NotAllowed]
    queryset = LiveSession.objects.select_related("user", "video").all()
    serializer_class = serializers.LiveSessionSerializer
    filter_backends = [
        filters.OrderingFilter,
        django_filters.rest_framework.DjangoFilterBackend,
    ]
    ordering_fields = ["created_on"]
    ordering = ["created_on"]
    filterset_class = LiveSessionFilter

    def get_permissions(self):
        """Instantiate and return the list of permissions that this view requires."""
        if self.action in ["list"]:
            permission_classes = [permissions.UserOrResourceIsAuthenticated]
        elif self.action in ["create", "set_display_name", "push_attendance"]:
            permission_classes = [
                permissions.ResourceIsAuthenticated
                | permissions.IsParamsVideoAdminThroughOrganization
                | permissions.BaseIsParamsVideoRoleThroughPlaylist
            ]
        elif self.action in [
            "partial_update",
            "retrieve",
        ]:
            permission_classes = [
                permissions.IsTokenResourceRouteObjectRelatedVideo
                | permissions.IsParamsVideoAdminThroughOrganization
                | permissions.BaseIsParamsVideoRoleThroughPlaylist
            ]
        elif self.action in ["list_attendances"]:
            permission_classes = [
                permissions.IsTokenInstructor
                | permissions.IsTokenAdmin
                # With standalone site, admin can access
                | permissions.IsParamsVideoAdminThroughOrganization
                | permissions.IsParamsVideoAdminOrInstructorThroughPlaylist
            ]
        elif self.action is None:
            if self.request.method not in self.allowed_methods:
                raise MethodNotAllowed(self.request.method)
            permission_classes = self.permission_classes
        else:
            # When here it means we forgot to define a permission for a new action
            # We enforce the permission definition in this method to have a clearer view
            raise NotImplementedError(f"Action '{self.action}' is not implemented.")
        return [permission() for permission in permission_classes]

    def _get_lti_queryset(self, queryset):
        """
        Restrict access to liveSession with data contained in the JWT token.
        Access is restricted to liveSession related to the video, context_id and consumer_site
        present in the JWT token. Email is ignored. Lti user id from the token can be used as well
        depending on the role.
        """
        if is_lti_token(self.request.resource.token):
            if object_pk := self.kwargs.get("pk"):
                queryset = queryset.filter(pk=object_pk)

            # admin and instructors can access all registrations of this course
            if not (
                permissions.IsTokenInstructor().check_role(self.request.resource.token)
                or permissions.IsTokenAdmin().check_role(self.request.resource.token)
            ):
                # students are limited by the token information
                queryset = queryset.filter(
                    lti_id=self.request.resource.context_id,
                    consumer_site=self.request.resource.consumer_site,
                    # token has email or not, user has access to this registration
                    # if it's the right combination of lti_user_id, lti_id and consumer_site
                    # email doesn't necessary have a match
                    lti_user_id=self.request.resource.user["id"],
                )

        elif not self.request.query_params.get("anonymous_id"):
            # Enforce the use of anonymous_id if the token is a public one
            queryset = queryset.none()

        return queryset

    def _get_standalone_queryset(self, queryset):
        """
        Restrict access to liveSession for user token.
        """
        # (not used yet) To be iso LTI, admin and instructor can retrieve all video's livesession
        if permissions.IsParamsVideoAdminThroughOrganization().has_permission(
            self.request, self
        ):
            return queryset
        # use can get his related livesession
        return queryset.filter(user_id=self.request.user.id)

    def get_queryset(self):
        """Redefine the queryset to use based on the current action."""
        video_id = self.get_related_video_id()

        if video_id is None:  # backward behavior for stand-alone site context
            return super().get_queryset().none()

        queryset = super().get_queryset().filter(video_id=video_id)

        if self.request.resource is not None:  # Then we are in an LTI context
            queryset = self._get_lti_queryset(queryset)

        if (
            not self.request.resource and self.request.user and self.action == "list"
        ):  # Then we are in stand-alone site context
            queryset = self._get_standalone_queryset(queryset)

        if self.action == "list_attendances":
            # we only want live sessions that are registered or with live_attendance not empty
            queryset = queryset.filter(
                Q(is_registered=True)
                | ~(Q(live_attendance__isnull=True) | Q(live_attendance__exact={}))
            )

        return queryset

    def get_serializer_class(self):
        """Get serializer for this view based on the current action."""
        if self.action == "list_attendances":
            return serializers.LiveAttendanceGraphSerializer
        return super().get_serializer_class()

    def get_throttles(self):
        """Depending on action, defines a throttle class"""
        throttle_class = []
        if self.action == "list":
            throttle_class = [LiveSessionThrottle]

        return [throttle() for throttle in throttle_class]

    def _send_registration_email(self, livesession):
        """Send a registration email and catch error if needed."""
        try:
            with override(livesession.language):
                video = livesession.video
                template_vars = {
                    "cancel_reminder_url": livesession.cancel_reminder_url,
                    "email": livesession.email,
                    "username": livesession.username,
                    "time_zone": settings.TIME_ZONE,
                    "video": video,
                    "video_access_url": livesession.video_access_reminder_url,
                }

                msg_plain = render_to_string(
                    "core/mail/text/register.txt", template_vars
                )
                msg_html = render_to_string(
                    "core/mail/html/register.html", template_vars
                )
                # translation needs to be out a f" to be detected
                # pylint:disable=redefined-builtin
                object = _("Registration validated!")
                send_mail(
                    subject=f"{object} {video.title}",
                    message=msg_plain,
                    from_email=None,
                    recipient_list=[livesession.email],
                    html_message=msg_html,
                    fail_silently=False,
                )
        except smtplib.SMTPException as exception:
            # no exception raised as user can't sometimes change his mail,
            logger.warning("registration mail %s not send", livesession.email)
            capture_exception(exception)

    def perform_create(self, serializer):
        """Overrides perform_create to send the mail and catch error if needed"""
        livesession = serializer.save()
        self._send_registration_email(livesession)

    # pylint: disable=unused-argument
    def partial_update(self, request, *args, **kwargs):
        """Partially update live_session instance."""
        instance = self.get_object()
        was_registered = instance.is_registered
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        try:
            livesession = serializer.save()
        except IntegrityError as error:
            if (
                "livesession_unique_email_video_with_consumer_site_user_none"
                in error.args[0]
            ):
                return Response(
                    {"email": "Email already registered for this live"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            raise error

        if livesession.is_registered and not was_registered:
            self._send_registration_email(livesession)

        if getattr(livesession, "_prefetched_objects_cache", None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            # pylint: disable=protected-access
            livesession._prefetched_objects_cache = {}

        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    # pylint: disable=unused-argument
    def push_attendance(self, request, video_id=None):
        """View handling pushing new attendance"""
        serializer = serializers.LiveAttendanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        video_id = self.get_related_video_id()
        video = get_object_or_404(Video, pk=video_id)

        try:
            if self.request.resource and is_lti_token(
                self.request.resource.token
            ):  # LTI context
                token = self.request.resource.token
                token_user = self.request.resource.user
                livesession, _ = get_livesession_from_lti(token)

                # Update username only if defined in the token user
                if token_user.get("username"):
                    livesession.username = token_user["username"]
                # Update email only if defined in the token user
                if token_user.get("email"):
                    livesession.email = token_user["email"]
            elif self.request.resource:  # Anonymous context
                anonymous_id = self.request.query_params.get("anonymous_id")
                if anonymous_id is None:
                    return Response(
                        {"detail": "anonymous_id is missing"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                livesession, _ = get_livesession_from_anonymous_id(
                    video_id=video.id, anonymous_id=anonymous_id
                )
            else:  # Standalone context
                livesession, _ = get_livesession_from_user_id(
                    video_id=video.id, user_id=request.user.id
                )

            livesession.live_attendance = (
                (serializer.data["live_attendance"] | livesession.live_attendance)
                if livesession.live_attendance
                else serializer.data["live_attendance"]
            )

            if serializer.data.get("language"):
                livesession.language = serializer.data["language"]

            livesession.save()
            return Response(self.get_serializer(livesession).data, status.HTTP_200_OK)
        except (Video.DoesNotExist, ConsumerSite.DoesNotExist) as exception:
            raise Http404("No resource matches the given query.") from exception
        except IntegrityError as error:
            if "livesession_unique_video_display_name" in error.args[0]:
                return Response(
                    {"display_name": "User with that display_name already exists!"},
                    status=status.HTTP_409_CONFLICT,
                )

            raise error

    @action(detail=False, methods=["put"], url_path="display_name")
    def set_display_name(self, request, video_id=None):
        """View handling setting display_name. Create or get registration."""
        serializer = serializers.LiveSessionDisplayUsernameSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"detail": "Invalid request."}, status=status.HTTP_400_BAD_REQUEST
            )

        video_id = self.get_related_video_id()
        video = get_object_or_404(Video, pk=video_id)

        try:
            update_fields = {
                "display_name": serializer.validated_data["display_name"],
            }
            if self.request.resource and is_lti_token(
                self.request.resource.token
            ):  # LTI context
                token_user = self.request.resource.user
                consumer_site = get_object_or_404(
                    ConsumerSite,
                    pk=self.request.resource.token.payload["consumer_site"],
                )
                # Update email only if it's defined in the token user
                if "email" in token_user:
                    update_fields.update({"email": token_user["email"]})

                # Update username only it's defined in the token user
                if "username" in token_user:
                    update_fields.update({"username": token_user["username"]})

                livesession, _created = LiveSession.objects.update_or_create(
                    consumer_site=consumer_site,
                    lti_id=self.request.resource.context_id,
                    lti_user_id=token_user.get("id"),
                    video=video,
                    defaults=update_fields,
                )
            elif self.request.resource:  # Anonymous context
                if not serializer.validated_data.get("anonymous_id"):
                    return Response(
                        {"detail": "Invalid request."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                livesession, _created = LiveSession.objects.update_or_create(
                    anonymous_id=serializer.validated_data["anonymous_id"],
                    video=video,
                    defaults=update_fields,
                )
            else:  # Standalone context
                livesession, _created = LiveSession.objects.update_or_create(
                    video=video,
                    user_id=self.request.user.id,
                    defaults=update_fields,
                )
            return Response(self.get_serializer(livesession).data, status.HTTP_200_OK)

        except IntegrityError as error:
            if "livesession_unique_video_display_name" in error.args[0]:
                return Response(
                    {"display_name": "User with that display_name already exists!"},
                    status=status.HTTP_409_CONFLICT,
                )

            raise error

    @action(detail=False, methods=["get"], url_path="list_attendances")
    def list_attendances(self, request, video_id=None):
        """
        Retrieve the list of attendances computed for livesessions where is_registered
        equals True or with the live_attendance field not empty. As we request a list
        of statistics, we want the timeline of the video to be identical for all
        students so we pass the list of timestamp to the serializer context.
        The same one will then be used for all the students on this list.
        Serializer is cached so the listing don't get recalculated too often
        """
        video_id = self.get_related_video_id()

        prefix_key = f"{VIDEO_ATTENDANCE_KEY_CACHE}{video_id}"
        cache_key = (
            f"{prefix_key}offset:{self.request.query_params.get('offset')}"
            f"limit:{self.request.query_params.get('limit')}"
        )
        if (cached_data := cache.get(cache_key, None)) is not None:
            return Response(cached_data)

        video = get_object_or_404(Video, pk=video_id)

        data = self.list(request, video_id=video_id).data

        # if the video is stopped, there is no need to limit the cache timeout
        cache_timeout = (
            None
            if video.live_info and video.live_info.get("stopped_at")
            else settings.VIDEO_ATTENDANCES_CACHE_DURATION
        )

        cache.set(
            cache_key,
            data,
            timeout=cache_timeout,
        )

        # save the key generated with no timeout in case it needs to be reinitialized
        if not cache_timeout:
            list_keys_timeout = cache.get(prefix_key, [])
            list_keys_timeout.append(cache_key)
            cache.set(prefix_key, list_keys_timeout)

        return Response(data)
