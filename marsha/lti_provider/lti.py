from django.conf import settings
from pylti.common import LTIException, LTINotInSessionException, \
    LTI_SESSION_KEY, verify_request_common, LTIRoleException, \
    LTI_ROLES, LTI_PROPERTY_LIST

from marsha.core.models.account import LTIPassportScope
from django.db.models import Q
import logging
<<<<<<< HEAD
log = logging.getLogger(__name__)
=======
log = logging.getLogger(__name__)  # pylint: disable=invalid-name
LTI_PROPERTY_LIST_EX = getattr(settings,
                               'LTI_PROPERTY_LIST_EX',
                               [
                                   'user_id',
                                   'context_title',
                                   'lis_course_offering_sourcedid',
                                   'context_id'
                               ])

LTI_PROPERTY_USER_USERNAME = getattr(settings,
                                     'LTI_PROPERTY_USER_USERNAME',
                                     'user_id')

>>>>>>> 15e2439a77faa369cd6902d6dce45e1ba595e0c7


class LTI(object):

    """
    LTI Object represents abstraction of current LTI session. It provides
    callback methods and methods that allow developer to inspect
    LTI basic-launch-request.

    This object is instantiated by the LTIMixin
    """

    def __init__(
        self,
        request,
        request_type,
        role_type,
        ):
        self.request_type = request_type
        self.role_type = role_type
        self.request = request

    def clear_session(self, request):
        """
        Invalidate the session
        """

        request.session.flush()

    def initialize_session(self, request, params):

        # All good to go, store all of the LTI params into a
        # session dict for use in views

        for prop in LTI_PROPERTY_LIST:
            if params.get(prop, None):
                request.session[prop] = params[prop]

    def verify(self, request):
        """
        Verify if LTI request is valid, validation
        depends on arguments

        :raises: LTIException
        """

        if self.request_type == 'session':
            self._verify_session(request)
        elif self.request_type == 'initial':
            self._verify_request(request)
        elif self.request_type == 'any':
            self._verify_any(request)
        else:
            raise LTIException('Unknown request type')

        return True

    def _params(self, request):
        if request.method == 'POST':
            return dict(request.POST.items())
        else:
            return dict(request.GET.items())

    def _verify_any(self, request):
        """
        Verify that request is in session or initial request.
        Guess what type of request is being sent over based on
        the request params.

        :raises: LTIException
        """

        # if an oauth_consumer_key is present, assume this is an initial
        # launch request and complete a full verification
        # otherwise, just check the session for the LTI_SESSION_KEY

        params = self._params(request)
        if 'oauth_consumer_key' in params:
            self._verify_request(request)
        else:
            self._verify_session(request)

    @staticmethod
    def _verify_session(request):
        """
        Verify that session was already created

        :raises: LTIException
        """

        if not request.session.get(LTI_SESSION_KEY, False):
            raise LTINotInSessionException('Session expired or unavailable'
                    )

    def _verify_request(self, request):
        """
        Verify LTI request

        :raises: LTIException is request validation failed
        """

        try:
            params = self._params(request)
            verify_request_common(self.consumers(request),
                                  request.build_absolute_uri(),
                                  request.method, request.META, params)
            self._validate_role()

            self.clear_session(request)
            self.initialize_session(request, params)
            request.session[LTI_SESSION_KEY] = True
            return True
        except LTIException:
            self.clear_session(request)
            request.session[LTI_SESSION_KEY] = False
            raise

    def consumers(self, request):
        """
        Gets consumer's map from settings 
        :return: consumers map
        """

        found_consumers = {}

        try:
<<<<<<< HEAD
            consumer_key = self.request.POST.get('oauth_consumer_key',
                    False)
            site_name = self.request.POST.get('resource_link_id', ''
                    ).rsplit('-', 1)[0]

            ltipassscope = \
                LTIPassportScope.objects.filter(Q(lti_passport__oauth_consumer_key=consumer_key,
                    lti_passport__is_enabled=True,
                    consumer_site__name=site_name)
                    | Q(lti_passport__oauth_consumer_key=consumer_key,
                    lti_passport__is_enabled=True,
                    playlist__consumer_site__name=site_name)).first()
            if ltipassscope:
                found_consumers = \
                    {str(ltipassscope.lti_passport.oauth_consumer_key): {'secret': str(ltipassscope.lti_passport.shared_secret)}}
            log.info('found_consumers:{}'.format(found_consumers))
        except Exception as exc:

