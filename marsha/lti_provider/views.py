import time
import sys
import uuid
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


<<<<<<< HEAD
=======


>>>>>>> 15e2439a77faa369cd6902d6dce45e1ba595e0c7
class LTILandingPage(LTIAuthMixin, TemplateView):

    template_name = 'lti_provider/landing_page.html'

    def get_context_data(self, **kwargs):
<<<<<<< HEAD

        form = VideoForm()
        playlist_id = self.request.session.get('playlist_id', None)
        lti_id = self.lti.resource_link_id(self.request).rsplit('-',
                1)[1]
        self.request.session['lti_id'] = str(lti_id)
        video = Video.objects.filter(lti_id=lti_id,
                playlist__pk=playlist_id).first()

=======
        domain = self.request.get_host()
        url = settings.LTI_TOOL_CONFIGURATION['landing_url'].format(
            self.request.scheme, domain, self.lti.course_context(self.request))
        #procan
        consumer = LTIPassport.objects.get(oauth_consumer_key=self.lti.oauth_consumer_key(self.request),is_enabled=True)
        ltipassscope=LTIPassportScope.objects.get(lti_passport=consumer)
        if ltipassscope.consumer_site is None and ltipassscope.playlist is None:
           self.template_name='lti_provider/404.html'
           return {}
        play=None 
        if ltipassscope.consumer_site is not None:
           playlist=Playlist.objects.filter(lti_id=self.lti.course_context(self.request),consumer_site=ltipassscope.consumer_site)
           if len(playlist)!=0:
                play=playlist[0]

           if play is None and self.lti.is_student(self.request):
                self.template_name='lti_provider/404.html'
                return {}
           if play is None and (self.lti.is_instructor(self.request) or self.lti.is_administrator(self.request)):
                try:
                    #uuid_playlist_lti=uuid.uuid1()
                    play= Playlist.objects.create(name="playlist1",lti_id=self.lti.course_context(self.request),is_public=True,consumer_site=ltipassscope.consumer_site)
                except:
                    log.info('error:{}'.format(sys.exc_info()[0]))
           if play is None :
               self.template_name='lti_provider/404.html'
               return {}
        else:
           play=ltipassscope.playlist
        #find videos
        site_name=self.lti.resource_link_id(self.request).rsplit('-', 1)[1]
        video=Video.objects.filter(lti_id=site_name,playlist=play)
        videolti=None
        if len(video)!=0:
                videolti=video[0]
        if videolti is None and self.lti.is_student(self.request):
                self.template_name='lti_provider/404.html'
                return {}
        a=False
        if(self.lti.is_instructor(self.request) or self.lti.is_administrator(self.request)):
                a=True
>>>>>>> 15e2439a77faa369cd6902d6dce45e1ba595e0c7
        return {
            'title': settings.LTI_TOOL_CONFIGURATION.get('title'),
            'is_instructor': a,
            'is_administrator': self.lti.is_administrator(self.request),
<<<<<<< HEAD
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

=======
            'videolti':videolti,
            'playlist_id':play.pk,
            'xblock_id':site_name,
        }

class AddVideo(LTIAuthMixin,TemplateView):
    template_name = 'lti_provider/landing_page.html'
    def get_context_data(self, **kwargs):
        name=self.request.GET.get('name')
        playlist_id=self.request.GET.get('playlist_id')
        xblock_id=self.request.GET.get('xblock_id')
        is_instructor=self.request.GET.get('is_instructor')
        upload=self.request.GET.get('upload')
        description=self.request.GET.get('description')
        language=self.request.GET.get('language')
        position=self.request.GET.get('position')
        try:
             if is_instructor:
                playlist=Playlist.objects.get(pk=playlist_id)
                if playlist is not None:
                   if upload=="True":
                      Video.objects.create(playlist=playlist,name=name,description=description,language=language,lti_id=xblock_id)
                   else:
                     vid= Video.objects.filter(playlist=playlist,lti_id=xblock_id)
                     if len(vid)!=0:
                         video=vid[0]
                         video.name=name
                         video.description=description
                         video.language=language
                         video.save()

        except:
             log.info('error:{}'.format(sys.exc_info()[1]))


        return {}
class LTIFailAuthorization(TemplateView):
    template_name = 'lti_provider/fail_auth.html'


class LTIRoutingView(LTIAuthMixin, View):
    request_type = 'initial'
    role_type = 'any'

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super(LTIRoutingView, self).dispatch(*args, **kwargs)

    def add_custom_parameters(self, url):
        if not hasattr(settings, 'LTI_EXTRA_PARAMETERS'):
            return url

        if '?' not in url:
            url += '?'
        else:
            url += '&'

        for key in settings.LTI_EXTRA_PARAMETERS:
            url += '{}={}&'.format(key, self.request.POST.get(key, ''))

        return url

    def post(self, request, assignment_name=None):
        if request.POST.get('ext_content_intended_use', '') == 'embed':
            domain = self.request.get_host()
            url = '%s://%s/%s?return_url=%s' % (
                self.request.scheme, domain,
                settings.LTI_TOOL_CONFIGURATION.get('embed_url'),
                request.POST.get('launch_presentation_return_url'))
        elif assignment_name:
            assignments = settings.LTI_TOOL_CONFIGURATION['assignments']
            url = assignments[assignment_name]
        elif settings.LTI_TOOL_CONFIGURATION.get('new_tab'):
            url = reverse('lti-landing-page')
        else:
            url = settings.LTI_TOOL_CONFIGURATION['landing_url'].format(
                self.request.scheme, self.request.get_host())

        # custom parameters can be tacked on here
        url = self.add_custom_parameters(url)

        return HttpResponseRedirect(url)
>>>>>>> 15e2439a77faa369cd6902d6dce45e1ba595e0c7

class LTIFailAuthorization(TemplateView):

<<<<<<< HEAD
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

=======
>>>>>>> 15e2439a77faa369cd6902d6dce45e1ba595e0c7
