"""Structure of {{cookiecutter.app_name}} related models API responses with Django Rest Framework serializers."""
from django.urls import reverse

from rest_framework import serializers

from marsha.core.serializers.playlist import PlaylistLiteSerializer

from .models import {{cookiecutter.model}}


class {{cookiecutter.model}}Serializer(serializers.ModelSerializer):
    """A serializer to display a {{cookiecutter.model}} resource."""

    class Meta:  # noqa
        model = {{cookiecutter.model}}
        fields = (
            "id",
            "lti_id",
            "title",
            "description",
            "playlist",
        )
        read_only_fields = (
            "id",
            "lti_id",
            "playlist",
        )

    playlist = PlaylistLiteSerializer(read_only=True)


class {{cookiecutter.model}}SelectLTISerializer({{cookiecutter.model}}Serializer):
    """A serializer to display a {{cookiecutter.model}} resource for LTI select content request."""

    class Meta:  # noqa
        model = {{cookiecutter.model}}
        fields = (
            "id",
            "lti_id",
            "lti_url",
            "title",
            "description",
            "playlist",
        )

    lti_url = serializers.SerializerMethodField()

    def get_lti_url(self, obj):
        """LTI Url of the {{cookiecutter.model}}.

        Parameters
        ----------
        obj : Type[models.Document]
            The document that we want to serialize

        Returns
        -------
        String
            the LTI url to be used by LTI consumers

        """
        return self.context["request"].build_absolute_uri(
            reverse("{{cookiecutter.app_name}}:{{cookiecutter.model_lower}}_lti_view", args=[obj.id]),
        )
