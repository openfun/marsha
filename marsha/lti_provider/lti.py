"""LTI module that supports LTI 1.0."""

from django.db.models import Q

from pylti.common import (
    LTI_PROPERTY_LIST,
    LTI_ROLES,
    LTI_SESSION_KEY,
    LTIException,
    LTINotInSessionException,
    LTIRoleException,
    verify_request_common,
)

from marsha.core.models.account import LTIPassportScope


class LTI:
    """This object is instantiated by the LTIMixin.

    LTI Object represents abstraction of current LTI session. It provides
    callback methods and methods that allow developer to inspect
    LTI basic-launch-request.
    """

    def __init__(self, request, request_type, role_type):
        """Initialize the LTI system.

        Arguments:
            request(django.http.request): the request that stores the LTI parameters in the session
            request_type(String): type of request (generally ``any``)
            role_type(String): user's role (generally ``any``)
        """
        self.request_type = request_type
        self.role_type = role_type
        self.request = request

    def clear_session(self, request):
        """Clear the session.

        Arguments:
            request(request): request is used to access the parameters stored in the session
        """
        request.session.flush()

    def initialize_session(self, request, params):
        """Initialize the session.

        Store all of the LTI params into a session dict for use in views.

        Arguments:
            request(request): request is used to access the parameters stored in the session
            params(params): contains all custom LTI parameters
        """
        for prop in LTI_PROPERTY_LIST:
            if params.get(prop, None):
                request.session[prop] = params[prop]

    def verify(self, request):
        """Verify if the LTI request is valid, validation depends on arguments.

        Arguments:
            request(request): request is used to access the parameters stored in the session
        Raises:
           LTIException: if suffix cannot be parsed or is not in its expected form
        Returns:
           boolean: True if request type is valid
        """
        if self.request_type == "session":
            self._verify_session(request)
        elif self.request_type == "initial":
            self._verify_request(request)
        elif self.request_type == "any":
            self._verify_any(request)
        else:
            raise LTIException("Unknown request type")

        return True

    def _params(self, request):
        """Return the HTTP parameters.

        Arguments:
            request(request): request is used to access the parameters stored in the session
        Returns:
            dict: a dictionary object containing all given HTTP parameters
                  (for POST and GET methods)
        """
        if request.method == "POST":
            return dict(request.POST.items())
        return dict(request.GET.items())

    def _verify_any(self, request):
        """Verify that request is in session or initial request.

        if an oauth_consumer_key is present, assume this is an initial
        launch request and complete a full verification
        otherwise, just check the session for the LTI_SESSION_KEY.

        Arguments:
            request(request): request is used to access the parameters stored in the session
        """
        params = self._params(request)
        if "oauth_consumer_key" in params:
            self._verify_request(request)
        else:
            self._verify_session(request)

    @staticmethod
    def _verify_session(request):
        """Verify that session was already created.

        Arguments:
            request(request): request is used to access the parameters stored in the session
        Raises:
            LTINotInSessionException: if suffix cannot be parsed or is not in its expected form
        """
        if not request.session.get(LTI_SESSION_KEY, False):
            raise LTINotInSessionException("Session expired or unavailable")

    def _verify_request(self, request):
        """Verify LTI request.

        LTIException if request validation failed.

        Arguments:
            request(request): request is used to access the parameters stored in the session
        Raises:
            LTIException: LTI Exception
        Returns:
            Boolean: True if request is valid
        """
        try:
            params = self._params(request)
            verify_request_common(
                self.consumers(request),
                request.build_absolute_uri(),
                request.method,
                request.META,
                params,
            )
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
        """Get consumer list from DB.

        Arguments:
            request(request): request is used to access the parameters stored in the session
        Returns:
            JSON: consumer list
        """
        found_consumers = {}

        try:
            # get consumer_key
            consumer_key = self.get_post_or_get(request).get(
                "oauth_consumer_key", False
            )

            # get consumer sitename
            site_name = self.consumer_sitename(request)

            # find ltipassscope related to either the customersite or the playlist
            # while checking the sitename retrieved from the lti request
            ltipassscope = LTIPassportScope.objects.filter(
                Q(
                    lti_passport__oauth_consumer_key=consumer_key,
                    lti_passport__is_enabled=True,
                    consumer_site__name=site_name,
                )
                | Q(
                    lti_passport__oauth_consumer_key=consumer_key,
                    lti_passport__is_enabled=True,
                    playlist__consumer_site__name=site_name,
                )
            ).first()
            if ltipassscope:
                found_consumers = {
                    str(ltipassscope.lti_passport.oauth_consumer_key): {
                        "secret": str(ltipassscope.lti_passport.shared_secret)
                    }
                }
        except LTIException as exc:
            found_consumers = None
            print("An exception occurred: {}".format(exc))

        return found_consumers

    def _validate_role(self):
        """Check that user is in accepted/specified role.

        Exception: LTIException if user is not in roles.
        """
        if self.role_type != u"any":
            if self.role_type in LTI_ROLES:
                role_list = LTI_ROLES[self.role_type]

                # find the intersection of the roles

                roles = set(role_list) & set(self.user_roles(self.request))
                if not roles:
                    raise LTIRoleException("Not authorized.")
            else:
                raise LTIException("Unknown role {}.".format(self.role_type))

        return True

    def get_post_or_get(self, request):
        """Return the equivalent of request.REQUEST.

        Arguments:
            request(django.http.request): the request that stores the LTI parameters in the session
        Returns:
            requestType: request.POST or request.GET
        """
        return request.POST or request.GET

    def resource_link_id(self, request):
        """Get the resource link id.

        Arguments:
            request(django.http.request): the request that stores the LTI parameters in the session
        Returns:
            String: get resource_link_id from the request session
        """
        return request.session.get("resource_link_id", None)

    def consumer_sitename(self, request):
        """Get consumer_sitename.

        Arguments:
            request(django.http.request): the request that stores the LTI parameters in the session
        Returns:
            String: get consumer sitename from the request session
        """
        # get the consumer sitename from the lti request
        if self.get_post_or_get(request).get(
            "tool_consumer_info_product_family_code", None
        ):
            site_name = self.get_post_or_get(request).get(
                "tool_consumer_instance_guid", ""
            )
        else:
            # in the case of OpenEDX, resource_link_id format is defined in settings.py file.
            # it is defined as follow: ``sitename-id_xblock``
            # example: ``dns.fr-724d6c2b5fcc4a17a26b9120a1d463aa``
            site_name = (
                self.get_post_or_get(request)
                .get("resource_link_id", "")
                .rsplit("-", 1)[0]
            )

        return site_name

    def consumer_user_id(self, request):
        """Get the consumer user id.

        Arguments:
            request(django.http.request): the request that stores the LTI parameters in the session
        Returns:
            String: get consumer_user_id from the request session
        """
        return self.oauth_consumer_key(request) + "-" + self.user_id(request)

    def course_context(self, request):
        """Get the course context id.

        Arguments:
            request(django.http.request): the request that stores the LTI parameters in the session
        Returns:
            String: get course_context from the request session
        """
        return request.session.get("context_id", None)

    def course_title(self, request):
        """Get the course title.

        Arguments:
            request(django.http.request): the request that stores the LTI parameters in the session
        Returns:
            String: get course_title from the request session
        """
        return request.session.get("context_title", None)

    def is_administrator(self, request):
        """Verify if the role is 'administrator'.

        Arguments:
            request(django.http.request): the request that stores the LTI parameters in the session
        Returns:
            Boolean: True if the user is administrator (else False)
        """
        return "administrator" in request.session.get("roles", "").lower()

    def is_student(self, request):
        """Verify if the role is 'student'.

        Arguments:
            request(django.http.request): the request that stores the LTI parameters in the session
        Returns:
            Boolean: True if the user is student (else False)
        """
        return "student" in request.session.get("roles", "").lower()

    def is_instructor(self, request):
        """Verify if the role is 'instructor'.

        Arguments:
            request(django.http.request): the request that stores the LTI parameters in the session
        Returns:
            Boolean: True if the user is instructor (else False)
        """
        roles = request.session.get("roles", "").lower()
        return "instructor" in roles or "staff" in roles

    def lis_outcome_service_url(self, request):
        """Get the LIS Outcome Service URL associated with this launch.

        Arguments:
            request(django.http.request): the request that stores the LTI parameters in the session
        Returns:
            String: get lis_outcome_service_url from the request session
        """
        return request.session.get("lis_outcome_service_url", None)

    def lis_result_sourcedid(self, request):
        """Get the LIS Result ID .

        Arguments:
            request(django.http.request): the request that stores the LTI parameters in the session
        Returns:
            String: get lis_result_sourcedid from the request session
        """
        return request.session.get("lis_result_sourcedid", None)

    def oauth_consumer_key(self, request):
        """Get the oauth_consumer_key parameter.

        Arguments:
            request(django.http.request): the request that stores the LTI parameters in the session
        Returns:
            String: get oauth_consumer_key from the request session
        """
        return request.session.get("oauth_consumer_key", None)

    def user_email(self, request):
        """Get the user email parameter.

        Arguments:
            request(django.http.request): the request that stores the LTI parameters in the session
        Returns:
            String: get email of user from the request session
        """
        return request.session.get("lis_person_contact_email_primary", None)

    def user_fullname(self, request):
        """Get the user fullname.

        Arguments:
            request(django.http.request): the request that stores the LTI parameters in the session
        Returns:
            String: get user's fullname from the request session
        """
        name = request.session.get("lis_person_name_full", None)
        if not name:
            name = self.user_id(request)

        return name or ""

    def user_id(self, request):
        """Get the user id.

        Arguments:
            request(django.http.request): the request that stores the LTI parameters in the session
        Returns:
            String: get user_id from the request session
        """
        return request.session.get("user_id", None)

    def user_name(self, request):
        """Get the user name.

        Arguments:
            request(django.http.request): the request that stores the LTI parameters in the session
        Returns:
            String: get username from the request session
        """
        return request.session.get("lis_person_sourcedid", None)

    def user_roles(self, request):  # pylint: disable=no-self-use
        """
        LTI roles of the authenticated user.

        Arguments:
            request(django.http.request): the request that stores the LTI parameters in the session
        Returns:
            Array: user'roles from the request session
        """
        roles = request.session.get("roles", None)
        if not roles:
            return []
        return roles.lower().split(",")
