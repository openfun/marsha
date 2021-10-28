"""pytest configuration."""

# uncomment to ignore https ssl validation
#
# import pytest
#
#
# @pytest.fixture()
# def browser_context_args(browser_context_args):
#     return {
#         **browser_context_args,
#         "ignore_https_errors": True,
#     }


# uncomment to take a screenshot on test failure
#
# from pathlib import Path
# from django.utils.text import slugify
#
#
# def pytest_runtest_makereport(item, call) -> None:
#     if call.when == "call":
#         if call.excinfo is not None and "page" in item.funcargs:
#             page = item.funcargs["page"]
#             screenshot_dir = Path("playwright-screenshots")
#             screenshot_dir.mkdir(exist_ok=True)
#             page.screenshot(path=str(screenshot_dir / f"{slugify(item.nodeid)}.png"))


# uncomment to record video during all tests
#
# import pytest
#
#
# @pytest.fixture(scope="session")
# def browser_context_args(browser_context_args):
#     return {
#         **browser_context_args,
#         "record_video_dir": "./playwright-videos"
#     }
