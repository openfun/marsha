"""Test the url utils of the Marsha core app."""
from django.test import RequestFactory, TestCase

from ..utils.url_utils import build_absolute_uri_behind_proxy, uri_scheme_behind_proxy


class URLUtilsTestCase(TestCase):
    """Test our time utils."""

    def test_uri_scheme_behind_proxy(self):
        """Test fix uris behind proxy."""
        factory = RequestFactory()
        request_url = "/request/url/"
        request = factory.get(
            request_url,
        )
        http_proxy_request = factory.get(
            request_url,
            HTTP_X_FORWARDED_PROTO="http",
        )
        https_proxy_request = factory.get(
            request_url,
            HTTP_X_FORWARDED_PROTO="https",
        )

        def _test_without_proxy(expected_url, url):
            self.assertEqual(expected_url, uri_scheme_behind_proxy(request, url))

        def _test_with_http_proxy(expected_url, url):
            self.assertEqual(
                expected_url, uri_scheme_behind_proxy(http_proxy_request, url)
            )

        def _test_with_https_proxy(expected_url, url):
            self.assertEqual(
                expected_url, uri_scheme_behind_proxy(https_proxy_request, url)
            )

        _test_without_proxy(
            "http://testserver/some/url/", "http://testserver/some/url/"
        )
        _test_without_proxy(
            "https://testserver/some/url/", "https://testserver/some/url/"
        )

        _test_with_http_proxy(
            "http://testserver/some/url/", "http://testserver/some/url/"
        )
        _test_with_http_proxy(
            "https://testserver/some/url/", "https://testserver/some/url/"
        )

        _test_with_https_proxy(
            "https://testserver/some/url/", "http://testserver/some/url/"
        )
        _test_with_https_proxy(
            "https://testserver/some/url/", "https://testserver/some/url/"
        )

    def test_build_absolute_uri_behind_proxy(self):
        """Test absolute uris behind proxy."""
        factory = RequestFactory()
        request_url = "/request/url/"
        request = factory.get(
            request_url,
        )
        http_proxy_request = factory.get(
            request_url,
            HTTP_X_FORWARDED_PROTO="http",
        )
        https_proxy_request = factory.get(
            request_url,
            HTTP_X_FORWARDED_PROTO="https",
        )

        def _test_without_proxy(expected_url, url):
            self.assertEqual(
                expected_url, build_absolute_uri_behind_proxy(request, url)
            )

        def _test_with_http_proxy(expected_url, url):
            self.assertEqual(
                expected_url, build_absolute_uri_behind_proxy(http_proxy_request, url)
            )

        def _test_with_https_proxy(expected_url, url):
            self.assertEqual(
                expected_url, build_absolute_uri_behind_proxy(https_proxy_request, url)
            )

        _test_without_proxy(
            "http://testserver/some/url/", "http://testserver/some/url/"
        )
        _test_without_proxy(
            "https://testserver/some/url/", "https://testserver/some/url/"
        )
        _test_without_proxy("http://testserver/request/url/", None)
        _test_without_proxy("http://testserver/request/url/", "")

        _test_with_http_proxy(
            "http://testserver/some/url/", "http://testserver/some/url/"
        )
        _test_with_http_proxy(
            "https://testserver/some/url/", "https://testserver/some/url/"
        )
        _test_with_http_proxy("http://testserver/request/url/", None)
        _test_with_http_proxy("http://testserver/request/url/", "")

        _test_with_https_proxy(
            "https://testserver/some/url/", "http://testserver/some/url/"
        )
        _test_with_https_proxy(
            "https://testserver/some/url/", "https://testserver/some/url/"
        )
        _test_with_https_proxy("https://testserver/request/url/", None)
        _test_with_https_proxy("https://testserver/request/url/", "")
