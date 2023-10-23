"""Marsha accounts URLs configuration."""
from django.conf import settings
from django.urls import include, path

from dj_rest_auth.views import (
    LogoutView,
    PasswordChangeView,
    PasswordResetConfirmView,
    PasswordResetView,
)
from rest_framework_simplejwt.views import (
    TokenBlacklistView,
    TokenObtainPairView,
    TokenRefreshView,
)
from social_edu_federation.django.views import EduFedMetadataView

from marsha.account.api import SamlFerIdpListAPIView
from marsha.account.views import RedirectToFrontendView


app_name = "account"

urlpatterns = [
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
    # API
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/token/blacklist/", TokenBlacklistView.as_view(), name="token_blacklist"),
    path(
        "api/saml/renater_fer_idp_list/",
        SamlFerIdpListAPIView.as_view(),
        name="api_saml_fer_idp_list",
    ),
    # - partial import of dj_rest_auth.urls
    path("api/logout/", LogoutView.as_view(), name="rest_logout"),
    path(
        "api/password/change/",
        PasswordChangeView.as_view(),
        name="rest_password_change",
    ),
    path(
        "api/password/reset/", PasswordResetView.as_view(), name="rest_password_reset"
    ),
    path(
        "api/password/reset/confirm/",
        PasswordResetConfirmView.as_view(),
        name="rest_password_reset_confirm",
    ),
]

if settings.SOCIAL_AUTH_SAML_FER_IDP_FAKER:
    urlpatterns += [path("", include("social_edu_federation.django.testing.urls"))]
