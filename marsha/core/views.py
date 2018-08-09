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
        """
        Populate the context with data retrieved from the LTI launch request.

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

            - resource-link-id: resource targetted by the LTI launch request.
            - state: state of the LTI launch request. Can be one of `student`, `instructor` or
                `error`.

            For instructors only
            ++++++++++++++++++++

            - jwt_token: a short-lived JWT token linked to the `resource_link_id` that will be used
                as authentication to request an upload policy.

        """
        context = super().get_context_data(**kwargs)

        lti = LTI(self.request)
        try:
            lti.verify()
        except LTIException:
            return {"state": "error"}

        if lti.is_instructor:
            # Create a short-lived JWT token for the "resource_link_id"
            jwt_token = AccessToken()
            jwt_token.payload["jti"] = lti.resource_link_id

            # Evaluating the token as a string computes it from its payload
            context = {"state": INSTRUCTOR, "jwt_token": str(jwt_token)}

        else:
            context = {"state": STUDENT}

        context["resource_link_id"] = lti.resource_link_id

        return context
