"""Structure of deposit related models API responses with Django Rest Framework serializers."""

import mimetypes
from os.path import splitext

from django.conf import settings
from django.urls import reverse

from rest_framework import serializers

from marsha.core.defaults import AWS_STORAGE_BASE_DIRECTORY, SCW_S3
from marsha.core.models import User
from marsha.core.serializers import (
    BaseInitiateUploadSerializer,
    UploadableFileWithExtensionSerializerMixin,
)
from marsha.core.serializers.playlist import PlaylistLiteSerializer
from marsha.core.storage.storage_class import file_storage
from marsha.deposit.models import DepositedFile, FileDepository


class DepositedFileSerializer(
    UploadableFileWithExtensionSerializerMixin,
    serializers.ModelSerializer,
    BaseInitiateUploadSerializer,
):
    """A serializer to display a deposited file."""

    class Meta:  # noqa
        model = DepositedFile
        fields = (
            "filename",
            "author_name",
            "id",
            "file_depository_id",
            "read",
            "url",
            "uploaded_on",
            "upload_state",
            "size",
        )
        read_only_fields = (
            "id",
            "file_depository_id",
            "url",
            "uploaded_on",
            "upload_state",
        )

    # file_depository = FileDepositorySerializer(read_only=True)
    # filename = serializers.SerializerMethodField()
    url = serializers.SerializerMethodField()
    # Make sure file depository UUID is converted to a string during serialization
    file_depository_id = serializers.PrimaryKeyRelatedField(
        read_only=True, pk_field=serializers.CharField()
    )

    @property
    def max_upload_file_size(self):
        """return the deposited max file size define in the settings.

        The @property decorator is used to ease the use of @override_settings
        in tests. Otherwise the setting is not changed and we can't easily test
        an upload with a size higher than the one defined in the settings
        """
        return settings.DEPOSITED_FILE_SOURCE_MAX_SIZE

    def create(self, validated_data):
        """Force the file depository field to the file depository of the JWT Token if any,
        and set the author name to the username of the JWT Token if any.

        Parameters
        ----------
        validated_data : dictionary
            Dictionary of the deserialized values of each field after validation.

        Returns
        -------
        dictionary
            The "validated_data" dictionary is returned after modification.

        """
        resource = self.context["request"].resource
        user = self.context["request"].user
        file_depository_id = self.context["view"].get_related_filedepository_id()

        if not validated_data.get("file_depository_id"):
            validated_data["file_depository_id"] = file_depository_id

        if resource:
            validated_data["author_id"] = resource.user.get("id")

            # try to get the most useful username from the token
            if resource.user:
                if author_name := (
                    resource.user.get("user_fullname") or resource.user.get("username")
                ):
                    validated_data["author_name"] = author_name
        else:
            validated_data["author_id"] = user.id
            validated_data["author_name"] = User.objects.get(id=user.id).username

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

    def get_url(self, obj):
        """Url of the DepositedFile.

        Parameters
        ----------
        obj : Type[models.DepositedFile]
            The deposited file that we want to serialize

        Returns
        -------
        String or None
            the url to fetch the deposited file on storage
            None if the deposited file is still not uploaded to S3 with success

        """
        if not obj.uploaded_on:
            return None

        if obj.storage_location == SCW_S3:
            file_key = obj.get_storage_key(obj.filename)

            return file_storage.url(file_key)

        file_key = obj.get_storage_key(
            obj.filename, base_dir=AWS_STORAGE_BASE_DIRECTORY
        )
        return file_storage.url(file_key)


class DepositedFileInitiateUploadSerializer(BaseInitiateUploadSerializer):
    """An initiate-upload serializer dedicated to deposited file."""

    @property
    def max_upload_file_size(self):
        """return the deposited max file size define in the settings.

        The @property decorator is used to ease the use of @override_settings
        in tests. Otherwise the setting is not changed and we can't easily test
        an upload with a size higher than the one defined in the settings
        """
        return settings.DEPOSITED_FILE_SOURCE_MAX_SIZE

    def validate_filename(self, value):
        """Check if the filename is valid."""
        if "/" in value or "\\" in value:
            raise serializers.ValidationError("Filename must not contain slashes.")

        if value.startswith("."):
            raise serializers.ValidationError("Filename must not start with a dot.")

        if len(value) > 255:
            raise serializers.ValidationError("Filename is too long.")

        return value

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


class DepositedFileUploadEndedSerializer(serializers.Serializer):
    """A serializer to validate data submitted on the UploadEnded API endpoint."""

    file_key = serializers.CharField()

    def validate_file_key(self, value):
        """Check if the file_key is valid."""
        filename = value.split("/")[-1]
        _, extension = splitext(filename)

        if not extension:
            raise serializers.ValidationError("Filename must include an extension.")

        if self.context["obj"].get_storage_key(filename=filename) != value:
            raise serializers.ValidationError("file_key is not valid")

        return value


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
        return self.context["request"].build_absolute_uri(
            reverse("deposit:file_depository_lti_view", args=[obj.id]),
        )
