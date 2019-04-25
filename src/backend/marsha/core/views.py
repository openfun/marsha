"""Views of the ``core`` app of the Marsha project."""
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

from .lti import LTI, OpenEdxLTI
from .models.account import INSTRUCTOR, STUDENT
from .serializers import VideoSerializer
from .utils.react_locales_utils import react_locale


logger = getLogger(__name__)


@method_decorator(csrf_exempt, name="dispatch")
@method_decorator(xframe_options_exempt, name="dispatch")
class VideoLTIView(TemplateResponseMixin, View):
    """View called by an LTI launch request.

    It is designed to work as a React single page application.

    """

    template_name = "core/lti_video.html"

    def get_lti(self):
        """Return the LTI abstraction class to verify the request and retrieve a video."""
        return LTI(self.request, self.kwargs["uuid"])

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
        lti = self.get_lti()
        try:
            video = lti.get_or_create_video()
        except LTIException as error:
            logger.warning("LTI Exception: %s", str(error))
            return {"state": "error", "video_data": "null"}

        context = {"state": INSTRUCTOR if lti.is_instructor else STUDENT}

        locale = "en_US"
        try:
            locale = react_locale(lti.launch_presentation_locale)
        except ImproperlyConfigured:
            pass

        if video is not None:
            # Create a short-lived JWT token for the video
            jwt_token = AccessToken()
            jwt_token.payload.update(
                {
                    "session_id": str(uuid.uuid4()),
                    "video_id": str(video.id),
                    "context_id": lti.context_id,
                    "roles": lti.roles,
                    "course": lti.get_course_info(),
                    "locale": locale,
                    "read_only": lti.is_student
                    or video.playlist.lti_id != lti.context_id,
                }
            )
            try:
                jwt_token.payload["user_id"] = lti.user_id
            except AttributeError:
                pass

            context["jwt_token"] = str(jwt_token)

        context["video_data"] = json.dumps(
            VideoSerializer(video).data if video else None
        )

        if getattr(settings, "STATICFILES_AWS_ENABLED", False):
            context["cloudfront_domain"] = settings.CLOUDFRONT_DOMAIN

        return context

    # pylint: disable=unused-argument
    def post(self, request, *args, **kwargs):
        """Respond to POST requests with the LTI Video template.

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


@method_decorator(csrf_exempt, name="dispatch")
@method_decorator(xframe_options_exempt, name="dispatch")
class OpenEdxVideoLTIView(VideoLTIView):
    """View called by the deprecated LTI launch request.

    [DEPRECATED] It is kept here for backward compatibility with the first versions of Marsha,
    only works with Open edX and will be removed in future releases.

    """

    def get_lti(self):
        """Use the deprecated LTI class specific to Open edX and kept to its minimal."""
        return OpenEdxLTI(self.request)


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
