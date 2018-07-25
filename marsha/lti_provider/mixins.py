"""Mixin for the ``lti_provider`` app of the Marsha project."""

from django.contrib.auth import authenticate
from django.http.response import HttpResponseRedirect

from marsha.lti_provider.lti import LTI


try:
    from django.urls import reverse
except ImportError:
    from django.core.urlresolvers import reverse


class LTIAuthMixin:
    """Validate the user and return authentication failure if the user is invalid."""

    role_type = "any"
    request_type = "any"

    def dispatch(self, request, *args, **kwargs):
        """Validate the user via oauth in order to redirect him to the correct url.

        Arguments:
            request(django.http.request): the request that stores the LTI parameters in the session
            args: arguments
            kwargs: arguments
        Returns:
            url: dispatched url.
        """
        lti = LTI(request, self.request_type, self.role_type)

        # validate the user via oauth
        user = authenticate(request=request, lti=lti)
        if user is None:
            lti.clear_session(request)
            return HttpResponseRedirect(reverse("lti-fail-auth"))

        self.lti = lti
        return super(LTIAuthMixin, self).dispatch(request, *args, **kwargs)
