"""LTI module that supports LTI 1.0."""
import re
from urllib.parse import urlparse

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.http.request import validate_host
from django.utils.datastructures import MultiValueDictKeyError

from pylti.common import LTIException, verify_request_common

from ..models import ConsumerSite
from ..models.account import ADMINISTRATOR, INSTRUCTOR, LTI_ROLES, STUDENT, LTIPassport
from ..utils.url_utils import build_absolute_uri_behind_proxy


class LTI:
    """The LTI object abstracts an LTI launch request.

    It provides properties and methods to inspect the launch request.
    """

    def __init__(self, request, resource_id=None):
        """Initialize the LTI system.

        Parameters
        ----------
        request : django.http.request.HttpRequest
            The request that holds the LTI parameters
        resource_id : uuid.uuid4
            The primary key of the video targetted by the LTI query as a UUID.

        """
        self.resource_id = resource_id
        self.request = request
        self._consumer_site = None

    def verify(self):
        """Verify the LTI request.

        Raises
        ------
        LTIException
            Raised if request validation fails
        ImproperlyConfigured
            Raised if BYPASS_LTI_VERIFICATION is True but we are not in DEBUG mode

        Returns
        -------
        string
            It returns the consumer site related to the passport used in the LTI launch
            request if it is valid.
            If the BYPASS_LTI_VERIFICATION and DEBUG settings are True, it creates and return a
            consumer site with the consumer site domain passed in the LTI request.

        """
        if self._consumer_site:
            return True

        if not self.context_id:
            raise LTIException("A context ID is required.")

        request_domain = self.request_domain

        if settings.BYPASS_LTI_VERIFICATION:
            if not settings.DEBUG:
                raise ImproperlyConfigured(
                    "Bypassing LTI verification only works in DEBUG mode."
                )
            if not request_domain:
                raise LTIException(
                    "You must provide an http referer in your LTI launch request."
                )
            self._consumer_site, _created = ConsumerSite.objects.get_or_create(
                domain=request_domain, defaults={"name": request_domain}
            )
            return True

        passport = self.get_passport()
        consumers = {
            str(passport.oauth_consumer_key): {"secret": str(passport.shared_secret)}
        }

        # The LTI signature is computed using the url of the LTI launch request. But when Marsha
        # is behind a TLS termination proxy, the url as seen by Django is changed and starts with
        # "http". We need to revert this so that the signature we calculate matches the one
        # calculated by our LTI consumer.
        # Note that this is normally done in pylti's "verify_request_common" method but it does
        # not support WSGI normalized headers so let's do it ourselves.
        url = build_absolute_uri_behind_proxy(self.request)

        # A call to the verification function should raise an LTIException but
        # we can further check that it returns True.
        if (
            verify_request_common(
                consumers,
                url,
                self.request.method,
                self.request.META,
                dict(self.request.POST.items()),
            )
            is not True
        ):
            raise LTIException("LTI verification failed.")

        consumer_site = passport.consumer_site or passport.playlist.consumer_site

        # Make sure we only accept requests from domains in which the "top parts" match
        # the URL for the consumer_site associated with the passport.
        # eg. sub.example.com & example.com for an example.com consumer site.
        # Also referer matching ALLOWED_HOSTS are accepted
        if (
            request_domain
            and request_domain != consumer_site.domain
            and not (
                request_domain.endswith(".{:s}".format(consumer_site.domain))
                or validate_host(request_domain, settings.ALLOWED_HOSTS)
            )
        ):
            raise LTIException(
                "Host domain ({:s}) does not match registered passport ({:s}).".format(
                    request_domain, consumer_site.domain
                )
            )

        self._consumer_site = consumer_site
        return True

    def get_consumer_site(self):
        """Return the consumer_site if the request is verified.

        Returns
        -------
        consumer_site: Type[models.ConsumerSite]

        Raises
        ------
        RuntimeError
            Raised if the LTI request is not verified

        """
        if self._consumer_site:
            return self._consumer_site

        raise RuntimeError(
            "Impossible to retrieve the consumer_site, verify the request first"
        )

    def __getattr__(self, name):
        """Look for attributes in the request's POST parameters as a last resort.

        Parameters
        ----------
        name : string
            The property to retrieve

        Returns
        -------
        any
            Value of this parameter in the request's POST parameters

        Raises
        ------
        AttributeError
            Raised if the attribute was not found in the request's POST parameters

        """
        try:
            return self.request.POST[name]
        except MultiValueDictKeyError as err:
            raise AttributeError(name) from err

    def get_passport(self):
        """Find and return the passport targeted by the LTI request or raise an LTIException."""
        consumer_key = self.request.POST.get("oauth_consumer_key", None)

        if not consumer_key:
            raise LTIException("An oauth consumer key is required.")

        # find a passport related to the oauth consumer key
        try:
            return LTIPassport.objects.get(
                oauth_consumer_key=consumer_key, is_enabled=True
            )
        except LTIPassport.DoesNotExist as err:
            raise LTIException(
                "Could not find a valid passport for this oauth consumer key: {:s}.".format(
                    consumer_key
                )
            ) from err

    def get_course_info(self):
        """Retrieve course info in the LTI request.

        Returns
        -------
        dict
            school_name: the school name
            course_name: the course name
            course_section: the course section

        """
        if self.is_edx_format:
            part = re.match(r"^course-v[0-9]:(.*)", self.context_id).group(1).split("+")
            length = len(part)
            return {
                "school_name": part[0] if length >= 1 else None,
                "course_name": part[1] if length >= 2 else None,
                "course_run": part[2] if length >= 3 else None,
            }

        return {
            "school_name": self.request.POST.get("tool_consumer_instance_name", None),
            "course_name": self.context_title,
            "course_run": None,
        }

    @property
    def resource_link_title(self):
        """Return the resource link id as default for its title."""
        return self.request.POST.get("resource_link_title", self.resource_link_id)

    @property
    def context_title(self):
        """Return the context id as default for its title."""
        return self.request.POST.get("context_title", self.context_id)

    @property
    def request_domain(self):
        """Get consumer site domain from the incoming request http referer header.

        Returns
        -------
        string
            Hostname parsed from the request http referer header.

        """
        return urlparse(self.request.META.get("HTTP_REFERER")).hostname

    @property
    def roles(self):
        """LTI roles of the authenticated user.

        Returns
        -------
        set
            normalized LTI roles from the session

        """
        roles = self.request.POST.get("roles", "")
        # Remove all spaces from the string and extra trailing or leading commas
        roles = re.sub(r"[\s+]", "", roles).strip(",")
        # Return a set of the roles mentioned in the request
        return roles.lower().split(",") if roles else []

    @property
    def is_instructor(self):
        """Check if the user of the launch request is an instructor on the course.

        Returns
        -------
        boolean
            True if the user is an instructor, False otherwise

        """
        return bool(LTI_ROLES[INSTRUCTOR] & set(self.roles))

    @property
    def is_admin(self):
        """Check if the user of the launch request is an administrator on the course.

        Returns
        -------
        boolean
            True if the user is an administrator, False otherwise

        """
        return bool(LTI_ROLES[ADMINISTRATOR] & set(self.roles))

    @property
    def is_student(self):
        """Check if the user of the launch request is a student on the course.

        Returns
        -------
        boolean
            True if the user is a student, False otherwise

        """
        return bool(LTI_ROLES[STUDENT] & set(self.roles))

    @property
    def is_edx_format(self):
        """Check if the LTI request comes from Open edX.

        Returns
        -------
        boolean
            True if the LTI request is sent by Open edX

        """
        return re.search(r"^course-v[0-9]:.*$", self.context_id)

    @property
    def launch_presentation_locale(self):
        """LTI launch_presentation_locale.

        Returns
        -------
        string
            The locale present in launch_presentation_locale or fallback to en

        """
        return self.request.POST.get("launch_presentation_locale", "en")

    @property
    def username(self):
        """Username of the authenticated user.

        Returns
        -------
        string
            The username of the authenticated user.
        """
        return self.request.POST.get("lis_person_sourcedid") or self.request.POST.get(
            "ext_user_username"
        )


class LTIUser:
    """
    LTIUser represents the information stored in the JWT Token once authenticated.

    It is a helper to retrieve information in a TokenUser.
    """

    def __init__(self, TokenUser):
        """Initialize LTIUser.

        Parameters
        ----------
        TokenUser : rest_framework_simplejwt.models.TokenUser
            The request that holds the LTI parameters

        """
        self.token = TokenUser.token

    def __getattr__(self, name):
        """Look for an attribute in the token payload.

        Parameters
        ----------
        name : string
            The property to retrieve

        Returns
        -------
        any
            Value of this parameter in the request's POST parameters

        Raises
        ------
        AttributeError
            Raised if the attribute was not found in the request's POST parameters

        """
        try:
            return self.token.payload[name]
        except KeyError as err:
            raise AttributeError(name) from err
