"""Declare API endpoints for live registration with Django RestFramework viewsets."""
from django.shortcuts import get_object_or_404

from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import SimpleRateThrottle

from .. import permissions, serializers
from ..models import ConsumerSite, LiveRegistration, Video
from .base import ObjectPkMixin


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

    def get_queryset(self):
        """Restrict access to liveRegistration with data contained in the JWT token.
        Access is restricted to liveRegistration related to the video, context_id and consumer_site
        present in the JWT token. Email is ignored. Lti user id from the token can be used as well
        depending on the role.
        """
        user = self.request.user
        if self.is_lti_token():
            filters = {"video__id": user.id}
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

        # public context, we can't read any liveregistration
        return LiveRegistration.objects.none()

    def get_throttles(self):
        """Depending on action, defines a throttle class"""
        throttle_class = []
        if self.action == "list":
            throttle_class = [LiveRegistrationThrottle]

        return [throttle() for throttle in throttle_class]

    @action(detail=False, methods=["post"])
    # pylint: disable=unused-argument
    def push_attendance(self, request, pk=None):
        """View handling pushing new attendance"""
        serializer = serializers.LiveAttendanceSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"detail": "Invalid request."}, status=400)

        user = self.request.user
        video = get_object_or_404(Video, pk=user.id)

        if self.is_lti_token():
            token_user = user.token.payload.get("user")
            consumer_site = get_object_or_404(
                ConsumerSite, pk=user.token.payload["consumer_site"]
            )
            liveregistration, _ = LiveRegistration.objects.get_or_create(
                consumer_site=consumer_site,
                lti_id=user.token.payload.get("context_id"),
                lti_user_id=token_user.get("id"),
                video=video,
            )
            # Update liveregistration email only if it's defined in the token user
            if token_user.get("email"):
                liveregistration.email = token_user.get("email")

            # Update liveregistration username only it's defined in the token user
            if token_user.get("username"):
                liveregistration.username = token_user.get("username")

            # update or add live_attendance information
            if liveregistration.live_attendance:
                liveregistration.live_attendance = (
                    serializer.data["live_attendance"]
                    | liveregistration.live_attendance
                )
            else:
                liveregistration.live_attendance = serializer.data["live_attendance"]

            liveregistration.save()

            return Response(
                {
                    "id": liveregistration.id,
                    "video": video.id,
                    "live_attendance": liveregistration.live_attendance,
                }
            )

        return Response(
            {"detail": "Attendance from public video is not implemented yet."},
            status=404,
        )
