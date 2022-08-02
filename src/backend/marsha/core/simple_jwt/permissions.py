"""Module for the permissions linked to Marsha's JWT"""
from dataclasses import asdict, dataclass


@dataclass
class ResourceAccessPermissions:
    """Permissions which can be provided in ResourceAccessToken"""

    can_access_dashboard: bool = False
    can_update: bool = False

    def as_dict(self):
        """
        Return permissions as a dict.
        This prevents importing `dataclasses.asdict` everywhere.
        """
        return asdict(self)
