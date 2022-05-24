"""Marsha django model authentication views."""
from django.conf import settings
from django.contrib.auth import logout as auth_logout
from django.contrib.auth.views import (
    LoginView as AuthLoginView,
    PasswordResetCompleteView as AuthPasswordResetCompleteView,
    PasswordResetConfirmView as AuthPasswordResetConfirmView,
    PasswordResetDoneView as AuthPasswordResetDoneView,
    PasswordResetView as AuthPasswordResetView,
)
from django.urls import reverse_lazy
from django.views.generic import RedirectView


class LoginView(AuthLoginView):
    """
    Display the login form and handle the login action.
    """

    template_name = "account/login.html"
    redirect_authenticated_user = True


class LogoutView(RedirectView):
    """
    Log out the user and redirect to the main page.
    """

    pattern_name = settings.LOGIN_REDIRECT_URL

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
