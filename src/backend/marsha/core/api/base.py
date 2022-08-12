"""Declare API endpoints with Django RestFramework viewsets."""

from django.apps import apps
from django.shortcuts import get_object_or_404

from rest_framework.decorators import api_view
from rest_framework.response import Response

from .. import defaults, serializers
from ..models import Video
from ..simple_jwt.tokens import ResourceAccessToken
from ..utils.api_utils import validate_signature


class ObjectPkMixin:
    """
    Get the object primary key from the URL path.

    This is useful to avoid making extra requests using view.get_object() on
    a ViewSet when we only need the object's id, which is available in the URL.
    """

    def get_object_pk(self):
        """Get the object primary key from the URL path."""
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        return self.kwargs.get(lookup_url_kwarg)


@api_view(["POST"])
def update_state(request):
    """View handling AWS POST request to update the state of an object by key.

    Parameters
    ----------
    request : Type[django.http.request.HttpRequest]
        The request on the API endpoint, it should contain a payload with the following fields:
            - key: the key of an object in the source bucket as delivered in the upload policy,
            - state: state of the upload, should be either "ready" or "error",
            - extraParameters: Dict containing arbitrary data sent from AWS Lambda.

    Returns
    -------
    Type[rest_framework.response.Response]
        HttpResponse acknowledging the success or failure of the state update operation.

    """
    msg = request.body
    serializer = serializers.UpdateStateSerializer(data=request.data)

    if serializer.is_valid() is not True:
        return Response(serializer.errors, status=400)

    # Check if the provided signature is valid against any secret in our list
    if not validate_signature(request.headers.get("X-Marsha-Signature"), msg):
        return Response("Forbidden", status=403)

    # Retrieve the elements from the key
    key_elements = serializer.get_key_elements()

    # Update the object targeted by the "object_id" and "resource_id"
    model = apps.get_model(app_label="core", model_name=key_elements["model_name"])

    extra_parameters = serializer.validated_data["extraParameters"]
    if (
        serializer.validated_data["state"] == defaults.READY
        and hasattr(model, "extension")
        and "extension" not in extra_parameters
    ):
        # The extension is part of the s3 key name and added in this key
        # when generated by the initiate upload
        extra_parameters["extension"] = key_elements.get("extension")

    try:
        object_instance = model.objects.get(id=key_elements["object_id"])
    except model.DoesNotExist:
        return Response({"success": False}, status=404)

    object_instance.update_upload_state(
        upload_state=serializer.validated_data["state"],
        uploaded_on=key_elements.get("uploaded_on")
        if serializer.validated_data["state"] == defaults.READY
        else None,
        **extra_parameters,
    )

    return Response({"success": True})


@api_view(["POST"])
def recording_slices_manifest(request):
    """View handling AWS POST request to set a manifest on a record slice.

    Parameters
    ----------
    request : Type[django.http.request.HttpRequest]
        The request on the API endpoint, it should contain a payload with the following fields:
            - video_id: the pk of a video.
            - harvest_job_id: the id of the harvest job.
            - manifest_key: the manifest key of the record slice.

    Returns
    -------
    Type[rest_framework.response.Response]
        HttpResponse containing the current harvest status of all recording slices.

    """
    # Check if the provided signature is valid against any secret in our list
    if not validate_signature(request.headers.get("X-Marsha-Signature"), request.body):
        return Response("Forbidden", status=403)

    video = get_object_or_404(Video, pk=request.data["video_id"])
    video.set_recording_slice_manifest_key(
        request.data["harvest_job_id"], request.data["manifest_key"]
    )
    return Response({"success": True})


@api_view(["POST"])
def recording_slices_state(request):
    """View handling AWS POST request to check each record slice harvest status by video pk.

    Parameters
    ----------
    request : Type[django.http.request.HttpRequest]
        The request on the API endpoint, it should contain a payload with the following fields:
            - video_id: the pk of a video.

    Returns
    -------
    Type[rest_framework.response.Response]
        HttpResponse containing the current harvest status of all recording slices.

    """
    # Check if the provided signature is valid against any secret in our list
    if not validate_signature(request.headers.get("X-Marsha-Signature"), request.body):
        return Response("Forbidden", status=403)

    video = get_object_or_404(Video, pk=request.data["video_id"])
    return Response(video.get_recording_slices_state())


class APIViewMixin:
    """
    Mixin to enhance the base DRF APIView.

    Must be used on every Marsha API views (APIView, Viewset, ...)

    This provides a way to separate request information between `request.user`
    and `request.resource`
    """

    def check_permissions(self, request):
        """
        Add resource attribute to the request when we are in a resource context.

        Note, we use the `check_permissions` method to do it because:
         - we need the authentication to be done to know whether we have a user
           token or a resource token
         - AND we also need to be before the call to `check_permissions` and we
           can't do it in `self.initial`
         - PLUS we can't be in `perform_authentication` because "metadata" views
           partially duplicates the request (see `clone_request`) and our
           `resource` won't be passed along. But `check_permissions`is called
           after the cloning so this works.

        Also, we can't alter the `request.user` without messing up with the
        middleware called with `process_response` so in case of a resource,
        we keep it as a TokenResource...
        """
        request.resource = None
        if isinstance(request.auth, ResourceAccessToken):  # otherwise, nothing to do
            request.resource = request.user

        super().check_permissions(request)
