"""e2e tests for site."""
from django.test import override_settings

from playwright.sync_api import BrowserContext, Error, Page, expect
import pytest
from pytest_django.live_server_helper import LiveServer
import responses
from waffle.testutils import override_switch

from marsha.bbb.factories import ClassroomFactory
from marsha.core.factories import (
    OrganizationFactory,
    PlaylistAccessFactory,
    PlaylistFactory,
    UserFactory,
)
from marsha.core.models import ADMINISTRATOR, Playlist


@pytest.mark.django_db()
@pytest.fixture(scope="function", autouse=True)
def site_settings(live_server: LiveServer):
    """Override frontend settings."""
    with override_settings(
        CORS_ALLOWED_ORIGINS=[live_server.url],
        FRONTEND_HOME_URL=live_server.url,
    ), override_switch("site", active=True):
        yield


# @pytest.mark.django_db()
@pytest.fixture(scope="function")
def user_logged_in(context: BrowserContext, live_server: LiveServer):
    """Create a user and log him in."""
    user = UserFactory(username="jane")
    user.set_password("password")
    organization = OrganizationFactory()
    organization.users.set([user])
    playlist = PlaylistFactory(
        organization=organization,
        title="Playlist test",
    )
    PlaylistAccessFactory(playlist=playlist, user=user, role=ADMINISTRATOR)
    ClassroomFactory(
        playlist=playlist,
        title="Classroom test",
    )

    page = context.new_page()
    page.goto(live_server.url)
    page.fill("input[name=username]", "jane")
    page.fill("input[name=password]", "password")
    page.click("text=OK")
    page.wait_for_timeout(500)
    page.wait_for_load_state("networkidle")
    yield


def test_site_login(page: Page, live_server: LiveServer):
    """Test site login."""
    user = UserFactory(username="john")
    user.set_password("password")

    page.goto(live_server.url)
    page.fill("input[name=username]", "john")
    page.fill("input[name=password]", "password")
    page.click("text=OK")

    expect(page.get_by_role("menuitem", name="Dashboard")).to_be_visible()
    expect(page.get_by_role("menuitem", name="My Playlists")).to_be_visible()
    expect(page.get_by_role("menuitem", name="My Contents")).to_be_visible()


@pytest.mark.usefixtures("user_logged_in")
def test_site_logged_in(context: BrowserContext, live_server: LiveServer):
    """Test site already logged in."""
    page = context.new_page()
    page.goto(live_server.url)

    expect(page.get_by_role("menuitem", name="Dashboard")).to_be_visible()
    expect(page.get_by_role("menuitem", name="My Playlists")).to_be_visible()
    expect(page.get_by_role("menuitem", name="My Contents")).to_be_visible()


@pytest.mark.usefixtures("user_logged_in")
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
def test_site_classroom_invite_link(context: BrowserContext, live_server: LiveServer):
    """Test site invite link."""

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
    page = context.pages[0]
    expect(page.get_by_role("menuitem", name="Dashboard")).to_be_visible()
    expect(page.get_by_role("menuitem", name="My Playlists")).to_be_visible()
    expect(page.get_by_role("menuitem", name="My Contents")).to_be_visible()
    page.get_by_text("Classroom test").click()

    expect(page.get_by_text("LTI link for this classroom:")).to_be_visible()
    invite_link_button = page.get_by_role(
        "button", name="Invite a viewer with this link:"
    )
    invite_link_button.click()
    expect(page.get_by_text("Url copied in clipboard !")).to_be_visible()

    invite_page = page.context.new_page()
    # tries to get the clipboard content, if it fails, it uses the data-clipboard-text
    # attribute of the button
    # see https://github.com/microsoft/playwright/issues/8114
    try:
        context.grant_permissions(["clipboard-read", "clipboard-write"])
        invite_link = page.evaluate("navigator.clipboard.readText()")
    except Error:
        invite_link = invite_link_button.get_attribute("data-clipboard-text")
    invite_page.goto(invite_link)
    expect(invite_page.get_by_text("Classroom not started yet.")).to_be_visible()


@pytest.mark.usefixtures("user_logged_in")
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
def test_site_classroom_moderator_link(
    context: BrowserContext, live_server: LiveServer
):
    """Test site moderator link."""

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
    page = context.pages[0]
    expect(page.get_by_role("menuitem", name="Dashboard")).to_be_visible()
    expect(page.get_by_role("menuitem", name="My Playlists")).to_be_visible()
    expect(page.get_by_role("menuitem", name="My Contents")).to_be_visible()
    page.get_by_text("Classroom test").click()

    expect(page.get_by_text("LTI link for this classroom:")).to_be_visible()
    moderator_link_button = page.get_by_role(
        "button", name="Invite a moderator with this link:"
    )
    moderator_link_button.click()
    expect(page.get_by_text("Url copied in clipboard !")).to_be_visible()

    moderator_page = page.context.new_page()
    # tries to get the clipboard content, if it fails, it uses the data-clipboard-text
    # attribute of the button
    # see https://github.com/microsoft/playwright/issues/8114
    try:
        context.grant_permissions(["clipboard-read", "clipboard-write"])
        moderator_link = page.evaluate("navigator.clipboard.readText()")
    except Error:
        moderator_link = moderator_link_button.get_attribute("data-clipboard-text")
    moderator_page.goto(moderator_link)
    expect(
        moderator_page.get_by_text("Launch the classroom now in BBB")
    ).to_be_visible()


@pytest.mark.usefixtures("user_logged_in")
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
def test_playlist_update(context: BrowserContext, live_server: LiveServer):
    """Test playlist update."""
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
    page = context.pages[0]
    page.get_by_role("menuitem", name="My Playlists").click()
    page.get_by_role("button", name="Update playlist Playlist test").click()
    page.get_by_label("Name*required").click()
    page.get_by_label("Name*required").fill("Playlist test updated")
    page.get_by_role("button", name="Save").click()

    expect(
        page.get_by_text("An error occures, please try again later.")
    ).not_to_be_visible()
    expect(page.get_by_text("Playlist updated with success.")).to_be_visible()

    # playlist title should be updated
    assert Playlist.objects.get(title="Playlist test updated") is not None
