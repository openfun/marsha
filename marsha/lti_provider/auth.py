from marsha.core.models import User
from nameparser import HumanName
from pylti.common import LTIException


class LTIBackend(object):

    def find_user(self, request, lti):
        username = lti.user_name(request)
        user = User(username=username, password='LTI user')
        user.set_unusable_password()
        user.email = lti.user_email(request) or ''
        name = HumanName(lti.user_fullname(request))
        user.first_name = name.first[:30]
        user.last_name = name.last[:30]
        return user

    def authenticate(self, request, lti):
        try:
            lti.verify(request)
            return self.find_user(request, lti)
        except LTIException:
            lti.clear_session(request)
            return None

