from django.test import TestCase, override_settings

from transcode_api.utils.resolutions import (
    compute_resolutions_to_transcode,
    is_odd,
    to_even,
)


@override_settings(
    TRANSCODING_RESOLUTIONS_240P=True,
    TRANSCODING_RESOLUTIONS_360P=True,
    TRANSCODING_RESOLUTIONS_480P=True,
    TRANSCODING_RESOLUTIONS_720P=True,
)
class ResolutionsTestCase(TestCase):
    """Test the resolutions utils file."""
    
    def test_to_even(self):
        """Should return an even number."""
        self.assertEqual(to_even(3), 4)
        self.assertEqual(to_even(4), 4)
        self.assertEqual(to_even(5), 6)

    def test_is_odd(self):
        """Should return True if the number is odd."""
        self.assertTrue(is_odd(3))
        self.assertFalse(is_odd(4))
        self.assertTrue(is_odd(5))

    def test_compute_resolutions_to_transcode(self):
        """Should return the lower resolutions to transcode related to settings."""
        resolutions = compute_resolutions_to_transcode(
            input_resolution=720,
            include_input=False,
            strict_lower=False,
            has_audio=True,
        )
        self.assertEqual(resolutions, [240, 360, 480, 720])

    def test_compute_resolutions_to_transcode_include_input(self):
        """Should return the all resolutions to transcode related to settings."""
        resolutions = compute_resolutions_to_transcode(
            input_resolution=1080,
            include_input=True,
            strict_lower=False,
            has_audio=True,
        )
        self.assertEqual(resolutions, [240, 360, 480, 720, 1080])

    def test_compute_resolutions_to_transcode_strict_lower(self):
        """Should return the strict lower resolutions to transcode related to settings."""
        resolutions = compute_resolutions_to_transcode(
            input_resolution=720,
            include_input=False,
            strict_lower=True,
            has_audio=True,
        )
        self.assertEqual(resolutions, [240, 360, 480])

    def test_compute_resolutions_to_transcode_no_audio(self):
        """Should return the lower resolutions to transcode related to settings."""
        resolutions = compute_resolutions_to_transcode(
            input_resolution=720,
            include_input=False,
            strict_lower=False,
            has_audio=False,
        )
        self.assertEqual(resolutions, [240, 360, 480, 720])
