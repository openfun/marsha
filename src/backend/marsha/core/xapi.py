"""XAPI module."""

import re
import uuid

from django.conf import settings
from django.utils import timezone
from django.utils.translation import to_locale

from ralph.models.xapi.base.agents import BaseXapiAgentWithAccount
from ralph.models.xapi.base.ifi import BaseXapiAccount
from ralph.models.xapi.concepts.activity_types.scorm_profile import CourseActivity
from ralph.models.xapi.concepts.activity_types.tincan_vocabulary import (
    DocumentActivity,
    DocumentActivityDefinition,
    WebinarActivity,
    WebinarActivityDefinition,
)
from ralph.models.xapi.concepts.activity_types.video import (
    VideoActivity,
    VideoActivityDefinition,
)
from ralph.models.xapi.lms.contexts import LMSProfileActivity
from ralph.models.xapi.video.contexts import VideoProfileActivity
import requests


def get_xapi_statement(resource):
    """Return the xapi object statement based on the required resource type."""
    if resource == "video":
        return XAPIVideoStatement()

    if resource == "document":
        return XAPIDocumentStatement()

    raise NotImplementedError


class XAPIStatementMixin:
    """Mixin used by xapi statements."""

    @staticmethod
    def get_user_id(jwt_token):
        """Return the user id if present in the JWT token or the session_is otherwise."""
        return (
            jwt_token.payload["user"].get("id")
            if jwt_token.payload.get("user")
            else jwt_token.payload["session_id"]
        )

    @staticmethod
    def get_username(jwt_token):
        """Return the user name if present in the JWT token or None otherwise."""
        return (
            jwt_token.payload["user"].get("username")
            if jwt_token.payload.get("user")
            else None
        )

    @staticmethod
    def get_homepage(resource):
        """Return the domain associated to the playlist consumer site."""
        return resource.playlist.consumer_site.domain

    def get_locale(self):
        """Return the locale formatted with a - instead of _"""

        return to_locale(settings.LANGUAGE_CODE).replace("_", "-")

    def get_actor_from_website(self, homepage, user):
        """Return the actor property from a website context"""
        return BaseXapiAgentWithAccount(
            account=BaseXapiAccount(homePage=homepage, name=str(user.id)),
            name=user.username,
        ).model_dump(exclude_none=True)

    def get_actor_from_lti(self, homepage, user_id, username):
        """Return the actor property from a LTI context"""
        return BaseXapiAgentWithAccount(
            name=username, account=BaseXapiAccount(homePage=homepage, name=user_id)
        ).model_dump(exclude_none=True)

    def build_common_statement_properties(
        self, statement, homepage, user=None, user_id=None, username=None # pylint: disable=too-many-arguments
    ):
        """build statement properties common to all resources."""
        if "id" not in statement:
            statement["id"] = str(uuid.uuid4())

        statement["timestamp"] = timezone.now().isoformat()

        statement["actor"] = (
            self.get_actor_from_website(homepage, user)
            if user
            else self.get_actor_from_lti(homepage, user_id, username)
        )

        return statement


class XAPIDocumentStatement(XAPIStatementMixin):
    """Object managing statement for document objects."""

    # pylint: disable=too-many-arguments
    def _build_statement(
        self, document, statement, homepage, user=None, user_id=None, username=None
    ):
        """Build all common properties for a document."""

        if re.match(r"^http(s?):\/\/.*", homepage) is None:
            homepage = f"http://{homepage}"

        statement = self.build_common_statement_properties(
            statement, homepage, user=user, user_id=user_id, username=username
        )

        statement["context"].update(
            {
                "contextActivities": {
                    "category": [LMSProfileActivity().model_dump(exclude_none=True)]
                }
            }
        )

        statement["object"] = DocumentActivity(
            definition=DocumentActivityDefinition(
                name={self.get_locale(): document.title}
            ),
            id=f"uuid://{document.id}",
        ).model_dump(exclude_none=True)

        return statement

    def from_website(self, document, statement, current_site, user):
        """Compute a valid xapi statement in a website context.

        Parameters
        ----------
        document : Type[marsha.core.models.Document]
            The document object used in the xAPI statement

        statement : dictionary
            Statement containing base information to send to the LRS
            An example of expected statement:
            {
                "verb": {
                    "id": "http://adlnet.gov/expapi/verbs/initialized",
                    "display": {
                        "en-US": "initialized"
                    }
                },
            }

        current_site : Type[django.contrib.sites.models.Site]
            The current site used to send the XAPI request

        user: Type[marsha.core.models.User]
            The connected user who sent the XAPI request

        """

        return self._build_statement(
            document, statement, homepage=current_site.domain, user=user
        )

    def from_lti(self, document, statement, jwt_token, course_url=None):
        """Compute a valid xapi download activity statement."""

        statement = self._build_statement(
            document,
            statement,
            homepage=self.get_homepage(document),
            user_id=self.get_user_id(jwt_token),
            username=self.get_username(jwt_token),
        )

        if course_url:
            statement["context"]["contextActivities"].update(
                {
                    "parent": [
                        CourseActivity(id=course_url).model_dump(
                            exclude_none=True
                        )
                    ]
                }
            )

        return statement


