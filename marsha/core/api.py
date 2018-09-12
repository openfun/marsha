"""Declare API endpoints with Django RestFramework viewsets."""
from django.conf import settings

from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Video
from .permissions import IsVideoTokenOrAdminUser
from .serializers import VideoSerializer
from .utils.s3_utils import get_s3_policy


class VideoViewSet(
    mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet
):
    """Viewset for the API of the video object."""

    queryset = Video.objects.all()
    serializer_class = VideoSerializer
    permission_classes = [IsVideoTokenOrAdminUser]

    @action(methods=["get"], detail=True, url_path="upload-policy")
    # pylint: disable=unused-argument
    def upload_policy(self, request, pk=None):
        """Get a policy for direct upload of a video to our AWS S3 source bucket.

        Parameters
        ----------
        request : Type[django.http.request.HttpRequest]
            The request on the API endpoint
        pk: string
            The primary key of the video

        Returns
        -------
        Type[rest_framework.response.Response]
            HttpResponse carrying the policy as a JSON object.

        """
        policy = get_s3_policy(settings.AWS_SOURCE_BUCKET_NAME, self.get_object())
        return Response(policy)
