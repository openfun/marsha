"""e2e tests for LTI."""

import json
import random
import uuid

from django.conf import settings
from django.test import override_settings
from django.utils import timezone
from django.utils.html import escape

from playwright.async_api import Page
import pytest
from pytest_django.live_server_helper import LiveServer

from marsha.core.defaults import READY
from marsha.core.factories import DocumentFactory, PlaylistFactory, VideoFactory
from marsha.core.models import Video
from marsha.core.tests.utils import generate_passport_and_signed_lti_parameters
import marsha.core.views


@pytest.fixture
def mock_cloud_storage(mocker, live_server):
    """Pytest fixture to easily mock s3 upload."""
    mock_aws_s3 = mocker.patch.object(
        marsha.core.serializers.VideoBaseSerializer, "get_urls", autospec=True
    )
    video_s3_id = "1622122634"
    media_path = f"{live_server.url}/media/e2e"

    mock_aws_s3.return_value = {
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
        yield mock_aws_s3


@pytest.mark.django_db()
@pytest.mark.usefixtures("mock_cloud_storage")
def test_lti_select(page: Page, live_server: LiveServer):
    """Test LTI select."""
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
        playlist=playlist,
        uploaded_on=timezone.now(),
    )

    page.goto(f"{live_server.url}/development/")
    lti_select_form = page.query_selector("#lti_select")
    for key, value in lti_parameters.items():
        lti_select_form.query_selector(f'input[name="{key}"]').fill(value)
    page.click('#lti_select input[type="submit"]')

    lti_select_iframe = page.frame("lti_select")

    # Select a document
    lti_select_iframe.click('button[role="tab"]:has-text("Documents")')
    document_content_items = (
        json.dumps(
            {
                "@context": "http://purl.imsglobal.org/ctx/lti/v1/ContentItem",
                "@graph": [
                    {
                        "@type": "ContentItem",
                        "url": f"{live_server.url}/lti/documents/{document.id}",
                        "title": f"{document.title}",
                        "frame": [],
                    }
                ],
            }
        )
        .replace(", ", ",")
        .replace(": ", ":")
    )
    assert document_content_items not in lti_select_iframe.content()
    lti_select_iframe.click(f'[title="Select {document.title}"]')
    lti_select_iframe.wait_for_selector("dd")
    assert document_content_items in lti_select_iframe.content()

    # Select a video
    page.click('#lti_select input[type="submit"]')
    lti_select_iframe.click('button[role="tab"]:has-text("Videos")')
    video_content_items = (
        escape(
            json.dumps(
                {
                    "@context": "http://purl.imsglobal.org/ctx/lti/v1/ContentItem",
                    "@graph": [
                        {
                            "@type": "ContentItem",
                            "url": f"{live_server}/lti/videos/{video.id}",
                            "title": f"{video.title}",
                            "frame": [],
                        }
                    ],
                }
            )
        )
        .replace(", ", ",")
        .replace(": ", ":")
    )
    assert video_content_items not in lti_select_iframe.content()
    lti_select_iframe.click(f'[title="Select {video.title}"]')
    assert video_content_items in lti_select_iframe.content()
    assert Video.objects.count() == 1


