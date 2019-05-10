"""Exceptions module."""


class MissingUserIdError(Exception):
    """Error raised if the user_id is missing when enriching xAPI statement."""
