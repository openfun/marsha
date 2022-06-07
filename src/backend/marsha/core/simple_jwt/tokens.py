"""Specific Marsha JWT models"""
from django.conf import settings

from rest_framework_simplejwt.tokens import AccessToken

from marsha.core.models import NONE, STUDENT
from marsha.core.simple_jwt.utils import define_locales
from marsha.core.utils.react_locales_utils import react_locale


class LTISelectFormAccessToken(AccessToken):
    """
    LTI select form access JWT.

    For now, we stay with the same attributes as the original AccessToken for
    backward compatibility:
    ```
        token_type = "access"
        lifetime = api_settings.ACCESS_TOKEN_LIFETIME
    ```

    Note: not usable through our authentication backend since it doesn't provide the
    `api_settings.USER_ID_CLAIM` information in payload.
    """

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


class ResourceAccessToken(AccessToken):
    """
    Resource dedicated access JWT.

    For now, we stay with the same attributes as the original AccessToken for
    backward compatibility:
    ```
        token_type = "access"
        lifetime = api_settings.ACCESS_TOKEN_LIFETIME
    ```

    Note: `api_settings.USER_ID_CLAIM` is currently `resource_id`.
    """

    @classmethod
    def for_resource_id(  # pylint: disable=too-many-arguments
        cls,
        permissions,
        session_id,
        lti=None,
        playlist_id=None,
        resource_id=None,
    ):
        """
        Returns an authorization token for the given resource that will be provided
        after authenticating the resource's credentials.

        Might be split later between LTI and simple behavior.

        Parameters
        ----------
        permissions: Type[Dict]
            permissions to add to the token.

        session_id: Type[str]
            session id to add to the token.

        lti: Type[LTI]
            LTI request.

        playlist_id: Type[str]
            playlist id to add to the token.

        resource_id: Type[str]
            resource id to add to the token.

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
            - user:
                - email
                - id
                - username
                - user_fullname
        """
        user_id = getattr(lti, "user_id", None) if lti else None

        locale = define_locales(lti)

        # Create a short-lived JWT token for the resource selection
        token = cls()

        if lti:
            token.payload["context_id"] = lti.context_id
            token.payload["consumer_site"] = str(lti.get_consumer_site().id)

        if playlist_id:
            token.payload["playlist_id"] = playlist_id

        token.payload.update(
            {
                "session_id": session_id,
                "resource_id": str(lti.resource_id) if lti else resource_id,
                "roles": lti.roles if lti else [NONE],
                "locale": locale,
                "permissions": permissions,
                "maintenance": settings.MAINTENANCE_MODE,
            }
        )
        if user_id:
            token.payload["user"] = {
                "email": lti.email,
                "id": user_id,
                "username": lti.username,
                "user_fullname": lti.user_fullname,
            }
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
        token = cls()

        token.payload["resource_id"] = str(live_session.video.id)
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
            token.payload["roles"] = [NONE]

        token.payload.update(
            {
                "session_id": session_id,
                "locale": react_locale(live_session.language),
                "permissions": {"can_access_dashboard": False, "can_update": False},
                "maintenance": settings.MAINTENANCE_MODE,
            }
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