@pytest.mark.django_db()
@pytest.mark.usefixtures("mock_cloud_storage")
@override_settings(X_FRAME_OPTIONS="")
def test_lti_video_play(page: Page, live_server: LiveServer, mock_cloud_storage):
    """Test LTI Video play."""
    page.set_viewport_size({"width": 1200, "height": 1200})

    # uncomment to log requests
    # page.on(
    #     "request",
    #     lambda request: print(">>", request.method, request.url, request.post_data),
    # )
    # page.on("response", lambda response: print("<<", response.status, response.url))

    video = VideoFactory(
        uploaded_on=timezone.now(),
        resolutions=settings.VIDEO_RESOLUTIONS,
        upload_state=READY,
    )

    lti_consumer_parameters = {
        "uuid": str(video.id),
        "resource_link_id": "example.com-df7",
        "context_id": video.playlist.lti_id,
        "roles": random.choice(["instructor", "administrator"]),
        "resource": "videos",
        "user_id": "56255f3807599c377bf0e5bf072359fd",
        "lis_person_contact_email_primary": "contact@openfun.fr",
        "custom_component_display_name": "LTI Consumer",
        "lti_version": "LTI-1p0",
        "lis_person_sourcedid": "John",
        "lti_message_type": "basic-lti-launch-request",
        "launch_presentation_return_url": "",
        "lis_result_sourcedid": "course-v1%3Aufr%2Bmathematics%2B0001:"
        "example.com-df7b0f2886f04b279854585735a402c4:"
        "56255f3807599c377bf0e5bf072359fd",
        "launch_presentation_locale": "en",
    }

    lti_parameters, _passport = generate_passport_and_signed_lti_parameters(
        url=f"{live_server.url}/lti/videos/{video.id}",
        lti_parameters=lti_consumer_parameters,
        passport_attributes={"consumer_site": video.playlist.consumer_site},
    )

    page.goto(f"{live_server.url}/development/")

    lti_resource_page_form = page.query_selector("#lti_resource_page")
    for key, value in lti_parameters.items():
        if key in (
            "custom_component_display_name",
            "lti_version",
            "lis_person_sourcedid",
            "lti_message_type",
            "launch_presentation_return_url",
            "lis_result_sourcedid",
            "launch_presentation_locale",
        ):
            continue
        if key in ("resource",):
            lti_resource_page_form.query_selector(
                f'select[name="{key}"]'
            ).select_option(value, timeout=100)
        else:
            lti_resource_page_form.query_selector(f'input[name="{key}"]').fill(
                value, timeout=100
            )

    page.click('#lti_resource_page input[type="submit"]')

    # TODO: make in work for other browsers
    if "firefox" in str(page.context.browser):
        with page.expect_request(
            mock_cloud_storage.return_value.get("mp4").get(1080)
        ) as response_info:
            assert 200 == response_info.value.response().status

        # breakpoint()
        page.click('button:has-text("Play Video")')
        for verb in ("initialized", "paused", "completed"):
            with page.expect_request("**/xapi/") as request_info:
                assert verb == request_info.value.post_data_json.get("verb").get(
                    "display"
                ).get("en-US")


@pytest.mark.django_db()
@pytest.mark.usefixtures("mock_cloud_storage")
def test_lti_video_upload(page: Page, live_server: LiveServer):
    """Test LTI Video upload."""
    page.set_viewport_size({"width": 1200, "height": 1200})
    new_uuid = str(uuid.uuid4())

    lti_consumer_parameters = {
        "uuid": new_uuid,
        "resource_link_id": "example.com-df7",
        "context_id": "sent_lti_context_id",
        "roles": random.choice(["instructor", "administrator"]),
        "resource": "videos",
        "user_id": "56255f3807599c377bf0e5bf072359fd",
        "lis_person_contact_email_primary": "contact@openfun.fr",
        "custom_component_display_name": "LTI Consumer",
        "lti_version": "LTI-1p0",
        "lis_person_sourcedid": "John",
        "lti_message_type": "basic-lti-launch-request",
        "launch_presentation_return_url": "",
        "lis_result_sourcedid": "course-v1%3Aufr%2Bmathematics%2B0001:"
        "example.com-df7b0f2886f04b279854585735a402c4:"
        "56255f3807599c377bf0e5bf072359fd",
        "launch_presentation_locale": "en",
    }

    lti_parameters, _passport = generate_passport_and_signed_lti_parameters(
        url=f"{live_server.url}/lti/videos/{new_uuid}",
        lti_parameters=lti_consumer_parameters,
    )

    page.goto(f"{live_server.url}/development/")

    lti_resource_page_form = page.query_selector("#lti_resource_page")
    for key, value in lti_parameters.items():
        if key in (
            "custom_component_display_name",
            "lti_version",
            "lis_person_sourcedid",
            "lti_message_type",
            "launch_presentation_return_url",
            "lis_result_sourcedid",
            "launch_presentation_locale",
        ):
            continue
        if key in ("resource",):
            lti_resource_page_form.query_selector(
                f'select[name="{key}"]'
            ).select_option(value, timeout=100)
        else:
            lti_resource_page_form.query_selector(f'input[name="{key}"]').fill(
                value, timeout=100
            )
    page.click('#lti_resource_page input[type="submit"]')

    page.click("text=Upload a video")

    with page.expect_file_chooser() as fc_info:
        page.click("text=Select a file to upload")
    file_chooser = fc_info.value
    # breakpoint()
    file_chooser.set_files(f"{settings.MEDIA_ROOT}/e2e/big_buck_bunny_480p.mp4")

    page.wait_for_selector("text=Your video is ready to play.")
    assert "Your video is ready to play." in page.content()
