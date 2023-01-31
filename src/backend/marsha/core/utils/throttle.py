"""Throttle Decorator module."""
from datetime import datetime, timedelta
from functools import wraps


class throttle:  # pylint: disable=invalid-name
    """
    Throttle Decorator
    Limit execution of a function to a defined interval
    """

    def __init__(self, interval):
        """
        Initialize throttle decorator
        Define the throttle_interval with the provided interval (in seconds)
        and set time_of_last_call to the earliest representable datetime
        """
        self.throttle_interval = timedelta(seconds=interval)
        self.time_of_last_call = datetime.min

    def __call__(self, callback):
        """
        Process `elapsed_since_last_call`,
        if it is greater than `throttle_interval`, callback is executed.
        """

        @wraps(callback)
        def wrapper(*args, **kwargs):
            now = datetime.now()
            elapsed_since_last_call = now - self.time_of_last_call

            if elapsed_since_last_call > self.throttle_interval:
                self.time_of_last_call = now
                return callback(*args, **kwargs)

            return None

        return wrapper
