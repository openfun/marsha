"""Custom template tags and filters."""

from django import template

from pylti.common import LTINotInSessionException

from marsha.lti_provider.lti import LTI


register = template.Library()


@register.simple_tag
def lti_session(request):
    """Create LTI session.

    Arguments:
        request(django.http.request): the request that stores the LTI parameters in the session
    Returns:
        marsha.lti_provider.lti: LTI object
    """
    try:
        lti = LTI(request, "session", "any")
    except LTINotInSessionException:
        return None
    else:
        if lti.verify(request):
            return lti
        return None
