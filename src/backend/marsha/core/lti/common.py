""" Common classes and methods for LTi module"""

from logging import getLogger
from urllib.parse import urlencode

from oauthlib.oauth1 import SignatureOnlyEndpoint
from oauthlib.oauth1.rfc5849 import CONTENT_TYPE_FORM_URLENCODED

from marsha.core.lti.validator import LTIRequestValidator


logger = getLogger(__name__)


class LTIException(Exception):
    """
    Custom LTI exception for proper handling
    of LTI specific errors
    """


def verify_request_common(url, method, headers, params):
    """
    Verifies that request is valid

    :param consumers: consumers from config file
    :param url: request url
    :param method: request method
    :param headers: request headers
    :param params: request params
    :return: is request valid
    """
    logger.debug("url %s", url)
    logger.debug("method %s", method)
    logger.debug("headers %s", headers)
    logger.debug("params %s", params)

    # Check header for SSL before selecting the url
    if (
        headers.get(
            "X-Forwarded-Proto",
            headers.get("HTTP_X_FORWARDED_PROTO", "http"),
        )
        == "https"
    ):
        url = url.replace("http:", "https:", 1)

    headers = dict(headers)
    body = None
    if params:
        params = dict(params)
        if method == "POST":
            headers["Content-Type"] = headers.get(
                "Content-Type", CONTENT_TYPE_FORM_URLENCODED
            )
            body = urlencode(params, True)
        else:
            url = f"{url}?{urlencode(params, True)}"
            body = None

    validator = LTIRequestValidator()
    endpoint = SignatureOnlyEndpoint(validator)
    valid, request = endpoint.validate_request(url, method, body=body, headers=headers)
    if not valid:
        if request:
            raise LTIException("OAuth error: Please check your key and secret")
        raise LTIException("OAuth error: Error while validating request.")

    return True
