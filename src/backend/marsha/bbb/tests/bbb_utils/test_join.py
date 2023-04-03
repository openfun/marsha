"""Tests for the join service in the ``bbb`` app of the Marsha project."""
from django.test import TestCase, override_settings

from marsha.bbb.factories import ClassroomFactory
from marsha.bbb.utils.bbb_utils import join


@override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
@override_settings(BBB_API_SECRET="SuperSecret")
class ClassroomServiceTestCase(TestCase):
    """Test our intentions about the Classroom join service."""

    maxDiff = None

    def test_join(self):
        """Return a meeting join url."""
        classroom = ClassroomFactory()
        api_response = join(classroom, consumer_site_user_id="a_1", fullname="John Doe")
        self.assertIn(
            "https://10.7.7.1/bigbluebutton/api/join?"
            f"fullName=John+Doe&meetingID={classroom.meeting_id}&"
            "role=viewer&userID=a_1&redirect=true",
            api_response.get("url"),
        )
