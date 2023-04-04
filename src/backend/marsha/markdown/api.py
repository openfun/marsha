"""Declare API endpoints with Django RestFramework viewsets."""
from django.conf import settings
from django.db.models import Q
from django.utils import timezone

import django_filters
from rest_framework import filters, mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK, HTTP_400_BAD_REQUEST

from marsha.core import defaults, permissions as core_permissions
from marsha.core.api import APIViewMixin, ObjectPkMixin, ObjectRelatedMixin
from marsha.core.utils.time_utils import to_timestamp

from . import permissions as markdown_permissions, serializers
from ..core.models import ADMINISTRATOR
from ..core.utils.s3_utils import create_presigned_post
from .defaults import LTI_ROUTE
from .forms import MarkdownDocumentForm
from .models import MarkdownDocument, MarkdownImage
from .permissions import IsRelatedMarkdownDocumentPlaylistOrOrganizationAdmin
from .utils.converter import LatexConversionException, render_latex_to_image


class MarkdownDocumentFilter(django_filters.FilterSet):
    """Filter for file depository."""

    organization = django_filters.UUIDFilter(field_name="playlist__organization__id")

    class Meta:
        model = MarkdownDocument
        fields = ["playlist"]


class MarkdownDocumentViewSet(
    APIViewMixin,
    ObjectPkMixin,
    viewsets.ModelViewSet,
    viewsets.GenericViewSet,
):
    """Viewset for the API of the Markdown document object."""

    queryset = (
        MarkdownDocument.objects.prefetch_related("translations")
        .select_related("playlist")
        .all()
    )
    serializer_class = serializers.MarkdownDocumentSerializer
    filter_backends = [
        filters.OrderingFilter,
        django_filters.rest_framework.DjangoFilterBackend,
    ]
    ordering_fields = ["created_on"]
    ordering = ["-created_on"]
    filterset_class = MarkdownDocumentFilter

    permission_classes = [
        (
            core_permissions.IsTokenResourceRouteObject
            & (core_permissions.IsTokenInstructor | core_permissions.IsTokenAdmin)
        )
        | markdown_permissions.IsMarkdownDocumentPlaylistOrOrganizationAdmin
    ]

    def get_permissions(self):
        """
        Manage permissions for built-in DRF methods.

        Default to the ViewSet's default permissions.
        """
        if self.action in ["create"]:
            permission_classes = [
                (
                    core_permissions.HasPlaylistToken
                    & (
                        core_permissions.IsTokenInstructor
                        | core_permissions.IsTokenAdmin
                    )
                )
                | (
                    core_permissions.UserIsAuthenticated  # asserts request.resource is None
                    & (
                        core_permissions.IsParamsPlaylistAdmin
                        | core_permissions.IsParamsPlaylistAdminThroughOrganization
                    )
                )
            ]
        elif self.action in ["destroy"]:
            permission_classes = [
                core_permissions.IsTokenInstructor
                | core_permissions.IsTokenAdmin
                | (
                    core_permissions.UserIsAuthenticated  # asserts request.resource is None
                    & (
                        core_permissions.IsParamsPlaylistAdmin
                        | core_permissions.IsParamsPlaylistAdminThroughOrganization
                    )
                )
            ]
        elif self.action in ["list"]:
            permission_classes = [core_permissions.UserIsAuthenticated]
        else:
            permission_classes = self.permission_classes
        return [permission() for permission in permission_classes]

    def _get_list_queryset(self):
        """Build the queryset used on the list action."""
        queryset = (
            super()
            .get_queryset()
            .filter(
                Q(
                    playlist__organization__user_accesses__user_id=self.request.user.id,
                    playlist__organization__user_accesses__role=ADMINISTRATOR,
                )
                | Q(
                    playlist__user_accesses__user_id=self.request.user.id,
                    playlist__user_accesses__role=ADMINISTRATOR,
                )
            )
            .distinct()
        )

        return queryset

    def get_queryset(self):
        """Redefine the queryset to use based on the current action."""
        if self.action in ["list"]:
            return self._get_list_queryset()

        return super().get_queryset()

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
        new_url = self.request.build_absolute_uri(LTI_ROUTE)

        markdown_documents = serializers.MarkdownDocumentSelectLTISerializer(
            MarkdownDocument.objects.filter(
                playlist__id=request.resource.playlist_id,
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


class MarkdownImageViewSet(
    APIViewMixin,
    ObjectPkMixin,
    ObjectRelatedMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Viewset for the API of the MarkdownImage object."""

    permission_classes = [core_permissions.NotAllowed]
    serializer_class = serializers.MarkdownImageSerializer

    def get_permissions(self):
        """Instantiate and return the list of permissions that this view requires."""
        if self.action == "create":
            permission_classes = [
                core_permissions.IsTokenInstructor
                | core_permissions.IsTokenAdmin
                | IsRelatedMarkdownDocumentPlaylistOrOrganizationAdmin
            ]
        else:
            permission_classes = [
                markdown_permissions.IsTokenResourceRouteObjectRelatedMarkdownDocument
                & core_permissions.IsTokenInstructor
                | markdown_permissions.IsTokenResourceRouteObjectRelatedMarkdownDocument
                & core_permissions.IsTokenAdmin
                | IsRelatedMarkdownDocumentPlaylistOrOrganizationAdmin
            ]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        Restrict list access to Markdown images related to the Markdown document in the JWT token.
        """
        if self.request.resource:
            return MarkdownImage.objects.filter(
                markdown_document__id=self.request.resource.id,
            )
        return MarkdownImage.objects.all()

    @action(methods=["post"], detail=True, url_path="initiate-upload")
    def initiate_upload(self, request, *args, pk=None, **kwargs):
        """Get an upload policy for a Markdown image.

        Calling the endpoint resets the upload state to `pending` and returns an upload policy to
        our AWS S3 source bucket.

        Parameters
        ----------
        request : Type[rest_framework.request.Request]
            The request on the API endpoint
        pk: string
            The primary key of the Markdown image

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse carrying the AWS S3 upload policy as a JSON object.

        """
        markdown_image = self.get_object()  # check permissions first

        serializer = serializers.MarkdownImageUploadSerializer(
            data=request.data,
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=HTTP_400_BAD_REQUEST)

        now = timezone.now()
        stamp = to_timestamp(now)

        key = markdown_image.get_source_s3_key(
            stamp=stamp,
            extension=serializer.validated_data["extension"],
        )

        presigned_post = create_presigned_post(
            [
                ["starts-with", "$Content-Type", "image/"],
                ["content-length-range", 0, settings.MARKDOWN_IMAGE_SOURCE_MAX_SIZE],
            ],
            {},
            key,
        )

        # Reset the upload state of the Markdown image
        MarkdownImage.objects.filter(pk=pk).update(
            upload_state=defaults.PENDING,
            extension=serializer.validated_data["extension"],
        )

        return Response(presigned_post)
