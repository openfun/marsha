"""Validators for the Marsha project."""
from django.core.exceptions import ValidationError
from django.utils import timezone


def validate_date_is_future(date):
    """Check date is in the future."""
    if date < timezone.now():
        raise ValidationError(
            f"{date} is not a valid date, date should be planned after!"
        )
