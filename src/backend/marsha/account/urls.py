"""Marsha accounts URLs configuration."""
from django.conf import settings
from django.urls import include, path

from social_edu_federation.django.views import EduFedMetadataView

from .views import (
    LoginView,
    LogoutView,
    PasswordResetCompleteView,
    PasswordResetConfirmView,
    PasswordResetDoneView,
    PasswordResetView,
    RedirectToFrontendView,
)
from .views.social_edu_federation_saml_auth import MarshaEduFederationIdpChoiceView


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
    path(
        "login/complete/",
        RedirectToFrontendView.as_view(),
        name="login_complete_redirect",
    ),
    path("", include("social_django.urls", namespace="social")),
    # SAML
    path(
        "saml/metadata/",
        EduFedMetadataView.as_view(backend_name="saml_fer"),
        name="saml_fer_metadata",
    ),
    path(
        "saml/renater_fer_idp_choice/",
        MarshaEduFederationIdpChoiceView.as_view(backend_name="saml_fer"),
        name="saml_fer_idp_choice",
    ),
]

if settings.SOCIAL_AUTH_SAML_FER_IDP_FAKER:
    urlpatterns += [path("", include("social_edu_federation.django.testing.urls"))]
