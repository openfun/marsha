"""e2e tests for LTI."""

import json
import random
import uuid

from django.conf import settings
from django.test import override_settings
from django.utils import timezone

from playwright.sync_api import Page, Request
import pytest
from pytest_django.live_server_helper import LiveServer

from marsha.core.defaults import READY
from marsha.core.factories import DocumentFactory, PlaylistFactory, VideoFactory
from marsha.core.models import Video
from marsha.core.tests.utils import generate_passport_and_signed_lti_parameters
import marsha.core.views


def _preview_video(live_server, page, video_uploaded=False):
    """Fill form to open video in a new page."""
    # uncomment to log requests
    # page.on(
    #     "request",
    #     lambda request: print(">>", request.method, request.url, request.post_data),
    # )
    # page.on("response", lambda response: print("<<", response.status, response.url))

    # uncomment to print console logs
    # page.on("console", lambda msg: print(msg.text))

    page.set_viewport_size({"width": 1200, "height": 1200})

    resource_id = uuid.uuid4()
    context_id = "sent_lti_context_id"
    passport_attributes = {}
    video = None

    if video_uploaded:
        video = VideoFactory(
            uploaded_on=timezone.now(),
            resolutions=settings.VIDEO_RESOLUTIONS,
            upload_state=READY,
        )
        resource_id = video.id
        context_id = video.playlist.lti_id
        passport_attributes = {"consumer_site": video.playlist.consumer_site}

    lti_consumer_parameters = {
        "uuid": str(resource_id),
        "resource_link_id": "example.com-df7",
        "context_id": context_id,
        "roles": random.choice(["instructor", "administrator"]),
        "resource": "videos",
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
        url=f"{live_server.url}/lti/videos/{resource_id}",
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
            ).select_option(value, timeout=300)
        else:
            lti_resource_page_form.query_selector(f'input[name="{key}"]').fill(
                value, timeout=300
            )
    page.click('#lti_resource_page input[type="submit"]')

    if not video_uploaded:
        page.wait_for_selector("text=What are you willing to do ?")
    return page, video


