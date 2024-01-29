"""Factories for the ``page`` app of the Marsha project."""

import factory
from factory.django import DjangoModelFactory

from marsha.page import models


# usage of format function here is wanted in this file
# pylint: disable=consider-using-f-string
class PageFactory(DjangoModelFactory):
    """Factory for the Page model."""

    class Meta:  # noqa
        model = models.Page

    slug = factory.Faker("slug")
    name = factory.Sequence("Page{:03d}".format)
    content = factory.Faker("paragraph")
    is_published = True
