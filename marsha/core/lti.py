"""LTI module that supports LTI 1.0."""
import re

from django.db.models import Q

from pylti.common import (
    LTI_PROPERTY_LIST,
    LTI_SESSION_KEY,
    LTIException,
    verify_request_common,
)

from .models.account import INSTRUCTOR, LTI_ROLES, STUDENT, LTIPassport


# Define passport scopes
CONSUMER_SITE, PLAYLIST = "consumer_site", "playlist"


class LTI:
    """The LTI object abstracts an LTI launch request.

    It provides properties and methods to inspect the launch request.
    """

    def __init__(self, request):
        """Initialize the LTI system.

        Parameters
        ----------
        request : django.http.request.HttpRequest
            The request that stores the LTI parameters in the session

        """
        self.request = request

    def get_passport(self):
        """Retrieve the passeport linked to an LTI launch request.

        Returns
        -------
        json
            LTI passport as a dictionary

        Raises
        ------
        LTIException
            exception if the passport is not valid or the LTI verification fails

        """
        consumer_key = self.request.POST.get("oauth_consumer_key", None)
        site_name = self.get_sitename()

        # find a passport scope related to either the consumer site or the playlist
        try:
            return LTIPassport.objects.get(
                Q(
                    oauth_consumer_key=consumer_key,
                    is_enabled=True,
                    consumer_site__name=site_name,
                )
                | Q(
                    oauth_consumer_key=consumer_key,
                    is_enabled=True,
                    playlist__consumer_site__name=site_name,
                )
            )
        except LTIPassport.DoesNotExist:
            raise LTIException()

    def get_sitename(self):
        """Get sitename from request.

        Returns
        -------
        string
            Consumer site name from the request session

        """
        # get the consumer sitename from the lti request
        if self.request.POST.get("tool_consumer_info_product_family_code", None):
            return self.request.POST.get("tool_consumer_instance_guid", "")

        # in the case of OpenEDX, resource_link_id format is defined in settings.py file.
        # it is defined as follow: ``sitename-id_xblock``
        # example: ``dns.fr-724d6c2b5fcc4a17a26b9120a1d463aa``
        return self.request.POST.get("resource_link_id", "").rsplit("-", 1)[0]

    def initialize_session(self):
        """Verify the LTI request and initialize a session.

        All the LTI parameters are stored into the session dict for use in views.

        Raises
        ------
        LTIException
            Exception raised if request validation fails

        Returns
        -------
        boolean
            True if the request is a valid LTI launch request

        """
        try:
            lti_passport = self.get_passport()
            consumers = {
                str(lti_passport.oauth_consumer_key): {
                    "secret": str(lti_passport.shared_secret)
                }
            }
            # A call to the verification function should raise an LTIException but
            # we can further check that it returns True.
            if (
                verify_request_common(
                    consumers,
                    self.request.build_absolute_uri(),
                    self.request.method,
                    self.request.META,
                    dict(self.request.POST.items()),
                )
                is not True
            ):
                raise LTIException()

        except LTIException:
            self.request.session.flush()
            raise

        for field in LTI_PROPERTY_LIST:
            param = self.request.POST.get(field, None)
            if param:
                self.request.session[field] = param

        # Record the scope of the applicable passport in the session
        # This will be useful to determine user permissions (e.g. right to create a new playlist)
        assert lti_passport.consumer_site or lti_passport.playlist
        self.request.session["scope"] = (
            CONSUMER_SITE if lti_passport.consumer_site else PLAYLIST
        )

        self.request.session[LTI_SESSION_KEY] = True
        return True

    @property
    def roles(self):
        """LTI roles of the authenticated user.

        Returns
        -------
        set
            normalized LTI roles from the session

        """
        roles = self.request.session.get("roles", "")
        # Remove all spaces from the string and extra trailing or leading commas
        roles = re.sub(r"[\s+]", "", roles).strip(",")
        # Return a set of the roles mentioned in the request
        return set(roles.lower().split(",")) if roles else set()

    @property
    def is_instructor(self):
        """Check if the user of the launch request is an instructor on the course.

        Returns
        -------
        boolean
            True if the user is an instructor, False otherwise

        """
        return bool(LTI_ROLES[INSTRUCTOR] & self.roles)

    @property
    def is_student(self):
        """Check if the user of the launch request is a student on the course.

        Returns
        -------
        boolean
            True if the user is a student, False otherwise

        """
        return bool(LTI_ROLES[STUDENT] & self.roles)

    @property
    def resource_link_id(self):
        """Get the resource link id from the session.

        Returns
        -------
        string
            `resource_link_id` from the request session

        """
        return self.request.session.get("resource_link_id", None)
