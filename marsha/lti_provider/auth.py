from hashlib import sha1

from marsha.core.models import User
from django.utils.encoding import force_bytes
from nameparser import HumanName
from pylti.common import LTIException


class LTIBackend(object):

    def create_user(self, request, lti, username):
        # create the user if necessary
        user = User(username=username, password='LTI user')
        user.set_unusable_password()
        user.email = lti.user_email(request) or ''

        name = HumanName(lti.user_fullname(request))
        user.first_name = name.first[:30]
        user.last_name = name.last[:30]

        user.save()
        return user

    def get_hashed_username(self, request, lti):
        # (http://developers.imsglobal.org/userid.html)
        # generate a username to avoid overlap with existing system usernames
        # sha1 hash result + trunc to 30 chars should result in a valid
        # username with low-ish-chance of collisions
        uid = force_bytes(lti.consumer_user_id(request))
        return sha1(uid).hexdigest()[:30]

    def get_username(self, request, lti):
        username = lti.user_identifier(request)
        if not username:
            username = self.get_hashed_username(request, lti)
        return username

    def find_user(self, request, lti):
        # find the user via lms identifier first
        user = User.objects.filter(
            username=lti.user_identifier(request)).first()

        # find the user via email address, if it exists
        email = lti.user_email(request)
        if user is None and email:
            user = User.objects.filter(email=email).first()

        if user is None:
            # find the user via hashed username
            username = self.get_hashed_username(request, lti)
            user = User.objects.filter(username=username).first()

        return user

    def find_or_create_user(self, request, lti):
        user = self.find_user(request, lti)
        if user is None:
            username = self.get_username(request, lti)
            user = self.create_user(request, lti, username)

        return user

    def authenticate(self, request, lti):
        try:
            lti.verify(request)
            return self.find_or_create_user(request, lti)
        except LTIException:
            lti.clear_session(request)
            return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
