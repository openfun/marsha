"""Views of the ``core`` app of the Marsha project."""
from abc import ABC, abstractmethod
import json
from logging import getLogger
from urllib.parse import unquote
import uuid

from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import (
    ImproperlyConfigured,
    PermissionDenied,
    SuspiciousOperation,
    ValidationError as DjangoValidationError,
)
from django.templatetags.static import static
from django.urls import reverse
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
from rest_framework_simplejwt.tokens import AccessToken
from waffle import mixins, switch_is_active

from .defaults import SENTRY, VIDEO_LIVE
from .lti import LTI
from .lti.utils import (
    PortabilityError,
    get_or_create_resource,
    get_selectable_resources,
)
from .models import Document, Playlist, Video
from .models.account import NONE, ConsumerSite, LTIPassport
from .serializers import (
    DocumentSelectLTISerializer,
    DocumentSerializer,
    VideoSelectLTISerializer,
    VideoSerializer,
)
from .utils.react_locales_utils import react_locale


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


def _get_base_app_data():
    """Define common app data."""
    return {
        "environment": settings.ENVIRONMENT,
        "flags": {
            SENTRY: switch_is_active(SENTRY),
        },
        "release": settings.RELEASE,
        "sentry_dsn": settings.SENTRY_DSN,
        "static": {
            "svg": {
                "icons": static("svg/icons.svg"),
                "plyr": static("svg/plyr.svg"),
            }
        },
    }


class SiteView(mixins.WaffleSwitchMixin, TemplateView):
    """
    View called to serve the first site pages a user lands on, wherever they come from.

    It is designed to work as a React single page application. Once the user lands and the
    frontend loads, frontend navigation takes over.
    """

    template_name = "core/site.html"
    waffle_switch = "site"

    def get_context_data(self, **kwargs):
        """Build the context necessary to run the frontend app for the site."""
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(self.request.user.id)
        jwt_token.payload["user_id"] = str(self.request.user.id)

        app_data = _get_base_app_data()
        app_data.update(
            {
                "frontend": "Site",
                "jwt": str(jwt_token),
            }
        )

        return {
            "app_data": json.dumps(app_data),
            "external_javascript_scripts": settings.EXTERNAL_JAVASCRIPT_SCRIPTS,
            "static_base_url": f"{settings.STATIC_URL}js/build/",
        }


