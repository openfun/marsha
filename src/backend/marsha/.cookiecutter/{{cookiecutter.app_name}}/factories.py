"""Factories for the ``{{cookiecutter.app_name}}`` app of the Marsha project."""

import factory
from factory.django import DjangoModelFactory

from marsha.core.factories import PlaylistFactory

from . import models


# usage of format function here is wanted in this file
# pylint: disable=consider-using-f-string


class {{cookiecutter.model}}Factory(DjangoModelFactory):
    """Factory for the {{cookiecutter.model}} model."""

    class Meta:  # noqa
        model = models.{{cookiecutter.model}}

    lti_id = factory.Faker("uuid4")
    title = factory.Sequence("{{cookiecutter.model}} {:03d}".format)
    description = factory.Faker("paragraph")
    playlist = factory.SubFactory(PlaylistFactory)
