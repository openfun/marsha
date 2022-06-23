"""Declare API endpoints with Django RestFramework viewsets."""

from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK, HTTP_400_BAD_REQUEST

from marsha.core import permissions as core_permissions
from marsha.core.api import ObjectPkMixin
from marsha.core.utils.url_utils import build_absolute_uri_behind_proxy

from . import serializers
from .forms import MarkdownDocumentForm
from .models import MarkdownDocument
from .utils.converter import LatexConversionException, render_latex_to_image


class MarkdownDocumentViewSet(
    ObjectPkMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Viewset for the API of the Markdown document object."""

    queryset = MarkdownDocument.objects.prefetch_related("translations").all()
    serializer_class = serializers.MarkdownDocumentSerializer

    permission_classes = [
        core_permissions.IsTokenResourceRouteObject
        & (core_permissions.IsTokenInstructor | core_permissions.IsTokenAdmin)
    ]

    def get_permissions(self):
        """
        Manage permissions for built-in DRF methods.

        Default to the ViewSet's default permissions.
        """
        if self.action in ["create"]:
            permission_classes = [
                core_permissions.HasPlaylistToken
                & (core_permissions.IsTokenInstructor | core_permissions.IsTokenAdmin)
            ]
        else:
            permission_classes = self.permission_classes
        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        """Create one document based on the request payload."""
        try:
            form = MarkdownDocumentForm(request.data)
            document = form.save()
        except ValueError:
            return Response({"errors": [dict(form.errors)]}, status=400)

        serializer = self.get_serializer(document)

        return Response(serializer.data, status=201)

    @action(
        methods=["get"],
        detail=False,
        url_path="lti-select",
        permission_classes=[core_permissions.HasPlaylistToken],
    )
    def lti_select(self, request):
        """Get selectable content for LTI.

        Calling the endpoint returns a base URL for building a new markdown document
        LTI URL and a list of available documents.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse carrying selectable content as a JSON object.

        """
        new_url = build_absolute_uri_behind_proxy(
            self.request, "/lti/markdown-documents/"
        )

        markdown_documents = serializers.MarkdownDocumentSelectLTISerializer(
            MarkdownDocument.objects.filter(
                playlist__id=request.user.token.payload.get("playlist_id")
            ),
            many=True,
            context={"request": self.request},
        ).data

        return Response(
            {
                "new_url": new_url,
                "markdown_documents": markdown_documents,
            }
        )

    @action(
        methods=["post"],
        detail=True,  # Add the markdown document ID, not used for now
        url_path="latex-rendering",
    )
    def render_latex(self, request, *args, **kwargs):
        """Render LaTeX to SVG.

        Calling the endpoint returns an SVG string representation of the LateX input.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse carrying the SVG rendering.

        """
        serializer = serializers.MarkdownPreviewSerializer(data=self.request.data)
        serializer.is_valid(raise_exception=True)
        markdown_text = serializer.get_markdown_content()

        try:
            latex_image = render_latex_to_image(markdown_text).encode("utf-8")
        except LatexConversionException:
            return Response(
                {
                    "error": "Error in LaTeX conversion",
                },
                status=HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "latex_image": latex_image,
            }
        )

    @action(
        methods=["patch"],
        detail=True,
        url_path="save-translations",
    )
    def update_translations(self, request, *args, **kwargs):
        """Update the translated attributes of a Markdown document.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse carrying the SVG rendering.

        """
        markdown_document = self.get_object()
        # Don't use `self.get_serializer(document, data=request.data, partial=True)`
        # because we only need to update the related translation model.
        # Also don't use the MarkdownDocumentTranslationsSerializer.save method
        # as we don't know the eventual PK of the object and don't want to bother with here.
        serializer = serializers.MarkdownDocumentTranslationsSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        markdown_document.set_current_language(
            serializer.validated_data["language_code"]
        )
        markdown_document.title = serializer.validated_data["title"]
        markdown_document.content = serializer.validated_data["content"]
        markdown_document.rendered_content = serializer.validated_data[
            "rendered_content"
        ]
        markdown_document.save()  # can't use `update_fields` for translations...

        return Response(
            self.get_serializer(instance=markdown_document).data, status=HTTP_200_OK
        )
