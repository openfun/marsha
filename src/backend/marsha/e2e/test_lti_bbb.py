"""e2e tests for BBB LTI."""

import json
import random
import uuid

from django.test import override_settings

from playwright.sync_api import Page
import pytest
from pytest_django.live_server_helper import LiveServer
import responses

from marsha.bbb.factories import MeetingFactory
from marsha.core.factories import PlaylistFactory
from marsha.core.tests.utils import generate_passport_and_signed_lti_parameters


def _preview_meeting(page: Page, live_server: LiveServer):
    """Fill form to open resource in a new page."""
    # uncomment to log requests
    # page.on(
    #     "request",
    #     lambda request: print(">>", request.method, request.url, request.post_data),
    # )
    # page.on("response", lambda response: print("<<", response.status, response.url))

    # uncomment to print console logs
    page.on("console", lambda msg: print(msg))

    page.set_viewport_size({"width": 1200, "height": 1200})

    meeting_id = uuid.uuid4()
    context_id = "sent_lti_context_id"
    passport_attributes = {}

    lti_consumer_parameters = {
        "uuid": str(meeting_id),
        "resource_link_id": "example.com-df7",
        "context_id": context_id,
        "roles": random.choice(["instructor", "administrator"]),
        "resource": "meetings",
        "user_id": "56255f3807599c377bf0e5bf072359fd",
        "lis_person_contact_email_primary": "contact@openfun.fr",
        "custom_component_display_name": "LTI Consumer",
        "lti_version": "LTI-1p0",
        "lis_person_sourcedid": "John",
        "lis_person_name_full": "John Doe",
        "lti_message_type": "basic-lti-launch-request",
        "launch_presentation_return_url": "",
        "lis_result_sourcedid": "course-v1%3Aufr%2Bmathematics%2B0001:"
        "example.com-df7b0f2886f04b279854585735a402c4:"
        "56255f3807599c377bf0e5bf072359fd",
        "launch_presentation_locale": "en",
    }
    lti_parameters, _passport = generate_passport_and_signed_lti_parameters(
        url=f"{live_server.url}/lti/meetings/{meeting_id}",
        lti_parameters=lti_consumer_parameters,
        passport_attributes=passport_attributes,
    )
    page.goto(f"{live_server.url}/development/")
    lti_resource_page_form = page.query_selector("#lti_resource_page")
    for key, value in lti_parameters.items():
        if key in (
            "custom_component_display_name",
            "lti_version",
            "lis_person_name_full",
            "lti_message_type",
            "launch_presentation_return_url",
            "lis_result_sourcedid",
            "launch_presentation_locale",
        ):
            continue
        if key in (
            "resource",
            "roles",
        ):
            lti_resource_page_form.query_selector(
                f'select[name="{key}"]'
            ).select_option(value, timeout=100)
        else:
            lti_resource_page_form.query_selector(f'input[name="{key}"]').fill(
                value, timeout=100
            )

    page.click('#lti_resource_page input[type="submit"]')

    return page, meeting_id


# @pytest.fixture
# def mock_meeting_bbb_server(mocker, live_server):
#     """Pytest fixture to easily mock bbb server."""
#     mock_aws_s3_meeting = mocker.patch.object(
#         marsha.bbb.serializers.MeetingSerializer, "get_lti_url", autospec=True
#     )
#     mock_aws_s3_meeting.return_value = (
#         f"{live_server.url}/media/e2e/big_buck_bunny_480p.jpg"
#     )
#
#     with override_settings(
#         DEBUG=True,
#         FRONT_UPLOAD_POLL_INTERVAL="1",
#         STORAGE_BACKEND="marsha.core.storage.dummy",
#         X_FRAME_OPTIONS="",
#     ):
#         yield mock_aws_s3_meeting


@pytest.mark.django_db()
@override_settings(
    DEBUG=True,
    FRONT_UPLOAD_POLL_INTERVAL="1",
    STORAGE_BACKEND="marsha.core.storage.dummy",
    X_FRAME_OPTIONS="",
)
def test_lti_select_bbb_enabled(page: Page, live_server: LiveServer, settings):
    """Test LTI select."""
    settings.BBB_ENABLED = True
    lti_consumer_parameters = {
        "roles": random.choice(["instructor", "administrator"]),
        "content_item_return_url": f"{live_server.url}/development/",
        "context_id": "sent_lti_context_id",
        "lti_message_type": "ContentItemSelectionRequest",
        "lti_version": "LTI-1p0",
    }
    lti_parameters, passport = generate_passport_and_signed_lti_parameters(
        url=f"{live_server.url}/lti/select/",
        lti_parameters=lti_consumer_parameters,
    )

    playlist = PlaylistFactory(
        lti_id=lti_parameters.get("context_id"),
        consumer_site=passport.consumer_site,
    )
    meeting = MeetingFactory(
        playlist=playlist,
    )

    page.goto(f"{live_server.url}/development/")
    lti_select_form = page.query_selector("#lti_select")
    for key, value in lti_parameters.items():
        if key in ("roles",):
            lti_select_form.query_selector(f'select[name="{key}"]').select_option(value)
        else:
            lti_select_form.query_selector(f'input[name="{key}"]').fill(value)
    page.click('#lti_select input[type="submit"]')

    lti_select_iframe = page.frame("lti_select")

    # Select a meeting
    lti_select_iframe.click('button[role="tab"]:has-text("Meetings")')
    meeting_content_items = (
        json.dumps(
            {
                "@context": "http://purl.imsglobal.org/ctx/lti/v1/ContentItem",
                "@graph": [
                    {
                        "@type": "ContentItem",
                        "url": f"{live_server.url}/lti/meetings/{meeting.id}",
                        "title": f"{meeting.title}",
                        "frame": [],
                    }
                ],
            }
        )
        .replace(", ", ",")
        .replace(": ", ":")
    )
    assert meeting_content_items not in lti_select_iframe.content()
    with page.expect_request("**/lti/respond/"):
        lti_select_iframe.click(f'[title="Select {meeting.title}"]')
    lti_select_iframe.wait_for_selector("dd")
    assert meeting_content_items in lti_select_iframe.content()


