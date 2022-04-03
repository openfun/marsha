"""Marsha markdown app URLs configuration."""

from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .api import MarkdownDocumentViewSet
from .views import MarkdownDocumentView


app_name = "markdown"

router = DefaultRouter()
router.register(
    "markdown-documents", MarkdownDocumentViewSet, basename="markdown-documents"
)

urlpatterns = [
    path(
        "lti/markdown_documents/<uuid:uuid>",
        MarkdownDocumentView.as_view(),
        name="markdown_document_lti_view",
    ),
    path("api/", include(router.urls)),
]
