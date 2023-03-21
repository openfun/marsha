"""Structure of liveSession related models API responses with DRF serializers."""
import collections
from datetime import datetime

from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import serializers

from marsha.core.permissions import (
    IsTokenAdmin,
    IsTokenInstructor,
    playlist_role_exists,
)

from ..models import ADMINISTRATOR, ConsumerSite, LiveSession, Video
from ..services.live_session import is_lti_token, is_public_token


class LiveSessionDisplayUsernameSerializer(serializers.ModelSerializer):
    """Serializer for liveSession models and display_name."""

    username = serializers.SerializerMethodField()

    class Meta:
        model = LiveSession
        fields = ("anonymous_id", "display_name", "username")
        read_only_fields = ("username",)
        extra_kwargs = {
            "display_name": {"allow_null": False, "required": True},
        }

    def get_username(self, obj):
        """Get username from user when present or from username field for LTI."""
        if obj.user_id:
            return obj.user.username
        return obj.username


class LiveSessionSerializer(serializers.ModelSerializer):
    """Serializer for liveSession model."""

    username = serializers.SerializerMethodField()

    class Meta:  # noqa
        model = LiveSession
        fields = (
            "anonymous_id",
            "consumer_site",
            "display_name",
            "email",
            "id",
            "is_registered",
            "language",
            "live_attendance",
            "lti_user_id",
            "lti_id",
            "should_send_reminders",
            "username",
            "video",
        )
        read_only_fields = (
            "consumer_site",
            "display_name",
            "id",
            "live_attendance",
            "lti_user_id",
            "lti_id",
            "username",
            "video",
        )

    # Make sure video UUID is converted to a string during serialization
    video = serializers.PrimaryKeyRelatedField(
        read_only=True, pk_field=serializers.CharField()
    )

    def get_username(self, obj):
        """Get username from user when present or from username field for LTI."""
        if obj.user_id:
            return obj.user.username
        return obj.username

    def create(self, validated_data):
        """Control or set data with token information.
        Force the video field to the video of the JWT Token if any.
        Check email, if present in the token, is equal to the one in the request.
        Set lti information if they are present in the token. Control integrity
        errors and set specific messages.
        Parameters
        ----------
        data : dictionary
            Dictionary of the deserialized values of each field after validation.
        Returns
        -------
        dictionary
            The "data" dictionary is returned after modification.
        """
        request = self.context["request"]
        video_id = self.context["video_id"]
        resource = request.resource

        video = get_object_or_404(Video, pk=video_id)

        if not validated_data.get("email"):
            raise serializers.ValidationError({"email": "Email is mandatory."})

        if video.is_scheduled is False:
            raise serializers.ValidationError(
                {"video": f"video with id {video_id} doesn't accept registration."}
            )

        if not validated_data.get("video_id"):
            validated_data["video_id"] = video_id

            if resource and is_lti_token(resource.token):  # LTI context
                validated_data["consumer_site"] = get_object_or_404(
                    ConsumerSite, pk=resource.consumer_site
                )
                validated_data["lti_id"] = resource.context_id
                validated_data["lti_user_id"] = resource.user["id"]

                # If email is present in token, we make sure the one sent is the one expected
                # lti users can't define their email, the one from the token is used
                if resource.user.get("email"):
                    if validated_data["email"] != resource.user["email"]:
                        raise serializers.ValidationError(
                            {
                                "email": "You are not authorized to register with a specific "
                                f"email {validated_data['email']}. You can only use the email "
                                "from your authentication."
                            }
                        )
                # We can identify the user for this context_id and consumer_site, we make sure
                # this user hasn't already registered for this video.
                if LiveSession.objects.filter(
                    consumer_site=validated_data["consumer_site"],
                    lti_id=validated_data["lti_id"],
                    lti_user_id=validated_data["lti_user_id"],
                    video=video,
                ).exists():
                    raise serializers.ValidationError(
                        {
                            "lti_user_id": "This identified user is already "
                            "registered for this video and consumer site and "
                            "course."
                        }
                    )

                # If username is present in the token we catch it
                validated_data["username"] = resource.user.get("username")
            elif resource:  # Anonymous context
                if not is_public_token(
                    resource.token
                ):  # public token should have no LTI info
                    raise serializers.ValidationError(
                        {
                            "token": "Public token shouldn't have any LTI information, "
                            "cases are not expected."
                        }
                    )
                # Make sure we have the anonymous_id
                if not validated_data.get("anonymous_id"):
                    raise serializers.ValidationError(
                        {"anonymous_id": "Anonymous id is mandatory."}
                    )

                # Control this email hasn't already been used for this video in the public case
                if LiveSession.objects.filter(
                    consumer_site=None,
                    email=validated_data["email"],
                    lti_id=None,
                    video=video,
                ).exists():
                    raise serializers.ValidationError(
                        {
                            "email": f"{validated_data['email']} is already registered "
                            "for this video, consumer site and course."
                        }
                    )

                validated_data["consumer_site"] = None
                validated_data["lti_id"] = None
            else:  # stand-alone context
                validated_data["user_id"] = request.user.id
                validated_data["consumer_site"] = None
                validated_data["lti_id"] = None

        validated_data["is_registered"] = True
        validated_data["registered_at"] = timezone.now()
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Do not allow to update some fields."""
        # User here is a video as it comes from the JWT
        # It is named "user" by convention in the `rest_framework_simplejwt` dependency we use.
        resource = self.context["request"].resource
        user = self.context["request"].user
        video_id = self.context["video_id"]

        updatable_fields = ["is_registered", "email", "language"]

        extra_fields = list(set(validated_data.keys()) - set(updatable_fields))

        if len(extra_fields) > 0:
            raise serializers.ValidationError({"not_allowed_fields": extra_fields})
        if validated_data.get("email"):
            # If the email is present in the token, we don't allow a different email
            if resource:  # LTI context
                token_email = resource.user.get("email")
                is_admin = IsTokenInstructor().check_role(
                    resource.token
                ) or IsTokenAdmin().check_role(resource.token)
            else:  # stand-alone context
                video = get_object_or_404(Video, pk=video_id)
                token_email = user.email
                is_admin = playlist_role_exists(
                    video.playlist_id, user.id, {"role": ADMINISTRATOR}
                )
            if not is_admin and token_email and token_email != validated_data["email"]:
                raise serializers.ValidationError(
                    {
                        "email": (
                            "You are not authorized to modify your email."
                            "You can only use the email from your authentication."
                        )
                    }
                )
        if (is_registered := validated_data.get("is_registered")) is not None:
            validated_data["registered_at"] = timezone.now() if is_registered else None

        return super().update(instance, validated_data)


class LiveAttendanceSerializer(serializers.ModelSerializer):
    """Serializer for liveSession model to monitor attendance."""

    class Meta:  # noqa
        model = LiveSession
        fields = (
            "id",
            "language",
            "live_attendance",
            "video",
        )
        read_only_fields = (
            "id",
            "video",
        )

        extra_kwargs = {"live_attendance": {"allow_null": False, "required": True}}

    def validate_live_attendance(self, value):
        """Controls that each keys are timestamps values"""
        if value:
            for key in value.keys():
                try:
                    datetime.fromtimestamp(int(key))
                except ValueError as error:
                    raise serializers.ValidationError(
                        "Field live_attendance doesn't contain expected key "
                        f"`{key}`, it should be a timestamp"
                    ) from error
        return value

    # Make sure video UUID is converted to a string during serialization
    video = serializers.PrimaryKeyRelatedField(
        read_only=True, pk_field=serializers.CharField()
    )


class LiveAttendanceGraphSerializer(serializers.ModelSerializer):
    """Serializer for liveSession model to list computed attendances."""

    display_name = serializers.SerializerMethodField()
    live_attendance = serializers.SerializerMethodField()

    class Meta:  # noqa
        model = LiveSession
        fields = (
            "id",
            "display_name",
            "is_registered",
            "live_attendance",
        )
        read_only_fields = (
            "id",
            "display_name",
            "is_registered",
            "live_attendance",
        )

    def get_display_name(self, obj):  # check new code anonymous_id and co
        """Build the display_name depending on existing data with priority order."""
        return obj.display_name or obj.username or obj.email

    def get_live_attendance(self, obj):
        """
        The video generates multiple timestamps depending on its length. We want to know
        for each of them, if the user was active or not at this current time.
        Parsing the live_attendance from the live session of the user, we identify if the user
        was or not active.
        """
        video_timestamps = obj.video.get_list_timestamps_attendences()

        # if there is no list of timestamps
        if video_timestamps == {}:
            return {}

        # if user has no live_attendance we return the list of timestamps
        if not obj.live_attendance:
            return video_timestamps

        list_attendances = {}
        # merge keys from the video depending on the length and live_attendance of the
        # session of the user
        list_attendances_merged = video_timestamps | obj.live_attendance

        # in case we exactly have the same key generated, we don't need to do any treatment
        if len(list_attendances_merged) == len(video_timestamps):
            return list_attendances_merged

        last_user_key = 0
        last_system_key = 0
        temp = {}
        between_info = {}
        # sort array so keys are ordered by timestamp
        try:
            list_attendances_ordered = collections.OrderedDict(
                sorted({int(k): v for k, v in list_attendances_merged.items()}.items())
            )
        except ValueError as error:
            raise serializers.ValidationError(
                {"live_attendance": "keys in fields should be timestamps"}
            ) from error

        live_attendance_keys = obj.live_attendance.keys()
        for key, value in list_attendances_ordered.items():
            key = str(key)

            # key belongs to the livesession of the user
            if key in live_attendance_keys:
                temp = value
                last_user_key = int(key)
                between_info = {
                    "connectedInBetween": True,
                    "lastConnected": last_user_key,
                }

            # this is a key generated by the video to build the timeline
            if key in video_timestamps.keys():
                # this key is over the expected record from the user
                # based on known frequency and last data received
                expected_next_user_key = last_user_key + settings.ATTENDANCE_PUSH_DELAY
                if int(key) > expected_next_user_key:
                    temp = {}

                # we keep the key system and save it with empty or last info of user
                list_attendances[key] = temp

                # we add an extra information, was user connected between
                # the two last keys system, to tell that this user was still around
                # some how, and maybe detect he has connection issues
                if not temp:
                    if last_user_key > last_system_key:
                        list_attendances[key] = list_attendances[key] | between_info
                    between_info = {}

                last_system_key = int(key)

        return list_attendances
