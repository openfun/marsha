from django.conf.urls import url

from marsha.lti_provider.views import LTIConfigView, LTILandingPage, LTIFailAuthorization,LTIRoutingView,AddVideo


urlpatterns = [
    url(r'^config.xml$', LTIConfigView.as_view(), {}, 'lti-config'),
    url(r'^auth$', LTIFailAuthorization.as_view(), {}, 'lti-fail-auth'),
    url(r'^landing/$', LTILandingPage.as_view(), {}, 'lti-landing-page'),
    url(r'^$', LTIRoutingView.as_view(), {}, 'lti-login'),
    url(r'^addVideo$', AddVideo.as_view(), {}, 'lti-add-video'),

]
