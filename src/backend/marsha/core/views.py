"""Views of the ``core`` app of the Marsha project."""
from abc import ABC, abstractmethod
import json
from logging import getLogger
import uuid

from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ImproperlyConfigured
from django.templatetags.static import static
from django.utils.decorators import method_decorator
from django.views.decorators.clickjacking import xframe_options_exempt
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import View
from django.views.generic.base import TemplateResponseMixin, TemplateView

from pylti.common import LTIException
from rest_framework_simplejwt.tokens import AccessToken

from .lti import LTI
from .lti.utils import PortabilityError, get_or_create_resource
from .models import Document, Video
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

    def get_context_data(self, request):
        """Build context for template rendering of configuration data for the frontend.

        Parameters
        ----------
        request : Request
            passed by Django

        Returns
        -------
        dictionary
            context with configuration data for the frontend

        """
        try:
            app_data = self._get_app_data(request)
        except (LTIException, PortabilityError) as error:
            logger.warning(str(error))
            app_data = {
                "state": "error",
                "modelName": self.model.RESOURCE_NAME,
                "resource": None,
            }

        return {
            "app_data": json.dumps(app_data),
            "static_base_url": f"{settings.ABSOLUTE_STATIC_URL}js/",
            "external_javascript_scripts": settings.EXTERNAL_JAVASCRIPT_SCRIPTS,
        }

    def _get_app_data(self, request):
        """Build app data for the frontend with information retrieved from the LTI launch request.

        Parameters
        ----------
        request : Request
            passed by Django

        Returns
        -------
        dictionary
            Configuration data to bootstrap the frontend:

            For all roles
            +++++++++++++

            - state: state of the LTI launch request. Can be one of `success` or `error`.
            - modelName: the type of resource (video, document,...)
            - resource: representation of the targetted resource including urls for the resource
                file (e.g. for a video: all resolutions, thumbnails and timed text tracks).

            For instructors only
            ++++++++++++++++++++

            - jwt_token: a short-lived JWT token linked to the resource ID that will be
                used for authentication and authorization on the API.

        """
        lti = LTI(self.request, self.kwargs["uuid"])
        lti.verify()

        app_data = None
        if lti.is_student:
            cache_key = "app_data|{model:s}|{domain:s}|{context:s}|{resource!s}".format(
                model=self.model.__name__,
                domain=lti.get_consumer_site().domain,
                context=lti.context_id,
                resource=lti.resource_id,
            )

            app_data = cache.get(cache_key)
            permissions = {"can_access_dashboard": False, "can_update": False}

        if not app_data:
            resource = get_or_create_resource(self.model, lti)
            permissions = {
                "can_access_dashboard": lti.is_instructor or lti.is_admin,
                "can_update": (lti.is_instructor or lti.is_admin)
                and resource.playlist.lti_id == lti.context_id,
            }
            app_data = {
                "modelName": self.model.RESOURCE_NAME,
                "resource": self.serializer_class(
                    resource,
                    context={"can_return_live_info": lti.is_admin or lti.is_instructor},
                ).data
                if resource
                else None,
                "state": "success",
                "sentry_dsn": settings.SENTRY_DSN,
                "environment": settings.ENVIRONMENT,
                "release": settings.RELEASE,
                "static": {"svg": {"plyr": static("svg/plyr.svg")}},
            }
            if lti.is_student:
                cache.set(cache_key, app_data, settings.APP_DATA_CACHE_DURATION)

        if app_data["resource"] is not None:
            try:
                locale = react_locale(lti.launch_presentation_locale)
            except ImproperlyConfigured:
                locale = "en_US"

            # Create a short-lived JWT token for the video
            jwt_token = AccessToken()
            jwt_token.payload.update(
                {
                    "session_id": str(uuid.uuid4()),
                    "context_id": lti.context_id,
                    "resource_id": str(lti.resource_id),
                    "roles": lti.roles,
                    "course": lti.get_course_info(),
                    "locale": locale,
                    "permissions": permissions,
                    "maintenance": settings.MAINTENANCE_MODE,
                }
            )
            try:
                jwt_token.payload["user_id"] = lti.user_id
            except AttributeError:
                pass

            app_data["jwt"] = str(jwt_token)

        return app_data

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
        return self.render_to_response(self.get_context_data(request))


class VideoLTIView(BaseLTIView):
    """Video view called by an LTI launch request."""

    model = Video
    serializer_class = VideoSerializer


class DocumentLTIView(BaseLTIView):
    """Document view called by an LTI launch request."""

    model = Document
    serializer_class = DocumentSerializer


class DevelopmentLTIView(TemplateView):
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
