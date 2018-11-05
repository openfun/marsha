"""LTI module that supports LTI 1.0."""
import re

from django.db.models import Q
from django.utils.datastructures import MultiValueDictKeyError
from django.utils.functional import cached_property

from pylti.common import LTIException, verify_request_common

from .models import PENDING, READY, ConsumerSite, Playlist, Video
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
        consumers = {
            str(self.passport.oauth_consumer_key): {
                "secret": str(self.passport.shared_secret)
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

    @cached_property
    def passport(self):
        """Find and return the passport targeted by the LTI request or raise an LTIException."""
        consumer_key = self.request.POST.get("oauth_consumer_key", None)

        try:
            assert consumer_key
        except AssertionError:
            raise LTIException("An oauth consumer key is required.")

        # find a passport related to the oauth consumer key
        try:
            return LTIPassport.objects.get(
                Q(oauth_consumer_key=consumer_key, is_enabled=True)
            )
        except LTIPassport.DoesNotExist:
            raise LTIException(
                "Could not find a valid passport for this oauth consumer key: {:s}.".format(
                    consumer_key
                )
            )

    @property
    def resource_link_title(self):
        """Return the resource link id as default for its title."""
        return self.request.POST.get("resource_link_title", self.resource_link_id)

    @property
    def context_title(self):
        """Return the context id as default for its title."""
        return self.request.POST.get("context_title", self.context_id)

    @property
    def resource_link_id(self):
        """Handle Open edX specific resource_link_id."""
        # The Open edX launch request is recognizable by the absence of consumer instance guid
        # It's consumer instance guid is concatenated in the resource link id which is wrong so
        # let's strip it...
        if self.request.POST.get("tool_consumer_instance_guid"):
            return self.request.POST["resource_link_id"]

        return self.request.POST["resource_link_id"].rsplit("-", 1)[-1]

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
            The video instance targeted by the `resource_link_id` or None.

        """
        # Make sure LTI verification has run successfully
        assert getattr(self, "_is_verified", False) or self.verify()

        try:
            assert self.context_id
        except AssertionError:
            raise LTIException("A context ID is required.")

        consumer_site_name = (
            self.passport.consumer_site.name
            if self.passport.consumer_site
            else self.passport.playlist.consumer_site.name
        )

        # If the video already exist, retrieve it from database
        try:
            return Video.objects.get(
                lti_id=self.resource_link_id,
                playlist__lti_id=self.context_id,
                playlist__consumer_site__name=consumer_site_name,
            )
        except Video.DoesNotExist:
            # Look for the same resource id from another playlist on the same consumer site
            origin_video = (
                Video.objects.filter(
                    lti_id=self.resource_link_id,
                    playlist__consumer_site__name=consumer_site_name,
                    playlist__is_portable_to_playlist=True,
                    state=READY,
                )
                .order_by("-uploaded_on")
                .first()
            )

            if origin_video is None:
                # Look for the same resource id from the same playlist on another consumer site
                origin_video = (
                    Video.objects.filter(
                        lti_id=self.resource_link_id,
                        playlist__lti_id=self.context_id,
                        playlist__is_portable_to_consumer_site=True,
                        state=READY,
                    )
                    .order_by("-uploaded_on")
                    .first()
                )

            if origin_video is None:
                # Look for the same resource id from another playlist on another consumer site
                origin_video = (
                    Video.objects.filter(
                        lti_id=self.resource_link_id,
                        state=READY,
                        playlist__is_portable_to_playlist=True,
                        playlist__is_portable_to_consumer_site=True,
                    )
                    .order_by("-uploaded_on")
                    .first()
                )

            # If we still didn't find any existing video, we will only create a new video if the
            # request comes from an instructor
            if origin_video is None and not self.is_instructor:
                return None

        # Creating the video...
        # - Get the consumer site (we know it exists because the passport verified)
        consumer_site = ConsumerSite.objects.get(name=consumer_site_name)

        # - Get the playlist if it exists or create it
        playlist, _ = Playlist.objects.get_or_create(
            lti_id=self.context_id,
            consumer_site=consumer_site,
            defaults={
                "title": self.context_title,
                "is_portable_to_playlist": (
                    origin_video.playlist.is_portable_to_playlist
                    if origin_video
                    else True
                ),
                "is_portable_to_consumer_site": (
                    origin_video.playlist.is_portable_to_consumer_site
                    if origin_video
                    else False
                ),
            },
        )

        # Create the video, pointing to the file from the origin video if any
        return Video.objects.create(
            duplicated_from=origin_video,
            lti_id=self.resource_link_id,
            playlist=playlist,
            state=READY if origin_video else PENDING,
            title=self.resource_link_title,
            uploaded_on=origin_video.uploaded_on if origin_video else None,
        )
