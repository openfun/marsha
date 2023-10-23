"""Marsha Development app URLs configuration."""

from django.urls import path

from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from marsha.development.views import DevelopmentLTIView


app_name = "development"

urlpatterns = [
    path("development/", DevelopmentLTIView.as_view(), name="lti-development-view"),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/schema/swagger-ui/",
        SpectacularSwaggerView.as_view(url_name="development:schema"),
        name="swagger-ui",
    ),
]
