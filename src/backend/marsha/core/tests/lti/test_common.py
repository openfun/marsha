"""Test LTI common methods"""

import uuid

from django.test import TestCase

from marsha.core.lti import LTIException, verify_request_common
from marsha.core.tests.testing_utils import generate_passport_and_signed_lti_parameters


class LTICommonTestCase(TestCase):
    """Test LTI common methods."""

    def test_verify_request_common(self):
        """
        verify_request_common succeeds on valid request
        """
        headers = {}
        url = f"http://testserver/lti/videos/{uuid.uuid4()}"
        lti_parameters, _ = generate_passport_and_signed_lti_parameters(
            url=url,
            lti_parameters={
                "resource_link_id": "df7",
                "context_id": "course-v1:ufr+mathematics+0001",
                "roles": "Instructor",
            },
        )
        ret = verify_request_common(url, "post", headers, lti_parameters)
        self.assertTrue(ret)

    def test_verify_request_common_no_oauth_fields(self):
        """
        verify_request_common fails on missing authentication
        """
        headers = {}
        url = f"http://testserver/lti/videos/{uuid.uuid4()}"
        lti_parameters, _ = generate_passport_and_signed_lti_parameters(
            url=url,
            lti_parameters={
                "resource_link_id": "df7",
                "context_id": "course-v1:ufr+mathematics+0001",
                "roles": "Instructor",
            },
        )
        lti_parameters.pop("oauth_consumer_key")
        with self.assertRaises(LTIException):
            verify_request_common(url, "post", headers, lti_parameters)

    def test_verify_request_common_no_params(self):
        """
        verify_request_common fails on missing parameters
        """
        url = "https://localhost:5000/"
        method = "GET"
        headers = {}
        params = {}
        with self.assertRaises(LTIException):
            verify_request_common(url, method, headers, params)
