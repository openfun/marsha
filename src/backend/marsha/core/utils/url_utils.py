"""Utils related to urls."""


def uri_scheme_behind_proxy(request, url):
    """
    Fix uris with forwarded protocol.

    When behind a proxy, django is reached in http, so generated urls are
    using http too.
    """
    if request.META.get("HTTP_X_FORWARDED_PROTO", "http") == "https":
        url = url.replace("http:", "https:", 1)
    return url


def build_absolute_uri_behind_proxy(request, url=None):
    """build_absolute_uri behind a proxy."""
    return uri_scheme_behind_proxy(request, request.build_absolute_uri(url))
