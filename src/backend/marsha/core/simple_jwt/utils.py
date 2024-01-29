"""Helpers/API for Marsha JWT use"""

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

from marsha.core.utils.react_locales_utils import react_locale


def define_locales(lti) -> str:
    """
    Get locale from LTI to pass to the frontend (React).

    lti: Type[LTI]
        LTI request.

    Returns
    -------
    str
        The locale formatted like xx_XX (eg. `fr_FR`).
    """
    try:
        return (
            react_locale(lti.launch_presentation_locale)
            if lti
            else settings.REACT_LOCALES[0]
        )
    except ImproperlyConfigured:
        return settings.REACT_LOCALES[0]
