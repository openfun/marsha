"""Tests for the `core.utils.lti_select_utils` module."""

from django.test import TestCase, override_settings

from marsha.core.utils.lti_select_utils import get_lti_select_resources


class LtiSelectUtilsTestCase(TestCase):
    """Tests for lti_select_utils module."""

    def setUp(self):
        super().setUp()
        get_lti_select_resources.cache_clear()

    @override_settings(BBB_ENABLED=False)
    @override_settings(MARKDOWN_ENABLED=True)
    def test_get_lti_select_resources(self):
        """return lti select config for enabled marsha apps.

        Settings are overriden to ensure BBB is not enabled and its config
        is not present in the lti_select config.
        Also, markdown is enabled to ensure it is in the config.
        """

        lti_select_config = get_lti_select_resources()
        self.assertNotIn("classroom", lti_select_config)
        self.assertIn("markdown", lti_select_config)
        self.assertIn("video", lti_select_config)
        self.assertIn("document", lti_select_config)
        self.assertIn("webinar", lti_select_config)

    @override_settings(BBB_ENABLED=True)
    def test_get_lti_select_resources_classrooms(self):
        """return lti select config for enabled marsha apps.

        Ensure that BBB/Classroom are the same config.
        """

        lti_select_config = get_lti_select_resources()
        self.assertIn("classroom", lti_select_config)
