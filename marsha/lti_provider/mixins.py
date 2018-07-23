from django.contrib.auth import authenticate
try:
    from django.urls import reverse
except ImportError:
    from django.core.urlresolvers import reverse
from django.http.response import HttpResponseRedirect
from marsha.lti_provider.lti import LTI

class LTIAuthMixin(object):
    role_type = 'any'
    request_type = 'any'
    def dispatch(self, request, *args, **kwargs):
        lti = LTI(request, self.request_type, self.role_type)

        # validate the user via oauth
        user = authenticate(request=request, lti=lti)
        if user is None:
            lti.clear_session(request)
            return HttpResponseRedirect(reverse('lti-fail-auth'))

        # configure course groups if requested
        self.lti = lti
        return super(LTIAuthMixin, self).dispatch(request, *args, **kwargs)
