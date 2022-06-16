"""Utils for requesting BBB API"""

import hashlib
import logging

from django.conf import settings

import requests
import xmltodict

from marsha.bbb.models import Classroom


logger = logging.getLogger(__name__)


class ApiMeetingException(Exception):
    """Exception used when a meeting api request fails."""

    def __init__(self, api_response):
        """Extract error message from bbb api response."""
        super().__init__(api_response.get("message"))


def _password(classroom: Classroom, moderator=False):
    """Return password for moderator or attendee."""
    if moderator:
        return classroom.moderator_password
    return classroom.attendee_password


def sign_parameters(action, parameters):
    """Add a checksum to parameters."""
    request = requests.Request(
        "GET", f"{settings.BBB_API_ENDPOINT}/{action}", params=parameters
    )
    prepared_request = request.prepare()
    checksum_data = (
        prepared_request.url.replace("?", "").replace(
            settings.BBB_API_ENDPOINT + "/", ""
        )
        + settings.BBB_API_SECRET
    )
    parameters["checksum"] = hashlib.sha1(  # nosec
        checksum_data.encode("utf-8")
    ).hexdigest()
    return parameters


def request_api(action, parameters, prepare=False):
    """Perform generic get request to BBB API."""
    url = f"{settings.BBB_API_ENDPOINT}/{action}"
    signed_parameters = sign_parameters(action, parameters)
    logger.debug(">>>bbb api request action %s", action)
    logger.debug(signed_parameters)
    if prepare:
        request = requests.Request("GET", url, params=signed_parameters).prepare()
        return {"url": request.url}

    request = requests.get(
        url,
        params=signed_parameters,
        # bypass cert verification if debug is enabled
        verify=not settings.DEBUG,
    )
    logger.debug(request.content)
    api_response = xmltodict.parse(request.content).get("response")
    logger.debug(api_response)
    if api_response.get("returncode") == "SUCCESS":
        return api_response

    raise ApiMeetingException(api_response)


def create(classroom: Classroom):
    """Call BBB API to create a meeting."""
    parameters = {
        "meetingID": str(classroom.meeting_id),
        "name": classroom.title,
        "attendeePW": classroom.attendee_password,
        "moderatorPW": classroom.moderator_password,
        "welcome": classroom.welcome_text,
    }

    api_response = request_api("create", parameters)
    if not api_response.get("message"):
        api_response["message"] = "Meeting created."
    classroom.started = True
    classroom.moderator_password = api_response["moderatorPW"]
    classroom.attendee_password = api_response["attendeePW"]
    classroom.save()
    return api_response


def join(classroom: Classroom, consumer_site_user_id, fullname, moderator=False):
    """Call BBB API to join a meeting."""
    parameters = {
        "fullName": fullname,
        "meetingID": str(classroom.meeting_id),
        "password": _password(classroom, moderator),
        "userID": consumer_site_user_id,
        "redirect": "true",
    }
    return request_api("join", parameters, prepare=True)


def end(classroom: Classroom, moderator=False):
    """Call BBB API to end a meeting."""
    parameters = {
        "meetingID": str(classroom.meeting_id),
        "password": _password(classroom, moderator),
    }
    api_response = request_api("end", parameters)
    classroom.started = False
    classroom.ended = True
    classroom.save()
    return api_response


def get_meeting_infos(classroom: Classroom):
    """Call BBB API to retrieve meeting information."""
    parameters = {
        "meetingID": classroom.meeting_id,
    }
    try:
        api_response = request_api("getMeetingInfo", parameters)
        classroom.started = api_response["returncode"] == "SUCCESS"

        # simplify attendees list:
        # - removes attendee level
        # - always wrap attendee into a list
        if api_response.get("attendees"):
            attendees = api_response.get("attendees").get("attendee")
            if isinstance(attendees, list):
                api_response["attendees"] = attendees
            else:
                api_response["attendees"] = [attendees]

        classroom.save()
        return api_response
    except ApiMeetingException as exception:
        classroom.started = False
        classroom.save()
        raise exception
