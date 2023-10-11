"""Utils for requesting BBB API"""
from datetime import timezone
import hashlib
import json
from json import JSONDecodeError
import logging
from os.path import splitext

from django.conf import settings
from django.utils.timezone import now

from dateutil.parser import parse
import requests
from requests.exceptions import MissingSchema
import xmltodict

from marsha.bbb.models import Classroom, ClassroomRecording, ClassroomSession
from marsha.core.utils import time_utils


logger = logging.getLogger(__name__)


class ApiMeetingException(Exception):
    """Exception used when a meeting api request fails."""

    api_response = None

    def __init__(self, api_response):
        """Extract error message from bbb api response."""
        self.api_response = api_response
        super().__init__(api_response.get("message"))


class MeetingNotFoundException(ApiMeetingException):
    """Exception used when a meeting is not found through api request."""


class GuestPolicyEnum:
    """Enum that specifies the BBB guestPolicy options"""

    ALWAYS_ACCEPT = "ALWAYS_ACCEPT"
    ALWAYS_DENY = "ALWAYS_DENY"
    ASK_MODERATOR = "ASK_MODERATOR"


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
    logger.debug("BBB API response: %s", api_response)
    if api_response.get("returncode") == "SUCCESS":
        return api_response

    if api_response.get("messageKey") == "notFound":
        raise MeetingNotFoundException(api_response)

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


