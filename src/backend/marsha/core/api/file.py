"""Declare API endpoints for documents with Django RestFramework viewsets."""
from mimetypes import guess_extension
from os.path import splitext

from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .. import defaults, permissions, serializers, storage
from ..models import Document
from .base import ObjectPkMixin


class DocumentViewSet(
    ObjectPkMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Viewset for the API of the Document object."""

    queryset = Document.objects.all()
    serializer_class = serializers.DocumentSerializer
    permission_classes = [
        permissions.IsTokenResourceRouteObject & permissions.IsTokenInstructor
        | permissions.IsTokenResourceRouteObject & permissions.IsTokenAdmin
    ]

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
        serializer = serializers.InitiateUploadSerializer(data=request.data)

        if serializer.is_valid() is not True:
            return Response(serializer.errors, status=400)

        extension = splitext(serializer.validated_data["filename"])[
            1
        ] or guess_extension(serializer.validated_data["mimetype"])

        response = storage.get_initiate_backend().initiate_document_upload(
            request, pk, extension
        )

        # Reset the upload state of the document
        Document.objects.filter(pk=pk).update(upload_state=defaults.PENDING)

        return Response(response)
