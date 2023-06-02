"""Declare API endpoints with Django RestFramework viewsets."""
from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import get_object_or_404

from rest_framework.decorators import api_view
from rest_framework.exceptions import APIException
from rest_framework.response import Response
from waffle import switch_is_active

from .. import defaults, serializers
from ..defaults import SENTRY
from ..models import SiteConfig, Video
from ..simple_jwt.tokens import ResourceAccessToken
from ..utils.api_utils import get_uploadable_models_s3_mapping, validate_signature


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


class ObjectRelatedMixin:
    """
    Get the related video belonging to the current object.

    Using view.get_object is permissions is not possible anymore due to
    infinite recursion between has_permission and has_object_permission call.
    """

    def get_related_object(self):
        """Get the video related to the current object."""
        queryset = self.filter_queryset(self.get_queryset())
        return queryset.get(pk=self.get_object_pk())


class ResourceDoesNotMatchParametersException(APIException):
    """Exception raised when resource token id does not match parameters."""

    status_code = 400
    default_detail = "Resource from token does not match given parameters."
    default_code = "resource_parameters_not_match"


class ObjectVideoRelatedMixin:
    """
    Get the related video id contained in resource.

    It exposes a function used to get the related video.
    It is also useful to avoid URL crafting (when the url video_id doesn't
    match token resource video id).
    """

    def get_related_video_id(self):
        """Get the related video ID from the request."""

        # The video ID in the URL will be mandatory when old routes are deleted.
        video_id = (
            self.kwargs.get("video_id")
            # Backward compatibility with old routes
            or self.request.data.get("video")
            or self.request.query_params.get("video")
        )

        # Backward compatibility with old routes for LTI context
        resource = self.request.resource
        if resource is not None:
            if resource.id and video_id and str(video_id) != str(resource.id):
                raise ResourceDoesNotMatchParametersException()
            return self.request.resource.id

        return video_id

    def get_serializer_context(self):
        """Extra context provided to the serializer class."""
        context = super().get_serializer_context()

        context.update({"video_id": self.get_related_video_id()})

        return context


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
    model_from_s3_identifier = get_uploadable_models_s3_mapping()
    model = model_from_s3_identifier[key_elements["model_name"]]

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


@api_view(["GET"])
def get_frontend_configuration(request):
    """View handling GET request to get the frontend configuration.

    Parameters
    ----------
    request : Type[django.http.request.HttpRequest]
        The request on the API endpoint.

    Returns
    -------
    Type[rest_framework.response.Response]
        HttpResponse containing the frontend configuration.

    """

    domain = request.get_host()
    inactive_resources = []
    if domain:
        try:
            inactive_resources = SiteConfig.objects.get(
                site__domain=domain
            ).inactive_resources
        except SiteConfig.DoesNotExist:
            pass

    return JsonResponse(
        {
            "environment": settings.ENVIRONMENT,
            "release": settings.RELEASE,
            "sentry_dsn": settings.SENTRY_DSN if switch_is_active(SENTRY) else None,
            "inactive_resources": inactive_resources,
        }
    )


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


class BulkDestroyModelMixin:
    """
    Mixin to add the "bulk_destroy" action. It needs ```MarshaDefaultRouter```.

    The action looks for a list of ID in the body and try to delete them.
    """

    def bulk_destroy(self, request):
        """
        The function takes a list of ids from the body and verify if the user
        has the permissions to delete related objects.
        If not, nothing is deleted and it returns a 403 error with the
        list of ids without permissions.
        """
        ids = request.data.get("ids", [])
        objects_to_delete = self.get_queryset().filter(pk__in=ids)
        # If it fails, it means that one or more Ids is not permitted
        if objects_to_delete.count() != len(ids):
            permitted_ids = [
                str(x) for x in objects_to_delete.values_list("id", flat=True)
            ]
            forbidden_ids = [x for x in ids if x not in permitted_ids]
            return Response(
                (
                    "You do not have permission to perform this action for objects:"
                    f"{str(forbidden_ids)}"
                ),
                status=403,
            )
        objects_to_delete.delete()
        return Response(status=204)
