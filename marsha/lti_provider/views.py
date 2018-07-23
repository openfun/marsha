from django.conf import settings
from django.http import HttpResponse
from django.http.response import HttpResponseRedirect
from django.utils.decorators import method_decorator
from django.views.decorators.clickjacking import xframe_options_exempt
from django.views.decorators.csrf import csrf_exempt
from django.views.generic.base import TemplateView, View
from django.views.generic.edit import CreateView, UpdateView

from marsha.core.factories import PlaylistFactory
from marsha.core.models.account import ConsumerSite
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
        """Find the video corresponding to lti_id and playlist_id."""
        form = VideoForm()
        playlist_id = self.request.session.get("playlist_id", None)
        lti_id = self.lti.resource_link_id(self.request).rsplit("-", 1)[1]
        self.request.session["lti_id"] = str(lti_id)
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
        self.object = form.save(commit=False)
        playlist = Playlist.objects.filter(
            pk=self.request.session.get("playlist_id")
        ).first()
        self.object.playlist = playlist
        self.object.lti_id = self.request.session.get("lti_id")
        self.object.save()
        return super(VideoCreate, self).form_valid(form)

    def form_invalid(self, form):
        return HttpResponse("form is invalid.. this is just an HttpResponse object")


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
    def dispatch(self, *args, **kwargs):
        """Dispatsh."""
        return super(LTIRoutingView, self).dispatch(*args, **kwargs)

    def add_playlist(self, request, lti_id, site_name):
        """Create a new playlist."""

        consumersite = ConsumerSite.objects.filter(name=site_name).first()
        playlist = PlaylistFactory(lti_id=lti_id, consumer_site=consumersite)
        request.session["playlist_id"] = str(playlist.pk)

    def post(self, request):
        """post."""
        site_name = self.lti.resource_link_id(request).rsplit("-", 1)[0]
        lti_id = self.lti.course_context(request)

        playlist = Playlist.objects.filter(
            lti_id=lti_id, consumer_site__name=site_name
        ).first()
        if playlist:
            request.session["playlist_id"] = str(playlist.pk)
        else:
            if self.lti.is_instructor(self.request) or self.lti.is_administrator(
                self.request
            ):
                self.add_playlist(request, lti_id, site_name)

        url = reverse("lti-landing-page")

        if settings.LTI_TOOL_CONFIGURATION.get("new_tab") is False:
            url = self.request.scheme + "://" + self.request.get_host() + url

        return HttpResponseRedirect(url)
