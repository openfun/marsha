"""Marsha Renater SAML authentication views."""
from django.conf import settings
from django.http import HttpResponse, HttpResponseRedirect, HttpResponseServerError
from django.shortcuts import resolve_url
from django.urls import reverse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.cache import never_cache
from django.views.generic import TemplateView

from social_django.utils import load_backend, load_strategy
from waffle.mixins import WaffleSwitchMixin

from marsha.account.social_utils.renater_parser import get_all_renater_idp_choices
from marsha.core.defaults import RENATER_SAML


class SAMLMetadataView(View):
    """Generates the metadata to provide to the identity providers."""

    def get(self, request, *args, **kwargs):
        """Displays the generated metadata for the Renater SAML provider."""
        complete_url = reverse("account:social:complete", args=("renater_saml",))
        saml_backend = load_backend(
            load_strategy(request),
            "renater_saml",  # Use the generic one to provide our metadata
            redirect_uri=complete_url,
        )
        metadata, errors = saml_backend.generate_metadata_xml()

        if errors:
            # May add a sentry error here
            return HttpResponseServerError(
                content=",".join(errors),  # no security need to hide errors
                content_type="text/html",
            )

        return HttpResponse(content=metadata, content_type="text/xml")


class RenaterIdpChoiceView(WaffleSwitchMixin, TemplateView):
    """
    Display the list of all available Renater's Identity providers.
    """

    template_name = "account/renater_available_idps.html"
    recent_use_cookie_name = "_renater_idps"
    waffle_switch = RENATER_SAML

    def get_context_data(self, **kwargs):
        """
        Returns the context values:
         - List of all available Identity Providers
         - Last selected IdPs according to the cookie
        """
        context = super().get_context_data(**kwargs)
        renater_shibboleth_idps = get_all_renater_idp_choices()

        latest_selected_idps_str = self.request.COOKIES.get(
            self.recent_use_cookie_name, None
        )
        if latest_selected_idps_str:
            # Populate the latest selected IdP list
            latest_selected_idps = latest_selected_idps_str.split("+")
            latest_selected_idps_tuples = [
                (idp_name, display_name)
                for idp_name, display_name in renater_shibboleth_idps
                if idp_name in latest_selected_idps
            ]
            context["latest_selected_idps"] = latest_selected_idps_tuples
        else:
            context["latest_selected_idps"] = None
        context["renater_shibboleth_idps"] = renater_shibboleth_idps
        context["recent_use_cookie_name"] = self.recent_use_cookie_name
        return context

    @method_decorator(never_cache)
    def dispatch(self, request, *args, **kwargs):
        """Redirect already logged-in user to the main page."""
        if self.request.user.is_authenticated:
            return HttpResponseRedirect(resolve_url(settings.LOGIN_REDIRECT_URL))
        return super().dispatch(request, *args, **kwargs)
