"""Specific Marsha JWT models"""
from dataclasses import asdict

from django.conf import settings
from django.utils.translation import gettext_lazy as _

from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken, Token

from marsha.core.models import NONE, STUDENT
from marsha.core.simple_jwt.utils import define_locales
from marsha.core.utils.react_locales_utils import react_locale

from .permissions import ResourceAccessPermissions


class MarshaRefreshToken(RefreshToken):
    """
    Refresh token made especially for Marsha. In this token, we also set the access token type.
    We will use later when the access token is generated. Instead of picking the token type from
    the access token class, we will use the one set in the refresh token payload. This avoid to
    have a view/serializer for each refresh token type we are managing.

    The token_type property must not be overridden and we must keep the one defined in RefreshToken
    class
    """

    access_token_type = RefreshToken.access_token_class.token_type

    no_copy_claims = RefreshToken.no_copy_claims + ("access_token_type",)

    def __init__(self, token=None, verify=True):
        """
        Once the parent init made, in the case this is a new generated token, we set
        in the payload the access_token_type property.
        """
        super().__init__(token=token, verify=verify)

        if token is None:
            # new token
            self.payload.update(
                {
                    "access_token_type": self.access_token_type,
                }
            )

    @property
    def access_token(self):
        """
        We delegate the creation of the access token to the parent property and then replace
        the token_type by the one set in the refresh token payload.
        """
        access = super().access_token
        access.payload.update(
            {api_settings.TOKEN_TYPE_CLAIM: self.payload["access_token_type"]}
        )

        return access


class ChallengeToken(Token):
    """Very short lifetime token to allow frontend authentication."""

    token_type = "challenge"  # nosec
    lifetime = settings.CHALLENGE_TOKEN_LIFETIME


class LTISelectFormAccessToken(AccessToken):
    """
    LTI select form access JWT.

    This token has its own lifetime define with the setting LTI_SELECT_FORM_ACCESS_TOKEN_LIFETIME.
    """

    token_type = "lti_select_form_access"  # nosec
    lifetime = settings.LTI_SELECT_FORM_ACCESS_TOKEN_LIFETIME

    PAYLOAD_FORM_DATA = "lti_select_form_data"

    @classmethod
    def for_lti_select_form_data(cls, lti_select_form_data):
        """
        Build an LTI Select Form JWT.

        Parameters
        ----------
        lti_select_form_data: dict
            the data to enclose in the JWT's payload.

        Returns
        -------
        LTISelectFormAccessToken
            JWT containing:
            - lti_select_form_data
        """
        token = cls()
        token.payload[cls.PAYLOAD_FORM_DATA] = lti_select_form_data
        return token

    def verify(self):
        """Performs additional validation steps to test payload content."""
        super().verify()

        if self.PAYLOAD_FORM_DATA not in self.payload:
            raise TokenError(_("Malformed LTI form token"))


