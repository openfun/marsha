"""Views of the ``core`` app of the Marsha project."""
from django.utils.decorators import method_decorator
from django.views.decorators.clickjacking import xframe_options_exempt
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import View
from django.views.generic.base import TemplateResponseMixin

from pylti.common import LTIException
from rest_framework_simplejwt.tokens import AccessToken

from .lti import LTI
from .models.account import INSTRUCTOR, STUDENT
from .serializers import VideoSerializer


@method_decorator(csrf_exempt, name="dispatch")
@method_decorator(xframe_options_exempt, name="dispatch")
class VideoLTIView(TemplateResponseMixin, View):
    """View called by an LTI launch request.

    It is designed to work as a React single page application.

    """

    template_name = "core/lti_video.html"

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
                resolutions, thumbnails and subtitles.

            For instructors only
            ++++++++++++++++++++

            - jwt_token: a short-lived JWT token linked to the video ID that will be
                used as authentication to request an upload policy for the video or update its
                name or description.

        """
        lti = LTI(self.request)
        try:
            video = lti.get_or_create_video()
        except LTIException:
            return {"state": "error"}

        if lti.is_instructor:
            # Create a short-lived JWT token for the video
            jwt_token = AccessToken()
            jwt_token.payload["video_id"] = str(video.id)

            # Evaluating the token as a string computes it from its payload
            context = {"state": INSTRUCTOR, "jwt_token": str(jwt_token)}
        else:
            context = {"state": STUDENT}

        context["video"] = VideoSerializer(video).data if video else None

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
