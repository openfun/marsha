"""Account API serializers."""
from django.contrib.auth import get_user_model, password_validation
from django.contrib.auth.forms import SetPasswordForm
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode

from rest_framework.exceptions import ValidationError
from rest_framework.fields import CharField
from rest_framework.serializers import Serializer
from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer,
    TokenRefreshSerializer as BaseTokenRefreshSerializer,
)

from marsha.core.simple_jwt.tokens import MarshaRefreshToken, UserRefreshToken


class UserTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Serializer for the user token obtain pair API using our own refresh token."""

    token_class = UserRefreshToken


class TokenRefreshSerializer(BaseTokenRefreshSerializer):
    """Serializer to use our own refresh token."""

    token_class = MarshaRefreshToken


class SetPasswordSerializer(Serializer):
    """
    Serializer that lets a user change set their password without entering the old
    password.
    """

    uidb64 = CharField(required=True)
    token = CharField(required=True)
    new_password1 = CharField(required=True)
    new_password2 = CharField(required=True)

    _form = None

    def get_user(self, uidb64):
        """Return the user corresponding to the uidb64 (or None)."""
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            # pylint: disable=protected-access
            user = get_user_model()._default_manager.get(pk=uid)
        except (TypeError, ValueError, OverflowError, get_user_model().DoesNotExist):
            user = None
        return user

    def validate(self, attrs):
        """Validate the provided data."""
        attrs = super().validate(attrs)

        if not (user := self.get_user(attrs["uidb64"])):
            raise ValidationError({"uidb64": ["Invalid value"]})

        try:
            if not default_token_generator.check_token(user, attrs["token"]):
                raise ValidationError({"token": ["Invalid value"]})
        except ValueError:
            raise ValidationError({"token": ["Invalid value"]}) from ValueError

        if attrs["new_password1"] != attrs["new_password2"]:
            raise ValidationError("The two password fields didn't match.")
        try:
            password_validation.validate_password(attrs["new_password2"], user)
        except DjangoValidationError as error:
            raise ValidationError from error

        # pass form to save method
        self._form = SetPasswordForm(user=user, data=attrs)
        if not self._form.is_valid():
            raise ValidationError(self._form.errors)

        return attrs

    def save(self, **kwargs):
        """Save the new password."""
        return self._form.save()
