"""Factories for the ``deposit`` app of the Marsha project."""

import factory
from factory.django import DjangoModelFactory

from marsha.core.factories import PlaylistFactory, UserFactory

from . import models


# usage of format function here is wanted in this file
# pylint: disable=consider-using-f-string


class FileDepositoryFactory(DjangoModelFactory):
    """Factory for the FileDepository model."""

    class Meta:  # noqa
        model = models.FileDepository

    lti_id = factory.Faker("uuid4")
    title = factory.Sequence("FileDepository {:03d}".format)
    description = factory.Faker("paragraph")
    playlist = factory.SubFactory(PlaylistFactory)
    created_by = factory.SubFactory(UserFactory)


class DepositedFileFactory(DjangoModelFactory):
    """Factory for the DepositedFile model."""

    class Meta:
        model = models.DepositedFile

    author_name = factory.Faker("name")
    author_id = factory.Faker("uuid4")
    file_depository = factory.SubFactory(FileDepositoryFactory)
    filename = factory.Faker("file_name")
    size = factory.Faker("pyint", min_value=1, max_value=2**30)
