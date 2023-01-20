"""e2e tests for BBB LTI."""

import json
import random
import uuid

from django.test import override_settings

from playwright.sync_api import Page
import pytest
from pytest_django.live_server_helper import LiveServer
import responses

from marsha.bbb.factories import ClassroomFactory
from marsha.bbb.models import Classroom
from marsha.core.factories import PlaylistFactory
from marsha.core.tests.utils import generate_passport_and_signed_lti_parameters


def _preview_classroom(page: Page, live_server: LiveServer):
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

    classroom_id = uuid.uuid4()
    context_id = "sent_lti_context_id"
    passport_attributes = {}

    lti_consumer_parameters = {
        "uuid": str(classroom_id),
        "resource_link_id": "example.com-df7",
        "context_id": context_id,
        "roles": random.choice(["instructor", "administrator"]),
        "resource": "classrooms",
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
        url=f"{live_server.url}/lti/classrooms/{classroom_id}",
        lti_parameters=lti_consumer_parameters,
        passport_attributes=passport_attributes,
    )
    page.goto(f"{live_server.url}/development/", wait_until="networkidle")
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

    return page, classroom_id


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
def test_lti_select_bbb_enabled(page: Page, live_server: LiveServer, settings):
    """Test LTI select."""
    settings.BBB_ENABLED = True
    settings.CLASSROOM_ENABLED = True

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

    lti_consumer_parameters = {
        "roles": random.choice(["instructor", "administrator"]),
        "content_item_return_url": f"{live_server.url}/development/",
        "context_id": "sent_lti_context_id",
        "lti_message_type": "ContentItemSelectionRequest",
        "lti_version": "LTI-1p0",
        "title": "Sent LMS activity title",
        "text": "Sent LMS activity text",
    }
    lti_parameters, passport = generate_passport_and_signed_lti_parameters(
        url=f"{live_server.url}/lti/select/",
        lti_parameters=lti_consumer_parameters,
    )

    playlist = PlaylistFactory(
        lti_id=lti_parameters.get("context_id"),
        consumer_site=passport.consumer_site,
    )
    classroom = ClassroomFactory(
        playlist=playlist,
    )

    page.goto(f"{live_server.url}/development/", wait_until="networkidle")
    lti_select_form = page.query_selector("#lti_select")
    for key, value in lti_parameters.items():
        if key in ("roles",):
            lti_select_form.query_selector(f'select[name="{key}"]').select_option(value)
        else:
            lti_select_form.query_selector(f'input[name="{key}"]').fill(value)
    page.click('#lti_select input[type="submit"]')

    lti_select_iframe = page.frame("lti_select")

    # Select a classroom
    lti_select_iframe.click('button[role="tab"]:has-text("classrooms")')
    classroom_content_items = (
        json.dumps(
            {
                "@context": "http://purl.imsglobal.org/ctx/lti/v1/ContentItem",
                "@graph": [
                    {
                        "@type": "ContentItem",
                        "url": f"{live_server.url}/lti/classrooms/{classroom.id}",
                        "frame": [],
                        "title": lti_consumer_parameters.get("title"),
                        "text": lti_consumer_parameters.get("text"),
                    }
                ],
            }
        )
        .replace(", ", ",")
        .replace(": ", ":")
    )
    assert classroom_content_items not in lti_select_iframe.content()
    with page.expect_request("**/lti/respond/"):
        lti_select_iframe.click(f'[title="Select {classroom.title}"]')
    lti_select_iframe.wait_for_selector("dd")
    assert classroom_content_items in lti_select_iframe.content()

    # Select a new classroom
    page.click('#lti_select input[type="submit"]')

    lti_select_iframe.click('button[role="tab"]:has-text("Classrooms")')
    sent_title_and_text = (
        f'"title":"{lti_consumer_parameters.get("title")}",'
        f'"text":"{lti_consumer_parameters.get("text")}"'
    )
    assert sent_title_and_text not in lti_select_iframe.content()
    with page.expect_request("**/lti/respond/"):
        lti_select_iframe.click("text=Add a classroom")
    lti_select_iframe.wait_for_selector("dd")

    # assert sent_title_and_text in lti_select_iframe.content()
    # assert Classroom.objects.count() == 1

    # added classroom is created
    assert Classroom.objects.count() == 2
    added_classroom = Classroom.objects.exclude(id=classroom.id).first()
    assert added_classroom.title == lti_consumer_parameters.get("title")
    assert added_classroom.description == lti_consumer_parameters.get("text")
    classroom_content_items = (
        json.dumps(
            {
                "@context": "http://purl.imsglobal.org/ctx/lti/v1/ContentItem",
                "@graph": [
                    {
                        "@type": "ContentItem",
                        "url": f"{live_server}/lti/classrooms/{added_classroom.id}",
                        "frame": [],
                        "title": lti_consumer_parameters.get("title"),
                        "text": lti_consumer_parameters.get("text"),
                    }
                ],
            }
        )
        .replace(", ", ",")
        .replace(": ", ":")
    )
    assert classroom_content_items in lti_select_iframe.content()


@pytest.mark.django_db()
@override_settings(
    DEBUG=True,
    FRONT_UPLOAD_POLL_INTERVAL="1",
    STORAGE_BACKEND="marsha.core.storage.dummy",
    X_FRAME_OPTIONS="",
)
def test_lti_select_bbb_disabled(page: Page, live_server: LiveServer, settings):
    """When BBB flag is disabled, classrooms are not selectable."""
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

    page.goto(f"{live_server.url}/development/", wait_until="networkidle")
    lti_select_form = page.query_selector("#lti_select")
    for key, value in lti_parameters.items():
        if key in ("roles",):
            lti_select_form.query_selector(f'select[name="{key}"]').select_option(value)
        else:
            lti_select_form.query_selector(f'input[name="{key}"]').fill(value)
    page.click('#lti_select input[type="submit"]')

    lti_select_iframe = page.frame("lti_select")

    lti_select_iframe.wait_for_selector(
        "button[role='tab']:has-text('Classrooms')", state="hidden"
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
    """Test LTI BBB classroom create."""
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
            body="BBB classroom joined!",
        ),
    )

    page, _ = _preview_classroom(page, live_server)

    page.fill("text=Title", "Classroom title")
    page.click("text=Launch the classroom now in BBB")
    with page.expect_event("popup") as bbb_classroom_page_info:
        page.click("text=Join classroom")
    bbb_classroom_page = bbb_classroom_page_info.value
    bbb_classroom_page.wait_for_load_state()

    assert "BBB classroom joined!" in bbb_classroom_page.content()
