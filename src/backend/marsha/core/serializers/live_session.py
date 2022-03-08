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

    def create(self, validated_data):
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
        if not validated_data.get("email"):
            raise serializers.ValidationError({"email": "Email is mandatory."})
        if video.is_scheduled is False:
            raise serializers.ValidationError(
                {"video": f"video with id {user.id} doesn't accept registration."}
            )

        if not validated_data.get("video_id") and isinstance(user, TokenUser):
            validated_data["video_id"] = user.id
            is_lti = (
                user.token.payload.get("context_id")
                and user.token.payload.get("consumer_site")
                and user.token.payload.get("user")
                and user.token.payload["user"].get("id")
            )

            if is_lti:
                validated_data["consumer_site"] = get_object_or_404(
                    ConsumerSite, pk=user.token.payload["consumer_site"]
                )
                validated_data["lti_id"] = user.token.payload["context_id"]
                validated_data["lti_user_id"] = user.token.payload["user"]["id"]

                # If email is present in token, we make sure the one sent is the one expected
                # lti users can't defined their email, the one from the token is used
                if user.token.payload["user"].get("email"):
                    if validated_data["email"] != user.token.payload["user"]["email"]:
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
                validated_data["username"] = user.token.payload["user"].get("username")
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

        validated_data["is_registered"] = True
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Do not allow to update some fields."""
        # User here is a video as it comes from the JWT
        # It is named "user" by convention in the `rest_framework_simplejwt` dependency we use.
        user = self.context["request"].user
        updatable_fields = ["is_registered", "email"]

        extra_fields = list(set(validated_data.keys()) - set(updatable_fields))

        if len(extra_fields) > 0:
            raise serializers.ValidationError({"not_allowed_fields": extra_fields})
        if validated_data.get("email"):
            # If the email is present in the token, we don't allow a different email
            token_email = user.token.payload.get("user", {}).get("email")
            is_admin = user.token.payload.get("roles") and any(
                role in ["administrator", "instructor"]
                for role in user.token.payload["roles"]
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

        return super().update(instance, validated_data)


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
