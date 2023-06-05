"""Declare API endpoints for documents with Django RestFramework viewsets."""
from mimetypes import guess_extension
from os.path import splitext

from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .. import defaults, permissions, serializers, storage
from ..factories import UserFactory
from ..forms import DocumentForm
from ..models import Document
from .base import APIViewMixin, ObjectPkMixin


class DocumentViewSet(
    APIViewMixin,
    ObjectPkMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """Viewset for the API of the Document object."""

    queryset = Document.objects.all()
    serializer_class = serializers.DocumentSerializer
    permission_classes = [
        permissions.IsTokenResourceRouteObject & permissions.IsTokenInstructor
        | permissions.IsTokenResourceRouteObject & permissions.IsTokenAdmin
    ]

    def get_permissions(self):
        """
        Manage permissions for built-in DRF methods.

        Default to the ViewSet's default permissions.
        """
        if self.action in ["create"]:
            permission_classes = [
                permissions.HasPlaylistToken
                & (permissions.IsTokenInstructor | permissions.IsTokenAdmin)
            ]
        else:
            permission_classes = self.permission_classes
        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        """Create one document based on the request payload."""
        try:
            # TODO: mikado 1: remove this when we have a proper authentication
            data = request.data.copy()
            data["created_by"] = UserFactory().id
            form = DocumentForm(data)
            document = form.save()
        except ValueError:
            return Response({"errors": [dict(form.errors)]}, status=400)

        serializer = self.get_serializer(document)

        return Response(serializer.data, status=201)

    @action(methods=["post"], detail=True, url_path="initiate-upload")
    # pylint: disable=unused-argument
    def initiate_upload(self, request, pk=None):
        """Get an upload policy for a file.

        Calling the endpoint resets the upload state to `pending` and returns an upload policy to
        our AWS S3 source bucket.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint
        pk: string
            The primary key of the Document instance

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse carrying the AWS S3 upload policy as a JSON object.

        """
        serializer = serializers.DocumentUploadSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        extension = splitext(serializer.validated_data["filename"])[
            1
        ] or guess_extension(serializer.validated_data["mimetype"])

        response = storage.get_initiate_backend().initiate_document_upload(
            request, pk, extension
        )

        # Reset the upload state of the document
        Document.objects.filter(pk=pk).update(upload_state=defaults.PENDING)

        return Response(response)
