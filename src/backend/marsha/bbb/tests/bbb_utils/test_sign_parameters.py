"""Tests for the sign_parameters service in the ``bbb`` app of the Marsha project."""

from django.test import TestCase, override_settings

from marsha.bbb.utils.bbb_utils import sign_parameters


@override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
@override_settings(BBB_API_SECRET="SuperSecret")
class ClassroomServiceTestCase(TestCase):
    """Test our intentions about the Classroom sign_parameters service."""

    maxDiff = None

    def test_sign_parameters(self):
        """Build params for BBB server request."""
        parameters = {
            "fullName": "User 7585026",
            "meetingID": "random - 8619987",
            "password": "ap",
            "redirect": "false",
        }
        self.assertEqual(
            {
                "fullName": "User 7585026",
                "meetingID": "random - 8619987",
                "password": "ap",
                "redirect": "false",
                "checksum": "26390c020c085ddf328305d33bbdf96ba22244b1",
            },
            sign_parameters(action="join", parameters=parameters),
        )
