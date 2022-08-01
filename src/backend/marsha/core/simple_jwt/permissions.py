"""Module for the permissions linked to Marsha's JWT"""
from dataclasses import dataclass


@dataclass
class ResourceAccessPermissions:
    """Permissions which can be provided in ResourceAccessToken"""

    can_access_dashboard: bool = False
    can_update: bool = False
