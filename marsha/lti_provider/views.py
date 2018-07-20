from django.conf import settings
from django.http.response import HttpResponseRedirect
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.views.generic.base import View, TemplateView
from django.views.generic.edit import CreateView, UpdateView

from marsha.lti_provider.mixins import LTIAuthMixin
from marsha.core.models.account import LTIPassport, LTIPassportScope, \
    ConsumerSite
from marsha.core.models.video import Playlist, Video
from marsha.core.factories import PlaylistFactory
from . forms import VideoForm

import logging
log = logging.getLogger(__name__)

try:
    from django.urls import reverse
except ImportError:
    from django.core.urlresolvers import reverse


class LTILandingPage(LTIAuthMixin, TemplateView):

    template_name = 'lti_provider/landing_page.html'

    def get_context_data(self, **kwargs):

        form = VideoForm()
        playlist_id = self.request.session.get('playlist_id', None)
        lti_id = self.lti.resource_link_id(self.request).rsplit('-',
                1)[1]
        self.request.session['lti_id'] = str(lti_id)
        video = Video.objects.filter(lti_id=lti_id,
                playlist__pk=playlist_id).first()

        return {
            'title': settings.LTI_TOOL_CONFIGURATION.get('title'),
            'is_instructor': self.lti.is_instructor(self.request),
            'is_administrator': self.lti.is_administrator(self.request),
            'video': video,
            'form': form,
            }


class VideoCreate(LTIAuthMixin, CreateView):

    model = Video
    success_url = '/lti/landing'
    form_class = VideoForm
    template_name = 'lti_provider/landing_page.html'

    def form_valid(self, form):
        self.object = form.save(commit=False)
        playlist = \
            Playlist.objects.filter(pk=self.request.session.get('playlist_id'
                                    )).first()
        self.object.playlist = playlist
        self.object.lti_id = self.request.session.get('lti_id')
        self.object.save()
        return super(VideoCreate, self).form_valid(form)

    def form_invalid(self, form):
        log.info('form is invalid')
        return http.HttpResponse('form is invalid.. this is just an HttpResponse object'
                                 )


class VideoUpdate(LTIAuthMixin, UpdateView):

    model = Video
    success_url = '/lti/landing'
    form_class = VideoForm
    template_name = 'lti_provider/landing_page.html'


class LTIFailAuthorization(TemplateView):

    template_name = 'lti_provider/fail_auth.html'


class LTIRoutingView(LTIAuthMixin, View):

    request_type = 'initial'
    role_type = 'any'

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super(LTIRoutingView, self).dispatch(*args, **kwargs)

    def add_playlist(
        self,
        request,
        lti_id,
        site_name,
        ):
        PlaylistFactory(lti_id=lti_id, consumer_site__name=site_name)

    def post(self, request):
        site_name = self.lti.resource_link_id(request).rsplit('-', 1)[0]
        lti_id = self.lti.course_context(request)

        playlist = Playlist.objects.filter(lti_id=lti_id,
                consumer_site__name=site_name).first()
        if playlist:
            request.session['playlist_id'] = str(playlist.pk)
        else:
            if self.lti.is_instructor(self.request) \
                or self.lti.is_administrator(self.request):
                self.add_playlist(request, lti_id, site_name)

        url = reverse('lti-landing-page')

        if settings.LTI_TOOL_CONFIGURATION.get('new_tab') == False:
            url = self.request.scheme + '://' + self.request.get_host() \
                + url

        return HttpResponseRedirect(url)

