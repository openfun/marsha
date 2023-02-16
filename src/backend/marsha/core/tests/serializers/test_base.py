"""Tests for the serializer base module of the Marsha project."""
from datetime import datetime, timedelta
import time
from unittest import mock

from django.test import TestCase, override_settings
from django.utils import timezone

from marsha.core.serializers import (
    get_resource_cloudfront_url_params,
    get_video_cloudfront_url_params,
)
from marsha.core.tests.testing_utils import RSA_KEY_MOCK
from marsha.core.utils.time_utils import to_timestamp


FIXED_TIME = datetime(2018, 8, 8, tzinfo=timezone.utc)


@override_settings(
    AWS_S3_URL_PROTOCOL="https",
    CACHES={
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        },
    },
    CLOUDFRONT_DOMAIN="abc.cloudfront.net",
    CLOUDFRONT_SIGNED_URLS_VALIDITY=2 * 60 * 60,  # 2 hours
    CLOUDFRONT_SIGNED_PUBLIC_KEY_ID="YourCloudfrontPublicKeyId",
    CLOUDFRONT_SIGNED_URL_CACHE_DURATION=15 * 60,  # 15 minutes
)
@mock.patch("builtins.open", new_callable=mock.mock_open, read_data=RSA_KEY_MOCK)
class ResourceCloudfrontUrlParamsTest(TestCase):
    """Test the function which generates the Cloudfront URL parameters."""

    maxDiff = None

    @mock.patch.object(timezone, "now", return_value=FIXED_TIME)
    def test_get_resource_cloudfront_url_params(self, _time_mock, _open_mock):
        """The `get_resource_cloudfront_url_params` function must return consistent values."""
        self.assertListEqual(
            get_resource_cloudfront_url_params(
                "some_resource",
                "dc3104d6-2cfb-11ed-aeff-7f0c85456c82",
            ),
            [
                "Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9hYmMuY2xvdWRmcm9udC5u"
                "ZXQvZGMzMTA0ZDYtMmNmYi0xMWVkLWFlZmYtN2YwYzg1NDU2YzgyLyoiLCJDb25kaXRpb24iOns"
                "iRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE1MzM2OTM2MDB9fX1dfQ__",
                "Signature=Ol2-nKxREmIWlqfkqyQSDWHhhYjyocA73X1N5LQHCLVdJiN2gxzM3mqe-heSbhWxC"
                "RwztcqETrzKQuAV~Oo1gNaizXApP6iykEVxBlYS8NmEfDne2rHbZUs9U90DnhVUx~E~2yfFhGzK"
                "ewaWKpjo1KVG9dR8yQlavJ1MICtheU94DK1s6qP6aJ1B6lPlwV1QyGirzKqcbGU-l-sqGv3fTXo"
                "pbDMKvFz8yYAoUCBh2IHcAkfRP6hjMJsjERnPA7FKBt5z2199WRGiF~9kcGLgEA2vEWF-FyI6r-"
                "JU6xJWgc3dHMUBf6oXOWbqsijYEhJMWr3EDwXnIfwYx52GejGS2w__",
                "Key-Pair-Id=YourCloudfrontPublicKeyId",
            ],
        )

    @mock.patch(
        "marsha.core.utils.cloudfront_utils.generate_cloudfront_urls_signed_parameters",
        return_value=["Policy", "Signature", "Key-Pair-Id"],
    )
    def test_get_resource_cloudfront_url_params_uses_cache(
        self, cloudfront_urls_mock, _open_mock
    ):
        """The `get_resource_cloudfront_url_params` function uses cache."""
        resource_kind = "some_resource"
        resource_id = "d0e8bcb8-2d00-11ed-b434-b3045e7f77ad"

        with (
            mock.patch.object(timezone, "now", return_value=FIXED_TIME),
            # mock time for LocMemCache
            mock.patch.object(time, "time", return_value=int(to_timestamp(FIXED_TIME))),
        ):
            self.assertListEqual(
                get_resource_cloudfront_url_params(
                    resource_kind,
                    resource_id,
                ),
                ["Policy", "Signature", "Key-Pair-Id"],
            )
            cloudfront_urls_mock.assert_called_once()

        cloudfront_urls_mock.reset_mock()

        now = FIXED_TIME + timedelta(seconds=15 * 60 - 1)
        with (
            mock.patch.object(timezone, "now", return_value=now),
            # mock time for LocMemCache
            mock.patch.object(time, "time", return_value=int(to_timestamp(now))),
        ):
            self.assertListEqual(
                get_resource_cloudfront_url_params(
                    resource_kind,
                    resource_id,
                ),
                ["Policy", "Signature", "Key-Pair-Id"],
            )
            cloudfront_urls_mock.assert_not_called()

        now = FIXED_TIME + timedelta(seconds=15 * 60 + 1)
        with (
            mock.patch.object(timezone, "now", return_value=now),
            # mock time for LocMemCache
            mock.patch.object(time, "time", return_value=int(to_timestamp(now))),
        ):
            self.assertListEqual(
                get_resource_cloudfront_url_params(
                    resource_kind,
                    resource_id,
                ),
                ["Policy", "Signature", "Key-Pair-Id"],
            )
            cloudfront_urls_mock.assert_called_once()

    @mock.patch.object(timezone, "now", return_value=FIXED_TIME)
    def test_get_video_cloudfront_url_params(self, _time_mock, _open_mock):
        """The `get_video_cloudfront_url_params` function must return consistent values."""
        self.assertListEqual(
            get_video_cloudfront_url_params(
                "5ad68da6-2cfc-11ed-85d6-070aafed10e6",
            ),
            [
                "Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9hYmMuY2xvdWRmcm9udC5u"
                "ZXQvNWFkNjhkYTYtMmNmYy0xMWVkLTg1ZDYtMDcwYWFmZWQxMGU2LyoiLCJDb25kaXRpb24iOns"
                "iRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE1MzM2OTM2MDB9fX1dfQ__",
                "Signature=OpUX~RdC3qBhsmuynnmyS~H84edXyYJQ0jdG9KLIcJy3I~B7-ACWMDp~Vlc0ohnSX"
                "6b99QwzTylIAzHeBmNT7b2kLkUpjEAzcH9BPu1A9UUnhArvPHAJ2qDKMTbf8Q2~cdEgDel2-znX"
                "kAJO04ieb0lXchT5xItMpGycrLsFgbK-XNc7k8hPZyol3HDwIurdz-nx5afDSH2PsYlAyyOZJub"
                "dc5iHzDjVdbtTffyRdsSSZt-l9O0GVs6d~FJbdEUZkVAA-T8hc-2eOglzvSqPK30fdBT8oAT8Hl"
                "zdwiiDqN9B40dIwX~bXtyf8u6JZOOcmNPCkpNA59DHEOIM0fWEHw__",
                "Key-Pair-Id=YourCloudfrontPublicKeyId",
            ],
        )
