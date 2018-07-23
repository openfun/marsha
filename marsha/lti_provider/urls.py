from django.conf.urls import url

from marsha.lti_provider.views import (
    LTIFailAuthorization,
    LTILandingPage,
    LTIRoutingView,
    VideoCreate,
    VideoUpdate,
)


urlpatterns = [
    url(r"^$", LTIRoutingView.as_view(), {}, "lti-login"),
    url(r"^landing/$", LTILandingPage.as_view(), {}, "lti-landing-page"),
    url(r"^auth$", LTIFailAuthorization.as_view(), {}, "lti-fail-auth"),
    url(r"^video/add/$", VideoCreate.as_view(), {}, "lti-video-add"),
    url(
        r"^video/update/(?P<pk>[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$",
        VideoUpdate.as_view(),
        {},
        "lti-video-update",
    ),
]
