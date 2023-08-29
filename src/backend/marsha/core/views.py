"""Views of the ``core`` app of the Marsha project."""
from abc import ABC, abstractmethod
import json
from logging import getLogger
import os
import re
from urllib.parse import unquote, urljoin
import uuid

from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import (
    PermissionDenied,
    SuspiciousOperation,
    ValidationError as DjangoValidationError,
)
from django.http import HttpResponse
from django.http.response import Http404
from django.shortcuts import get_object_or_404
from django.template import Context, Engine
from django.templatetags.static import static
from django.urls import reverse
from django.utils import translation
from django.utils.decorators import method_decorator
from django.views.decorators.clickjacking import xframe_options_exempt
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import View
from django.views.generic.base import TemplateResponseMixin, TemplateView

from oauthlib import oauth1
from pylti.common import LTIException
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework_simplejwt.exceptions import TokenError
from waffle import mixins, switch_is_active

from marsha.core.lti.user_association import get_user_from_lti
from marsha.core.simple_jwt.tokens import (
    LTISelectFormAccessToken,
    LTIUserToken,
    PlaylistRefreshToken,
)
from marsha.core.utils.lti_select_utils import get_lti_select_resources

from .defaults import (
    APP_DATA_STATE_ERROR,
    APP_DATA_STATE_PORTABILITY,
    APP_DATA_STATE_SUCCESS,
    BBB,
    CLASSROOM,
    DEPOSIT,
    DOCUMENT,
    LIVE_RAW,
    MARKDOWN,
    SENTRY,
    VIDEO,
    WEBINAR,
)
from .lti import LTI
from .lti.utils import (
    PortabilityError,
    get_or_create_resource,
    get_resource_closest_owners_and_playlist,
    get_selectable_resources,
)
from .models import Document, LiveSession, Playlist, PortabilityRequest, Video
from .models.account import LTIPassport
from .serializers import DocumentSerializer, PlaylistLiteSerializer, VideoSerializer


# pylint: disable=too-many-lines,too-many-locals

logger = getLogger(__name__)


def exception_handler(exc, context):
    """Handle Django ValidationError as an accepted exception.

    For the parameters, see ``exception_handler``
    This code comes from twidi's gist:
    https://gist.github.com/twidi/9d55486c36b6a51bdcb05ce3a763e79f
    """
    if isinstance(exc, DjangoValidationError):
        if hasattr(exc, "message_dict"):
            detail = exc.message_dict
        elif hasattr(exc, "message"):
            detail = exc.message
        elif hasattr(exc, "messages"):
            detail = exc.messages

        exc = DRFValidationError(detail=detail)

    return drf_exception_handler(exc, context)


class MarshaViewMixin:
    """
    Mixin which provides the very base context data for Marsha's frontend views.

    The context provides information for the `core/site.html` and `core/resource.html`
    templates:
     - static_base_url: the base URL for static files (including the React frontend)
     - external_javascript_scripts: third party js scripts to load
     - app_data: a payload to provide data to the frontend application

    Views should define the `frontend_name`, for now, only two values: `Site` and `LTI`.
    """

    frontend_name = None

    def _get_base_app_data(self):
        """Define common app data. This is not supposed to be overridden anywhere."""
        return {
            "frontend": self.frontend_name,
            "environment": settings.ENVIRONMENT,
            "flags": {
                SENTRY: switch_is_active(SENTRY),
                BBB: settings.BBB_ENABLED,
                CLASSROOM: settings.BBB_ENABLED,
                DEPOSIT: settings.DEPOSIT_ENABLED,
                LIVE_RAW: settings.LIVE_RAW_ENABLED,
                MARKDOWN: settings.MARKDOWN_ENABLED,
                VIDEO: True,
                WEBINAR: True,
                DOCUMENT: True,
            },
            "release": settings.RELEASE,
            "sentry_dsn": settings.SENTRY_DSN,
            "p2p": {
                "isEnabled": settings.P2P_ENABLED,
                "stunServerUrls": settings.P2P_STUN_SERVER_URLS,
                "webTorrentTrackerUrls": settings.P2P_WEB_TORRENT_TRACKER_URLS,
            },
            "static": {
                "img": {
                    "liveBackground": static("img/liveBackground.jpg"),
                    "liveErrorBackground": static("img/liveErrorBackground.jpg"),
                    "marshaWhiteLogo": static("img/marshaWhiteLogo.png"),
                    "videoWizardBackground": static("img/videoWizardBackground.png"),
                    "errorMain": static("img/errorTelescope.png"),
                },
            },
        }

    def _get_app_data(self):
        """Base method to fetch app data according to the view's context."""
        return self._get_base_app_data()

    def _build_context_data(self, app_data):
        """Utility to build expected params to render_to_response"""
        return {
            "app_data": json.dumps(app_data),
            "static_base_url": f"{settings.STATIC_URL}js/build/lti_site/",
            "external_javascript_scripts": settings.EXTERNAL_JAVASCRIPT_SCRIPTS,
        }