@pytest.mark.django_db()
@override_settings(
    DEBUG=True,
    FRONT_UPLOAD_POLL_INTERVAL="1",
    STORAGE_BACKEND="marsha.core.storage.dummy",
    X_FRAME_OPTIONS="",
)
def test_lti_select_bbb_disabled(page: Page, live_server: LiveServer, settings):
    """When BBB flag is disabled, meetings are not selectable."""
    settings.BBB_ENABLED = False
    lti_consumer_parameters = {
        "roles": random.choice(["instructor", "administrator"]),
        "content_item_return_url": f"{live_server.url}/development/",
        "context_id": "sent_lti_context_id",
        "lti_message_type": "ContentItemSelectionRequest",
        "lti_version": "LTI-1p0",
    }
    lti_parameters, passport = generate_passport_and_signed_lti_parameters(
        url=f"{live_server.url}/lti/select/",
        lti_parameters=lti_consumer_parameters,
    )

    page.goto(f"{live_server.url}/development/")
    lti_select_form = page.query_selector("#lti_select")
    for key, value in lti_parameters.items():
        if key in ("roles",):
            lti_select_form.query_selector(f'select[name="{key}"]').select_option(value)
        else:
            lti_select_form.query_selector(f'input[name="{key}"]').fill(value)
    page.click('#lti_select input[type="submit"]')

    lti_select_iframe = page.frame("lti_select")

    lti_select_iframe.wait_for_selector(
        "button[role='tab']:has-text('Meetings')", state="hidden"
    )


@responses.activate
@pytest.mark.django_db()
@override_settings(
    DEBUG=True,
    FRONT_UPLOAD_POLL_INTERVAL="1",
    STORAGE_BACKEND="marsha.core.storage.dummy",
    X_FRAME_OPTIONS="",
    BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api",
    BBB_API_SECRET="SuperSecret",
)
def test_lti_bbb_create_enabled(page: Page, live_server: LiveServer, settings):
    """Test LTI BBB meeting create."""
    settings.BBB_ENABLED = True

    # Backend requests mocking
    responses.add(
        responses.GET,
        "https://10.7.7.1/bigbluebutton/api/create",
        body="""<response>
            <returncode>SUCCESS</returncode>
            <meetingID>12345</meetingID>
            <internalMeetingID>232a8ab5dbfde4d33a2bd9d5bbc08bd74d04e163-1628693645640</internalMeetingID>
            <parentMeetingID>bbb-none</parentMeetingID>
            <attendeePW>9#R1kuUl3R</attendeePW>
            <moderatorPW>0$C7Aaz0o</moderatorPW>
            <createTime>1628693645640</createTime>
            <voiceBridge>83267</voiceBridge>
            <dialNumber>613-555-1234</dialNumber>
            <createDate>Wed Aug 11 14:54:05 UTC 2021</createDate>
            <hasUserJoined>false</hasUserJoined>
            <duration>0</duration>
            <hasBeenForciblyEnded>false</hasBeenForciblyEnded>
            <messageKey></messageKey>
            <message></message>
        </response>
        """,
        status=200,
    )
    responses.add(
        responses.GET,
        "https://10.7.7.1/bigbluebutton/api/getMeetingInfo",
        body="""<response>
            <returncode>FAILED</returncode>
            <messageKey>notFound</messageKey>
            <message>We could not find a meeting with that meeting ID</message>
        </response>
        """,
        status=200,
    )
    responses.add(
        responses.GET,
        "https://10.7.7.1/bigbluebutton/api/join",
        body="""
        <response>
            <returncode>SUCCESS</returncode>
            <messageKey>successfullyJoined</messageKey>
            <message>You have joined successfully.</message>
            <meeting_id>74f4b5fefa00d05889a9095d1c81c51f704a74c0-1632323106549</meeting_id>
            <user_id>w_cmlgpuqzkqez</user_id>
            <auth_token>pcwfqes0ugkb</auth_token>
            <session_token>4vtuguoqsolsqkqi</session_token>
            <guestStatus>ALLOW</guestStatus>
            <url>https://10.7.7.1/html5client/join?sessionToken=4vtuguoqsolsqkqi</url>
        </response>
        """,
        status=200,
    )

    # Frontend requests mocking
    page.context.route(
        "https://10.7.7.1/bigbluebutton/api/join*",
        lambda route: route.fulfill(
            status=200,
            body="BBB meeting joined!",
        ),
    )

    page, _ = _preview_meeting(page, live_server)

    page.click("text=Create meeting in BBB")
    with page.expect_event("popup") as bbb_meeting_page_info:
        page.click("text=Join meeting")
    bbb_meeting_page = bbb_meeting_page_info.value
    bbb_meeting_page.wait_for_load_state()

    assert "BBB meeting joined!" in bbb_meeting_page.content()
