"""Structure of ``page`` related models API responses with Django Rest Framework serializers."""

from rest_framework import serializers

from .models import Page


class PageSerializer(serializers.ModelSerializer):
    """A serializer to list Page"""

    class Meta:  # noqa
        model = Page
        fields = (
            "slug",
            "name",
            "content",
        )


class PageLiteSerializer(serializers.ModelSerializer):
    """A serializer to list Page"""

    class Meta:  # noqa
        model = Page
        fields = (
            "slug",
            "name",
        )