@method_decorator(csrf_exempt, name="dispatch")
@method_decorator(xframe_options_exempt, name="dispatch")
class BaseLTIView(ABC, TemplateResponseMixin, View):
    """Base view called to serve a resource and how to use it by the front application.

    It is designed to work as a React single page application.

    """

    template_name = "core/resource.html"

    @property
    @abstractmethod
    def model(self):
        """Model used by the view."""

    @property
    @abstractmethod
    def serializer_class(self):
        """Return the serializer used by the view."""

    def _get_base_app_data(self):
        """Define common app data for the LTI view."""
        app_data = _get_base_app_data()
        app_data.update(
            {
                "frontend": "LTI",
                "modelName": self.model.RESOURCE_NAME,
            }
        )
        return app_data

    def get_context_data(self):
        """Build context for template rendering of configuration data for the frontend.

        Returns
        -------
        dictionary
            context with configuration data for the frontend

        """

        def _manage_exception(error):
            logger.warning(str(error))
            app_data = self._get_base_app_data()
            app_data.update(
                {
                    "resource": None,
                    "state": "error",
                }
            )
            return app_data

        lti = LTI(self.request, self.kwargs["uuid"])
        try:
            lti.verify()
        except LTIException as error:
            app_data = _manage_exception(error)
        else:
            cache_key = "app_data|{model:s}|{domain:s}|{context:s}|{resource!s}".format(
                model=self.model.__name__,
                domain=lti.get_consumer_site().domain,
                context=lti.context_id,
                resource=lti.resource_id,
            )
            try:
                app_data = self._get_app_data(cache_key=cache_key, lti=lti)
            except PortabilityError as error:
                app_data = _manage_exception(error)

        return {
            "app_data": json.dumps(app_data),
            "static_base_url": f"{settings.STATIC_URL}js/build/",
            "external_javascript_scripts": settings.EXTERNAL_JAVASCRIPT_SCRIPTS,
        }

    def _get_app_data(self, cache_key, lti=None, resource_id=None):
        """Build app data for the frontend with information retrieved from the LTI launch request.

        Returns
        -------
        dictionary
            Configuration data to bootstrap the frontend:

            For all roles
            +++++++++++++

            - state: state of the LTI launch request. Can be one of `success` or `error`.
            - modelName: the type of resource (video, document,...)
            - resource: representation of the targetted resource including urls for the resource
                file (e.g. for a video: all resolutions, thumbnails and timed text tracks).

            For instructors only
            ++++++++++++++++++++

            - jwt_token: a short-lived JWT token linked to the resource ID that will be
                used for authentication and authorization on the API.

        """
        app_data = None
        if lti is None or lti.is_student:
            app_data = cache.get(cache_key)

        permissions = {"can_access_dashboard": False, "can_update": False}

        user_id = getattr(lti, "user_id", None) if lti else None

        if app_data is None:
            resource = (
                get_or_create_resource(self.model, lti)
                if lti
                else self._get_public_resource(resource_id)
            )
            if lti:
                permissions = {
                    "can_access_dashboard": lti.is_instructor or lti.is_admin,
                    "can_update": (lti.is_instructor or lti.is_admin)
                    and resource.playlist.lti_id == lti.context_id,
                }
            app_data = self._get_base_app_data()
            app_data.update(
                {
                    "flags": {
                        VIDEO_LIVE: switch_is_active(VIDEO_LIVE),
                        SENTRY: switch_is_active(SENTRY),
                    },
                    "resource": self.serializer_class(
                        resource,
                        context={
                            "can_return_live_info": lti.is_admin or lti.is_instructor
                            if lti
                            else False,
                            "roles": lti.roles if lti else [],
                            "user_id": user_id,
                        },
                    ).data
                    if resource
                    else None,
                    "state": "success",
                    "player": settings.VIDEO_PLAYER,
                }
            )
            if lti is None or lti.is_student:
                cache.set(cache_key, app_data, settings.APP_DATA_CACHE_DURATION)

        if app_data["resource"] is not None:
            try:
                locale = (
                    react_locale(lti.launch_presentation_locale)
                    if lti
                    else settings.REACT_LOCALES[0]
                )
            except ImproperlyConfigured:
                locale = settings.REACT_LOCALES[0]

            # Create a short-lived JWT token for the video
            jwt_token = AccessToken()
            jwt_token.payload.update(
                {
                    "session_id": str(uuid.uuid4()),
                    "context_id": lti.context_id
                    if lti
                    else app_data["resource"]["playlist"]["lti_id"],
                    "resource_id": str(lti.resource_id)
                    if lti
                    else app_data["resource"]["id"],
                    "roles": lti.roles if lti else [NONE],
                    "course": lti.get_course_info() if lti else {},
                    "locale": locale,
                    "permissions": permissions,
                    "maintenance": settings.MAINTENANCE_MODE,
                }
            )

            if user_id:
                jwt_token.payload["user_id"] = user_id

            app_data["jwt"] = str(jwt_token)

        return app_data

    def _get_public_resource(self, resource_id):
        """Fetch a resource publicly accessible.

        Parameters
        ----------
        resource_id: string
            The resource primary key to fetch

        Raises
        ------
        model.DoesNotExist
            Exception raised if the resource is not found

        Returns
        -------
        An instance of the model
        """
        return self.model.objects.select_related("playlist").get(
            self.model.get_ready_clause(),
            is_public=True,
            pk=resource_id,
        )

    def get_public_data(self):
        """Build app data for the frontend for a resource publicly accessible.

        Returns
        -------
        dictionary
            context with configuration data for the frontend
        """
        cache_key = "app_data|public|{model:s}|{resource_id:s}".format(
            model=self.model.__name__, resource_id=str(self.kwargs["uuid"])
        )
        try:
            app_data = self._get_app_data(
                cache_key=cache_key, resource_id=self.kwargs["uuid"]
            )
        except self.model.DoesNotExist:
            app_data = {
                "state": "error",
                "modelName": self.model.RESOURCE_NAME,
                "resource": None,
            }

        return {
            "app_data": json.dumps(app_data),
            "static_base_url": f"{settings.STATIC_URL}js/build/",
            "external_javascript_scripts": settings.EXTERNAL_JAVASCRIPT_SCRIPTS,
        }

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

    # pylint: disable=unused-argument
    def get(self, request, *args, **kwargs):
        """Respond to GET request.

        Only publicly accessible resources can be fetched

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
        return self.render_to_response(self.get_public_data())


class VideoView(BaseLTIView):
    """Video view."""

    model = Video
    serializer_class = VideoSerializer


class DocumentView(BaseLTIView):
    """Document view."""

    model = Document
    serializer_class = DocumentSerializer


@method_decorator(csrf_exempt, name="dispatch")
@method_decorator(xframe_options_exempt, name="dispatch")
class LTISelectView(TemplateResponseMixin, View):
    """LTI view called to select LTI content through Deep Linking.

    It is designed to work as a React single page application.

    """

    template_name = "core/resource.html"

    def get_context_data(self):
        """Build context for template rendering of configuration data for the frontend.

        Returns
        -------
        dictionary
            context with configuration data for the frontend

        """

        def _manage_exception(error):
            logger.warning(str(error))
            return {
                "frontend": "LTI",
                "state": "error",
            }

        lti = LTI(self.request)

        if not lti.is_instructor and not lti.is_admin:
            raise PermissionDenied

        try:
            lti.verify()
        except LTIException as error:
            app_data = _manage_exception(error)
        else:
            Playlist.objects.get_or_create(
                lti_id=lti.context_id,
                consumer_site=lti.get_consumer_site(),
                defaults={"title": lti.context_title},
            )
            app_data = self._get_app_data(lti)

        return {
            "app_data": json.dumps(app_data),
            "static_base_url": f"{settings.STATIC_URL}js/build/",
        }

    def _get_app_data(self, lti):
        """Build app data for the frontend with information retrieved from the LTI launch request.

        Returns
        -------
        dictionary
            Configuration data to bootstrap the frontend:
            A form is built in React to post data to the LTI Consumer thnough an iframe.

            For instructors only
            ++++++++++++++++++++

            - lti_select_form_action_url: URL to post data to.
            - lti_select_form_data: Data to post.
            - new_document_url: LTI URL to a new document.
            - new_video_url: LTI URL to a new video.
            - documents: Documents list with their LTI URLs.
            - videos: Videos list with their LTI URLs.

        """
        documents = DocumentSelectLTISerializer(
            get_selectable_resources(Document, lti),
            many=True,
            context={"request": self.request},
        ).data

        videos = VideoSelectLTISerializer(
            get_selectable_resources(Video, lti),
            many=True,
            context={"request": self.request},
        ).data

        new_uuid = str(uuid.uuid4())
        app_data = _get_base_app_data()

        lti_select_form_data = self.request.POST.copy()
        lti_select_form_data["lti_message_type"] = "ContentItemSelection"

        jwt_token = AccessToken()
        jwt_token.payload["lti_select_form_data"] = lti_select_form_data

        app_data.update(
            {
                "frontend": "LTI",
                "lti_select_form_action_url": reverse("respond_lti_view"),
                "lti_select_form_data": {"jwt": str(jwt_token)},
                "new_document_url": self.request.build_absolute_uri(
                    reverse("document_lti_view", args=[new_uuid])
                ),
                "new_video_url": self.request.build_absolute_uri(
                    reverse("video_lti_view", args=[new_uuid])
                ),
                "documents": documents,
                "videos": videos,
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

        Renders a form autosubmitted to a LTI consumer with signed parameters.

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
            jwt_token = AccessToken(self.request.POST.get("jwt", ""))
            jwt_token.verify()
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


@method_decorator(csrf_exempt, name="dispatch")
@method_decorator(xframe_options_exempt, name="dispatch")
class DevelopmentLTIView(TemplateView):
    """A development view with iframe POST / plain POST helpers.

    Not available outside of DEBUG = true environments.

    """

    template_name = "core/lti_development.html"

    def get_context_data(self, **kwargs):
        """Generate a UUID to pre-populate the `uuid` fields in the LTI request form.

        Parameters
        ----------
        kwargs : dictionary
            keyword extra arguments

        Returns
        -------
        dictionary
            context for template rendering

        """
        domain = self.request.build_absolute_uri("/").split("/")[2]
        try:
            consumer_site = ConsumerSite.objects.get(domain=domain)
        except ConsumerSite.DoesNotExist:
            consumer_site, _ = ConsumerSite.objects.get_or_create(
                domain=domain, name=domain
            )

        try:
            playlist = Playlist.objects.get(consumer_site=consumer_site)
        except Playlist.DoesNotExist:
            playlist, _ = Playlist.objects.get_or_create(
                consumer_site=consumer_site, title=domain, lti_id=domain
            )

        passport, _ = LTIPassport.objects.get_or_create(playlist=playlist)

        oauth_dict = {
            "oauth_consumer_key": passport.oauth_consumer_key,
        }

        return {
            "domain": domain,
            "uuid": uuid.uuid4(),
            "select_context_id": playlist.lti_id,
            "select_content_item_return_url": self.request.build_absolute_uri(
                reverse("lti-development-view")
            ),
            "oauth_dict": oauth_dict,
        }

    # pylint: disable=unused-argument
    def post(self, request, *args, **kwargs):
        """Respond to POST request.

        Context populated with POST request.

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
        return self.render_to_response({"content_selected": self.request.POST})