class SiteView(mixins.WaffleSwitchMixin, MarshaViewMixin, TemplateView):
    """
    View called to serve the first site pages a user lands on, wherever they come from.

    It is designed to work as a React single page application. Once the user lands and the
    frontend loads, frontend navigation takes over.
    """

    waffle_switch = "site"

    """
    Serves the compiled frontend entry point (only works if you have run `yarn
    run build`).
    """

    def get(self, request, *args, **kwargs):
        try:
            with open(
                os.path.join(
                    settings.BASE_STATIC_DIR,
                    "js",
                    "build",
                    "site",
                    "index.html",
                ),
                encoding="utf-8",
            ) as file:
                static_base_url = f"{settings.STATIC_URL}js/build/site/"
                content = file.read()
                content = re.sub(
                    r"/(static/js/main\..*\.js)", rf"{static_base_url}\1", content
                )
                content = re.sub(
                    r"/(static/css/main\..*\.css)", rf"{static_base_url}\1", content
                )

                engine = Engine.get_default()
                template = engine.from_string(content)

                return HttpResponse(
                    template.render(
                        Context(
                            {
                                "static_base_url": static_base_url,
                            }
                        )
                    )
                )
        except FileNotFoundError:
            logger.exception("Production build of app not found")
            return HttpResponse(
                """
                This URL is only used when you have built the production
                version of the app. Visit http://localhost:3000/ instead, or
                run `yarn run build` to test the production version.
                """,
                status=501,
            )


class ResourceException(Exception):
    """Wrapper to normalize exceptions caught in views."""


class BaseResourceView(TemplateResponseMixin, MarshaViewMixin, View):
    """
    Base view to provide common methods for view which concerns resource.

    This does not inherit from `TemplateView` as the inheriting views may provide only POST method.
    """

    frontend_name = "LTI"  # even for public resource
    template_name = "core/resource.html"

    def _app_data_exception(self, error: BaseException):
        """
        Build app data in a context of failure (object not found, LTI authentication failed...)

        This is called anytime a `ResourceException` is raised during
        the `get_context_data` process.

        Parameters
        ----------
        error : BaseException
            The original exception raised.

        Returns
        -------
        The `app data` dict.
        """
        logger.warning(str(error))
        app_data = self._get_base_app_data()
        app_data["state"] = APP_DATA_STATE_ERROR
        return app_data

    def _build_context_exception(self, error: BaseException):
        """
        Build the view context (for a `render_to_response`)
        when a `ResourceException` is raised.

        Parameters
        ----------
        error : BaseException
            The original exception raised.

        Returns
        -------
        The view's context dict.
        """
        return self._build_context_data(self._app_data_exception(error))

    def _init_context(self):
        """
        Endpoint to add view initialization steps before the `_get_app_data` call.

        This method should not return any value.
        """
        pass  # pylint:disable=unnecessary-pass

    def get_context_data(self):
        """
        Provides the context for the view, which will be returned using `render_to_response`.

        This falls into two steps:
         - the initialization step to extract or process specific data
           required in the following step.
         - the app data creation.

        Both steps may raise a resource exception, which purpose is to be caught to return an
        `_app_data_exception` app data. Other exceptions will pass through
        (e.g. a PermissionDenied).
        """
        try:
            self._init_context()
            app_data = self._get_app_data()
        except ResourceException as error:
            return self._build_context_exception(error.__cause__)

        return self._build_context_data(app_data)


