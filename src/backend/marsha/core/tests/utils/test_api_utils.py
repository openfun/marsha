"""Tests for the `core.api_utils` module."""

import django.apps
from django.test import TestCase

from marsha.core.models import (
    AudioTrack,
    Document,
    SharedLiveMedia,
    SignTrack,
    Thumbnail,
    TimedTextTrack,
    Video,
)
from marsha.core.utils.api_utils import get_uploadable_models_s3_mapping


class UploadableModelsS3MappingTestCase(TestCase):
    """Test the `get_uploadable_models_s3_mapping` function."""

    def test_get_uploadable_models_s3_mapping(self):
        """
        Simply test the function returns what we expect.

        We only check specific keys to not break when new model with S3 identifier are added.
        """
        mapping = get_uploadable_models_s3_mapping()

        self.assertEqual(mapping["document"], Document)
        self.assertEqual(mapping["sharedlivemedia"], SharedLiveMedia)
        self.assertEqual(mapping["thumbnail"], Thumbnail)
        self.assertEqual(mapping["timedtexttrack"], TimedTextTrack)
        self.assertEqual(mapping["video"], Video)

    def test_models_consistency(self):
        """
        Assert all models with an `upload_state` defines also an `S3_IDENTIFIER`

        For now there are two models which don't:
         - marsha.core.models.video.AudioTrack
         - marsha.core.models.video.SignTrack
        and it's okay like that.
        """
        all_models = django.apps.apps.get_models()
        undefined_s3_identifier = [
            model
            for model in all_models
            if getattr(model, "S3_IDENTIFIER", "has no S3_IDENTIFIER attribute") is None
        ]
        self.assertListEqual(
            undefined_s3_identifier,
            [AudioTrack, SignTrack],
            "All `UploadableFileMixin` models must define an `S3_IDENTIFIER` attribute",
        )
