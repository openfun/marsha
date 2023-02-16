"""Tests for Marsha JWT factories"""
import uuid

from django.test import RequestFactory, TestCase

from marsha.core.factories import LiveSessionFactory
from marsha.core.lti import LTI
from marsha.core.models import INSTRUCTOR
from marsha.core.simple_jwt.factories import (
    LiveSessionLtiTokenFactory,
    LTIResourceAccessTokenFactory,
)
from marsha.core.simple_jwt.tokens import ResourceAccessToken
from marsha.core.tests.testing_utils import generate_passport_and_signed_lti_parameters


class LTIResourceAccessTokenFactoryTestCase(TestCase):
    """Test suite for the LTIResourceAccessTokenFactory"""

    def test_payload_keys(self):
        """Tests the factory generates a payload with the same keys as the original method."""
        # generate an LTI request
        resource_id = uuid.uuid4()
        url = f"http://testserver/lti/videos/{resource_id}"
        lti_parameters, _passport = generate_passport_and_signed_lti_parameters(
            url=url,
            lti_parameters={
                "resource_link_id": "df7",
                "context_id": "course-v1:ufr+mathematics+0001",
                "roles": INSTRUCTOR,
                "user_id": "56255f3807599c377bf0e5bf072359fd",
                "lis_person_sourcedid": "jane_doe",
                "lis_person_contact_email_primary": "jane@test-mooc.fr",
            },
        )

        request = RequestFactory().post(
            url,
            lti_parameters,
            HTTP_REFERER="https://testserver",
        )
        lti = LTI(request, resource_id)
        self.assertTrue(lti.verify())

        session_id = uuid.uuid4()
        jwt = ResourceAccessToken.for_lti(lti, {}, session_id)

        jwt_from_factory = LTIResourceAccessTokenFactory()

        self.assertSetEqual(
            set(jwt.payload.keys()),
            set(jwt_from_factory.payload.keys()),
        )


class LiveSessionLtiTokenFactoryTestCase(TestCase):
    """Test suite for the LiveSessionLtiTokenFactory"""

    def test_payload_keys(self):
        """Tests the factory generates a payload with the same keys as the original method."""
        session_id = uuid.uuid4()
        jwt = ResourceAccessToken.for_live_session(
            LiveSessionFactory(is_from_lti_connection=True),
            session_id,
        )

        jwt_from_factory = LiveSessionLtiTokenFactory()

        self.assertSetEqual(
            set(jwt.payload.keys()),
            set(jwt_from_factory.payload.keys()),
        )