class BaseModelResourceView(ABC, BaseResourceView):
    """
    Base view called to serve a specific resource.
    This must be overridden to provide the model for the resource and its serializer.

    This is the common view for LTI accessed resources and public resources.
    """

    @staticmethod
    def build_cache_key(*keys):
        """Generates the cache key from parameters."""
        return "|".join(str(key) for key in keys)

    @property
    @abstractmethod
    def cache_key(self):
        """Cache key from view context to store computed app data in some cases."""

    @property
    @abstractmethod
    def model(self):
        """Model used by the view."""

    @property
    @abstractmethod
    def serializer_class(self):
        """Return the serializer used by the view."""

    def _app_data_exception(self, error):
        """Adds the resource name to the exception app data."""
        app_data = super()._app_data_exception(error)
        app_data.update(
            {
                "modelName": self.model.RESOURCE_NAME,
                "resource": None,
            }
        )
        return app_data

    def _get_base_app_data(self):
        """
        Adds the resource name, fetch status and frontend configuration to the app data.

        This may also provide the `appName` for the frontend to load the proper components.
        """
        app_data = super()._get_base_app_data()
        app_data.update(
            {
                "modelName": self.model.RESOURCE_NAME,
                "state": APP_DATA_STATE_SUCCESS,
                "player": settings.VIDEO_PLAYER,
                "uploadPollInterval": settings.FRONT_UPLOAD_POLL_INTERVAL,
                # front is expecting duration in milliseconds
                "attendanceDelay": settings.ATTENDANCE_PUSH_DELAY * 1000,
                # In certain context, such as embedding the resource in content,
                # we want to collapse the dashboard.
                "dashboardCollapsed": "custom_embedded_resource" in self.request.POST,
            }
        )

        if self.request.resolver_match.app_name:
            app_data.update(
                {
                    "appName": self.request.resolver_match.app_name,
                }
            )

        return app_data

    def _get_resource_data(self, resource, session_id, is_admin=False, user_id=None):
        """Serializes the resource, provided some context, for the frontend app data."""
        if not resource:
            return None

        return self.serializer_class(
            resource,
            context={
                "is_admin": is_admin,
                "user_id": user_id,
                "session_id": session_id,
            },
        ).data


