"""Utils for requesting BBB API"""
import hashlib
import logging
from os.path import splitext

from django.conf import settings

import requests
import xmltodict

from marsha.bbb.models import Classroom, ClassroomRecording
from marsha.core.utils import time_utils


logger = logging.getLogger(__name__)


class ApiMeetingException(Exception):
    """Exception used when a meeting api request fails."""

    def __init__(self, api_response):
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


def request_api(action, parameters, prepare=False, data=None):
    """Perform generic request to BBB API."""
    url = f"{settings.BBB_API_ENDPOINT}/{action}"
    signed_parameters = sign_parameters(action, parameters)
    if prepare:
        request = requests.Request(
            "GET", url, params=signed_parameters, data=data
        ).prepare()
        return {"url": request.url}

    request = requests.request(
        "post" if data else "get",
        url,
        params=signed_parameters,
        data=bytes(data, "utf8") if data else None,
        verify=not settings.DEBUG,
        timeout=settings.BBB_API_TIMEOUT,
        headers={"Content-Type": "application/xml"} if data else None,
    )
    api_response = xmltodict.parse(request.content).get("response")
    if api_response.get("returncode") == "SUCCESS":
        return api_response

    raise ApiMeetingException(api_response)


def get_url(obj):
    """Url of the ClassroomDocument.

    Parameters
    ----------
    obj : Type[models.DepositedFile]
        The classroom document that we want to serialize

    Returns
    -------
    String or None
        the url to fetch the classroom document on CloudFront
        None if the classroom document is still not uploaded to S3 with success

    """
    if obj.uploaded_on is None:
        return None

    extension = ""
    if "." in obj.filename:
        extension = splitext(obj.filename)[1]

    return (
        f"{settings.AWS_S3_URL_PROTOCOL}://{settings.CLOUDFRONT_DOMAIN}/"
        f"{obj.classroom.pk}/classroomdocument/{obj.pk}/"
        f"{time_utils.to_timestamp(obj.uploaded_on)}{extension}"
    )


def create(classroom: Classroom, recording_ready_callback_url: str):
    """Call BBB API to create a meeting."""
    parameters = {
        "meetingID": str(classroom.meeting_id),
        "name": classroom.title,
        "role": "moderator",
        "welcome": classroom.welcome_text,
        "record": settings.BBB_ENABLE_RECORD,
        "meta_bbb-recording-ready-url": recording_ready_callback_url,
    }

    documents = classroom.classroom_documents.filter(upload_state="ready")
    xml = ""
    if documents:
        xml += '<modules><module name="presentation">'
        for document in documents:
            if "pdf" not in document.filename:
                continue
            xml += (
                f'<document url="{get_url(document)}" filename="{document.filename}" '
                f'current="{document.is_default and "true" or "false"}" '
                "/>"
            )
        xml += "</module></modules>"

    api_response = request_api("create", parameters, data=xml)
    if not api_response.get("message"):
        api_response["message"] = "Meeting created."
    classroom.started = True
    classroom.save(update_fields=["started"])
    return api_response


def join(classroom: Classroom, consumer_site_user_id, fullname, moderator=False):
    """Call BBB API to join a meeting."""
    parameters = {
        "fullName": fullname,
        "meetingID": str(classroom.meeting_id),
        "role": "moderator" if moderator else "viewer",
        "userID": consumer_site_user_id,
        "redirect": "true",
    }
    return request_api("join", parameters, prepare=True)


def end(classroom: Classroom):
    """Call BBB API to end a meeting."""
    parameters = {
        "meetingID": str(classroom.meeting_id),
    }
    api_response = request_api("end", parameters)
    classroom.started = False
    classroom.ended = True
    classroom.save(update_fields=["started", "ended"])
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

        classroom.save(update_fields=["started"])
        return api_response
    except ApiMeetingException as exception:
        classroom.started = False
        classroom.save(update_fields=["started"])
        raise exception


def get_recordings(classroom: Classroom, record_id: str = None):
    """Call BBB API to retrieve recordings and update them in the classroom."""
    parameters = {
        "meetingID": classroom.meeting_id,
    }
    if record_id:
        parameters["recordID"] = record_id

    api_response = request_api("getRecordings", parameters)

    # simplify recordings list:
    # - removes attendee level
    # - always wrap attendee into a list
    if api_response.get("recordings"):
        recordings = api_response.get("recordings").get("recording")
        if isinstance(recordings, list):
            api_response["recordings"] = recordings
        else:
            api_response["recordings"] = [recordings]

    return api_response


def process_recording(classroom, recording_data):
    """Creates or update a recording from BBB API."""
    if recording_data.get("published"):
        for recording_format in recording_data.get("playback").get("format"):
            if recording_format.get("type") == "video":
                (classroom_recording, _,) = ClassroomRecording.objects.get_or_create(
                    classroom=classroom,
                    record_id=recording_data.get("recordID"),
                )
                classroom_recording.video_file_url = recording_format.get("url")
                classroom_recording.started_at = time_utils.to_datetime(
                    int(recording_data.get("startTime")) / 1000
                )
                classroom_recording.save(update_fields=["video_file_url", "started_at"])


def process_recordings(classroom, recordings_data, record_id=None):
    """Process recordings for a given classroom."""
    if not recordings_data.get("recordings"):
        logger.info("No recording found.")
        if record_id:
            logger.info("Recording %s not anymore available.", record_id)
            logger.info("Deleting recording %s.", record_id)
            classroom.recordings.filter(record_id=record_id).delete()
        return
    for recording in recordings_data.get("recordings"):
        logger.info("Recording found.")
        process_recording(classroom, recording)
