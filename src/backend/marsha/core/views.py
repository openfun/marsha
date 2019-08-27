"""Views of the ``core`` app of the Marsha project."""
from abc import ABC, abstractmethod
import json
from logging import getLogger
import uuid

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.utils.decorators import method_decorator
from django.views.decorators.clickjacking import xframe_options_exempt
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import View
from django.views.generic.base import TemplateResponseMixin, TemplateView

from pylti.common import LTIException
from rest_framework_simplejwt.tokens import AccessToken

from .lti import LTI
from .lti.utils import get_or_create_resource
from .models import Document, Video
from .models.account import INSTRUCTOR, STUDENT
from .serializers import DocumentSerializer, VideoSerializer
from .utils.react_locales_utils import react_locale


logger = getLogger(__name__)


@method_decorator(csrf_exempt, name="dispatch")
@method_decorator(xframe_options_exempt, name="dispatch")
class BaseLTIView(ABC, TemplateResponseMixin, View):
    """Base view called by an LTI launch request.

    It is designed to work as a React single page application.

    """

    template_name = "core/lti.html"

    @property
    @abstractmethod
    def model(self):
        """Model used by the view."""

    @property
    @abstractmethod
    def serializer_class(self):
        """Return the serializer used by the view."""

    @abstractmethod
    def _enrich_jwt_token(self, token, resource):
        """Enrich the base JWT Token with specific data from the targeted resource."""

    def get_context_data(self):
        """Build a context with data retrieved from the LTI launch request.

        Returns
        -------
        dictionary
            context for template rendering:

            For all roles
            +++++++++++++

            - state: state of the LTI launch request. Can be one of `student`, `instructor` or
                `error`.
            - video: representation of the video including urls for the video file in all
                resolutions, with thumbnails and timed text tracks.

            For instructors only
            ++++++++++++++++++++

            - jwt_token: a short-lived JWT token linked to the video ID that will be
                used as authentication.

        """
        lti = LTI(self.request, self.kwargs["uuid"])
        try:
            resource = get_or_create_resource(self.model, lti)
        except LTIException as error:
            logger.warning("LTI Exception: %s", str(error))
            return {
                "state": "error",
                "resource": self.model._meta.verbose_name_plural.lower(),
                "resource_data": "null",
            }

        context = {"state": STUDENT if lti.is_student else INSTRUCTOR}

        locale = "en_US"
        try:
            locale = react_locale(lti.launch_presentation_locale)
        except ImproperlyConfigured:
            pass

        if resource is not None:
            # Create a short-lived JWT token for the video
            jwt_token = AccessToken()
            jwt_token.payload.update(
                {
                    "session_id": str(uuid.uuid4()),
                    "context_id": lti.context_id,
                    "resource_id": str(resource.id),
                    "roles": lti.roles,
                    "course": lti.get_course_info(),
                    "locale": locale,
                    "read_only": lti.is_student
                    or resource.playlist.lti_id != lti.context_id,
                }
            )
            try:
                jwt_token.payload["user_id"] = lti.user_id
            except AttributeError:
                pass

            self._enrich_jwt_token(jwt_token, resource)

            context["jwt_token"] = str(jwt_token)

        context["resource_data"] = json.dumps(
            self.serializer_class(resource).data if resource else None
        )
        context["resource"] = self.model._meta.verbose_name_plural.lower()

        if getattr(settings, "STATICFILES_AWS_ENABLED", False):
            context["cloudfront_domain"] = settings.CLOUDFRONT_DOMAIN

        return context

    # pylint: disable=unused-argument
    def post(self, request, *args, **kwargs):
        """Respond to POST requests with the LTI template.

        Populated with context retrieved by get_context_data in the LTI launch request.

        Parameters
        ----------
        request : Request
            passed by Django
        args : list
            positional extra arguments
        kwargs : dictionary
            keyword extra arguments

        Returns
        -------
        HTML
            generated from applying the data to the template

        """
        return self.render_to_response(self.get_context_data())


class VideoLTIView(BaseLTIView):
    """Video view called by an LTI launch request."""

    model = Video
    serializer_class = VideoSerializer

    def _enrich_jwt_token(self, token, resource):
        """Enrich the base JWT Token with specific data from the targeted resource."""
        token.payload.update({"video_id": str(resource.id)})


class DocumentLTIView(BaseLTIView):
    """Document view called by an LTI launch request."""

    model = Document
    serializer_class = DocumentSerializer

    def _enrich_jwt_token(self, token, resource):
        pass


class LTIDevelopmentView(TemplateView):
    """A development view with iframe POST / plain POST helpers.

    Not available outside of DEBUG = true environments.

    """

    template_name = "core/lti_development.html"

    def get_context_data(self, **kwargs):
        """Generate a UUID to pre-populate the `uuid` fields in the LTI request form.

        Parameters
        ----------
        kwargs : dictionary
            keyword extra arguments

        Returns
        -------
        dictionary
            context for template rendering

        """
        return {"uuid": uuid.uuid4()}
