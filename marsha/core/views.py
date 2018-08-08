"""Views of the ``core`` app of the Marsha project."""
from django.shortcuts import render

from pylti.common import LTIException

from .lti import LTI
from .models.account import INSTRUCTOR, STUDENT


def video_lti_view(request):
    """View called by an LTI launch request.

    Arguments:
        request(django.http.request.HttpRequest): Http request for the view

    Returns:
        HttpResponse(django.http.response.HttpResponse): Http response to the LTI launch request.
            It is designed to work as a React single page application.

    """
    lti = LTI(request)
    try:
        lti.initialize_session()
    except LTIException:
        context = {"state": "error"}
    else:
        context = {"state": INSTRUCTOR if lti.is_instructor else STUDENT}

    return render(request, "core/lti_video.html", context)
