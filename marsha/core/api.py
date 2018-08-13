"""Declare API endpoints with Django RestFramework viewsets."""
from rest_framework import mixins, viewsets

from .models import Video
from .permissions import IsVideoTokenOrAdminUser
from .serializers import VideoSerializer


class VideoViewSet(
    mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet
):
    """Viewset for the API of the video object."""

    queryset = Video.objects.all()
    serializer_class = VideoSerializer
    permission_classes = [IsVideoTokenOrAdminUser]