def create(classroom: Classroom, recording_ready_callback_url: str, attempt=0):
    """Call BBB API to create a meeting."""
    parameters = {
        "meetingID": str(classroom.meeting_id),
        "name": classroom.title,
        "role": "moderator",
        "welcome": classroom.welcome_text,
        "meta_bbb-recording-ready-url": recording_ready_callback_url,
        "record": classroom.enable_recordings,
        "guestPolicy": GuestPolicyEnum.ASK_MODERATOR
        if classroom.enable_waiting_room
        else GuestPolicyEnum.ALWAYS_ACCEPT,
        "disabledFeatures": classroom.generate_disabled_features(),
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
    try:
        api_response = request_api("create", parameters, data=xml)
    except ApiMeetingException as error:
        # When a meeting is not correctly closed by BBB, it is not possible
        # to create it again. To fix this issue, we must try to force to end it
        # to be _maybe_ able to create it again
        # See https://github.com/bigbluebutton/bigbluebutton/issues/18913

        attempt += 1
        if error.api_response.get("messageKey") == "internalError" and attempt < 5:
            try:
                end(classroom=classroom)
            except ApiMeetingException:
                pass

            return create(
                classroom=classroom,
                recording_ready_callback_url=recording_ready_callback_url,
                attempt=attempt,
            )

        raise error
    if not api_response.get("message"):
        api_response["message"] = "Meeting created."
    start_session(classroom)
    classroom.started = True
    classroom.ended = False
    classroom.save(update_fields=["started", "ended"])
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


def start_session(classroom: Classroom):
    """Create a session for a given classroom,
    and store cookie and learning analytics url."""
    join_response = join(
        classroom=classroom,
        consumer_site_user_id="marsha",
        fullname="Marsha",
        moderator=True,
    )
    session = requests.Session()
    response = session.get(
        join_response.get("url"), allow_redirects=True, timeout=settings.BBB_API_TIMEOUT
    )
    cookie = json.dumps(session.cookies.get_dict())
    url = response.url.replace(
        "html5client/join", "bigbluebutton/api/learningDashboard"
    )

    classroom.sessions.create(
        started_at=now(),
        ended_at=None,
        cookie=cookie,
        bbb_learning_analytics_url=url,
    )


def update_session_learning_analytics(classroom: Classroom):
    """Update a session for a given classroom, with cookie and learning analytics url."""
    try:
        classroom_session = classroom.sessions.get(ended_at=None)
        if learning_analytics := get_learning_analytics(classroom_session):
            classroom_session.learning_analytics = learning_analytics
            classroom_session.save(update_fields=["learning_analytics"])
    except ClassroomSession.DoesNotExist:
        pass


def end_session(classroom: Classroom):
    """End a session for a given classroom."""
    try:
        classroom_session = classroom.sessions.get(ended_at=None)
        classroom_session.ended_at = now()
        update_fields = ["ended_at"]
        if learning_analytics := get_learning_analytics(classroom_session):
            classroom_session.learning_analytics = learning_analytics
            update_fields.append("learning_analytics")
        classroom_session.save(update_fields=update_fields)
    except ClassroomSession.DoesNotExist:
        pass


def get_learning_analytics(classroom_session: ClassroomSession):
    """Get BBB learning analytics."""
    try:
        logger.debug(
            "Learning analytics url: %s", classroom_session.bbb_learning_analytics_url
        )
        learning_analytics_response = requests.get(
            classroom_session.bbb_learning_analytics_url,
            cookies=json.loads(classroom_session.cookie),
            timeout=settings.BBB_API_TIMEOUT,
        )
        logger.debug(
            "Learning analytics response: %s", learning_analytics_response.content
        )
        logger.debug(
            "Learning analytics response status code: %s",
            learning_analytics_response.status_code,
        )
        if learning_analytics_response.status_code != 200:
            return None
        learning_analytics = (
            learning_analytics_response.json().get("response").get("data")
        )
        return learning_analytics
    except (JSONDecodeError, MissingSchema):
        return None


def end(classroom: Classroom):
    """Call BBB API to end a meeting."""
    parameters = {
        "meetingID": str(classroom.meeting_id),
    }
    end_session(classroom)
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
        update_session_learning_analytics(classroom)

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
    except MeetingNotFoundException as exception:
        end_session(classroom)
        classroom.started = False
        classroom.save(update_fields=["started"])
        raise exception


def get_recordings(meeting_id: str = None, record_id: str = None):
    """Call BBB API to retrieve recordings."""
    parameters = {}
    if meeting_id:
        parameters["meetingID"] = meeting_id
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


def get_recording_url(meeting_id: str = None, record_id: str = None):
    """Look for the video url in the get_recordings response"""
    recordings = get_recordings(meeting_id=meeting_id, record_id=record_id).get(
        "recordings"
    )

    if recordings is not None and recordings[0].get("published"):
        recording = recordings[0]
        for recording_format in recording.get("playback").get("format"):
            if recording_format.get("type") == "video":
                return recording_format.get("url")

    return None


def process_recording(classroom, recording_data):
    """Creates or update a recording from BBB API."""
    if recording_data.get("published"):
        for recording_format in recording_data.get("playback").get("format"):
            if recording_format.get("type") == "video":
                classroom_recording, created = ClassroomRecording.objects.get_or_create(
                    classroom=classroom,
                    record_id=recording_data.get("recordID"),
                )
                classroom_recording.started_at = time_utils.to_datetime(
                    int(recording_data.get("startTime")) / 1000
                )
                classroom_recording.save(update_fields=["started_at"])
                logger.info(
                    "%s recording started at %s with url %s",
                    "Created" if created else "Updated",
                    classroom_recording.started_at.isoformat(),
                    recording_format.get("url"),
                )


def process_recordings(  # pylint: disable=too-many-arguments
    classroom,
    recordings_data,
    record_id=None,
    record_ids_to_skip=None,
    before=None,
    after=None,
):
    """Process recordings for a given classroom."""
    if not recordings_data.get("recordings"):
        logger.info("No recording found.")
        if record_id:
            logger.info("Recording %s not anymore available.", record_id)
            recording = classroom.recordings.filter(
                record_id=record_id, vod__isnull=True
            )
            if recording.count():
                logger.info("Deleting recording %s.", record_id)
                recording.delete()
            else:
                logger.info("Recording %s converted to VOD.", record_id)
        return
    for recording in recordings_data.get("recordings"):
        if record_ids_to_skip and recording.get("recordID") in record_ids_to_skip:
            continue

        recording_started_at = time_utils.to_datetime(
            int(recording.get("startTime")) / 1000
        )
        if before and recording_started_at > parse(before).replace(tzinfo=timezone.utc):
            continue
        if after and recording_started_at < parse(after).replace(tzinfo=timezone.utc):
            continue

        logger.info("Recording %s found.", recording.get("recordID"))
        process_recording(classroom, recording)


def delete_recording(
    classroom_recordings: list[ClassroomRecording],
):
    """Delete a given classroom recording from BBB API."""
    parameters = {
        "recordID": ",".join([x.record_id for x in classroom_recordings]),
    }
    return request_api("deleteRecordings", parameters)
