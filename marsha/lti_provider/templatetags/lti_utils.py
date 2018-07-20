from django import template
from marsha.lti_provider.lti import LTI
from pylti.common import LTINotInSessionException

register = template.Library()


@register.simple_tag
def lti_session(request):
    try:
        lti = LTI('session', 'any')
        if lti.verify(request):
            return lti
    except LTINotInSessionException:
        return None
