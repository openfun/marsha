"""Marsha accounts URLs configuration."""
from django.conf import settings
from django.urls import include, path

from .views import (
    LoginView,
    LogoutView,
    PasswordResetCompleteView,
    PasswordResetConfirmView,
    PasswordResetDoneView,
    PasswordResetView,
    RenaterIdpChoiceView,
    SAMLMetadataView,
)


app_name = "account"

urlpatterns = [
    # Authentication
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("password_reset/", PasswordResetView.as_view(), name="password_reset"),
    path(
        "password_reset/done/",
        PasswordResetDoneView.as_view(),
        name="password_reset_done",
    ),
    path(
        "reset/<uidb64>/<token>/",
        PasswordResetConfirmView.as_view(),
        name="password_reset_confirm",
    ),
    path(
        "reset/done/",
        PasswordResetCompleteView.as_view(),
        name="password_reset_complete",
    ),
    # Django social auth
    path("", include("social_django.urls", namespace="social")),
    # SAML
    path("saml/metadata/", SAMLMetadataView.as_view(), name="saml_metadata"),
    path(
        "saml/renater_idp_choice/",
        RenaterIdpChoiceView.as_view(),
        name="saml_renater_choice",
    ),
]

if settings.SOCIAL_AUTH_RENATER_SAML_IDP_FAKER:
    urlpatterns += [path("", include("marsha.account.social_testing.urls"))]
