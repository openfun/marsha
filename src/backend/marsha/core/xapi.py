"""XAPI module."""
import re
import uuid

from django.conf import settings
from django.utils import timezone
from django.utils.translation import to_locale

import requests


def get_xapi_statement(resource):
    """Return the xapi object statement based on the required resource type."""
    if resource == "video":
        return XAPIVideoStatement

    if resource == "document":
        return XAPIDocumentStatement

    raise NotImplementedError


class XAPIStatementMixin:
    """Mixin used by xapi statements."""

    statement = None

    def get_statement(self):
        """Return the enriched statement."""
        return self.statement

    def get_user_id(self, jwt_token):
        """Return the user id if present in the JWT token or the session_is otherwise."""
        return (
            jwt_token.payload["user"].get("id")
            if jwt_token.payload.get("user")
            else jwt_token.payload["session_id"]
        )

    def get_homepage(self, resource):
        """Return the domain associated to the playlist consumer site."""
        return resource.playlist.consumer_site.domain


class XAPIDocumentStatement(XAPIStatementMixin):
    """Object managing statement for document objects."""

    def __init__(self, document, statement, jwt_token):
        """Compute a valid xapi download activity statement."""
        user_id = self.get_user_id(jwt_token)

        homepage = self.get_homepage(document)

        activity_type = "http://id.tincanapi.com/activitytype/document"

        if re.match(r"^http(s?):\/\/.*", homepage) is None:
            homepage = f"http://{homepage}"

        if "id" not in statement:
            statement["id"] = str(uuid.uuid4())

        statement["timestamp"] = timezone.now().isoformat()

        if jwt_token.payload.get("context_id"):
            statement["context"].update(
                {
                    "contextActivities": {
                        "parent": [
                            {
                                "id": jwt_token.payload["context_id"],
                                "objectType": "Activity",
                                "definition": {
                                    "type": "http://adlnet.gov/expapi/activities/course"
                                },
                            }
                        ]
                    }
                }
            )

        statement["actor"] = {
            "objectType": "Agent",
            "account": {"name": user_id, "homePage": homepage},
        }

        statement["object"] = {
            "definition": {
                "type": activity_type,
                "name": {
                    to_locale(settings.LANGUAGE_CODE).replace("_", "-"): document.title
                },
            },
            "id": f"uuid://{document.id}",
            "objectType": "Activity",
        }

        self.statement = statement


class XAPIVideoStatement(XAPIStatementMixin):
    """Object managing statement for video objects."""

    def __init__(self, video, statement, jwt_token):
        """Compute a valid xapi satement.

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
        user_id = self.get_user_id(jwt_token)

        homepage = self.get_homepage(video)

        activity_type = "https://w3id.org/xapi/video/activity-type/video"

        # When the video is a live we change the activity to webinar
        if video.is_live:
            activity_type = "http://id.tincanapi.com/activitytype/webinar"

        if re.match(r"^http(s?):\/\/.*", homepage) is None:
            homepage = f"http://{homepage}"

        if "id" not in statement:
            statement["id"] = str(uuid.uuid4())

        statement["timestamp"] = timezone.now().isoformat()
        statement["context"].update(
            {"contextActivities": {"category": [{"id": "https://w3id.org/xapi/video"}]}}
        )

        if jwt_token.payload.get("context_id"):
            statement["context"]["contextActivities"].update(
                {
                    "parent": [
                        {
                            "id": jwt_token.payload["context_id"],
                            "objectType": "Activity",
                            "definition": {
                                "type": "http://adlnet.gov/expapi/activities/course"
                            },
                        }
                    ]
                }
            )

        statement["actor"] = {
            "objectType": "Agent",
            "account": {"name": user_id, "homePage": homepage},
        }

        statement["object"] = {
            "definition": {
                "type": activity_type,
                "name": {
                    to_locale(settings.LANGUAGE_CODE).replace("_", "-"): video.title
                },
            },
            "id": f"uuid://{video.id}",
            "objectType": "Activity",
        }

        self.statement = statement


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
            json=xapi_statement.get_statement(),
            headers=headers,
            timeout=settings.STAT_BACKEND_TIMEOUT,
        )

        response.raise_for_status()
