"""Declare API endpoints for live session with Django RestFramework viewsets."""
from collections import OrderedDict
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

from rest_framework import mixins, status, viewsets
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
    is_lti_token,
    is_public_token,
)
from .base import APIViewMixin, ObjectPkMixin


logger = getLogger(__name__)


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
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Viewset for the API of the LiveSession object."""

    permission_classes = [permissions.NotAllowed]
    queryset = LiveSession.objects.select_related("user").all()
    serializer_class = serializers.LiveSessionSerializer

    def get_permissions(self):
        """Instantiate and return the list of permissions that this view requires."""
        if self.action in [
            "create",
            "list",
            "partial_update",
            "retrieve",
            "push_attendance",
            "set_display_name",
        ]:
            permission_classes = [permissions.ResourceIsAuthenticated]
        elif self.action in ["list_attendances"]:
            permission_classes = [
                permissions.IsTokenInstructor | permissions.IsTokenAdmin
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

    def get_queryset(self):
        """Restrict access to liveSession with data contained in the JWT token.
        Access is restricted to liveSession related to the video, context_id and consumer_site
        present in the JWT token. Email is ignored. Lti user id from the token can be used as well
        depending on the role.
        """
        filters = {"video__id": self.request.resource.id}
        if is_lti_token(self.request.resource.token):
            if self.kwargs.get("pk"):
                filters["pk"] = self.kwargs["pk"]

            if self.request.query_params.get("is_registered"):
                filters["is_registered"] = self.request.query_params.get(
                    "is_registered"
                )

            # admin and instructors can access all registrations of this course
            if permissions.IsTokenInstructor().check_role(
                self.request.resource.token
            ) or permissions.IsTokenAdmin().check_role(self.request.resource.token):
                return LiveSession.objects.filter(**filters)

            filters["lti_id"] = self.request.resource.context_id
            filters["consumer_site"] = self.request.resource.consumer_site

            # token has email or not, user has access to this registration if it's the right
            # combination of lti_user_id, lti_id and consumer_site
            # email doesn't necessary have a match
            filters["lti_user_id"] = self.request.resource.user["id"]
            return LiveSession.objects.filter(**filters)

        if self.request.query_params.get("anonymous_id"):
            return LiveSession.objects.filter(
                anonymous_id=self.request.query_params.get("anonymous_id"), **filters
            )

        return LiveSession.objects.none()

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
                    f"{object} {video.title}",
                    msg_plain,
                    settings.EMAIL_FROM,
                    [livesession.email],
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

        token = self.request.resource.token
        if is_lti_token(token):
            try:
                livesession, created = get_livesession_from_lti(token)
            except (Video.DoesNotExist, ConsumerSite.DoesNotExist) as exception:
                raise Http404("No resource matches the given query.") from exception

        elif is_public_token(token):
            anonymous_id = self.request.query_params.get("anonymous_id")
            if anonymous_id is None:
                return Response(
                    {"detail": "anonymous_id is missing"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                livesession, created = get_livesession_from_anonymous_id(
                    video_id=token.payload["resource_id"], anonymous_id=anonymous_id
                )
            except Video.DoesNotExist as exception:
                raise Http404("No Video matches the given query.") from exception
        else:
            return Response(
                {
                    "detail": (
                        "Impossible to authenticate you. You should provide a valid JWT token."
                    )
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        token_user = self.request.resource.user
        # livesession already exists, we update email and username if necessary
        if not created:
            # Update livesession email only if it's defined in the token user
            if token_user.get("email"):
                livesession.email = token_user.get("email")

            # Update livesession username only it's defined in the token user
            if token_user.get("username"):
                livesession.username = token_user.get("username")

        # update or add live_attendance information
        livesession.live_attendance = (
            (serializer.data["live_attendance"] | livesession.live_attendance)
            if livesession.live_attendance
            else serializer.data["live_attendance"]
        )

        if serializer.data.get("language"):
            livesession.language = serializer.data["language"]

        livesession.save()

        return Response(self.get_serializer(livesession).data, status.HTTP_200_OK)

    @action(detail=False, methods=["put"], url_path="display_name")
    def set_display_name(self, request, video_id=None):
        """View handling setting display_name. Create or get registration."""
        serializer = serializers.LiveSessionDisplayUsernameSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"detail": "Invalid request."}, status=status.HTTP_400_BAD_REQUEST
            )

        resource = self.request.resource
        video = get_object_or_404(Video, pk=resource.id)

        try:
            update_fields = {
                "display_name": serializer.validated_data["display_name"],
            }
            if is_lti_token(resource.token):
                token_user = resource.user
                consumer_site = get_object_or_404(
                    ConsumerSite, pk=resource.token.payload["consumer_site"]
                )
                # Update email only if it's defined in the token user
                if "email" in token_user:
                    update_fields.update({"email": token_user["email"]})

                # Update username only it's defined in the token user
                if "username" in token_user:
                    update_fields.update({"username": token_user["username"]})

                livesession, _ = LiveSession.objects.update_or_create(
                    consumer_site=consumer_site,
                    lti_id=resource.context_id,
                    lti_user_id=token_user.get("id"),
                    video=video,
                    defaults=update_fields,
                )
            else:
                if not serializer.validated_data.get("anonymous_id"):
                    return Response(
                        {"detail": "Invalid request."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                livesession, _ = LiveSession.objects.update_or_create(
                    anonymous_id=serializer.validated_data["anonymous_id"],
                    video=video,
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
        prefix_key = f"{VIDEO_ATTENDANCE_KEY_CACHE}{self.request.resource.id}"
        cache_key = (
            f"{prefix_key}offset:{self.request.query_params.get('offset')}"
            f"limit:{self.request.query_params.get('limit')}"
        )
        if cached_data := cache.get(cache_key, None):
            return Response(
                OrderedDict(
                    [
                        ("count", cached_data.get("count")),
                        ("next", cached_data.get("next")),
                        ("previous", cached_data.get("previous")),
                        ("results", cached_data.get("results")),
                    ]
                )
            )

        try:
            video = Video.objects.get(pk=self.request.resource.id)
        except Video.DoesNotExist as exception:
            raise Http404("No resource matches the given query.") from exception

        # we only want livesessions that are registered or with live_attendance not empty
        queryset = LiveSession.objects.filter(
            (
                Q(is_registered=True)
                | ~(Q(live_attendance__isnull=True) | Q(live_attendance__exact={}))
            )
            & Q(video__id=video.id)
        )
        page = self.paginate_queryset(self.filter_queryset(queryset))
        serializer = serializers.LiveAttendanceGraphSerializer(
            page,
            many=True,
            context={"video_timestamps": video.get_list_timestamps_attendences()},
        )
        # if the video is stopped, there is no need to limit the cache timeout
        cache_timeout = (
            None
            if video.live_info and video.live_info.get("stopped_at")
            else settings.VIDEO_ATTENDANCES_CACHE_DURATION
        )
        data = OrderedDict(
            [
                ("count", self.paginator.count),
                ("next", self.paginator.get_next_link()),
                ("previous", self.paginator.get_previous_link()),
                ("results", serializer.data),
            ]
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