def _preview_document(live_server, page, document_uploaded=False):
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

    resource_id = uuid.uuid4()
    context_id = "sent_lti_context_id"
    passport_attributes = {}
    document = None

    if document_uploaded:
        document = DocumentFactory(
            uploaded_on=timezone.now(),
            upload_state=READY,
        )
        resource_id = document.id
        context_id = document.playlist.lti_id
        passport_attributes = {"consumer_site": document.playlist.consumer_site}

    lti_consumer_parameters = {
        "uuid": str(resource_id),
        "resource_link_id": "example.com-df7",
        "context_id": context_id,
        "roles": random.choice(["instructor", "administrator"]),
        "resource": "documents",
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
        url=f"{live_server.url}/lti/documents/{resource_id}",
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

    if not document_uploaded:
        page.wait_for_selector("text=There is currently no document to display.")
    return page, document


@pytest.fixture
def mock_video_cloud_storage(mocker, live_server):
    """Pytest fixture to easily mock s3 upload."""
    mock_aws_s3_video = mocker.patch.object(
        marsha.core.serializers.VideoBaseSerializer, "get_urls", autospec=True
    )
    video_s3_id = "1622122634"
    media_path = f"{live_server.url}/media/e2e"

    mock_aws_s3_video.return_value = {
        "manifests": {
            "hls": f"{media_path}/cmaf/{video_s3_id}.m3u8",
        },
        "mp4": {
            resolution: f"{media_path}/mp4/{video_s3_id}_{resolution}.mp4"
            for resolution in settings.VIDEO_RESOLUTIONS
        },
        "thumbnails": {
            resolution: f"{media_path}/thumbnails/{video_s3_id}_{resolution}.0000000.jpg"
            for resolution in settings.VIDEO_RESOLUTIONS
        },
    }

    with override_settings(
        DEBUG=True,
        FRONT_UPLOAD_POLL_INTERVAL="1",
        STORAGE_BACKEND="marsha.core.storage.dummy",
        X_FRAME_OPTIONS="",
    ):
        yield mock_aws_s3_video


@pytest.fixture
def mock_document_cloud_storage(mocker, live_server):
    """Pytest fixture to easily mock s3 upload."""
    mock_aws_s3_document = mocker.patch.object(
        marsha.core.serializers.DocumentSerializer, "get_url", autospec=True
    )
    mock_aws_s3_document.return_value = (
        f"{live_server.url}/media/e2e/big_buck_bunny_480p.jpg"
    )

    with override_settings(
        DEBUG=True,
        FRONT_UPLOAD_POLL_INTERVAL="1",
        STORAGE_BACKEND="marsha.core.storage.dummy",
        X_FRAME_OPTIONS="",
    ):
        yield mock_aws_s3_document


@pytest.mark.django_db()
@pytest.mark.usefixtures("mock_video_cloud_storage")
def test_lti_select_title_text(page: Page, live_server: LiveServer):
    """Test LTI select."""
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

    resolutions = [144]
    playlist = PlaylistFactory(
        lti_id=lti_parameters.get("context_id"),
        consumer_site=passport.consumer_site,
    )
    video = VideoFactory(
        playlist=playlist,
        uploaded_on=timezone.now(),
        resolutions=resolutions,
    )
    document = DocumentFactory(
        description="Document description",
        playlist=playlist,
        uploaded_on=timezone.now(),
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

    # Select a document
    lti_select_iframe.click('button[role="tab"]:has-text("Documents")')
    # Use send text in the response to fill the activity text
    document_content_items = (
        json.dumps(
            {
                "@context": "http://purl.imsglobal.org/ctx/lti/v1/ContentItem",
                "@graph": [
                    {
                        "@type": "ContentItem",
                        "url": f"{live_server.url}/lti/documents/{document.id}",
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
    assert document_content_items not in lti_select_iframe.content()
    with page.expect_request("**/lti/respond/"):
        lti_select_iframe.click(f'[title="Select {document.title}"]')
    lti_select_iframe.wait_for_selector("dd")
    assert document_content_items in lti_select_iframe.content()

    # Select a video
    page.click('#lti_select input[type="submit"]')
    lti_select_iframe.click('button[role="tab"]:has-text("Videos")')
    # Use send text in the response to fill the activity text
    video_content_items = (
        json.dumps(
            {
                "@context": "http://purl.imsglobal.org/ctx/lti/v1/ContentItem",
                "@graph": [
                    {
                        "@type": "ContentItem",
                        "url": f"{live_server}/lti/videos/{video.id}",
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
    assert video_content_items not in lti_select_iframe.content()
    with page.expect_request("**/lti/respond/"):
        lti_select_iframe.click(f'[title="Select {video.title}"]')
    lti_select_iframe.wait_for_selector("dd")
    assert video_content_items in lti_select_iframe.content()
    assert Video.objects.count() == 1

    # Select a new video
    page.click('#lti_select input[type="submit"]')
    lti_select_iframe.click('button[role="tab"]:has-text("Videos")')
    sent_title_and_text = (
        f'"title":"{lti_consumer_parameters.get("title")}",'
        f'"text":"{lti_consumer_parameters.get("text")}"'
    )
    assert sent_title_and_text not in lti_select_iframe.content()
    with page.expect_request("**/lti/respond/"):
        lti_select_iframe.click("text=Add a video")
    lti_select_iframe.wait_for_selector("dd")

    # added video is created
    assert Video.objects.count() == 2
    added_video = Video.objects.exclude(id=video.id).first()
    assert added_video.title == lti_consumer_parameters.get("title")
    assert added_video.description == lti_consumer_parameters.get("text")
    # Use send text in the response to fill the activity text
    video_content_items = (
        json.dumps(
            {
                "@context": "http://purl.imsglobal.org/ctx/lti/v1/ContentItem",
                "@graph": [
                    {
                        "@type": "ContentItem",
                        "url": f"{live_server}/lti/videos/{added_video.id}",
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
    assert video_content_items in lti_select_iframe.content()


@pytest.mark.django_db()
@pytest.mark.usefixtures("mock_video_cloud_storage")
@override_settings(LTI_CONFIG_TITLE="Marsha")
def test_lti_select_title_no_text(page: Page, live_server: LiveServer):
    """When the request has a title and an empty text,
    don't use the text in the created resource."""
    lti_consumer_parameters = {
        "roles": random.choice(["instructor", "administrator"]),
        "content_item_return_url": f"{live_server.url}/development/",
        "context_id": "sent_lti_context_id",
        "lti_message_type": "ContentItemSelectionRequest",
        "lti_version": "LTI-1p0",
        "title": "Sent LMS activity title",
        "text": "",
    }
    lti_parameters, passport = generate_passport_and_signed_lti_parameters(
        url=f"{live_server.url}/lti/select/",
        lti_parameters=lti_consumer_parameters,
    )

    resolutions = [144]
    playlist = PlaylistFactory(
        lti_id=lti_parameters.get("context_id"),
        consumer_site=passport.consumer_site,
    )
    video = VideoFactory(
        playlist=playlist,
        uploaded_on=timezone.now(),
        resolutions=resolutions,
    )
    document = DocumentFactory(
        description="Document description",
        playlist=playlist,
        uploaded_on=timezone.now(),
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

    # Select a document
    lti_select_iframe.click('button[role="tab"]:has-text("Documents")')
    # Use the document description in the response to fill the activity text
    document_content_items = (
        json.dumps(
            {
                "@context": "http://purl.imsglobal.org/ctx/lti/v1/ContentItem",
                "@graph": [
                    {
                        "@type": "ContentItem",
                        "url": f"{live_server.url}/lti/documents/{document.id}",
                        "frame": [],
                        "title": lti_consumer_parameters.get("title"),
                        "text": document.description,
                    }
                ],
            }
        )
        .replace(", ", ",")
        .replace(": ", ":")
    )
    assert document_content_items not in lti_select_iframe.content()
    with page.expect_request("**/lti/respond/"):
        lti_select_iframe.click(f'[title="Select {document.title}"]')
    lti_select_iframe.wait_for_selector("dd")
    assert document_content_items in lti_select_iframe.content()

    # Select a video
    page.click('#lti_select input[type="submit"]')
    lti_select_iframe.click('button[role="tab"]:has-text("Videos")')
    # Use the video description in the response to fill the activity text
    video_content_items = (
        json.dumps(
            {
                "@context": "http://purl.imsglobal.org/ctx/lti/v1/ContentItem",
                "@graph": [
                    {
                        "@type": "ContentItem",
                        "url": f"{live_server}/lti/videos/{video.id}",
                        "frame": [],
                        "title": lti_consumer_parameters.get("title"),
                        "text": video.description,
                    }
                ],
            }
        )
        .replace(", ", ",")
        .replace(": ", ":")
    )
    assert video_content_items not in lti_select_iframe.content()
    with page.expect_request("**/lti/respond/"):
        lti_select_iframe.click(f'[title="Select {video.title}"]')
    lti_select_iframe.wait_for_selector("dd")
    assert video_content_items in lti_select_iframe.content()
    assert Video.objects.count() == 1

    # Select a new video
    page.click('#lti_select input[type="submit"]')
    lti_select_iframe.click('button[role="tab"]:has-text("Videos")')
    sent_title = f'"title":"{lti_consumer_parameters.get("title")}"'
    assert sent_title not in lti_select_iframe.content()
    with page.expect_request("**/lti/respond/"):
        lti_select_iframe.click("text=Add a video")
    lti_select_iframe.wait_for_selector("dd")

    # added video is created
    assert Video.objects.count() == 2
    added_video = Video.objects.exclude(id=video.id).first()
    assert added_video.title == lti_consumer_parameters.get("title")
    assert added_video.description == lti_consumer_parameters.get("text")
    # Don't send text in the response
    video_content_items = (
        json.dumps(
            {
                "@context": "http://purl.imsglobal.org/ctx/lti/v1/ContentItem",
                "@graph": [
                    {
                        "@type": "ContentItem",
                        "url": f"{live_server}/lti/videos/{added_video.id}",
                        "frame": [],
                        "title": lti_consumer_parameters.get("title"),
                    }
                ],
            }
        )
        .replace(", ", ",")
        .replace(": ", ":")
    )
    assert video_content_items in lti_select_iframe.content()


@pytest.mark.django_db()
@pytest.mark.usefixtures("mock_video_cloud_storage")
@override_settings(LTI_CONFIG_TITLE="Marsha")
def test_lti_select_default_title_no_text(page: Page, live_server: LiveServer):
    """When the request has a default title don't use it in the created resource,
    and send the ressource title in the LTI response."""
    lti_consumer_parameters = {
        "roles": random.choice(["instructor", "administrator"]),
        "content_item_return_url": f"{live_server.url}/development/",
        "context_id": "sent_lti_context_id",
        "lti_message_type": "ContentItemSelectionRequest",
        "lti_version": "LTI-1p0",
        "title": settings.LTI_CONFIG_TITLE,
        "text": "",
    }
    lti_parameters, passport = generate_passport_and_signed_lti_parameters(
        url=f"{live_server.url}/lti/select/",
        lti_parameters=lti_consumer_parameters,
    )

    resolutions = [144]
    playlist = PlaylistFactory(
        lti_id=lti_parameters.get("context_id"),
        consumer_site=passport.consumer_site,
    )
    video = VideoFactory(
        playlist=playlist,
        uploaded_on=timezone.now(),
        resolutions=resolutions,
    )
    document = DocumentFactory(
        description="Document description",
        playlist=playlist,
        uploaded_on=timezone.now(),
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

    # Select a document
    lti_select_iframe.click('button[role="tab"]:has-text("Documents")')
    # Use the document title and description in the response to fill the activity title and text
    document_content_items = (
        json.dumps(
            {
                "@context": "http://purl.imsglobal.org/ctx/lti/v1/ContentItem",
                "@graph": [
                    {
                        "@type": "ContentItem",
                        "url": f"{live_server.url}/lti/documents/{document.id}",
                        "frame": [],
                        "title": document.title,
                        "text": document.description,
                    }
                ],
            }
        )
        .replace(", ", ",")
        .replace(": ", ":")
    )
    assert document_content_items not in lti_select_iframe.content()
    with page.expect_request("**/lti/respond/"):
        lti_select_iframe.click(f'[title="Select {document.title}"]')
    lti_select_iframe.wait_for_selector("dd")
    assert document_content_items in lti_select_iframe.content()

    # Select a video
    page.click('#lti_select input[type="submit"]')
    lti_select_iframe.click('button[role="tab"]:has-text("Videos")')
    # Use the video title and description in the response to fill the activity title and text
    video_content_items = (
        json.dumps(
            {
                "@context": "http://purl.imsglobal.org/ctx/lti/v1/ContentItem",
                "@graph": [
                    {
                        "@type": "ContentItem",
                        "url": f"{live_server}/lti/videos/{video.id}",
                        "frame": [],
                        "title": video.title,
                        "text": video.description,
                    }
                ],
            }
        )
        .replace(", ", ",")
        .replace(": ", ":")
    )
    assert video_content_items not in lti_select_iframe.content()
    with page.expect_request("**/lti/respond/"):
        lti_select_iframe.click(f'[title="Select {video.title}"]')
    lti_select_iframe.wait_for_selector("dd")
    assert video_content_items in lti_select_iframe.content()
    assert Video.objects.count() == 1

    # Select a new video
    page.click('#lti_select input[type="submit"]')
    lti_select_iframe.click('button[role="tab"]:has-text("Videos")')
    sent_title = f'"title":"{lti_consumer_parameters.get("title")}"'
    assert sent_title not in lti_select_iframe.content()
    with page.expect_request("**/lti/respond/"):
        lti_select_iframe.click("text=Add a video")
    lti_select_iframe.wait_for_selector("dd")

    # added video is created
    assert Video.objects.count() == 2
    added_video = Video.objects.exclude(id=video.id).first()
    assert added_video.title != lti_consumer_parameters.get("title")
    assert added_video.description == lti_consumer_parameters.get("text")
    # Don't send title nor text in the response
    video_content_items = (
        json.dumps(
            {
                "@context": "http://purl.imsglobal.org/ctx/lti/v1/ContentItem",
                "@graph": [
                    {
                        "@type": "ContentItem",
                        "url": f"{live_server}/lti/videos/{added_video.id}",
                        "frame": [],
                    }
                ],
            }
        )
        .replace(", ", ",")
        .replace(": ", ":")
    )
    assert video_content_items in lti_select_iframe.content()


@pytest.mark.skip_browser("webkit")
@pytest.mark.django_db()
@pytest.mark.usefixtures("mock_video_cloud_storage")
@override_settings(X_FRAME_OPTIONS="")
def test_lti_video_play(page: Page, live_server: LiveServer, mock_video_cloud_storage):
    """Test LTI Video play."""
    with (
        page.expect_request("**/media/e2e/cmaf/1622122634_480.m3u8") as response_info,
        page.expect_request("**/xapi/video/") as request_info,
    ):
        page, _ = _preview_video(live_server, page, video_uploaded=True)
    assert 200 == response_info.value.response().status
    assert "initialized" == request_info.value.post_data_json.get("verb").get(
        "display"
    ).get("en-US")

    def check_xapi_played(request: Request):
        """Check xapi played call."""
        assert request.method == "POST"
        assert (
            request.post_data_json.get("verb").get("display").get("en-US") == "played"
        )

    page.on("request", check_xapi_played)

    page.click('button:has-text("Play Video")')


@pytest.mark.django_db()
@pytest.mark.usefixtures("mock_video_cloud_storage")
def test_lti_video_upload(page: Page, live_server: LiveServer):
    """Test LTI Video upload."""
    page, _ = _preview_video(live_server, page)

    page.click("text=Create a video")
    page.fill("input[placeholder='Enter title of your video here']", "My video")

    page.set_input_files(
        "input[type='file']", f"{settings.MEDIA_ROOT}/e2e/big_buck_bunny_480p.mp4"
    )

    page.click("text=Create a video")

    page.wait_for_selector("text=Video creation", state="detached")
    page.wait_for_selector("text=Visibility and interaction parameters")
    page.wait_for_selector("text=Replace the video")


@pytest.mark.django_db()
@pytest.mark.usefixtures("mock_video_cloud_storage")
def test_lti_nav_video(page: Page, live_server: LiveServer):
    """
    Test LTI navigation when a video is present.

    Preview tab should be visible.
    """
    page, _ = _preview_video(live_server, page, video_uploaded=True)

    page.wait_for_selector("text=What are you willing to do ?", state="detached")
    assert page.is_enabled('button:has-text("Play Video")')


@pytest.mark.django_db()
@pytest.mark.usefixtures("mock_video_cloud_storage")
def test_lti_nav_no_video(page: Page, live_server: LiveServer):
    """
    Test LTI navigation when no video is present.

    Preview tab should not be visible.
    """
    page, _ = _preview_video(live_server, page)

    page.wait_for_selector("text=What are you willing to do ?")
    page.wait_for_selector("text=Preview", state="detached")


# TODO: make in work for chromium
@pytest.mark.skip_browser("chromium")
@pytest.mark.django_db()
@pytest.mark.usefixtures("mock_document_cloud_storage")
def test_lti_document_upload(page: Page, live_server: LiveServer):
    """Test LTI Document upload."""
    page, _ = _preview_document(live_server, page)

    page.click("text=Upload a document")

    with page.expect_file_chooser() as fc_info:
        page.click("text=Select a file to upload")
    file_chooser = fc_info.value
    file_chooser.set_files(f"{settings.MEDIA_ROOT}/e2e/big_buck_bunny_480p.jpg")

    page.wait_for_selector("text=Your document is ready to display.")

    page.click("text=Preview")
    page.wait_for_selector("text=Your document is ready to display.", state="detached")
    page.wait_for_selector("text=Instructor Preview")


@pytest.mark.django_db()
@pytest.mark.usefixtures("mock_document_cloud_storage")
def test_lti_nav_document(page: Page, live_server: LiveServer):
    """
    Test LTI navigation when a document is present.

    Preview tab should be visible.
    """
    page, _ = _preview_document(live_server, page, document_uploaded=True)

    page.wait_for_selector("text=Your document is ready to display.", state="detached")

    page.click("text=Dashboard")
    page.wait_for_selector("text=Your document is ready to display.")


@pytest.mark.django_db()
@pytest.mark.usefixtures("mock_document_cloud_storage")
def test_lti_nav_no_document(page: Page, live_server: LiveServer):
    """
    Test LTI navigation when no document is present.

    Preview tab should not be visible.
    """
    page, _ = _preview_document(live_server, page)

    page.wait_for_selector("text=There is currently no document to display.")
    page.wait_for_selector("text=Preview", state="detached")


@pytest.mark.django_db()
@pytest.mark.usefixtures("mock_video_cloud_storage")
@pytest.mark.skip(
    "Portability is disable with new VOD Dashboard. Must be implemented soon."
)
def test_lti_playlist_portability_video(page: Page, live_server: LiveServer):
    """Test LTI playlist portability."""
    page, video = _preview_video(live_server, page, video_uploaded=True)

    new_playlist = PlaylistFactory(
        consumer_site=video.consumer_site,
    )

    page.click("text=Playlist")

    content = page.text_content("[role=heading]")
    assert (
        content == f"Belongs to playlist {video.playlist.title} ({video.playlist.id})"
    )
    page.fill('[placeholder="Paste playlist id"]', str(new_playlist.id))

    page.click('[aria-label="add share"]')

    # wait for request done
    with page.expect_response(f"**/api/playlists/{video.playlist.id}/"):
        print("put done")

    assert video.playlist.portable_to.get(id=new_playlist.id)
    page.text_content(f"[aria-label='Shared with {new_playlist.title}']")
    page.text_content('[role="status"]:has-text("Playlist updated")')

    # go to new_playlist LTI select view
    lti_consumer_parameters = {
        "roles": random.choice(["instructor", "administrator"]),
        "content_item_return_url": f"{live_server.url}/development/",
        "context_id": new_playlist.lti_id,
        "lti_message_type": "ContentItemSelectionRequest",
        "lti_version": "LTI-1p0",
        "title": "",
        "text": "",
    }
    lti_parameters, passport = generate_passport_and_signed_lti_parameters(
        url=f"{live_server.url}/lti/select/",
        lti_parameters=lti_consumer_parameters,
        passport_attributes={"consumer_site": video.playlist.consumer_site},
    )

    page.goto(f"{live_server.url}/development/", wait_until="networkidle")
    lti_select_form = page.query_selector("#lti_select")
    for key, value in lti_parameters.items():
        if key in ("roles",):
            lti_select_form.query_selector(f'select[name="{key}"]').select_option(value)
        else:
            lti_select_form.query_selector(f'input[name="{key}"]').fill(value)
    page.click('#lti_select input[type="submit"]')

    # ensure video is available in new_playlist
    lti_select_iframe = page.frame("lti_select")
    lti_select_iframe.click('button[role="tab"]:has-text("Videos")')
    lti_select_iframe.text_content(f'[title="Select {video.title}"]')
