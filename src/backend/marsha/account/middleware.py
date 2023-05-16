"""Account middleware dealing with social auth exception."""
from urllib.parse import quote

from django.conf import settings
from django.shortcuts import redirect

from sentry_sdk import capture_exception
from social_core.exceptions import SocialAuthBaseException


class SocialAuthExceptionMiddleware:
    """Middleware that handles Social Auth AuthExceptions by providing the user
    with a message and redirecting to some next location.

    By default, is captured in sentry and they are
    redirected to the location specified in the SOCIAL_AUTH_LOGIN_ERROR_URL
    setting.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exception):
        """Process the exception if it's a social_core exceptions.
        Redirect the user to SOCIAL_AUTH_LOGIN_ERROR_URL if defined and
        capture the exception in sentry"""
        strategy = getattr(request, "social_strategy", None)
        if strategy is None or self.raise_exception(request):
            return None

        if isinstance(exception, SocialAuthBaseException):
            backend = getattr(request, "backend", None)
            backend_name = getattr(backend, "name", "unknown-backend")

            url = self.get_redirect_uri(request)

            if url:
                message = str(exception)
                url += (
                    "?" in url and "&" or "?"
                ) + f"message={quote(message)}&backend={backend_name}"
                capture_exception(exception)
                return redirect(url)

        return None

    def raise_exception(self, request):
        """Determine if the exception should be raised or not."""
        strategy = getattr(request, "social_strategy", None)
        if strategy is not None:
            return strategy.setting("RAISE_EXCEPTIONS", settings.DEBUG)

        return True

    def get_redirect_uri(self, request):
        """Get the redirected url."""
        strategy = getattr(request, "social_strategy", None)
        return strategy.setting("LOGIN_ERROR_URL")
