"""Specific Marsha JWT models"""
from dataclasses import asdict

from django.conf import settings
from django.utils.translation import gettext_lazy as _

from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken

from marsha.core.models import NONE, STUDENT
from marsha.core.simple_jwt.utils import define_locales
from marsha.core.utils.react_locales_utils import react_locale

from .permissions import ResourceAccessPermissions


class LTISelectFormAccessToken(AccessToken):
    """
    LTI select form access JWT.

    This token has the same lifetime as the default AccessToken (see `ACCESS_TOKEN_LIFETIME`
    setting).

    Note: not usable through our authentication backend since it doesn't provide the
    `api_settings.USER_ID_CLAIM` information in payload.
    """

    token_type = "lti_select_form_access"  # nosec

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


class ResourceAccessToken(AccessToken):
    """
    Resource dedicated access JWT.

    This token has the same lifetime as the default AccessToken (see `ACCESS_TOKEN_LIFETIME`
    setting).

    Note: `api_settings.USER_ID_CLAIM` is currently `resource_id`.
    """

    token_type = "resource_access"  # nosec

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
        playlist_id=None,
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
            str(lti.resource_id),
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

        if playlist_id:
            assert lti.is_instructor or lti.is_admin  # nosec
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
            str(live_session.video.id),
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


class UserAccessToken(AccessToken):
    """
    User access JWT.

    For now, we stay with the same attributes as the original AccessToken for
    backward compatibility:
    ```
        token_type = "access"
        lifetime = api_settings.ACCESS_TOKEN_LIFETIME
    ```

    Note: `api_settings.USER_ID_CLAIM` is currently `resource_id`.
    """

    token_type = "user_access"  # nosec

    PAYLOAD_USER = "user"

    @classmethod
    def for_user(cls, user):
        """
        Build a user JWT, used to authenticate user through the application.

        Parameters
        ----------
        user: Type[core.User]
            the user whom information are to store in JWT.

        Returns
        -------
        AccessToken
            JWT containing:
            - resource_id (`api_settings.USER_ID_CLAIM`)
            - user
        """
        token = super().for_user(user)
        token.payload[cls.PAYLOAD_USER] = {"id": str(user.id)}
        return token

    def verify(self):
        """Performs additional validation steps to test payload content."""
        super().verify()

        if self.PAYLOAD_USER not in self.payload:
            raise TokenError(_("Malformed user token"))
