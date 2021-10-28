"""Utils for requesting BBB API"""

import hashlib
import logging

from django.conf import settings

import requests
import xmltodict


logger = logging.getLogger(__name__)


class ApiMeetingException(Exception):
    """Exception used when a meeting api request fails."""

    def __init__(meeting, api_response):
        """Extract error message from bbb api response."""
        super().__init__(api_response.get("message"))


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


def request_bbb_api(action, parameters, prepare=False):
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


def bbb_api_create(meeting):
    """Call BBB API to create a meeting."""
    parameters = {
        "meetingID": str(meeting.meeting_id),
        "name": meeting.title,
        "attendeePW": meeting.attendee_password,
        "moderatorPW": meeting.moderator_password,
        "welcome": meeting.welcome_text,
    }

    api_response = request_bbb_api("create", parameters)
    if not api_response.get("message"):
        api_response["message"] = "Meeting created."
    return api_response


def bbb_api_end(meeting, moderator=False):
    """Call BBB API to end a meeting."""
    password = meeting.attendee_password
    if moderator:
        password = meeting.moderator_password
    parameters = {
        "meetingID": str(meeting.meeting_id),
        "password": password,
    }
    return request_bbb_api("end", parameters)


def bbb_api_join(meeting, fullname, moderator=False):
    """Call BBB API to join a meeting."""
    password = meeting.attendee_password
    if moderator:
        password = meeting.moderator_password
    parameters = {
        "fullName": fullname,
        "meetingID": str(meeting.meeting_id),
        "password": password,
        "redirect": "true",
    }
    return request_bbb_api("join", parameters, prepare=True)


def bbb_api_get_meeting_infos(meeting):
    """Call BBB API to retrieve meeting informations."""
    parameters = {
        "meetingID": meeting.meeting_id,
    }
    return request_bbb_api("getMeetingInfo", parameters)
