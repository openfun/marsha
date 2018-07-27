"""Views for the ``lti_provider`` app of the Marsha project."""

from django.conf import settings
from django.http import HttpResponse
from django.http.response import HttpResponseRedirect
from django.utils.decorators import method_decorator
from django.views.decorators.clickjacking import xframe_options_exempt
from django.views.decorators.csrf import csrf_exempt
from django.views.generic.base import TemplateView, View
from django.views.generic.edit import CreateView, UpdateView

from marsha.core.factories import PlaylistFactory
from marsha.core.models.video import Playlist, Video
from marsha.lti_provider.mixins import LTIAuthMixin

from .forms import VideoForm


try:
    from django.urls import reverse
except ImportError:
    from django.core.urlresolvers import reverse


class LTILandingPage(LTIAuthMixin, TemplateView):
    """The LTILandingPage object displays the landing page once the LTI request is validated."""

    template_name = "lti_provider/landing_page.html"

    def get_context_data(self, **kwargs):
        """Find the video corresponding to lti_id and playlist_id.

        Arguments:
            kwargs: arguments
        Returns:
            JSON: the information passed to the html template
        """
        form = VideoForm()
        # get playlist_id from session
        playlist_id = self.request.session.get("playlist_id", None)
        # get xblock_id
        lti_id = self.lti.resource_link_id(self.request)
        # set xblock_id in session to be able to retrieve it during the addition of video
        self.request.session["lti_id"] = str(lti_id)
        # retrieve the video linked to the xblock_id and playlist
        video = Video.objects.filter(lti_id=lti_id, playlist__pk=playlist_id).first()

        return {
            "title": settings.LTI_TOOL_CONFIGURATION.get("title"),
            "is_instructor": self.lti.is_instructor(self.request),
            "is_administrator": self.lti.is_administrator(self.request),
            "video": video,
            "form": form,
        }


class VideoCreate(LTIAuthMixin, CreateView):
    """Create a new video."""

    model = Video
    success_url = "/lti/landing"
    form_class = VideoForm
    template_name = "lti_provider/landing_page.html"

    def form_valid(self, form):
        """If the form is valid, save video object.

        Arguments:
            form(Form): Video Form
        Returns:
            Form: form_valid
        """
        try:
            self.object = form.save(commit=False)
            playlist = Playlist.objects.filter(
                pk=self.request.session.get("playlist_id")
            ).first()
            self.object.playlist = playlist
            self.object.lti_id = self.request.session.get("lti_id")
            self.object.save()
            return super(VideoCreate, self).form_valid(form)
        except BaseException:
            return super(VideoCreate, self).form_invalid(form)

    def form_invalid(self, form):
        """If the form is not valid, return error.

        Arguments:
            form(Form): Video Form
        Returns:
            django.http.HttpResponse: redirected url
        """
        return HttpResponse("Form is invalid.. Error occurred while adding video")


class VideoUpdate(LTIAuthMixin, UpdateView):
    """Modify an existing video."""

    model = Video
    success_url = "/lti/landing"
    form_class = VideoForm
    template_name = "lti_provider/landing_page.html"


class LTIFailAuthorization(TemplateView):
    """Fail Authorization."""

    template_name = "lti_provider/fail_auth.html"


class LTIRoutingView(LTIAuthMixin, View):
    """Access route with 'initial' request and 'any' role."""

    request_type = "initial"
    role_type = "any"

    @method_decorator(csrf_exempt, xframe_options_exempt)
    def dispatch(self, request, *args, **kwargs):
        """Decorate the dispatch method for csrf_exempt and xframe_options_exempt.

        Arguments:
            request(django.http.request): the request that stores the LTI parameters in the session
            args: arguments
            kwargs: arguments
        Returns:
            url: dispatched url.
        """
        return super(LTIRoutingView, self).dispatch(request, *args, **kwargs)

    def add_playlist(self, request, lti_id, site_name):
        """Create a new playlist.

        Arguments:
            request(django.http.request): the request that stores the LTI parameters in the session
            lti_id(String): Id of LTI course
            site_name(String): name of ConsumerSite
        """
        # create playlist and link it to an existing consumer site
        playlist = PlaylistFactory(lti_id=lti_id, consumer_site__name=site_name)
        # set playlist_id in session to be able to retrieve it during the addition of video
        request.session["playlist_id"] = str(playlist.pk)

    def post(self, request):
        """Check the user's role and the existence of playlist to redirect him to the correct url.

        Arguments:
            request(django.http.request): the request that stores the LTI parameters in the session
        Returns:
            django.http.response.HttpResponseRedirect: redirected url
        """
        # get the consumer sitename
        site_name = self.lti.consumer_sitename(request)
        # get the course_id from the lti request
        lti_id = self.lti.course_context(request)

        # retrieve playlist linked to the course_id and sitename
        playlist = Playlist.objects.filter(
            lti_id=lti_id, consumer_site__name=site_name
        ).first()
        if playlist:
            # set playlist_id in session to be able to retrieve it during the addition of video
            request.session["playlist_id"] = str(playlist.pk)
        else:
            # create playlist if it does not exist and
            # if user's role is either instructor or administrator
            if self.lti.is_instructor(self.request) or self.lti.is_administrator(
                self.request
            ):
                self.add_playlist(request, lti_id, site_name)

        url = reverse("lti-landing-page")

        # a templated landing page view for those LMS who do not have a 'launch in new tab' option
        if settings.LTI_TOOL_CONFIGURATION.get("new_tab") is False:
            url = self.request.scheme + "://" + self.request.get_host() + url

        return HttpResponseRedirect(url)