class ResourceAccessMixin:
    """
    Methods dedicated to access JWT. They are both used by the ResourceAccessToken
    and the ResourceRefreshToken classes.
    """

    def verify(self):
        """Performs additional validation steps to test payload content."""
        super().verify()

        try:
            ResourceAccessPermissions(**self.payload["permissions"])
        except TypeError as exc:
            raise TokenError(_("Malformed resource access token")) from exc

    @classmethod
    def for_lti(
        cls,
        lti,
        permissions,
        session_id,
        playlist_id,
    ):
        """
        Returns an authorization token for the resource in the LTI request that will be provided
        after authenticating the credentials.

        Parameters
        ----------
        lti: Type[LTI]
            LTI request.

        permissions: Type[Dict]
            permissions to add to the token, must be determined by the caller.

        session_id: Type[str]
            session id to add to the token.

        playlist_id: Type[str]
            optional, playlist id to give access to in addition to the resource.

        Returns
        -------
        ResourceAccessToken
            JWT containing:
            - session_id
            - resource_id
            - roles
            - locale
            - permissions
            - maintenance
            - context_id
            - consumer_site
            - playlist_id (may not be present)
            - user (may not be present):
                - email
                - id
                - username
                - user_fullname
        """
        token = cls.for_resource_id(
            str(playlist_id),
            session_id,
            permissions=permissions,
            roles=lti.roles,
            locale=define_locales(lti),
        )
        token.payload.update(
            {
                "context_id": lti.context_id,
                "consumer_site": str(lti.get_consumer_site().id),
            }
        )

        token.payload["playlist_id"] = playlist_id

        user_id = getattr(lti, "user_id", None)
        if user_id:
            token.payload["user"] = {
                "email": lti.email,
                "id": user_id,
                "username": lti.username,
                "user_fullname": lti.user_fullname,
            }

        return token

    @classmethod
    def for_lti_portability_request(
        cls,
        lti,
        session_id,
        playlist_id,
    ):
        """
        Returns an authorization token without resource
        to allow only portability requests creation.

        Parameters
        ----------
        lti: Type[LTI]
            LTI request.

        session_id: Type[str]
            session id to add to the token.

        playlist_id: Type[str]
            playlist id to give access to in addition to the resource.

        Returns
        -------
        ResourceAccessToken
            JWT containing:
            - session_id
            - resource_id
            - roles
            - locale
            - permissions
            - maintenance
            - context_id
            - consumer_site - mandatory
            - playlist_id - mandatory
            - user:
                - email
                - id - mandatory
                - username
                - user_fullname
        """
        if not (lti.is_instructor or lti.is_admin):
            raise TokenError(
                _("User has not enough rights to make a portability request")
            )

        if not getattr(lti, "user_id", None):  # is None or is empty
            raise TokenError(
                _(
                    "LTI request does not provide enough data to make a portability request"
                )
            )

        token = cls.for_lti(
            lti,
            None,  # not any permission provided
            session_id,  # not mandatory
            playlist_id=playlist_id,
        )
        # Important: this token must not provide any access to the resource
        token.payload["resource_id"] = ""

        return token

    @classmethod
    def for_resource_id(  # pylint: disable=too-many-arguments
        cls,
        resource_id,
        session_id,
        permissions=None,
        roles=None,
        locale=None,
    ):
        """
        Returns an authorization token for the given resource that will be provided
        after authenticating the resource's credentials.

        Parameters
        ----------
        resource_id: Type[str]
            resource id to add to the token.

        session_id: Type[str]
            session id to add to the token.

        permissions: Type[Dict]
            optional, permissions available for the token.

        roles: List[Role]
            optional, list of roles given to the token.

        locale: str
            optional, locale to provide to the frontend
            available locales are defined in `settings.REACT_LOCALES`

        Returns
        -------
        ResourceAccessToken
            JWT containing:
            - session_id
            - resource_id
            - roles
            - locale
            - permissions
            - maintenance
        """
        permissions = ResourceAccessPermissions(**(permissions or {}))

        # Create a short-lived JWT token for the resource selection
        token = cls()
        token.payload.update(
            {
                "session_id": session_id,
                "resource_id": resource_id,
                "roles": roles or [NONE],
                "locale": locale or settings.REACT_LOCALES[0],
                "permissions": asdict(permissions),
                "maintenance": settings.MAINTENANCE_MODE,
            }
        )
        return token

    @classmethod
    def for_live_session(cls, live_session, session_id):
        """
        Returns an authorization token for the resource liked to the live session
        that will be provided after authenticating the resource's credentials.

        Parameters
        ----------
        live_session: Type[LiveSession]
            the live session associated to the token.

        session_id: Type[str]
            session id to add to the token.

        Returns
        -------
        ResourceAccessToken
            JWT containing:
            - resource_id
            - consumer_site (if from LTI connection)
            - context_id (if from LTI connection)
            - roles
            - session_id
            - locale
            - permissions
            - maintenance
            - user:
                - email
                - id (if from LTI connection)
                - username (if from LTI connection)
                - anonymous_id (if not from LTI connection)
        """
        token = cls.for_resource_id(
            str(live_session.video.playlist.id),
            session_id,
            locale=react_locale(live_session.language),
        )

        token.payload["user"] = {
            "email": live_session.email,
        }

        if live_session.is_from_lti_connection:
            token.payload["consumer_site"] = str(live_session.consumer_site.id)
            token.payload["context_id"] = str(live_session.video.playlist.lti_id)
            token.payload["roles"] = [STUDENT]
            token.payload["user"].update(
                {
                    "id": live_session.lti_user_id,
                    "username": live_session.username,
                }
            )
        else:
            token.payload["user"].update(
                {"anonymous_id": str(live_session.anonymous_id)}
            )

        return token


