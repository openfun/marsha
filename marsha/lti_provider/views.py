import time
import sys
import uuid
from django.conf import settings
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import Group
from django.http.response import HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.views.generic.base import View, TemplateView

from marsha.lti_provider.mixins import LTIAuthMixin
from pylti.common import LTIPostMessageException, post_message

from marsha.core.models.account import LTIPassport,LTIPassportScope,ConsumerSite
from marsha.core.models.video import Playlist,Video
import logging
log = logging.getLogger(__name__)  # pylint: disable=invalid-name


try:
    from django.urls import reverse
except ImportError:
    from django.core.urlresolvers import reverse


class LTIConfigView(TemplateView):
    template_name = 'lti_provider/config.xml'
    content_type = 'text/xml; charset=utf-8'

    def get_context_data(self, **kwargs):
        domain = self.request.get_host()
        launch_url = '%s://%s/%s' % (
            self.request.scheme, domain,
            settings.LTI_TOOL_CONFIGURATION.get('launch_url'))

        ctx = {
            'domain': domain,
            'launch_url': launch_url,
            'title': settings.LTI_TOOL_CONFIGURATION.get('title'),
            'description': settings.LTI_TOOL_CONFIGURATION.get('description'),
            'embed_icon_url':
                settings.LTI_TOOL_CONFIGURATION.get('embed_icon_url'),
            'embed_tool_id': settings.LTI_TOOL_CONFIGURATION.get(
                'embed_tool_id'),
            'frame_width': settings.LTI_TOOL_CONFIGURATION.get('frame_width'),
            'frame_height': settings.LTI_TOOL_CONFIGURATION.get(
                'frame_height'),
            'navigation': settings.LTI_TOOL_CONFIGURATION.get('navigation')
        }
        return ctx


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


class LTILandingPage(LTIAuthMixin, TemplateView):
    template_name = 'lti_provider/landing_page.html'
    def get_context_data(self, **kwargs):
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
                    uuid_playlist_lti=uuid.uuid1()
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
                videolti=videolti[0]
        if videolti is None and self.lti.is_student(self.request):
                self.template_name='lti_provider/404.html'
                return {}

        return {
            'landing_url': url,
            'title': settings.LTI_TOOL_CONFIGURATION.get('title'),
            'is_instructor': self.lti.is_instructor(self.request),
            'is_administrator': self.lti.is_administrator(self.request),
            'idlti':ltipassscope.pk,
        }


class LTIFailAuthorization(TemplateView):
    template_name = 'lti_provider/fail_auth.html'


class LTICourseConfigure(LTIAuthMixin, TemplateView):
    template_name = 'lti_provider/fail_course_configuration.html'

    def get_context_data(self, **kwargs):
        return {
            'is_instructor': self.lti.is_instructor(self.request),
            'is_administrator': self.lti.is_administrator(self.request),
            'user': self.request.user,
            'lms_course': self.lti.course_context(self.request),
            'lms_course_title': self.lti.course_title(self.request),
            'sis_course_id': self.lti.sis_course_id(self.request),
            'domain': self.lti.canvas_domain(self.request)
        }


class LTICourseEnableView(LTIAuthMixin, View):

    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super(self.__class__, self).dispatch(request, *args, **kwargs)

    def post(self, *args, **kwargs):
        group_id = self.request.POST.get('group')
        faculty_group_id = self.request.POST.get('faculty_group')
        course_context = self.lti.course_context(self.request)
        title = self.lti.course_title(self.request)

        '''(ctx, created) = LTICourseContext.objects.get_or_create(
            group=get_object_or_404(Group, id=group_id),
            faculty_group=get_object_or_404(Group, id=faculty_group_id),
            lms_course_context=course_context)'''

        messages.add_message(
            self.request, messages.INFO,
            '<strong>Success!</strong> {} is connected to {}.'.format(
                title, settings.LTI_TOOL_CONFIGURATION.get('title')))

        url = reverse('lti-landing-page', args=[course_context])
        return HttpResponseRedirect(url)


class LTIPostGrade(LTIAuthMixin, View):

    def message_identifier(self):
        return '{:.0f}'.format(time.time())

    def post(self, request, *args, **kwargs):
        """
        Post grade to LTI consumer using XML

        :param: score: 0 <= score <= 1. (Score MUST be between 0 and 1)
        :return: True if post successful and score valid
        :exception: LTIPostMessageException if call failed
        """
        try:
            score = float(request.POST.get('score'))
        except ValueError:
            score = 0

        redirect_url = request.POST.get('next', '/')
        launch_url = request.POST.get('launch_url', None)

        xml = self.lti.generate_request_xml(
            self.message_identifier(), 'replaceResult',
            self.lti.lis_result_sourcedid(request), score, launch_url)

        if not post_message(
            self.lti.consumers(), self.lti.oauth_consumer_key(request),
                self.lti.lis_outcome_service_url(request), xml):

            msg = ('An error occurred while saving your score. '
                   'Please try again.')
            messages.add_message(request, messages.ERROR, msg)

            # Something went wrong, display an error.
            # Is 500 the right thing to do here?
            raise LTIPostMessageException('Post grade failed')
        else:
            msg = ('Your score was submitted. Great job!')
            messages.add_message(request, messages.INFO, msg)

            return HttpResponseRedirect(redirect_url)
