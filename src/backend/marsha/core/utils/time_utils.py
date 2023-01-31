"""Utils to handle dates and time."""
import calendar
from datetime import datetime

from django.core.exceptions import ValidationError
from django.utils import timezone


def to_timestamp(value):
    """Convert a datetime value to a Unix timestamp.

    Parameters
    ----------
    value: Type[datetime.datetime]
        The Python datetime to convert to a Unix timestamp

    Returns
    --------
    integer or `None`:
        Unix timestamp for the datetime value or `None`

    """
    try:
        return str(calendar.timegm(value.utctimetuple()))
    except (AttributeError, TypeError):
        return None


def to_datetime(value):
    """Convert a Unix timestamp value to a timezone aware datetime.

    Parameters
    ----------
    value: Type[string|integer]
        The Unix timestamp to convert to a Python datetime.

    Returns
    --------
    datetime.datetime or `None`:
        datetime value corresponding to the Unix timestamp or `None`

    Raises
    ------
    ValidationError
        when the value passed in argument is not a valid timestamp

    """
    if value is None:
        return None
    try:
        return datetime.utcfromtimestamp(int(value)).replace(tzinfo=timezone.utc)
    except (ValueError, TypeError) as exc:
        raise ValidationError(f"{value:s} is not a valid Unix timestamp.") from exc
