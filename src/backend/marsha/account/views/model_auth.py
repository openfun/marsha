"""Marsha django model authentication views."""
from django.conf import settings
from django.contrib.auth import logout as auth_logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import (
    LoginView as AuthLoginView,
    PasswordResetCompleteView as AuthPasswordResetCompleteView,
    PasswordResetConfirmView as AuthPasswordResetConfirmView,
    PasswordResetDoneView as AuthPasswordResetDoneView,
    PasswordResetView as AuthPasswordResetView,
)
from django.urls import reverse_lazy
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django.views.generic import RedirectView

from marsha.core.defaults import RENATER_FER_SAML
from marsha.core.simple_jwt.tokens import ChallengeToken


class LoginView(AuthLoginView):
    """
    Display the login form and handle the login action.
    """

    template_name = "account/login.html"
    redirect_authenticated_user = True

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Add switch name for Renater SAML
        context["RENATER_FER_SAML"] = RENATER_FER_SAML
        return context


class LogoutView(RedirectView):
    """
    Log out the user and redirect to the main page.
    """

    url = settings.FRONTEND_HOME_URL

    def get(self, request, *args, **kwargs):
        """Logout the user then redirect to the home page."""
        auth_logout(request)
        return super().get(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        """Logout may be done via POST."""
        return self.get(request, *args, **kwargs)


class PasswordResetView(AuthPasswordResetView):
    """
    Ask the user's email and send an email with password reset link.
    """

    email_template_name = "account/password_reset_email.html"
    success_url = reverse_lazy("account:password_reset_done")
    template_name = "account/password_reset_form.html"


class PasswordResetDoneView(AuthPasswordResetDoneView):
    """
    Confirm to the user the email has been sent if user exists.
    """

    template_name = "account/password_reset_done.html"


class PasswordResetConfirmView(AuthPasswordResetConfirmView):
    """
    Ask the new password twice to the user and apply the new password.
    """

    success_url = reverse_lazy("account:password_reset_complete")
    template_name = "account/password_reset_confirm.html"


class PasswordResetCompleteView(AuthPasswordResetCompleteView):
    """
    Confirm to the user the password has been updated.
    """

    template_name = "account/password_reset_complete.html"


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
