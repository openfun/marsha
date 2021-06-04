"""XAPI module."""
import re
import uuid

from django.conf import settings
from django.utils import timezone
from django.utils.translation import to_locale

import requests


class XAPIStatement:
    """Object to work on a XAPI Statement."""

    statement = None

    def __init__(self, video, statement, lti_user):
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

        lti_user : Type[lti.LTIUser]
            Object representing data stored in the JWT Token and related to the user authenticated
            with LTI

        """
        try:
            user_id = lti_user.user.get("id")
        except AttributeError:
            user_id = lti_user.session_id

        homepage = video.playlist.consumer_site.domain

        if re.match(r"^http(s?):\/\/.*", homepage) is None:
            homepage = f"http://{homepage}"

        if "id" not in statement:
            statement["id"] = str(uuid.uuid4())

        statement["timestamp"] = timezone.now().isoformat()
        statement["context"].update(
            {"contextActivities": {"category": [{"id": "https://w3id.org/xapi/video"}]}}
        )

        statement["actor"] = {
            "objectType": "Agent",
            "account": {"name": user_id, "homePage": homepage},
        }

        statement["object"] = {
            "definition": {
                "type": "https://w3id.org/xapi/video/activity-type/video",
                "name": {
                    to_locale(settings.LANGUAGE_CODE).replace("_", "-"): video.title
                },
            },
            "id": "uuid://{id}".format(id=str(video.id)),
            "objectType": "Activity",
        }

        object_extensions = {}
        if lti_user.course.get("school_name") is not None:
            object_extensions[
                "https://w3id.org/xapi/acrossx/extensions/school"
            ] = lti_user.course["school_name"]

        if lti_user.course.get("course_name") is not None:
            object_extensions[
                "http://adlnet.gov/expapi/activities/course"
            ] = lti_user.course["course_name"]

        if lti_user.course.get("course_run") is not None:
            object_extensions[
                "http://adlnet.gov/expapi/activities/module"
            ] = lti_user.course["course_run"]

        if object_extensions:
            statement["object"]["definition"]["extensions"] = object_extensions

        self.statement = statement

    def get_statement(self):
        """Return the enriched statement."""
        return self.statement


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
            self.url, json=xapi_statement.get_statement(), headers=headers
        )

        response.raise_for_status()
