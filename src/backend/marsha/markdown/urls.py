"""Marsha markdown app URLs configuration."""

from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .api import MarkdownDocumentViewSet, MarkdownImageViewSet
from .views import MarkdownDocumentView


app_name = "markdown"

router = DefaultRouter()
router.register(
    "markdown-documents",
    MarkdownDocumentViewSet,
    basename="markdown-documents",
)
router.register("markdown-images", MarkdownImageViewSet, basename="markdown-images")

urlpatterns = [
    path(
        "lti/markdown-documents/<uuid:uuid>",
        MarkdownDocumentView.as_view(),
        name="markdown_document_lti_view",
    ),
    path("api/", include(router.urls)),
]
