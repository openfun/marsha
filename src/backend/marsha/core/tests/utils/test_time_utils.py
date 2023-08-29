"""Test the time utils of the Marsha core app."""
from datetime import datetime, timezone

from django.test import TestCase

from marsha.core.utils import time_utils


class TimeUtilsTestCase(TestCase):
    """Test our time utils."""

    def test_utils_time_utils_to_timestamp(self):
        """Test computing a Unix timestamp from a datetime value."""
        value = datetime(2018, 8, 8, tzinfo=timezone.utc)
        self.assertEqual(time_utils.to_timestamp(value), "1533686400")

    def test_utils_time_utils_to_timestamp_none(self):
        """Trying to compute a Unix timestamp from a null value should return None."""
        self.assertIsNone(time_utils.to_timestamp(None))

    def test_utils_time_utils_to_datetime(self):
        """Test computing a time-aware datetime from a Unix timestamp."""
        self.assertEqual(
            time_utils.to_datetime(1533686400),
            datetime(2018, 8, 8, tzinfo=timezone.utc),
        )

    def test_utils_time_utils_to_datetime_none(self):
        """Trying to compute a datetime from a Unix timestamp should return None."""
        self.assertIsNone(time_utils.to_datetime(None))
