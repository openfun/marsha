"""Marsha Education Federation SAML authentication views."""
from social_edu_federation.django.views import EduFedIdpChoiceView
from waffle.mixins import WaffleSwitchMixin

from marsha.core.defaults import RENATER_FER_SAML


class MarshaEduFederationIdpChoiceView(WaffleSwitchMixin, EduFedIdpChoiceView):
    """Display the list of all available Identity providers using marsha's template."""

    template_extends = "account/base.html"
    waffle_switch = RENATER_FER_SAML
