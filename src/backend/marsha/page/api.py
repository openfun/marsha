"""Declare API endpoints with Django RestFramework viewsets."""
import django_filters
from rest_framework import filters, mixins, permissions, viewsets

from . import serializers
from .models import Page


class PageViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Viewset for the API of the ``page`` object."""

    queryset = Page.objects.filter(is_published=True).all()
    serializer_class = serializers.PageSerializer
    filter_backends = [
        filters.OrderingFilter,
        django_filters.rest_framework.DjangoFilterBackend,
    ]
    ordering_fields = ["created_on"]
    ordering = ["created_on"]
    lookup_field = "slug"

    permission_classes = [permissions.AllowAny]

    def get_serializer_class(self):
        """Get serializer for this view based on the current action."""
        if self.action == "list":
            return serializers.PageLiteSerializer
        return super().get_serializer_class()
