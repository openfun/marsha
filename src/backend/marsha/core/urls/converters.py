"""Marsha module managing urls converters."""

from django.urls.converters import StringConverter


class XAPIResourceKindConverter(StringConverter):
    """Converter used with the xapi url to match a resource_kind"""

    regex = "video|document"
