"""Backend for authenticating users via an LTI launch URL."""

from nameparser import HumanName
from pylti.common import LTIException

from marsha.core.models import User


class LTIBackend:
    """Check the request.

    If the request is an LTI launch request, then this class attempts to
    authenticate the username and signature passed in the POST data. If
    authentication is successful, the user is automatically logged. If
    the request is not an LTI launch request, do nothing.

    """

    def find_user(self, request, lti):
        """Retrieve user information from LTI parameters and create a User object.

        Arguments:
            request(django.http.request): the request that stores the LTI parameters in the session
            lti(marsha.lti_provider.lti): abstraction of current LTI session
        Returns:
            marsha.core.models.User: user object
        """
        username = lti.user_name(request)
        user = User(username=username, password="LTI user")
        user.set_unusable_password()
        user.email = lti.user_email(request) or ""
        name = HumanName(lti.user_fullname(request))
        user.first_name = name.first[:30]
        user.last_name = name.last[:30]
        return user

    def authenticate(self, request, lti):
        """Check the LTI request and create User object.

        Arguments:
            request(django.http.request): the request that stores the LTI parameters in the session
            lti(marsha.lti_provider.lti): abstraction of current LTI session
        Returns:
            marsha.core.models.User: user object
        """
        try:
            lti.verify(request)
            return self.find_user(request, lti)
        except LTIException:
            lti.clear_session(request)
            return None
