"""Declare API endpoints for documents with Django RestFramework viewsets."""

from django.utils import timezone

from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from marsha import settings
from marsha.core import defaults, permissions, serializers, storage
from marsha.core.api.base import APIViewMixin, ObjectPkMixin
from marsha.core.forms import DocumentForm
from marsha.core.models import Document
from marsha.core.utils.time_utils import to_datetime, to_timestamp


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
        permissions.IsPlaylistTokenMatchingRouteObject
        & (permissions.IsTokenInstructor | permissions.IsTokenAdmin)
    ]

    def get_permissions(self):
        """
        Manage permissions for built-in DRF methods.

        Default to the ViewSet's default permissions.
        """
        if self.action in ["create"]:
            permission_classes = [
                permissions.IsPlaylistToken
                & (permissions.IsTokenInstructor | permissions.IsTokenAdmin)
            ]
        else:
            permission_classes = self.permission_classes
        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        """Create one document based on the request payload."""
        try:
            form = DocumentForm(request.data)
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
        document = self.get_object()

        serializer = serializers.DocumentInitiateUploadSerializer(data=request.data)

        if serializer.is_valid() is not True:
            return Response(serializer.errors, status=400)

        filename = serializer.validated_data["filename"]
        extension = serializer.validated_data["extension"]

        if not filename.endswith(extension):
            filename = f"{filename}{extension}"

        presigned_post = (
            storage.get_initiate_backend().initiate_document_storage_upload(
                request,
                document,
                filename,
                [["content-length-range", 0, settings.DOCUMENT_SOURCE_MAX_SIZE]],
            )
        )

        # Reset the upload state of the document
        Document.objects.filter(pk=pk).update(
            filename=serializer.validated_data["filename"],
            upload_state=defaults.PENDING,
        )

        return Response(presigned_post)

    @action(methods=["post"], detail=True, url_path="upload-ended")
    # pylint: disable=unused-argument
    def upload_ended(self, request, pk=None):
        """Notify the API that the file upload has ended.

        Calling the endpoint will update the upload state of the file.
        The request should have a file_key in the body, which is the key of the
        uploaded file.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint
        pk: string
            The primary key of the deposited file

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse with the serialized deposited file.
        """
        document = self.get_object()  # check permissions first

        serializer = serializers.DocumentUploadEndedSerializer(
            data=request.data, context={"obj": document}
        )

        serializer.is_valid(raise_exception=True)

        now = timezone.now()
        stamp = to_timestamp(now)

        document.update_upload_state(defaults.READY, to_datetime(stamp))

        return Response(serializer.data)
