"""Test utils module."""

from importlib import reload
import sys
from urllib.parse import unquote, urlparse

from django.urls import clear_url_caches

from oauthlib import oauth1

from marsha.core.factories import ConsumerSiteLTIPassportFactory


def reload_urlconf():
    """
    Enforce URL configuration reload.
    Required when using override_settings for a
    setting present in `marsha.urls`.
    """
    # Look for all URLs modules because the `settings.ROOT_URLCONF` is not enough
    # for settings in application's URL configuration.
    for module in [module for module in sys.modules if module.endswith(".urls")]:
        # The module is already loaded, need to reload
        reload(sys.modules[module])
    clear_url_caches()
    # Otherwise, the module will be loaded normally by Django


def generate_passport_and_signed_lti_parameters(
    url, lti_parameters, passport_attributes=None
):
    """Generate signed LTI parameters."""
    url = urlparse(url)
    if passport_attributes is None:
        passport_attributes = {}
    passport = ConsumerSiteLTIPassportFactory(
        consumer_site__domain=url.hostname, **passport_attributes
    )
    client = oauth1.Client(
        client_key=passport.oauth_consumer_key, client_secret=passport.shared_secret
    )
    # Compute Authorization header which looks like:
    # Authorization: OAuth oauth_nonce="80966668944732164491378916897",
    # oauth_timestamp="1378916897", oauth_version="1.0", oauth_signature_method="HMAC-SHA1",
    # oauth_consumer_key="", oauth_signature="frVp4JuvT1mVXlxktiAUjQ7%2F1cw%3D"
    _uri, headers, _body = client.sign(
        url.geturl(),
        http_method="POST",
        body=lti_parameters,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    oauth_dict = dict(
        param.strip().replace('"', "").split("=")
        for param in headers["Authorization"].split(",")
    )

    signature = oauth_dict["oauth_signature"]
    oauth_dict["oauth_signature"] = unquote(signature)
    oauth_dict["oauth_nonce"] = oauth_dict.pop("OAuth oauth_nonce")

    lti_parameters.update(oauth_dict)
    return lti_parameters, passport