class ResourceAccessToken(ResourceAccessMixin, AccessToken):
    """
    Resource dedicated access JWT.

    This token has the same lifetime as the default AccessToken (see `ACCESS_TOKEN_LIFETIME`
    setting).
    """

    token_type = "resource_access"  # nosec

    def set_jti(self, jti=None):
        """
        Populates the configured jti claim of a token with a string where there
        is a negligible probability that the same string will be chosen at a
        later time.

        See here:
        https://tools.ietf.org/html/rfc7519#section-4.1.7
        """
        if not jti:
            super().set_jti()
        else:
            self.payload[api_settings.JTI_CLAIM] = jti


class ResourceRefreshToken(ResourceAccessMixin, MarshaRefreshToken):
    """Refresh token for resource access which relies on `ResourceAccessToken`"""

    access_token_class = ResourceAccessToken
    access_token_type = ResourceAccessToken.token_type


class LTIUserToken(AccessToken):
    """
    JWT dedicated to authenticate an LTI user.
    This token use does not pass through the authentication middleware because its use is
    limited to below cases:
     - Authenticate a portability request creation
     - Provide this JWT to the frontend to create an LTI/marsha site association
    This token has its own lifetime define with the setting LTI_USER_TOKEN_LIFETIME.
    """

    token_type = "lti_user_access"  # nosec
    lifetime = settings.LTI_USER_TOKEN_LIFETIME

    def verify(self):
        """Performs additional validation steps to test payload content."""
        super().verify()

        if not all(
            self.payload.get(key)
            for key in (
                "lti_consumer_site_id",
                "lti_user_id",
            )
        ):
            raise TokenError(_("Malformed LTI user token"))

    @classmethod
    def for_lti(cls, lti):
        """
        Generates token from lti context.
        Parameters
        ----------
        lti: Type[LTI]
            LTI request.
        Returns
        -------
        LTIUserToken
            JWT containing:
            - lti_consumer_site
            - lti_user_id
        Raises
        ------
        TokenError
            If JWT cannot be properly created.
        """
        token = cls()

        token.payload.update(
            {
                "lti_consumer_site_id": str(lti.get_consumer_site().id),
                "lti_user_id": str(lti.user_id),
            }
        )
        return token


class UserTokenMixin:
    """
    Methods dedicated to user JWT. They are both used by the UserAccessToken
    and the UserRefreshToken classes.
    """

    @classmethod
    def for_user_id(cls, user_id):
        """
        Build a user JWT, used to authenticate user through the application.
        The token is build directly from the user ID to spare a database request.

        This is only valid since the user token is not expected to store other information
        than the user ID.

        Parameters
        ----------
        user_id: str
            The user ID to authenticate.

        Returns
        -------
        AccessToken
            JWT containing:
            - user_id
        """
        token = cls()
        token.payload["user_id"] = user_id
        return token


class UserAccessToken(UserTokenMixin, AccessToken):
    """
    User access JWT.

    For now, we stay with the same attributes as the original AccessToken for
    backward compatibility:
    ```
        token_type = "access"
        lifetime = api_settings.ACCESS_TOKEN_LIFETIME
    ```
    """

    token_type = "user_access"  # nosec

    def verify(self):
        """Performs additional validation steps to test payload content."""
        super().verify()

        if not self.payload.get("user_id", None):
            raise TokenError(_("Malformed user token"))


class UserRefreshToken(UserTokenMixin, MarshaRefreshToken):
    """Refresh token for user authentication, which relies on our own `UserAccessToken`."""

    access_token_class = UserAccessToken
    access_token_type = UserAccessToken.token_type
