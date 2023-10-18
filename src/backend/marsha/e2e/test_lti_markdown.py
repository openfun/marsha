"""e2e tests for Markdown LTI."""

import random
import uuid

from django.test import override_settings

from playwright.sync_api import Page, expect
import pytest
from pytest_django.live_server_helper import LiveServer
from waffle.testutils import override_switch

from marsha.core.tests.testing_utils import generate_passport_and_signed_lti_parameters


@pytest.mark.django_db()
@pytest.fixture(scope="function", autouse=True)
def site_settings(live_server: LiveServer):
    """Override frontend settings."""
    with override_settings(
        CORS_ALLOWED_ORIGINS=[live_server.url],
        FRONTEND_HOME_URL=live_server.url,
    ), override_switch("site", active=True):
        yield


def _preview_markdown(page: Page, live_server: LiveServer):
    """Fill form to open resource in a new page."""
    # uncomment to log requests
    # page.on(
    #     "request",
    #     lambda request: print(">>", request.method, request.url, request.post_data),
    # )
    # page.on("response", lambda response: print("<<", response.status, response.url))

    # uncomment to print console logs
    # page.on("console", lambda msg: print(msg))

    page.set_viewport_size({"width": 1200, "height": 1200})

    markdown_document_id = uuid.uuid4()
    context_id = "sent_lti_context_id"
    passport_attributes = {}

    lti_consumer_parameters = {
        "uuid": str(markdown_document_id),
        "resource_link_id": "example.com-df7",
        "context_id": context_id,
        "roles": random.choice(["instructor", "administrator"]),
        "resource": "markdown-documents",
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
        url=f"{live_server.url}/lti/markdown-documents/{markdown_document_id}",
        lti_parameters=lti_consumer_parameters,
        passport_attributes=passport_attributes,
    )
    page.goto(f"{live_server.url}/development/", wait_until="networkidle")
    lti_resource_page_form = page.query_selector("#lti_resource_page")
    for key, value in lti_parameters.items():
        if key in (
            "custom_component_display_name",
            "lti_version",
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

    return page, markdown_document_id


@override_settings(
    DEBUG=True,
    X_FRAME_OPTIONS="",
)
def test_render(page: Page, live_server: LiveServer, settings) -> None:
    """Test that the markdown is rendered."""
    settings.MARKDOWN_ENABLED = True
    page, _ = _preview_markdown(page, live_server)

    page.get_by_label("Enter title of your course here").fill("my title")
    page.get_by_role("button", name="Create your course").click()

    editor_container = page.get_by_test_id("editor_container")
    editor_container.get_by_role("textbox").click()
    page.keyboard.type("this should be rendered")

    page.get_by_role("tab", name="Preview").click()
    expect(
        page.get_by_test_id("renderer_container").get_by_text("this should be rendered")
    ).to_be_visible()

    page.get_by_role("tab", name="Markdown").click()
    editor_container.get_by_role("textbox").focus()
    page.keyboard.press("Home")
    page.keyboard.type("# ")

    page.get_by_role("tab", name="Preview").click()
    expect(page.get_by_role("heading", name="this should be rendered")).to_be_visible()
    page.get_by_role("button", name="Save").click()
    expect(page.get_by_text("Document is saved")).to_be_visible()
