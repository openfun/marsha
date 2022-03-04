"""Structure of liveSession related models API responses with DRF serializers."""
from django.shortcuts import get_object_or_404

from rest_framework import serializers
from rest_framework_simplejwt.models import TokenUser

from ..models import ConsumerSite, LiveSession, Video


class LiveSessionDisplayUsernameSerializer(serializers.ModelSerializer):
    """Serializer for liveSession models and display_name."""

    class Meta:
        model = LiveSession
        fields = ("anonymous_id", "display_name", "username")
        read_only_fields = ("username",)
        extra_kwargs = {
            "display_name": {"allow_null": False, "required": True},
        }


class LiveSessionSerializer(serializers.ModelSerializer):
    """Serializer for liveSession model."""

    class Meta:  # noqa
        model = LiveSession
        fields = (
            "anonymous_id",
            "consumer_site",
            "display_name",
            "email",
            "id",
            "is_registered",
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
            "is_registered",
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

    def validate(self, attrs):
        """Control or set data with token informations.
        Force the video field to the video of the JWT Token if any.
        Check email, if present in the token, is equal to the one in the request.
        Set lti informations if they are present in the token. Control integrity
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
        # User here is a video as it comes from the JWT
        # It is named "user" by convention in the `rest_framework_simplejwt` dependency we use.
        user = self.context["request"].user
        video = get_object_or_404(Video, pk=user.id)
        if not attrs.get("email"):
            raise serializers.ValidationError({"email": "Email is mandatory."})
        if video.is_scheduled is False:
            raise serializers.ValidationError(
                {"video": f"video with id {user.id} doesn't accept registration."}
            )

        if not attrs.get("video_id") and isinstance(user, TokenUser):
            attrs["video_id"] = user.id
            is_lti = (
                user.token.payload.get("context_id")
                and user.token.payload.get("consumer_site")
                and user.token.payload.get("user")
                and user.token.payload["user"].get("id")
            )

            if is_lti:
                attrs["consumer_site"] = get_object_or_404(
                    ConsumerSite, pk=user.token.payload["consumer_site"]
                )
                attrs["lti_id"] = user.token.payload["context_id"]
                attrs["lti_user_id"] = user.token.payload["user"]["id"]

                # If email is present in token, we make sure the one sent is the one expected
                # lti users can't defined their email, the one from the token is used
                if user.token.payload["user"].get("email"):
                    if attrs["email"] != user.token.payload["user"]["email"]:
                        raise serializers.ValidationError(
                            {
                                "email": "You are not authorized to register with a specific email"
                                f" {attrs['email']}. You can only use the email from your "
                                "authentication."
                            }
                        )
                # We can identify the user for this context_id and consumer_site, we make sure
                # this user hasn't already registered for this video.
                if LiveSession.objects.filter(
                    consumer_site=attrs["consumer_site"],
                    lti_id=attrs["lti_id"],
                    lti_user_id=attrs["lti_user_id"],
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
                attrs["username"] = user.token.payload["user"].get("username")
            else:  # public token should have no LTI info
                if (
                    user.token.payload.get("context_id")
                    or user.token.payload.get("consumer_site")
                    or (
                        user.token.payload.get("user")
                        and user.token.payload["user"].get("id")
                    )
                ):
                    # we prevent any side effects if token's creation changes.
                    raise serializers.ValidationError(
                        {
                            "token": "Public token shouldn't have any LTI information, "
                            "cases are not expected."
                        }
                    )
                # Make sure we have the anonymous_id
                if not attrs.get("anonymous_id"):
                    raise serializers.ValidationError(
                        {"anonymous_id": "Anonymous id is mandatory."}
                    )

                # Control this email hasn't already been used for this video in the public case
                if LiveSession.objects.filter(
                    consumer_site=None,
                    email=attrs["email"],
                    lti_id=None,
                    video=video,
                ).exists():
                    raise serializers.ValidationError(
                        {
                            "email": f"{attrs['email']} is already registered "
                            "for this video, consumer site and course."
                        }
                    )

                attrs["consumer_site"] = None
                attrs["lti_id"] = None

        return super().validate(attrs)

    def create(self, validated_data):
        validated_data["is_registered"] = True
        return super().create(validated_data)


class LiveAttendanceSerializer(serializers.ModelSerializer):
    """Serializer for liveSession model to monitor attendance."""

    class Meta:  # noqa
        model = LiveSession
        fields = (
            "id",
            "live_attendance",
            "video",
        )
        read_only_fields = (
            "id",
            "video",
        )

        extra_kwargs = {"live_attendance": {"allow_null": False, "required": True}}

    # Make sure video UUID is converted to a string during serialization
    video = serializers.PrimaryKeyRelatedField(
        read_only=True, pk_field=serializers.CharField()
    )