=======
            #foo = LTIPassport.objects.create(pk="2B99E07E-36D4-4E07-9A6C-8DBEB66DA9BF",deleted="2018-07-09 15:06:33.781507+00",created_on="2018-07-09 15:06:33.781507+00",updated_on="2018-07-09 15:06:33.781507+00",oauth_consumer_key="mykey",shared_secret="mysecret",is_enabled=True)
            key=self.request.POST.get('oauth_consumer_key', False)
            consumer = LTIPassport.objects.get(oauth_consumer_key=key,is_enabled=True)
            ltipassscope=LTIPassportScope.objects.get(lti_passport=consumer)
            if ltipassscope.consumer_site is None and ltipassscope.playlist is None:
                return found_consumers
            site_name=self.request.POST.get('resource_link_id', '').rsplit('-', 1)[0]

            if ltipassscope.consumer_site is not None and site_name!=ltipassscope.consumer_site.name:
                   return found_consumers
            if ltipassscope.consumer_site is None and ltipassscope.playlist is not None and site_name!=ltipassscope.playlist.consumer_site.name:
                   return found_consumers

            found_consumers = {
               str(consumer.oauth_consumer_key): { 'secret': str(consumer.shared_secret)}
            }
        except Exception as exc:
>>>>>>> 15e2439a77faa369cd6902d6dce45e1ba595e0c7
            log.info('error:{}'.format(exc))
            found_consumers = None

        return found_consumers

    def _validate_role(self):
        """
        Check that user is in accepted/specified role

        :exception: LTIException if user is not in roles
        """

        if self.role_type != u'any':
            if self.role_type in LTI_ROLES:
                role_list = LTI_ROLES[self.role_type]

                # find the intersection of the roles

                roles = set(role_list) & set(self.user_roles())
                if len(roles) < 1:
                    raise LTIRoleException('Not authorized.')
            else:
                raise LTIException('Unknown role {}.'.format(self.role_type))

        return True

    def resource_link_id(self, request):
        return request.session.get('resource_link_id', None)

    def consumer_user_id(self, request):
        return '%s-%s' % (self.oauth_consumer_key(request),
                          self.user_id(request))

    def course_context(self, request):
        return request.session.get('context_id', None)

    def course_title(self, request):
        return request.session.get('context_title', None)

    def is_administrator(self, request):
        return 'administrator' in request.session.get('roles', ''
                ).lower()

    def is_student(self, request):
        return 'student' in request.session.get('roles', '').lower()

    def is_instructor(self, request):
        roles = request.session.get('roles', '').lower()
        return 'instructor' in roles or 'staff' in roles

    def lis_outcome_service_url(self, request):
        return request.session.get('lis_outcome_service_url', None)

    def lis_result_sourcedid(self, request):
        return request.session.get('lis_result_sourcedid', None)

    def oauth_consumer_key(self, request):
        return request.session.get('oauth_consumer_key', None)

    def user_email(self, request):
        return request.session.get('lis_person_contact_email_primary',
                                   None)

    def user_fullname(self, request):
        name = request.session.get('lis_person_name_full', None)
        if not name or len(name) < 1:
            name = self.user_id(request)

        return name or ''

    def user_id(self, request):
        return request.session.get('user_id', None)

    def user_name(self, request):
        return request.session.get('lis_person_sourcedid', None)

    def user_roles(self, request):  # pylint: disable=no-self-use
        """
        LTI roles of the authenticated user

        :return: roles
        """

        roles = request.session.get('roles', None)
        if not roles:
            return []
        return roles.lower().split(',')

<<<<<<< HEAD
=======

>>>>>>> 15e2439a77faa369cd6902d6dce45e1ba595e0c7
