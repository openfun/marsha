"""LTI module that supports LTI 1.0."""
import re

from django.db.models import Q
from django.utils.datastructures import MultiValueDictKeyError

from pylti.common import LTIException, verify_request_common

from .models import ConsumerSite, Playlist, Video
from .models.account import INSTRUCTOR, LTI_ROLES, STUDENT, LTIPassport


class LTI:
    """The LTI object abstracts an LTI launch request.

    It provides properties and methods to inspect the launch request.
    """

    def __init__(self, request):
        """Initialize the LTI system.

        Parameters
        ----------
        request : django.http.request.HttpRequest
            The request that holds the LTI parameters

        """
        self.request = request
        self._is_verified = False

    def verify(self):
        """Verify the LTI request.

        Raises
        ------
        LTIException
            Exception raised if request validation fails

        Returns
        -------
        boolean
            True if the request is a valid LTI launch request

        """
        consumer_key = self.request.POST.get("oauth_consumer_key", None)
        consumer_site_name = self.consumer_site_name

        try:
            assert consumer_key
        except AssertionError:
            raise LTIException("An oauth consumer key is required.")

        try:
            assert self.context_id
        except AssertionError:
            raise LTIException("A context ID is required.")

        try:
            assert consumer_site_name
        except AssertionError:
            raise LTIException("A consumer site name is required.")

        # find a passport related to either the consumer site or the playlist
        try:
            lti_passport = LTIPassport.objects.get(
                Q(
                    oauth_consumer_key=consumer_key,
                    is_enabled=True,
                    consumer_site__name=consumer_site_name,
                )
                | Q(
                    oauth_consumer_key=consumer_key,
                    is_enabled=True,
                    playlist__consumer_site__name=consumer_site_name,
                )
            )
        except LTIPassport.DoesNotExist:
            raise LTIException(
                "Could not find a valid passport for this consumer site and this "
                "oauth consumer key: {:s}/{:s}.".format(
                    consumer_site_name, consumer_key
                )
            )

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

        self._is_verified = True
        return True

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

    @property
    def resource_link_title(self):
        """Return the resource link id as default for its title."""
        return self.request.POST.get("resource_link_title", self.resource_link_id)

    @property
    def context_title(self):
        """Return the context id as default for its title."""
        return self.request.POST.get("context_title", self.context_id)

    @property
    def consumer_site_name(self):
        """Get consumer site name from the LTI launch request.

        Returns
        -------
        string
            Consumer site name from the request POST parameters

        """
        # get the consumer sitename from the lti request
        try:
            return self.request.POST["tool_consumer_instance_guid"]
        except MultiValueDictKeyError:
            # in the case of OpenEDX, resource_link_id format is defined in settings.py file.
            # it is defined as follow: ``consumer-site-id_xblock-id``
            # example: ``dns.fr-724d6c2b5fcc4a17a26b9120a1d463aa``
            # except
            return self.request.POST.get("resource_link_id", "").rsplit("-", 1)[0]

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

    def get_or_create_video(self):
        """Get or create the video targetted by the LTI launch request.

        Create the playlist if it does not pre-exist (it can only happen with consumer site scope
        passports).

        Returns
        -------
        core.models.video.Video
            The video instance targetted by the `resource_link_id` or None.

        """
        # Make sure LTI verification have run successfully
        assert getattr(self, "_is_verified", False) or self.verify()

        # If the video already exist, retrieve it from database
        try:
            return Video.objects.get(
                lti_id=self.resource_link_id,
                playlist__lti_id=self.context_id,
                playlist__consumer_site__name=self.consumer_site_name,
            )
        except Video.DoesNotExist:
            # Only create the video if the request comes from an instructor
            if not self.is_instructor:
                return None

        # Creating the video...
        # - Get the consumer site (we know it exists because the passport verified)
        consumer_site = ConsumerSite.objects.get(name=self.consumer_site_name)

        # - Get the playlist if it exists or create it
        playlist, _ = Playlist.objects.get_or_create(
            lti_id=self.context_id,
            consumer_site=consumer_site,
            defaults={"title": self.context_title},
        )

        # Create the video
        return Video.objects.create(
            lti_id=self.resource_link_id,
            title=self.resource_link_title,
            playlist=playlist,
        )
