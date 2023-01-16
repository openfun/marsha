"""Marsha django model authentication views."""
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django.views.generic import RedirectView

from marsha.core.simple_jwt.tokens import ChallengeToken


class RedirectToFrontendView(RedirectView):
    """Redirect the user to frontend, right after login with a challenge to authenticate."""

    url = "%(frontend_login_url)s?token=%(challenge_token)s"

    @method_decorator(login_required)
    @method_decorator(never_cache)
    def dispatch(self, request, *args, **kwargs):
        """Prevent unauthenticated users to access this view."""
        return super().dispatch(request, *args, **kwargs)

    def get(self, request, *args, **kwargs):
        """Redirect the user to the frontend providing a challenge token for authentication."""

        return super().get(
            request,
            *args,
            frontend_login_url=settings.FRONTEND_HOME_URL,
            challenge_token=ChallengeToken.for_user(request.user),
            **kwargs,
        )
