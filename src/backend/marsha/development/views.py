"""Declare development views."""
from logging import getLogger
import uuid

from django.conf import settings
from django.urls import reverse
from django.utils.decorators import method_decorator
from django.views.decorators.clickjacking import xframe_options_exempt
from django.views.decorators.csrf import csrf_exempt
from django.views.generic.base import TemplateView

from ..core.models import Playlist
from ..core.models.account import ConsumerSite, LTIPassport


logger = getLogger(__name__)


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

        if settings.BYPASS_LTI_VERIFICATION:
            oauth_dict = {
                "oauth_consumer_key": passport.oauth_consumer_key,
            }
        else:
            oauth_dict = {
                "oauth_consumer_key": passport.oauth_consumer_key,
                "oauth_timestamp": "",
                "oauth_nonce": "",
                "oauth_signature": "",
                "oauth_version": "",
                "oauth_signature_method": "",
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
