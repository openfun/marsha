"""Views of the ``core`` app of the Marsha project."""
from django.views.generic import TemplateView

from pylti.common import LTIException
from rest_framework_simplejwt.tokens import AccessToken

from .lti import LTI
from .models.account import INSTRUCTOR, STUDENT


class VideoLTIView(TemplateView):
    """View called by an LTI launch request.

    It is designed to work as a React single page application.

    """

    template_name = "core/lti_video.html"

    def get_context_data(self, **kwargs):
        """Populate the context with data retrieved from the LTI launch request.

        Parameters
        ----------
        kwargs : dictionary
            passed on to the parent's method

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
        context = super().get_context_data(**kwargs)

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

        context["video"] = video

        return context
