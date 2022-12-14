"""e2e tests for site."""
from django.test import override_settings

from playwright.sync_api import Page
import pytest
from pytest_django.live_server_helper import LiveServer
from waffle.testutils import override_switch

from marsha.core import factories


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
def user_logged_in(page: Page, live_server: LiveServer):
    """Create a user and log him in."""
    user = factories.UserFactory(username="jane")
    user.set_password("password")
    page.goto(live_server.url)
    page.fill("input[name=username]", "jane")
    page.fill("input[name=password]", "password")
    page.click("text=OK")
    yield


def test_site_login(page: Page, live_server: LiveServer):
    """Test site login."""
    user = factories.UserFactory(username="john")
    user.set_password("password")

    page.goto(live_server.url)
    page.fill("input[name=username]", "john")
    page.fill("input[name=password]", "password")
    page.click("text=OK")

    page.wait_for_selector("text=Dashboard")
    page.wait_for_selector("text=My Playlists")
    page.wait_for_selector("text=My Contents")
