from django import template

from pylti.common import LTINotInSessionException

from marsha.lti_provider.lti import LTI


register = template.Library()


@register.simple_tag
def lti_session(request):
    try:
        lti = LTI(request, "session", "any")
        if lti.verify(request):
            return lti
    except LTINotInSessionException:
        return None
