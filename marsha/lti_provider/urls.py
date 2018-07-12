from django.conf.urls import url

from marsha.lti_provider.views import LTIConfigView, LTILandingPage, LTIRoutingView, \
    LTICourseEnableView, LTIPostGrade, LTIFailAuthorization, LTICourseConfigure


urlpatterns = [
    url(r'^config.xml$', LTIConfigView.as_view(), {}, 'lti-config'),
    url(r'^auth$', LTIFailAuthorization.as_view(), {}, 'lti-fail-auth'),
    url(r'^course/config$',
        LTICourseConfigure.as_view(), {}, 'lti-course-config'),
    url(r'^course/enable/$',
        LTICourseEnableView.as_view(), {}, 'lti-course-enable'),
    url(r'^landing/$', LTILandingPage.as_view(), {}, 'lti-landing-page'),
    url('^grade/$', LTIPostGrade.as_view(), {}, 'lti-post-grade'),
    url(r'^$', LTIRoutingView.as_view(), {}, 'lti-login'),
    url(r'^assignment/(?P<assignment_name>.*)/$',
        LTIRoutingView.as_view(), {}, 'lti-assignment-view'),
]
