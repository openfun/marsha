"""Structure of deposit related models API responses with Django Rest Framework serializers."""
from datetime import timedelta
import mimetypes
from os.path import splitext
from urllib.parse import quote_plus

from django.conf import settings
from django.urls import reverse
from django.utils import timezone

from botocore.signers import CloudFrontSigner
from rest_framework import serializers
from rest_framework_simplejwt.models import TokenUser

from marsha.core.serializers import (
    InitiateUploadSerializer,
    UploadableFileWithExtensionSerializerMixin,
)
from marsha.core.serializers.playlist import PlaylistLiteSerializer
from marsha.core.utils import cloudfront_utils, time_utils
from marsha.core.utils.url_utils import build_absolute_uri_behind_proxy

from .models import DepositedFile, FileDepository


class DepositedFileSerializer(
    UploadableFileWithExtensionSerializerMixin, serializers.ModelSerializer
):
    """A serializer to display a deposited file."""

    class Meta:  # noqa
        model = DepositedFile
        fields = (
            "filename",
            "id",
            "file_depository",
            "read",
            "url",
            "uploaded_on",
            "upload_state",
        )
        read_only_fields = (
            "id",
            "file_depository",
            "url",
            "uploaded_on",
            "upload_state",
        )

    # file_depository = FileDepositorySerializer(read_only=True)
    # filename = serializers.SerializerMethodField()
    url = serializers.SerializerMethodField()
    # Make sure file depository UUID is converted to a string during serialization
    file_depository = serializers.PrimaryKeyRelatedField(
        read_only=True, pk_field=serializers.CharField()
    )

    def create(self, validated_data):
        """Force the file depository field to the file depository of the JWT Token if any.

        Parameters
        ----------
        validated_data : dictionary
            Dictionary of the deserialized values of each field after validation.

        Returns
        -------
        dictionary
            The "validated_data" dictionary is returned after modification.

        """
        # user here is a file depository as it comes from the JWT
        # It is named "user" by convention in the `rest_framework_simplejwt` dependency we use.
        user = self.context["request"].user
        # Set the file depository field from the payload if there is one and the user is identified
        # as a proper user object through access rights
        if (
            self.initial_data.get("file_depository")
            and user.token.get("user")
            and user.token["resource_id"] == user.token.get("user", {}).get("id")
        ):
            validated_data["file_depository"] = self.initial_data.get("file_depository")
        # If the user just has a token for a video, force the video ID on the shared live media
        if not validated_data.get("file_depository_id") and isinstance(user, TokenUser):
            validated_data["file_depository_id"] = user.id
        return super().create(validated_data)

    def _get_extension_string(self, obj):
        """Deposited file extension with the leading dot.

        Parameters
        ----------
        obj : Type[models.DepositedFile]
            The deposited file that we want to serialize

        Returns
        -------
        String
            The extension with the leading dot if the deposited file has an extension
            An empty string otherwise

        """
        return "." + obj.extension if obj.extension else ""

    # def get_filename(self, obj):
    #     """Filename of the deposited file."""
    #     return self._get_filename(obj.title) if obj.uploaded_on else None

    def get_url(self, obj):
        """Url of the DepositedFile.

        Parameters
        ----------
        obj : Type[models.DepositedFile]
            The deposited file that we want to serialize

        Returns
        -------
        String or None
            the url to fetch the deposited file on CloudFront
            None if the deposited file is still not uploaded to S3 with success

        """
        if obj.uploaded_on is None:
            return None

        url = (
            f"{settings.AWS_S3_URL_PROTOCOL}://{settings.CLOUDFRONT_DOMAIN}/"
            f"{obj.file_depository.pk}/depositedfile/{obj.pk}/"
            f"{time_utils.to_timestamp(obj.uploaded_on)}{self._get_extension_string(obj)}?response"
            f"-content-disposition={quote_plus('attachment; filename=' + obj.filename)}"
        )

        # Sign the deposited file urls only if the functionality is activated
        if settings.CLOUDFRONT_SIGNED_URLS_ACTIVE:
            date_less_than = timezone.now() + timedelta(
                seconds=settings.CLOUDFRONT_SIGNED_URLS_VALIDITY
            )
            cloudfront_signer = CloudFrontSigner(
                settings.CLOUDFRONT_SIGNED_PUBLIC_KEY_ID, cloudfront_utils.rsa_signer
            )
            url = cloudfront_signer.generate_presigned_url(
                url, date_less_than=date_less_than
            )

        return url


class DepositedFileInitiateUploadSerializer(InitiateUploadSerializer):
    """An initiate-upload serializer dedicated to deposited file."""

    def validate(self, attrs):
        """Validate if the mimetype is allowed or not."""
        # mimetype is provided, we directly check it
        if attrs["mimetype"] != "":
            attrs["extension"] = mimetypes.guess_extension(attrs["mimetype"])

        # mimetype is not provided, we have to guess it from the extension
        else:
            mimetypes.init()
            extension = splitext(attrs["filename"])[1]
            mimetype = mimetypes.types_map.get(extension)
            # extension is added to the data in order to be used later
            attrs["extension"] = extension
            attrs["mimetype"] = mimetype

        return attrs


class FileDepositorySerializer(serializers.ModelSerializer):
    """A serializer to display a FileDepository resource."""

    class Meta:  # noqa
        model = FileDepository
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


class FileDepositorySelectLTISerializer(FileDepositorySerializer):
    """A serializer to display a FileDepository resource for LTI select content request."""

    class Meta:  # noqa
        model = FileDepository
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
        """LTI Url of the FileDepository.

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
            reverse("deposit:file_depository_lti_view", args=[obj.id]),
        )
