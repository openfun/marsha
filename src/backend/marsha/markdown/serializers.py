"""Structure of Markdown related models API responses with Django Rest Framework serializers."""
from django.urls import reverse

from rest_framework import serializers

from marsha.core.serializers.playlist import PlaylistLiteSerializer
from marsha.core.utils.url_utils import build_absolute_uri_behind_proxy

from .models import MarkdownDocument


class MarkdownPreviewSerializer(serializers.Serializer):
    """A simple serializer for Markdown rendering API."""

    text = serializers.CharField(allow_blank=True, trim_whitespace=False)

    def get_markdown_content(self):
        """Helper to allow easier field name refactor.

        Note: `is_valid` method must be called before.
        """
        return self.validated_data["text"]


class MarkdownDocumentTranslationsSerializer(serializers.ModelSerializer):
    """A serializer to manage documents' translations."""

    class Meta:  # noqa
        # pylint: disable-next=protected-access
        model = MarkdownDocument._parler_meta.root.model
        fields = (
            "language_code",
            "title",
            "content",
            "rendered_content",
        )


class MarkdownDocumentSerializer(serializers.ModelSerializer):
    """A serializer to display a MarkdownDocument resource."""

    class Meta:  # noqa
        model = MarkdownDocument
        fields = (
            "id",
            # document attributes
            "is_draft",
            "rendering_options",
            "translations",
            # playlist attributes
            "playlist",
            "position",
        )
        read_only_fields = (
            "id",
            "lti_id",
            # document attributes
            "translations",
            # playlist attributes
            "playlist",
            "position",
        )

    playlist = PlaylistLiteSerializer(read_only=True)
    translations = MarkdownDocumentTranslationsSerializer(many=True, read_only=True)


class MarkdownDocumentSelectLTISerializer(MarkdownDocumentSerializer):
    """A serializer to display a MarkdownDocument resource for LTI select content request."""

    class Meta:  # noqa
        model = MarkdownDocument
        fields = (
            *MarkdownDocumentSerializer.Meta.fields,
            "lti_id",
            "lti_url",
        )

    lti_url = serializers.SerializerMethodField()

    def get_lti_url(self, obj):
        """LTI Url of the MarkdownDocument.

        Parameters
        ----------
        obj : Type[models.MarkdownDocument]
            The document that we want to serialize

        Returns
        -------
        String
            the LTI url to be used by LTI consumers

        """
        return build_absolute_uri_behind_proxy(
            self.context["request"],
            reverse("markdown:markdown_document_lti_view", args=[obj.id]),
        )
