"""Test suite for Marsha validators."""
from datetime import timedelta

from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone

from ..validators import validate_date_is_future


class TestValidators(TestCase):
    """Test validators method."""

    def test_validate_date_is_future(self):
        """The validator should not raise any exception if the date is in the future."""
        date = timezone.now() + timedelta(days=5)
        validate_date_is_future(date)

    def test_validate_date_is_future_with_now(self):
        """The validator should raise exception if the date is set to now."""
        now = timezone.now()

        with self.assertRaises(ValidationError) as error:
            validate_date_is_future(now)

        self.assertEqual(
            error.exception.messages,
            [f"{now} is not a valid date, date should be planned after!"],
        )

    def test_validate_date_is_future_with_date_in_the_past(self):
        """The validator should raise exception if the date is in the past."""
        date = timezone.now() - timedelta(days=5)
        with self.assertRaises(ValidationError) as error:
            validate_date_is_future(date)

        self.assertEqual(
            error.exception.messages,
            [f"{date} is not a valid date, date should be planned after!"],
        )