@method_decorator(csrf_exempt, name="dispatch")
@method_decorator(xframe_options_exempt, name="dispatch")
class BaseLTIView(BaseModelResourceView, ABC):
    """Base LTI view called to serve a resource on an LTI context
    and how to use it by the front application.

    This view answer to POST request only.

    It is designed to work as a React single page application.
    """

    @property
    def cache_key(self):
        """Cache key from view context."""

        return self.build_cache_key(
            "app_data",
            self.model.__name__,
            self.lti.get_consumer_site().domain,
            self.lti.context_id,
            self.lti.resource_id,
        )

    def _get_resource(self):
        """Get or create a resource from LTI.

        Raises
        ------
        PortabilityError
            When the resource is not portable.

        Returns
        -------
        An instance of the resource model
        """
        try:
            return get_or_create_resource(self.model, self.lti)
        except PortabilityError as error:
            raise ResourceException from error

    def _init_context(self):
        """Extract LTI information (and verifies the request) before data process."""
        self.lti = LTI(  # pylint:disable=attribute-defined-outside-init
            self.request,
            self.kwargs["uuid"],
        )
        try:
            self.lti.verify()
        except LTIException as error:
            raise ResourceException from error

    def _get_app_data(self):
        """Build app data for the frontend with information retrieved from the LTI launch request.

        Returns
        -------
        dictionary
            Configuration data to bootstrap the frontend:

            - state: state of the LTI launch request. Can be one of `defaults.APP_DATA_STATE_*`.
            - modelName: the type of resource (video, document,...)
            - resource: representation of the targeted resource including urls for the resource
                file (e.g. for a video: all resolutions, thumbnails and timed text tracks).
            - jwt_token: a short-lived JWT token linked to the resource ID that will be
                used for authentication and authorization on the API.
        """
        app_data = None
        if self.lti.is_student:
            app_data = cache.get(self.cache_key)

        permissions = {"can_access_dashboard": False, "can_update": False}
        session_id = str(uuid.uuid4())

        frontend_home_url = settings.FRONTEND_HOME_URL
        if frontend_home_url.endswith("/"):
            frontend_home_url = frontend_home_url[:-1]

        if app_data is None:
            is_instructor_or_admin = self.lti.is_instructor or self.lti.is_admin

            try:
                resource = self._get_resource()
            except ResourceException:
                # Try to determine whether the resource is available for portability
                if not is_instructor_or_admin:
                    raise

                resource_owners, playlist_id = get_resource_closest_owners_and_playlist(
                    self.model, self.lti.resource_id
                )
                if not resource_owners:
                    raise

                # Currently, the playlist will already be created along with the first resource
                # when the user "adds" a resource to the playlist/course on the LMS side.
                # We keep the creation possibility here in case we want to change this behavior
                # later (ie. do not create a resource each time a user wants to only copy/paste
                # the RMS URL to an existing resource).
                destination_playlist, _ = Playlist.objects.get_or_create(
                    lti_id=self.lti.context_id,
                    consumer_site=self.lti.get_consumer_site(),
                    defaults={"title": self.lti.context_title},
                )

                app_data = self._get_base_app_data()
                app_data["state"] = APP_DATA_STATE_PORTABILITY

                portability_request_exists = PortabilityRequest.objects.filter(
                    for_playlist=playlist_id,
                    from_playlist=destination_playlist,
                ).exists()

                redirect_to = urljoin(
                    settings.FRONTEND_HOME_URL,
                    "/portability-requests/pending/",
                )
                if not get_user_from_lti(self.lti):
                    lti_user_jwt = str(LTIUserToken.for_lti(self.lti))
                    redirect_to = f"{redirect_to}?association_jwt={lti_user_jwt}"
                app_data["portability"] = {
                    "for_playlist_id": str(playlist_id),
                    "redirect_to": redirect_to,
                    "portability_request_exists": portability_request_exists,
                }
                refresh_token = PlaylistRefreshToken.for_lti_portability_request(
                    lti=self.lti,
                    session_id=session_id,
                    port_to_playlist_id=str(destination_playlist.pk),
                )
                jwt_token = refresh_token.access_token
                app_data["jwt"] = str(jwt_token)
                app_data["refresh_token"] = str(refresh_token)
                app_data["frontend_home_url"] = frontend_home_url
                return app_data

            permissions = {
                "can_access_dashboard": is_instructor_or_admin,
                "can_update": (
                    is_instructor_or_admin
                    and resource.playlist.lti_id == self.lti.context_id
                ),
            }

            app_data = self._get_base_app_data()
            app_data["resource"] = self._get_resource_data(
                resource,
                session_id,
                is_admin=is_instructor_or_admin,
                user_id=getattr(self.lti, "user_id", None),
            )

            if self.lti.is_student:
                cache.set(self.cache_key, app_data, settings.APP_DATA_CACHE_DURATION)

        if app_data["resource"] is not None:
            refresh_token = PlaylistRefreshToken.for_lti(
                lti=self.lti,
                permissions=permissions,
                session_id=session_id,
                port_to_playlist_id=str(app_data["resource"]["playlist"]["id"]),
            )
            jwt_token = refresh_token.access_token
            app_data["jwt"] = str(jwt_token)
            app_data["refresh_token"] = str(refresh_token)
            app_data["frontend_home_url"] = frontend_home_url

        return app_data

    # pylint: disable=unused-argument
    def post(self, request, *args, **kwargs):
        """Respond to POST request.

        Populated with context retrieved by get_context_data in the LTI launch request.
        """
        return self.render_to_response(self.get_context_data())


