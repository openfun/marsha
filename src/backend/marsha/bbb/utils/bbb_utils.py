"""Utils for requesting BBB API"""

import hashlib
import logging

from django.conf import settings

import requests
import xmltodict

from marsha.bbb.models import Meeting


logger = logging.getLogger(__name__)


class ApiMeetingException(Exception):
    """Exception used when a meeting api request fails."""

    def __init__(self, api_response):
        """Extract error message from bbb api response."""
        super().__init__(api_response.get("message"))


def _password(meeting: Meeting, moderator=False):
    """Return password for moderator or attendee."""
    if moderator:
        return meeting.moderator_password
    return meeting.attendee_password


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


def create(meeting: Meeting):
    """Call BBB API to create a meeting."""
    parameters = {
        "meetingID": str(meeting.meeting_id),
        "name": meeting.title,
        "attendeePW": meeting.attendee_password,
        "moderatorPW": meeting.moderator_password,
        "welcome": meeting.welcome_text,
    }

    api_response = request_api("create", parameters)
    if not api_response.get("message"):
        api_response["message"] = "Meeting created."
    meeting.started = True
    meeting.moderator_password = api_response["moderatorPW"]
    meeting.attendee_password = api_response["attendeePW"]
    meeting.save()
    return api_response


def join(meeting: Meeting, consumer_site_user_id, fullname, moderator=False):
    """Call BBB API to join a meeting."""
    parameters = {
        "fullName": fullname,
        "meetingID": str(meeting.meeting_id),
        "password": _password(meeting, moderator),
        "userID": consumer_site_user_id,
        "redirect": "true",
    }
    return request_api("join", parameters, prepare=True)


def end(meeting: Meeting, moderator=False):
    """Call BBB API to end a meeting."""
    parameters = {
        "meetingID": str(meeting.meeting_id),
        "password": _password(meeting, moderator),
    }
    api_response = request_api("end", parameters)
    meeting.started = False
    meeting.ended = True
    meeting.save()
    return api_response


def get_meeting_infos(meeting: Meeting):
    """Call BBB API to retrieve meeting informations."""
    parameters = {
        "meetingID": meeting.meeting_id,
    }
    try:
        api_response = request_api("getMeetingInfo", parameters)
        meeting.started = api_response["returncode"] == "SUCCESS"

        # simplify attendees list:
        # - removes attendee level
        # - always wrap attendee into a list
        if api_response.get("attendees"):
            attendees = api_response.get("attendees").get("attendee")
            if isinstance(attendees, list):
                api_response["attendees"] = attendees
            else:
                api_response["attendees"] = [attendees]

        meeting.save()
        return api_response
    except ApiMeetingException as exception:
        meeting.started = False
        meeting.save()
        raise exception
