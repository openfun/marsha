"""Marsha markdown app URLs configuration."""

from django.urls import include, path

from rest_framework.routers import DefaultRouter

from marsha.markdown.api import MarkdownDocumentViewSet, MarkdownImageViewSet
from marsha.markdown.views import MarkdownDocumentView


app_name = "markdown"

router = DefaultRouter()
router.register(
    "markdown-documents",
    MarkdownDocumentViewSet,
    basename="markdown-documents",
)

markdown_document_related_router = DefaultRouter()
markdown_document_related_router.register(
    "markdown-images", MarkdownImageViewSet, basename="markdown-images"
)

urlpatterns = [
    path(
        "lti/markdown-documents/<uuid:uuid>",
        MarkdownDocumentView.as_view(),
        name="markdown_document_lti_view",
    ),
    path("api/", include(router.urls)),
    path(
        "api/markdown-documents/<uuid:markdown_document_id>/",
        include(markdown_document_related_router.urls),
    ),
]
