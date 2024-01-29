"""Test delete_outdated_classrooms command."""

from datetime import date, datetime, timezone as baseTimezone
from unittest.mock import patch

from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from marsha.bbb.factories import ClassroomFactory
from marsha.bbb.models import Classroom


class DeleteOutdatedClassroomsTestCase(TestCase):
    """
    Test case for the delete_outdated_classrooms command.
    """

    def setUp(self):
        """
        Set up the test case with classrooms.
        """

        self.classroom_1 = ClassroomFactory(
            retention_date=date(2022, 1, 1),
        )
        self.classroom_2 = ClassroomFactory(
            retention_date=date(2021, 1, 1),
        )
        self.classroom_3 = ClassroomFactory(
            retention_date=date(2023, 1, 1),
        )
        self.classroom_4 = ClassroomFactory()

    def test_delete_outdated_videos(self):
        """
        Test the delete_outdated_classrooms command.
        """
        with patch.object(
            timezone, "now", return_value=datetime(2022, 1, 2, tzinfo=baseTimezone.utc)
        ):
            call_command("delete_outdated_classrooms")
            self.assertEqual(Classroom.objects.count(), 2)

            self.classroom_1.refresh_from_db()
            self.assertIsNotNone(self.classroom_1.deleted)

            self.classroom_2.refresh_from_db()
            self.assertIsNotNone(self.classroom_2.deleted)

            self.classroom_3.refresh_from_db()
            self.assertIsNone(self.classroom_3.deleted)

            self.classroom_4.refresh_from_db()
            self.assertIsNone(self.classroom_4.deleted)