class BaseView(BaseModelResourceView, ABC):
    """
    Base view called to serve a specific publicly available resource.

    This view answer to GET request only.
    """

    @property
    def cache_key_domain(self):
        """Cache key for domain name  linked to the current public resource"""
        return self.build_cache_key(
            "consumer_site__domain",
            self.model.__name__,
            self.kwargs["uuid"],
        )

    @property
    def cache_key(self):
        """Cache key from view context."""
        return self.build_cache_key(
            "app_data",
            "public",
            self.model.__name__,
            self.kwargs["uuid"],
        )

    def _get_app_data(self):
        """Build app data for the frontend for public resources.

        Returns
        -------
        dictionary
            Configuration data to bootstrap the frontend:

            - modelName: the type of resource (video, document,...)
            - resource: representation of the targeted resource including urls for the resource
                file (e.g. for a video: all resolutions, thumbnails and timed text tracks).
        """
        app_data = cache.get(self.cache_key)

        session_id = str(uuid.uuid4())

        if app_data is None:
            resource = self._get_resource()

            app_data = self._get_base_app_data()
            app_data["resource"] = self._get_resource_data(
                resource,
                session_id,
            )

            cache.set(self.cache_key, app_data, settings.APP_DATA_CACHE_DURATION)
            # if a consumer exists, we save the domain in a dedicated cache in order to use it
            # on every request made to determine if the response headers should be changed in the
            # get method.
            if resource.playlist.consumer_site:
                cache.set(
                    self.cache_key_domain,
                    resource.playlist.consumer_site.domain,
                    settings.PUBLIC_RESOURCE_DOMAIN_CACHE_DURATION,
                )

        if app_data["resource"] is not None:
            refresh_token = PlaylistRefreshToken.for_playlist_id(
                playlist_id=app_data["resource"]["playlist"]["id"],
                session_id=session_id,
            )
            jwt_token = refresh_token.access_token
            app_data["jwt"] = str(jwt_token)
            app_data["refresh_token"] = str(refresh_token)

        return app_data

    def _get_resource(self):
        """Fetch a resource publicly accessible.

        Raises
        ------
        model.DoesNotExist
            Exception raised if the resource is not found

        Returns
        -------
        An instance of the resource model
        """
        resource_id = self.kwargs["uuid"]

        try:
            return self.model.objects.select_related(
                "playlist", "playlist__consumer_site"
            ).get(
                self.model.get_ready_clause(),
                is_public=True,
                pk=resource_id,
            )
        except self.model.DoesNotExist as error:
            raise ResourceException from error

    # pylint: disable=unused-argument
    def get(self, request, *args, **kwargs):
        """Responds to GET request.

        Publicly accessible resources or direct access videos can be fetched
        """
        response = self.render_to_response(self.get_context_data())

        domain = cache.get(self.cache_key_domain)

        # If the resource is owned in a consumer site then we allow only this consumer
        # site domain to embed a public resource in an iframe
        # All subdomain from the domain are also accepted to have the same behavior as
        # with LTI passports
        if domain:
            response.xframe_options_exempt = True
            response.headers[
                "Content-Security-Policy"
            ] = f"frame-ancestors {domain} *.{domain};"

        return response


