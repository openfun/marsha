"""Declare API endpoints for live registration with Django RestFramework viewsets."""
from logging import getLogger
import smtplib

from django.conf import settings
from django.core.mail import send_mail
from django.db.utils import IntegrityError
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from django.utils.translation import gettext_lazy as _

from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import SimpleRateThrottle
from sentry_sdk import capture_exception

from .. import permissions, serializers
from ..models import ConsumerSite, LiveRegistration, Video
from ..models.account import NONE
from .base import ObjectPkMixin


logger = getLogger(__name__)


class LiveRegistrationThrottle(SimpleRateThrottle):
    """Throttling for liveregistration list requests."""

    scope = "live_registration"

    def get_cache_key(self, request, view):
        if request.query_params.get("anonymous_id"):
            return self.cache_format % {
                "scope": self.scope,
                "ident": self.get_ident(request),
            }
        return None


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

    def is_lti_token(self):
        """Read the token and confirms if the user is identified by LTI"""
        user = self.request.user

        return (
            user.token.payload
            and user.token.payload.get("context_id")
            and user.token.payload.get("consumer_site")
            and user.token.payload.get("user")
            and user.token.payload["user"].get("id")
        )

    def is_public_token(self):
        """Read the token and check it was made to fetch a public resource."""
        user = self.request.user
        return (
            user.token.payload
            and user.token.payload.get("roles") == [NONE]
            and user.token.payload.get("user") is None
            and user.token.payload.get("context_id") is None
            and user.token.payload.get("consumer_site") is None
        )

    def get_liveregistration_from_lti(self):
        """Get or create liveregistration for a LTI connection."""
        user = self.request.user
        video = get_object_or_404(Video, pk=user.id)
        token_user = user.token.payload.get("user")
        consumer_site = get_object_or_404(
            ConsumerSite, pk=user.token.payload["consumer_site"]
        )

        return LiveRegistration.objects.get_or_create(
            consumer_site=consumer_site,
            lti_id=user.token.payload.get("context_id"),
            lti_user_id=token_user.get("id"),
            video=video,
            defaults={
                "email": token_user.get("email"),
                "username": token_user.get("username"),
            },
        )

    def get_liveregistration_from_anonymous_id(self, anonymous_id):
        """Get or create a liveregistration for an anonymous id"""
        user = self.request.user
        video = get_object_or_404(Video, pk=user.id)

        return LiveRegistration.objects.get_or_create(
            video=video, anonymous_id=anonymous_id
        )

    def get_queryset(self):
        """Restrict access to liveRegistration with data contained in the JWT token.
        Access is restricted to liveRegistration related to the video, context_id and consumer_site
        present in the JWT token. Email is ignored. Lti user id from the token can be used as well
        depending on the role.
        """
        user = self.request.user
        filters = {"video__id": user.id}
        if self.is_lti_token():
            if self.kwargs.get("pk"):
                filters["pk"] = self.kwargs["pk"]

            filters["lti_id"] = user.token.payload["context_id"]
            filters["consumer_site"] = user.token.payload["consumer_site"]
            if self.request.query_params.get("is_registered"):
                filters["is_registered"] = self.request.query_params.get(
                    "is_registered"
                )

            # admin and instructors can access all registrations of this course
            if user.token.payload.get("roles") and any(
                role in ["administrator", "instructor"]
                for role in user.token.payload["roles"]
            ):
                return LiveRegistration.objects.filter(**filters)

            # token has email or not, user has access to this registration if it's the right
            # combination of lti_user_id, lti_id and consumer_site
            # email doesn't necessary have a match
            filters["lti_user_id"] = user.token.payload["user"]["id"]
            return LiveRegistration.objects.filter(**filters)

        if self.request.query_params.get("anonymous_id"):
            return LiveRegistration.objects.filter(
                anonymous_id=self.request.query_params.get("anonymous_id"), **filters
            )

        return LiveRegistration.objects.none()

    def get_throttles(self):
        """Depending on action, defines a throttle class"""
        throttle_class = []
        if self.action == "list":
            throttle_class = [LiveRegistrationThrottle]

        return [throttle() for throttle in throttle_class]

    def perform_create(self, serializer):
        """Overrides perform_create to send the mail and catch error if needed"""
        liveregistration = serializer.save()
        try:
            video = Video.objects.get(id=liveregistration.video_id)
            template_vars = {
                "cancel_reminder_url": liveregistration.generate_cancel_reminder_url(),
                "email": liveregistration.email,
                "username": serializer.validated_data.get("username", ""),
                "time_zone": settings.TIME_ZONE,
                "video": video,
            }
            msg_plain = render_to_string("core/mail/text/register.txt", template_vars)
            msg_html = render_to_string("core/mail/html/register.html", template_vars)
            send_mail(
                f'{_("Registration for ")}{video.title}',
                msg_plain,
                settings.EMAIL_FROM,
                [liveregistration.email],
                html_message=msg_html,
                fail_silently=False,
            )
        except smtplib.SMTPException as exception:
            # no exception raised as user can't sometimes change his mail,
            logger.warning("registration mail %s not send", liveregistration.email)
            capture_exception(exception)

    @action(detail=False, methods=["post"])
    # pylint: disable=unused-argument
    def push_attendance(self, request, pk=None):
        """View handling pushing new attendance"""
        serializer = serializers.LiveAttendanceSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"detail": "Invalid request."}, status=400)

        if self.is_lti_token():
            liveregistration, created = self.get_liveregistration_from_lti()
        elif self.is_public_token():
            anonymous_id = self.request.query_params.get("anonymous_id")
            if anonymous_id is None:
                return Response(
                    {"detail": "anonymous_id is missing"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            liveregistration, created = self.get_liveregistration_from_anonymous_id(
                anonymous_id=anonymous_id
            )
        else:
            return Response(
                {
                    "detail": (
                        "Impossible to authenticate you. You should provide a valid JWT token."
                    )
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        token_user = self.request.user.token.payload.get("user", {})
        # liveregistration already exists, we update email and username if necessary
        if not created:
            # Update liveregistration email only if it's defined in the token user
            if token_user.get("email"):
                liveregistration.email = token_user.get("email")

            # Update liveregistration username only it's defined in the token user
            if token_user.get("username"):
                liveregistration.username = token_user.get("username")

        # update or add live_attendance information
        if liveregistration.live_attendance:
            liveregistration.live_attendance = (
                serializer.data["live_attendance"] | liveregistration.live_attendance
            )
        else:
            liveregistration.live_attendance = serializer.data["live_attendance"]

        liveregistration.save()

        return Response(
            {
                "id": liveregistration.id,
                "video": liveregistration.video.id,
                "live_attendance": liveregistration.live_attendance,
            }
        )

    @action(detail=False, methods=["put"], url_path="display_name")
    def set_display_name(self, request):
        """View handling setting display_name. Create or get registration."""
        serializer = serializers.LiveRegistrationDisplayUsernameSerializer(
            data=request.data
        )
        if not serializer.is_valid():
            return Response(
                {"detail": "Invalid request."}, status=status.HTTP_400_BAD_REQUEST
            )

        user = self.request.user
        video = get_object_or_404(Video, pk=user.id)

        try:
            update_fields = {
                "display_name": serializer.validated_data["display_name"],
            }
            if self.is_lti_token():
                token_user = user.token.payload.get("user")
                consumer_site = get_object_or_404(
                    ConsumerSite, pk=user.token.payload["consumer_site"]
                )
                # Update email only if it's defined in the token user
                if token_user.get("email"):
                    update_fields.update({"email": token_user.get("email")})

                # Update username only it's defined in the token user
                if token_user.get("username"):
                    update_fields.update({"username": token_user.get("username")})

                liveregistration, _ = LiveRegistration.objects.update_or_create(
                    consumer_site=consumer_site,
                    lti_id=user.token.payload.get("context_id"),
                    lti_user_id=token_user.get("id"),
                    video=video,
                    defaults=update_fields,
                )
            else:
                liveregistration, _ = LiveRegistration.objects.update_or_create(
                    anonymous_id=serializer.validated_data["anonymous_id"],
                    video=video,
                    defaults=update_fields,
                )
            return Response(
                {
                    "display_name": liveregistration.display_name,
                    "username": liveregistration.username,
                }
            )
        except IntegrityError as error:
            if "liveregistration_unique_video_display_name" in error.args[0]:
                return Response(
                    {"display_name": "User with that username already exists!"},
                    status=status.HTTP_409_CONFLICT,
                )

            raise error
