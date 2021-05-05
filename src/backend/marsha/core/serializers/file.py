"""Structure of Document related models API responses with Django Rest Framework serializers."""
from datetime import timedelta
import re
from urllib.parse import quote_plus

from django.conf import settings
from django.urls import reverse
from django.utils import timezone
from django.utils.text import slugify

from botocore.signers import CloudFrontSigner
from rest_framework import serializers

from ..models import Document
from ..utils import cloudfront_utils, time_utils
from ..utils.url_utils import build_absolute_uri_behind_proxy
from .base import EXTENSION_REGEX, TimestampField
from .playlist import PlaylistLiteSerializer


class DocumentSerializer(serializers.ModelSerializer):
    """A serializer to display a Document resource."""

    class Meta:  # noqa
        model = Document
        fields = (
            "active_stamp",
            "extension",
            "filename",
            "id",
            "is_ready_to_show",
            "title",
            "upload_state",
            "url",
            "show_download",
            "playlist",
        )
        read_only_fields = (
            "active_stamp",
            "extension",
            "filename",
            "id",
            "is_ready_to_show",
            "upload_state",
            "url",
        )

    active_stamp = TimestampField(
        source="uploaded_on", required=False, allow_null=True, read_only=True
    )
    filename = serializers.SerializerMethodField()
    url = serializers.SerializerMethodField()
    is_ready_to_show = serializers.BooleanField(read_only=True)
    playlist = PlaylistLiteSerializer(read_only=True)

    def _get_extension_string(self, obj):
        """Document extension with the leading dot.

        Parameters
        ----------
        obj : Type[models.Document]
            The document that we want to serialize

        Returns
        -------
        String
            The document with the leading dot if the document has an extension
            An empty string otherwise

        """
        return "." + obj.extension if obj.extension else ""

    def get_filename(self, obj):
        """Filename of the Document.

        Parameters
        ----------
        obj : Type[models.Document]
            The document that we want to serialize

        Returns
        -------
        String
            The document's filename

        """
        return "{playlist_title:s}_{title:s}{extension:s}".format(
            playlist_title=slugify(obj.playlist.title),
            title=slugify(obj.title),
            extension=self._get_extension_string(obj),
        )

    def get_url(self, obj):
        """Url of the Document.

        Parameters
        ----------
        obj : Type[models.Document]
            The document that we want to serialize

        Returns
        -------
        String or None
            the url to fetch the document on CloudFront
            None if the document is still not uploaded to S3 with success

        """
        if obj.uploaded_on is None:
            return None

        url = (
            "{protocol:s}://{cloudfront:s}/{pk!s}/document/{stamp:s}{extension:s}"
            "?response-content-disposition={content_disposition:s}"
        ).format(
            protocol=settings.AWS_S3_URL_PROTOCOL,
            cloudfront=settings.CLOUDFRONT_DOMAIN,
            pk=obj.pk,
            stamp=time_utils.to_timestamp(obj.uploaded_on),
            content_disposition=quote_plus(
                "attachment; filename=" + self.get_filename(obj)
            ),
            extension=self._get_extension_string(obj),
        )

        # Sign the document urls only if the functionality is activated
        if settings.CLOUDFRONT_SIGNED_URLS_ACTIVE:
            date_less_than = timezone.now() + timedelta(
                seconds=settings.CLOUDFRONT_SIGNED_URLS_VALIDITY
            )
            cloudfront_signer = CloudFrontSigner(
                settings.CLOUDFRONT_ACCESS_KEY_ID, cloudfront_utils.rsa_signer
            )
            url = cloudfront_signer.generate_presigned_url(
                url, date_less_than=date_less_than
            )

        return url

    def validate_title(self, value):
        """Force extension removal in the title field (if any).

        Parameters
        ----------
        value : Type[string]
            the value sent in the request

        Returns
        -------
        String
            The title without the extension if there is one.

        """
        match = re.match(
            r"^(?P<title>.*)(\.{extension_regex:s})$".format(
                extension_regex=EXTENSION_REGEX
            ),
            value,
        )
        if match:
            return match.group("title")

        return value


class DocumentSelectLTISerializer(serializers.ModelSerializer):
    """A serializer to display a Document resource for LTI select content request."""

    class Meta:  # noqa
        model = Document
        fields = (
            "id",
            "is_ready_to_show",
            "title",
            "upload_state",
            "lti_url",
        )
        read_only_fields = (
            "id",
            "is_ready_to_show",
            "title",
            "upload_state",
            "lti_url",
        )

    is_ready_to_show = serializers.BooleanField(read_only=True)
    lti_url = serializers.SerializerMethodField()

    def get_lti_url(self, obj):
        """LTI Url of the Document.

        Parameters
        ----------
        obj : Type[models.Document]
            The document that we want to serialize

        Returns
        -------
        String
            the LTI url to be used by LTI consumers

        """
        return build_absolute_uri_behind_proxy(
            self.context["request"],
            reverse("document_lti_view", args=[obj.id]),
        )


class InitiateUploadSerializer(serializers.Serializer):
    """A serializer to validate data submitted on the initiate-upload API endoint."""

    filename = serializers.CharField()
    mimetype = serializers.CharField(allow_blank=True)
