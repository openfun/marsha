"""LTI module that supports LTI 1.0."""
import re
from urllib.parse import urlparse

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.db.models import Q
from django.utils.datastructures import MultiValueDictKeyError

from pylti.common import LTIException, verify_request_common

from .defaults import PENDING, READY
from .models import ConsumerSite, Playlist, Video
from .models.account import INSTRUCTOR, LTI_ROLES, STUDENT, LTIPassport


class LTI:
    """The LTI object abstracts an LTI launch request.

    It provides properties and methods to inspect the launch request.
    """

    def __init__(self, request, resource_id):
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
        if settings.BYPASS_LTI_VERIFICATION:
            if not settings.DEBUG:
                raise ImproperlyConfigured(
                    "Bypassing LTI verification only works in DEBUG mode."
                )
            return ConsumerSite.objects.get_or_create(
                domain=self.consumer_site_domain,
                defaults={"name": self.consumer_site_domain},
            )[0]

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
        url = self.request.build_absolute_uri()
        if self.request.META.get("HTTP_X_FORWARDED_PROTO", "http") == "https":
            url = url.replace("http:", "https:", 1)

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
        domain_check = urlparse(self.request.META.get("HTTP_REFERER")).hostname
        if domain_check != consumer_site.domain and not domain_check.endswith(
            ".{:s}".format(consumer_site.domain)
        ):
            raise LTIException(
                "Host domain ({:s}) does not match registered passport ({:s}).".format(
                    domain_check, consumer_site.domain
                )
            )

        return consumer_site

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
        except MultiValueDictKeyError:
            raise AttributeError(name)

    def get_passport(self):
        """Find and return the passport targeted by the LTI request or raise an LTIException."""
        consumer_key = self.request.POST.get("oauth_consumer_key", None)

        try:
            assert consumer_key
        except AssertionError:
            raise LTIException("An oauth consumer key is required.")

        # find a passport related to the oauth consumer key
        try:
            return LTIPassport.objects.get(
                oauth_consumer_key=consumer_key, is_enabled=True
            )
        except LTIPassport.DoesNotExist:
            raise LTIException(
                "Could not find a valid passport for this oauth consumer key: {:s}.".format(
                    consumer_key
                )
            )

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
    def consumer_site_domain(self):
        """Get consumer site domain from the LTI launch request.

        Returns
        -------
        string
            Consumer site domain from the request POST parameters

        """
        # get the consumer site domain from the lti request
        try:
            return self.request.POST["tool_consumer_instance_guid"]
        except MultiValueDictKeyError:
            # in the case of OpenEDX, resource_link_id format is defined in settings.py file.
            # it is defined as follow: ``consumer_site_id-xblock_id``
            # example: ``dns.fr-724d6c2b5fcc4a17a26b9120a1d463aa``
            elements = self.request.POST.get("resource_link_id", "").rsplit("-", 1)
            return elements[0] if len(elements) == 2 and elements[0] else None

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

    def get_or_create_video(self):
        """Get or create the video targeted by the LTI launch request.

        Create the playlist if it does not pre-exist (it can only happen with consumer site scope
        passports).

        Raises
        ------
        LTIException
            Exception raised if the request does not contain a context id (playlist).

        Returns
        -------
        core.models.video.Video
            The video instance targeted by the launch url or None.

        """
        # Make sure LTI verification has run successfully. It raises an LTIException otherwise.
        consumer_site = self.verify()

        try:
            assert self.context_id
        except AssertionError:
            raise LTIException("A context ID is required.")

        # If the video already exists, retrieve it from database
        filter_kwargs = {"upload_state": READY} if not self.is_instructor else {}
        try:
            return Video.objects.get(
                Q(playlist__lti_id=self.context_id)
                | Q(playlist__is_portable_to_playlist=True, upload_state=READY),
                Q(playlist__consumer_site=consumer_site)
                | Q(playlist__is_portable_to_consumer_site=True, upload_state=READY)
                | Q(
                    playlist__consumer_site__in=consumer_site.reachable_from.all(),
                    upload_state=READY,
                ),
                pk=self.resource_id,
                **filter_kwargs,
            )
        except Video.DoesNotExist:
            pass

        # If we didn't find any existing video, we will only create a new video if the
        # request comes from an instructor
        if not self.is_instructor:
            return None

        # Check that the video does not already exist (possible in another playlist and/or
        # on another consumer site if it is not portable or not ready).
        try:
            video = Video.objects.get(pk=self.resource_id)
        except Video.DoesNotExist:
            pass
        else:
            raise LTIException(
                "The video ID {!s} already exists but is not portable to your playlist ({!s}) "
                "and/or consumer site ({!s}).".format(
                    video.id, self.context_id, consumer_site.domain
                )
            )

        # Creating the video...
        # - Get the playlist if it exists or create it
        playlist, _ = Playlist.objects.get_or_create(
            lti_id=self.context_id,
            consumer_site=consumer_site,
            defaults={"title": self.context_title},
        )

        # Create the video, pointing to the file from the origin video if any
        return Video.objects.create(
            pk=self.resource_id,
            lti_id=self.resource_link_id,
            playlist=playlist,
            upload_state=PENDING,
            title=self.resource_link_title,
            show_download=consumer_site.video_show_download_default,
        )


class OpenEdxLTI(LTI):
    """Deprecated pseudo-LTI for backward compatibility with early version Open edX.

    [DEPRECATED] This LTI class does not comply with the LTI specification.
    It is kept for backward compatibility, only works with the Open edX XBlock consumer and
    will be removed in a future release.

    """

    # pylint: disable=super-init-not-called
    def __init__(self, request):
        """Initialize the LTI system.

        Parameters
        ----------
        request : django.http.request.HttpRequest
            The request that holds the LTI parameters

        """
        self.request = request

    @property
    def resource_link_id(self):
        """Accept only Open edX specific resource_link_id."""
        resource_link_id = self.request.POST["resource_link_id"].rsplit("-", 1)
        if len(resource_link_id) == 2:
            return resource_link_id[1]
        raise LTIException("This launch request only works with Open edX.")

    def get_or_create_video(self):
        """Get or create the video targeted by the LTI launch request.

        Create the playlist if it does not pre-exist (it can only happen with consumer site scope
        passports).

        Returns
        -------
        core.models.video.Video
            The video instance targeted by the `resource_link_id` or None.

        """
        # Make sure LTI verification has run successfully. It raises an LTIException otherwise.
        self.verify()

        # If the video already exists, retrieve it from database
        try:
            return Video.objects.get(lti_id=self.resource_link_id, upload_state=READY)
        except Video.DoesNotExist:
            return None


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
        except MultiValueDictKeyError:
            raise AttributeError(name)