class XAPIVideoStatement(XAPIStatementMixin):
    """Object managing statement for video objects."""

    def _get_object(self, video):
        """Return the object xAPI instance for a given video"""
        # When the video is a live we change the activity to webinar
        if video.is_live:
            return WebinarActivity(
                id=f"uuid://{video.id}",
                definition=WebinarActivityDefinition(
                    name={self.get_locale(): video.title}
                ),
            ).model_dump(exclude_none=True)

        return VideoActivity(
            id=f"uuid://{video.id}",
            definition=VideoActivityDefinition(name={self.get_locale(): video.title}),
        ).model_dump(exclude_none=True)

    # pylint: disable=too-many-arguments
    def _build_statement(
        self, video, statement, homepage, user=None, user_id=None, username=None
    ):
        """Build all common properties for a video."""
        if re.match(r"^http(s?):\/\/.*", homepage) is None:
            homepage = f"http://{homepage}"

        statement = self.build_common_statement_properties(
            statement, homepage, user=user, user_id=user_id, username=username
        )

        if statement["verb"]["id"] == "http://id.tincanapi.com/verb/downloaded":
            statement["context"].update(
                {
                    "contextActivities": {
                        "category": [LMSProfileActivity().model_dump(exclude_none=True)]
                    }
                }
            )
        else:
            statement["context"].update(
                {
                    "contextActivities": {
                        "category": [
                            VideoProfileActivity().model_dump(exclude_none=True)
                        ]
                    }
                }
            )

        statement["object"] = self._get_object(video)

        return statement

    def from_website(self, video, statement, current_site, user):
        """Compute a valid xapi statement in a website context.

        Parameters
        ----------
        video : Type[.models/videos]
            The video object used in the xAPI statement

        statement : dictionary
            Statement containing base information to send to the LRS
            An example of expected statement:
            {
                "verb": {
                    "id": "http://adlnet.gov/expapi/verbs/initialized",
                    "display": {
                        "en-US": "initialized"
                    }
                },
                "context": {
                    "extensions": {
                        "https://w3id.org/xapi/video/extensions/volume": 1,
                        "https://w3id.org/xapi/video/extensions/video-playback-size": "640x264",
                    }
                }
            }

        current_site : Type[django.contrib.sites.models.Site]
            The current site used to send the XAPI request

        user: Type[marsha.core.models.User]
            The connected user who sent the XAPI request

        """

        return self._build_statement(
            video, statement, homepage=current_site.domain, user=user
        )

    def from_lti(self, video, statement, jwt_token, course_url=None):
        """Compute a valid xapi statement in an LTI context.

        Parameters
        ----------
        video : Type[.models/videos]
            The video object used in the xAPI statement

        statement : dictionary
            Statement containing base information to send to the LRS
            An example of expected statement:
            {
                "verb": {
                    "id": "http://adlnet.gov/expapi/verbs/initialized",
                    "display": {
                        "en-US": "initialized"
                    }
                },
                "context": {
                    "extensions": {
                        "https://w3id.org/xapi/video/extensions/volume": 1,
                        "https://w3id.org/xapi/video/extensions/video-playback-size": "640x264",
                    }
                }
            }

        jwt_token : Type[rest_framework_simplejwt.tokens.AccessToken]
            A jwt token containing the context used to enrich the xapi statement

        """
        statement = self._build_statement(
            video,
            statement,
            homepage=self.get_homepage(video),
            user_id=self.get_user_id(jwt_token),
            username=self.get_username(jwt_token),
        )

        if course_url:
            statement["context"]["contextActivities"].update(
                {
                    "parent": [
                        CourseActivity(id=course_url).model_dump(
                            exclude_none=True
                        )
                    ]
                }
            )

        return statement


class XAPI:
    """The XAPI object compute statements and send them to a LRS."""

    def __init__(self, url, auth_token, xapi_version="1.0.3"):
        """Initialize the XAPI module.

        Parameters
        ----------
        url: string
            The LRS endpoint to fetch

        auth_token: string
            The basic_auth token used to authenticate on the LRS

        xapi_version: string
            The xAPI version used.

        """
        self.url = url
        self.auth_token = auth_token
        self.xapi_version = xapi_version

    def send(self, xapi_statement):
        """Send the statement to a LRS.

        Parameters
        ----------
        statement : Type[.XAPIStatement]

        """
        headers = {
            "Authorization": self.auth_token,
            "Content-Type": "application/json",
            "X-Experience-API-Version": self.xapi_version,
        }

        response = requests.post(
            self.url,
            json=xapi_statement,
            headers=headers,
            timeout=settings.STAT_BACKEND_TIMEOUT,
        )

        response.raise_for_status()