class VideoView(BaseView):
    """Video view."""

    model = Video
    serializer_class = VideoSerializer

    # pylint: disable=unused-argument
    def get(self, request, *args, **kwargs):
        """Respond to GET request.

        Publicly accessible resources or direct access videos can be fetched

        Parameters
        ----------
        request : Request
            passed by Django
        args : list
            positional extra arguments
        kwargs : dictionary
            keyword extra arguments

        Returns
        -------
        HTML
            generated from applying the data to the template

        """
        if "uuid" in kwargs and request.GET.get("lrpk") and request.GET.get("key"):
            return self.get_direct_access_from_livesession(
                kwargs["uuid"], request.GET.get("lrpk"), request.GET.get("key")
            )

        return super().get(request, *args, **kwargs)

    def get_direct_access_from_livesession(self, video_pk, livesession_pk, key):
        """Reminders mails for a scheduled webinar send direct access to the video.
        Video can be public or not. It will be accessed out of an LTI connection.
        The livesession information is used to build a JWT token.
        """
        livesession = get_object_or_404(
            LiveSession, pk=livesession_pk, video__pk=video_pk
        )

        if livesession.get_generate_salted_hmac() != key:
            raise Http404

        session_id = str(uuid.uuid4())
        cache_key = self.build_cache_key(
            "app_data",
            "direct_access",
            self.model.__name__,
            video_pk,
        )
        app_data = cache.get(cache_key)

        # activate language depending on livesession
        translation.activate(livesession.language)

        if app_data is None:
            app_data = self._get_base_app_data()
            app_data["resource"] = self._get_resource_data(
                livesession.video,
                session_id,
                user_id=livesession.lti_id,
            )
            cache.set(cache_key, app_data, settings.APP_DATA_CACHE_DURATION)

        refresh_token = PlaylistRefreshToken.for_live_session(livesession, session_id)
        jwt_token = refresh_token.access_token
        app_data["jwt"] = str(jwt_token)
        app_data["refresh_token"] = str(refresh_token)

        return self.render_to_response(self._build_context_data(app_data))


class VideoLTIView(BaseLTIView):
    """Video LTI view."""

    model = Video
    serializer_class = VideoSerializer


class DocumentView(BaseView):
    """Document view."""

    model = Document
    serializer_class = DocumentSerializer


class DocumentLTIView(BaseLTIView):
    """Document LTI view."""

    model = Document
    serializer_class = DocumentSerializer


@method_decorator(csrf_exempt, name="dispatch")
@method_decorator(xframe_options_exempt, name="dispatch")
class LTIConfigView(TemplateResponseMixin, View):
    """LTI view called to configure Marsha LTI provider."""

    template_name = "core/lti_config.xml"
    content_type = "text/xml; charset=utf-8"

    # pylint: disable=unused-argument
    def get(self, request, *args, **kwargs):
        """Respond to GET request.

        Parameters
        ----------
        request : Request
            passed by Django
        args : list
            positional extra arguments
        kwargs : dictionary
            keyword extra arguments

        Returns
        -------
        XML
            generated from applying the data to the template

        """
        icon_url = ""
        if settings.LTI_CONFIG_ICON:
            if settings.CLOUDFRONT_DOMAIN in settings.STATIC_URL:
                icon_url = static(settings.LTI_CONFIG_ICON)
            else:
                icon_url = f"//{request.get_host()}{static(settings.LTI_CONFIG_ICON)}"
        return self.render_to_response(
            {
                "code": settings.LTI_CONFIG_TITLE.lower()
                if settings.LTI_CONFIG_TITLE
                else None,
                "contact_email": settings.LTI_CONFIG_CONTACT_EMAIL,
                "description": settings.LTI_CONFIG_DESCRIPTION,
                "host": request.get_host(),
                "icon_url": icon_url,
                "title": settings.LTI_CONFIG_TITLE,
                "url": settings.LTI_CONFIG_URL,
            }
        )


