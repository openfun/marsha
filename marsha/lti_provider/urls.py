from django.conf.urls import url

<<<<<<< HEAD
from marsha.lti_provider.views import LTILandingPage, \
    LTIFailAuthorization, LTIRoutingView, VideoCreate, VideoUpdate
=======
from marsha.lti_provider.views import LTILandingPage, LTIFailAuthorization,LTIRoutingView,AddVideo
>>>>>>> 15e2439a77faa369cd6902d6dce45e1ba595e0c7

urlpatterns = [url(r'^$', LTIRoutingView.as_view(), {}, 'lti-login'),
               url(r'^landing/$', LTILandingPage.as_view(), {},
               'lti-landing-page'), url(r'^auth$',
               LTIFailAuthorization.as_view(), {}, 'lti-fail-auth'),
               url(r'^video/add/$', VideoCreate.as_view(), {},
               'lti-video-add'),
               url(r'^video/update/(?P<pk>[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$'
               , VideoUpdate.as_view(), {}, 'lti-video-update')]

<<<<<<< HEAD
=======
urlpatterns = [
    url(r'^auth$', LTIFailAuthorization.as_view(), {}, 'lti-fail-auth'),
    url(r'^landing/$', LTILandingPage.as_view(), {}, 'lti-landing-page'),
    url(r'^$', LTIRoutingView.as_view(), {}, 'lti-login'),
    url(r'^addVideo$', AddVideo.as_view(), {}, 'lti-add-video'),

]
>>>>>>> 15e2439a77faa369cd6902d6dce45e1ba595e0c7
