"""Factories for the ``markdown`` app of the Marsha project."""

from django.conf import settings
from django.utils import lorem_ipsum

import factory
from factory.django import DjangoModelFactory

from marsha.core.factories import PlaylistFactory
from marsha.markdown import models


# usage of format function here is wanted in this file
# pylint: disable=consider-using-f-string
class MarkdownDocumenTranslationFactory(DjangoModelFactory):
    """Factory for the Markdown document's translation model."""

    class Meta:  # noqa
        # pylint: disable-next=protected-access
        model = models.MarkdownDocument._parler_meta.root.model

    master = factory.SubFactory(
        "marsha.markdown.factories.MarkdownDocumentFactory", translations=None
    )

    # Only translate in one language for test purpose
    language_code = settings.LANGUAGES[0][0]  # en
    title = factory.Sequence("Markdown Document's title {:03d}".format)
    content = lorem_ipsum.sentence()
    rendered_content = lorem_ipsum.sentence()


class MarkdownDocumentFactory(DjangoModelFactory):
    """Factory for the Markdown document model."""

    class Meta:  # noqa
        model = models.MarkdownDocument
        skip_postgeneration_save = True

    lti_id = factory.Faker("uuid4")
    playlist = factory.SubFactory(PlaylistFactory)

    translations = factory.RelatedFactory(
        MarkdownDocumenTranslationFactory,
        factory_related_name="master",
    )


class MarkdownImageFactory(DjangoModelFactory):
    """Factory for the MarkdownImage model."""

    markdown_document = factory.SubFactory(MarkdownDocumentFactory)
    extension = factory.fuzzy.FuzzyChoice([None, "jpg", "jpeg", "png", "gif"])

    class Meta:  # noqa
        model = models.MarkdownImage
