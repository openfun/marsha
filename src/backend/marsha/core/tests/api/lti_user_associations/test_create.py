"""Tests for the LtiUserAssociation create API."""

import json

from django.db.transaction import atomic
from django.test import TestCase

from marsha.core.factories import ConsumerSiteFactory, LtiUserAssociationFactory
from marsha.core.models import LtiUserAssociation
from marsha.core.simple_jwt.factories import LTIUserTokenFactory, UserAccessTokenFactory


class LtiUserAssociationCreateAPITest(TestCase):
    """Testcase for the LtiUserAssociation create API."""

    maxDiff = None

    def test_create_lti_user_association_by_anonymous_user(self):
        """Anonymous users cannot create LTI user association."""
        self.assertEqual(LtiUserAssociation.objects.count(), 0)

        response = self.client.post(
            "/api/lti-user-associations/",
            content_type="application/json",
            data=json.dumps(
                {
                    "association_jwt": str(LTIUserTokenFactory()),
                }
            ),
        )

        self.assertEqual(response.status_code, 401)  # Unauthorized
        self.assertEqual(LtiUserAssociation.objects.count(), 0)

    def test_create_api_lti_user_association_from_site_user(self):
        """
        Any user from the marsha standalone site should be able to create
        an LTI user association.
        """
        jwt_token = UserAccessTokenFactory()
        lti_user_jwt = LTIUserTokenFactory()

        response = self.client.post(
            "/api/lti-user-associations/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
            data=json.dumps(
                {
                    "association_jwt": str(lti_user_jwt),
                }
            ),
        )
        self.assertEqual(response.status_code, 201)  # Created
        self.assertEqual(LtiUserAssociation.objects.count(), 1)

        with atomic():
            response = self.client.post(
                "/api/lti-user-associations/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                content_type="application/json",
                data=json.dumps(
                    {
                        "association_jwt": str(lti_user_jwt),
                    }
                ),
            )
        self.assertEqual(response.status_code, 409)  # Conflict
        self.assertEqual(LtiUserAssociation.objects.count(), 1)

    def test_create_api_lti_user_association_from_site_user_bad_request(self):
        """The association JWT is mandatory in request body."""
        jwt_token = UserAccessTokenFactory()

        response = self.client.post(
            "/api/lti-user-associations/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
            data=json.dumps({}),
        )
        self.assertEqual(response.status_code, 400)  # Bad request
        self.assertEqual(LtiUserAssociation.objects.count(), 0)

    def test_create_api_lti_user_association_from_site_user_corrupted_jwt(self):
        """
        If for any reason the association JWT contains empty values it must raise a bad request.
        This cannot happen since the LTIUserToken is validated on creation and
        the UserToken has a user ID.
        """
        jwt_token = UserAccessTokenFactory()

        # lti_consumer_site_id is empty
        association_jwt = LTIUserTokenFactory()
        association_jwt.payload["lti_consumer_site_id"] = ""
        response = self.client.post(
            "/api/lti-user-associations/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
            data=json.dumps(
                {
                    "association_jwt": str(association_jwt),
                }
            ),
        )
        self.assertEqual(response.status_code, 400)  # Bad request
        self.assertEqual(LtiUserAssociation.objects.count(), 0)

        # lti_user_id is empty
        association_jwt = LTIUserTokenFactory()
        association_jwt.payload["lti_user_id"] = ""
        response = self.client.post(
            "/api/lti-user-associations/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
            data=json.dumps(
                {
                    "association_jwt": str(association_jwt),
                }
            ),
        )
        self.assertEqual(response.status_code, 400)  # Bad request
        self.assertEqual(LtiUserAssociation.objects.count(), 0)

        jwt_token = UserAccessTokenFactory()
        jwt_token.payload["user_id"] = ""
        # user_id is empty
        response = self.client.post(
            "/api/lti-user-associations/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
            data=json.dumps(
                {
                    "association_jwt": str(LTIUserTokenFactory()),
                }
            ),
        )
        self.assertEqual(response.status_code, 401)  # Unauthorized
        self.assertEqual(LtiUserAssociation.objects.count(), 0)

    def test_create_api_lti_user_association_without_association_jwt(
        self,
    ):
        """
        Any user from the marsha standalone site should be able to create
        an LTI user association by passing lti_consumer_site_id and lti_user_id.
        """
        jwt_token = UserAccessTokenFactory()
        consumer_site = ConsumerSiteFactory()

        response = self.client.post(
            "/api/lti-user-associations/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
            data=json.dumps(
                {
                    "lti_consumer_site_id": str(consumer_site.id),
                    "lti_user_id": "1234",
                }
            ),
        )

        self.assertEqual(response.status_code, 201)  # Created
        self.assertEqual(LtiUserAssociation.objects.count(), 1)
        lti_user_association = LtiUserAssociation.objects.first()
        self.assertEqual(lti_user_association.consumer_site, consumer_site)
        self.assertEqual(lti_user_association.lti_user_id, "1234")
        self.assertEqual(
            str(lti_user_association.user_id), jwt_token.payload["user_id"]
        )

    def test_create_api_lti_user_association_without_association_jwt_unknown_consumer_site(
        self,
    ):
        """
        If the consumer site is unknown, it must raise a bad request.
        """
        jwt_token = UserAccessTokenFactory()

        response = self.client.post(
            "/api/lti-user-associations/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
            data=json.dumps(
                {
                    "lti_consumer_site_id": "unknown",
                    "lti_user_id": "1234",
                }
            ),
        )

        self.assertEqual(response.status_code, 400)  # Bad request
        self.assertEqual(LtiUserAssociation.objects.count(), 0)

    def test_create_api_lti_user_association_without_association_jwt_already_existing(
        self,
    ):
        """
        If the association already exists, it must raise a conflict.
        """
        jwt_token = UserAccessTokenFactory()
        consumer_site = ConsumerSiteFactory()
        LtiUserAssociationFactory(
            consumer_site=consumer_site,
            lti_user_id="1234",
            user_id=jwt_token.get("user_id"),
        )

        response = self.client.post(
            "/api/lti-user-associations/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
            data=json.dumps(
                {
                    "lti_consumer_site_id": str(consumer_site.id),
                    "lti_user_id": "1234",
                }
            ),
        )

        self.assertEqual(response.status_code, 409)