@method_decorator(csrf_exempt, name="dispatch")
@method_decorator(xframe_options_exempt, name="dispatch")
class LTISelectView(BaseResourceView):
    """LTI view called to select LTI content through Deep Linking.

    It is designed to work as a React single page application.

    """

    def _init_context(self):
        """Adds LTI request verification and permissions check to the context initialization."""
        self.lti = LTI(self.request)  # pylint:disable=attribute-defined-outside-init

        if not self.lti.is_instructor and not self.lti.is_admin:
            # Return a 403 error
            raise PermissionDenied

        try:
            self.lti.verify()
        except LTIException as error:
            raise ResourceException from error

    def _get_app_data(self):
        """Build app data for the frontend with information retrieved from the LTI launch request.

        Returns
        -------
        dictionary
            Configuration data to bootstrap the frontend:
            A form is built in React to post data to the LTI Consumer through an iframe.

            For instructors only
            ++++++++++++++++++++

            - lti_select_form_action_url: URL to post data to.
            - lti_select_form_data: Data to post.
            - new_document_url: base URL for building a new document LTI URL.
            - new_video_url: base URL for building a new video LTI URL.
            - documents: Documents list with their LTI URLs.
            - videos: Videos list with their LTI URLs.

        """
        targeted_resource = self.request.resolver_match.kwargs.get("resource_kind")
        lti_select_resources_config = get_lti_select_resources()
        lti_select_resources_kind = (
            [targeted_resource]
            if targeted_resource
            else lti_select_resources_config.keys()
        )

        app_data = super()._get_app_data()

        # filter out resources that are inactive
        inactive_resources = self.lti.get_consumer_site().inactive_resources
        for name, value in app_data.get("flags").items():
            if name in ["sentry", "raw_live"]:
                continue
            if name == "BBB":
                app_data["flags"][name] = (
                    value and "classroom" not in inactive_resources
                )
                continue
            app_data["flags"][name] = value and name not in inactive_resources

        lti_select_resources_kind = [
            resource_kind
            for resource_kind in lti_select_resources_kind
            if resource_kind not in inactive_resources
            and app_data["flags"][resource_kind]
        ]

        if targeted_resource:
            app_data.update(
                {
                    "targeted_resource": targeted_resource,
                }
            )

        playlist, _ = Playlist.objects.get_or_create(
            lti_id=self.lti.context_id,
            consumer_site=self.lti.get_consumer_site(),
            defaults={"title": self.lti.context_title},
        )

        for resource_kind in lti_select_resources_kind:
            resource_config = lti_select_resources_config[resource_kind]
            resources = get_selectable_resources(resource_config["model"], self.lti)
            if resource_config.get("extra_filter"):
                resources = resource_config["extra_filter"](resources)

            serialized_data = resource_config["serializer"](
                resources,
                many=True,
                context={"request": self.request},
            ).data

            app_data.update(
                {
                    f"{resource_kind}s": serialized_data,
                    f"new_{resource_kind}_url": self.request.build_absolute_uri(
                        resource_config["route"]
                    ),
                }
            )

        lti_select_form_data = self.request.POST.copy()
        lti_select_form_data["lti_message_type"] = "ContentItemSelection"

        lti_select_form_data_jwt = LTISelectFormAccessToken.for_lti_select_form_data(
            lti_select_form_data
        )

        activity_title = ""
        if self.request.POST.get("title") != settings.LTI_CONFIG_TITLE:
            activity_title = self.request.POST.get("title")

        refresh_token = PlaylistRefreshToken.for_lti(
            lti=self.lti,
            permissions={"can_access_dashboard": False, "can_update": True},
            session_id=str(uuid.uuid4()),
            port_to_playlist_id=str(playlist.id),
        )

        app_data.update(
            {
                "lti_select_form_action_url": reverse("respond_lti_view"),
                "lti_select_form_data": {
                    "jwt": str(lti_select_form_data_jwt),
                    "activity_title": activity_title,
                    "activity_description": self.request.POST.get("text"),
                },
                "playlist": PlaylistLiteSerializer(playlist).data,
                "jwt": str(refresh_token.access_token),
                "refresh_token": str(refresh_token),
            }
        )

        return app_data

    # pylint: disable=unused-argument
    def post(self, request, *args, **kwargs):
        """Respond to POST request.

        Populated with context retrieved by get_context_data in the LTI launch request.

        Parameters
        ----------
        request : Request
            passed by Django
        args : list
            positional extra arguments
        kwargs : dictionary
            keyword extra arguments

        Returns
        -------
        HTML
            generated from applying the data to the template

        """
        return self.render_to_response(self.get_context_data())


