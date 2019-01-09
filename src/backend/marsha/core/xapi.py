"""XAPI module."""
import re
import uuid

import requests


class XAPI:
    """The LTI object abstracts an LTI launch request."""

    def __init__(self, url, auth_token, xapi_version):
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

    def send(self, video, statement, lti_user):
        """Send the statement to a LRS.

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

        lti_user : .lti.LTIUser
            Object representing data stored in the JWT Token and related to the user authenticated
            with LTI

        """
        enrich_statement = self._enrich_statement(statement, video, lti_user)
        headers = {
            "Authorization": self.auth_token,
            "Content-Type": "application/json",
            "X-Experience-API-Version": self.xapi_version,
        }

        response = requests.post(self.url, json=enrich_statement, headers=headers)

        response.raise_for_status()

    # pylint: disable=missing-param-doc,missing-type-doc
    def _enrich_statement(self, statement, video, lti_user):
        """Add additionnal information to the existing statement."""
        try:
            user_id = lti_user.user_id
        except AttributeError:
            raise MissingUserIdError()

        homepage = video.playlist.consumer_site.domain

        if re.match(r"^http(s?):\/\/.*", homepage) is None:
            homepage = f"http://{homepage}"

        if "id" not in statement:
            statement["id"] = str(uuid.uuid4())

        statement["timestamp"] = statement["timestamp"].isoformat()

        statement["context"].update(
            {"contextActivities": {"category": [{"id": "https://w3id.org/xapi/video"}]}}
        )

        statement["actor"] = {
            "objectType": "Agent",
            "account": {"name": user_id, "homePage": homepage},
        }

        statement["object"] = {
            "definition": {"type": "https://w3id.org/xapi/video/activity-type/video"},
            "id": "uuid://{id}".format(id=str(video.id)),
            "objectType": "Activity",
        }

        object_extensions = {}
        if lti_user.course["school_name"] is not None:
            object_extensions[
                "https://w3id.org/xapi/acrossx/extensions/school"
            ] = lti_user.course["school_name"]

        if lti_user.course["course_name"] is not None:
            object_extensions[
                "http://adlnet.gov/expapi/activities/course"
            ] = lti_user.course["course_name"]

        if lti_user.course["course_section"] is not None:
            object_extensions[
                "http://adlnet.gov/expapi/activities/module"
            ] = lti_user.course["course_section"]

        if object_extensions:
            statement["object"]["definition"]["extensions"] = object_extensions

        return statement


class MissingUserIdError(Exception):
    """Error raised if the user_id is missing when enriching xAPI statement."""

    pass