@method_decorator(csrf_exempt, name="dispatch")
@method_decorator(xframe_options_exempt, name="dispatch")
class LTIRespondView(TemplateResponseMixin, View):
    """LTI view called to respond to a consumer.

    ie. after a deep linking content selection.

    """

    template_name = "core/form_autosubmit.html"

    # pylint: disable=unused-argument
    def post(self, request, *args, **kwargs):
        """Respond to POST request.

        Renders a form autosubmitted to an LTI consumer with signed parameters.

        Parameters
        ----------
        request : Request
            passed by Django
        args : list
            positional extra arguments
        kwargs : dictionary
            keyword extra arguments
        Returns
        -------
        HTML
            generated from applying the data to the template

        """
        try:
            jwt_token = LTISelectFormAccessToken(self.request.POST.get("jwt", ""))
        except TokenError as error:
            logger.warning(str(error))
            raise PermissionDenied from error

        try:
            lti_select_form_data = jwt_token.payload.get("lti_select_form_data")
            content_item_return_url = lti_select_form_data.get(
                "content_item_return_url"
            )
            if not content_item_return_url or "content_items" not in request.POST:
                raise SuspiciousOperation

            # filters out oauth parameters
            lti_parameters = {
                key: value
                for (key, value) in lti_select_form_data.items()
                if "oauth" not in key
            }
            lti_parameters.update(
                {"content_items": self.request.POST.get("content_items")}
            )
        except AttributeError as error:
            logger.warning(str(error))
            raise SuspiciousOperation from error

        try:
            passport = LTIPassport.objects.get(
                oauth_consumer_key=lti_select_form_data.get("oauth_consumer_key"),
                is_enabled=True,
            )
        except LTIPassport.DoesNotExist as error:
            logger.warning(str(error))
            raise PermissionDenied from error

        try:
            client = oauth1.Client(
                client_key=passport.oauth_consumer_key,
                client_secret=passport.shared_secret,
            )
            # Compute Authorization header which looks like:
            # Authorization: OAuth oauth_nonce="80966668944732164491378916897",
            # oauth_timestamp="1378916897",
            # oauth_version="1.0", oauth_signature_method="HMAC-SHA1",
            # oauth_consumer_key="",
            # oauth_signature="frVp4JuvT1mVXlxktiAUjQ7%2F1cw%3D"
            _uri, headers, _body = client.sign(
                content_item_return_url,
                http_method="POST",
                body=lti_parameters,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
        except ValueError as error:
            logger.warning(str(error))
            raise SuspiciousOperation from error

        # Parse headers to pass to template as part of context:
        oauth_dict = dict(
            param.strip().replace('"', "").split("=")
            for param in headers["Authorization"].split(",")
        )

        oauth_dict["oauth_signature"] = unquote(oauth_dict["oauth_signature"])
        oauth_dict["oauth_nonce"] = oauth_dict.pop("OAuth oauth_nonce")

        lti_parameters.update(oauth_dict)

        return self.render_to_response(
            {"form_action": content_item_return_url, "form_data": lti_parameters}
        )


class RemindersCancelView(TemplateResponseMixin, View):
    """
    View to cancel reminders by supplying the key and the pk of a livesession
    """

    template_name = "core/reminder_unregister.html"

    def get(self, request, *args, **kwargs):
        """Set should_send_reminders to False if link to unsubscribe is recognized."""
        if "pk" in kwargs and "key" in kwargs:
            livesession = get_object_or_404(LiveSession, pk=kwargs["pk"])
            if livesession.get_generate_salted_hmac() == kwargs["key"]:
                livesession.should_send_reminders = False
                livesession.save()
                translation.activate(livesession.language)
                return self.render_to_response({"video": livesession.video})

        raise Http404
