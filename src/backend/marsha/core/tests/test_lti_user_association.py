"""Test the user_association module from core.lti."""
import uuid

from django.core.exceptions import ValidationError
from django.test import RequestFactory, TestCase

from marsha.core.factories import (
    ConsumerSiteFactory,
    LtiUserAssociationFactory,
    UserFactory,
)
from marsha.core.lti import LTI
from marsha.core.lti.user_association import (
    clean_lti_user_id,
    create_user_association,
    get_user_from_lti,
    get_user_from_lti_user_id_and_consumer_site,
)
from marsha.core.models import LtiUserAssociation
from marsha.core.tests.utils import generate_passport_and_signed_lti_parameters


class LTIUserAssociationTestCase(TestCase):
    """Test the LTI user association helper functions."""

    def _build_lti_request(self, url, extra_parameters=None):
        """Build a LTI request with the given parameters."""
        lti_parameters, _passport = generate_passport_and_signed_lti_parameters(
            url=url,
            lti_parameters={
                "resource_link_id": "df7",
                "context_id": "course-v1:ufr+mathematics+0001",
                "roles": "Instructor",
                **(extra_parameters or {}),
            },
        )
        request = RequestFactory().post(
            url,
            lti_parameters,
            HTTP_REFERER="https://testserver",
        )
        lti = LTI(request, uuid.uuid4())
        self.assertTrue(lti.verify())
        return lti

    def test_clean_lti_user_id(self):
        """Test the LTI user id cleaning function behaves properly."""
        self.assertEqual(clean_lti_user_id(lti_user_id="john.doe.123"), "JOHN.DOE.123")
        self.assertEqual(clean_lti_user_id(lti_user_id="john.doe.123 "), "JOHN.DOE.123")
        self.assertEqual(clean_lti_user_id(lti_user_id=" john.doe.123"), "JOHN.DOE.123")
        self.assertEqual(clean_lti_user_id(lti_user_id=" john.dOe.123"), "JOHN.DOE.123")
        self.assertEqual(
            clean_lti_user_id(lti_user_id=" john dOe.123 "), "JOHN DOE.123"
        )

    def test_get_user_from_lti_user_id_and_consumer_site(self):
        """
        Test the LTI user association retrieval from LTI user id
        and consumer site function behaves properly.
        """
        user = UserFactory()  # because we want to assert this is the retrieved user
        lti_user_association = LtiUserAssociationFactory(user=user)

        self.assertIsNone(
            get_user_from_lti_user_id_and_consumer_site(
                lti_user_id="",
                consumer_site="",
            )
        )
        self.assertIsNone(
            get_user_from_lti_user_id_and_consumer_site(
                lti_user_id=lti_user_association.lti_user_id,
                consumer_site=None,
            )
        )
        self.assertIsNone(
            get_user_from_lti_user_id_and_consumer_site(
                lti_user_id="",
                consumer_site=lti_user_association.consumer_site,
            )
        )

        self.assertEqual(
            get_user_from_lti_user_id_and_consumer_site(
                lti_user_id=lti_user_association.lti_user_id,
                consumer_site=lti_user_association.consumer_site,
            ),
            user,
        )
        self.assertEqual(
            get_user_from_lti_user_id_and_consumer_site(
                lti_user_id=f"{lti_user_association.lti_user_id.lower()} ",
                consumer_site=lti_user_association.consumer_site,
            ),
            user,
        )

    def test_get_user_from_lti(self):
        """Test the LTI user association retrieval from LTI function behaves properly."""
        url = f"http://testserver/lti/videos/{uuid.uuid4()}"
        lti = self._build_lti_request(url)

        self.assertIsNone(get_user_from_lti(lti))

        lti = self._build_lti_request(url, {"user_id": "john.doe.123"})
        self.assertIsNone(get_user_from_lti(lti))

        user = UserFactory()  # because we want to assert this is the retrieved user
        LtiUserAssociationFactory(
            user=user, lti_user_id="JOHN.DOE.123", consumer_site=lti.get_consumer_site()
        )

        self.assertEqual(get_user_from_lti(lti), user)

    def test_create_user_association(self):
        """Test the LTI user association creation function behaves properly."""
        with self.assertRaises(ValidationError):
            create_user_association(
                lti_consumer_site_id=str(uuid.uuid4()),
                lti_user_id=str(uuid.uuid4()),
                user_id=str(uuid.uuid4()),
            )

        user = UserFactory()
        consumer_site = ConsumerSiteFactory()
        with self.assertRaises(ValidationError):
            create_user_association(
                lti_consumer_site_id=consumer_site.pk,
                lti_user_id=str(uuid.uuid4()),
                user_id=str(uuid.uuid4()),
            )

        create_user_association(
            lti_consumer_site_id=consumer_site.pk,
            lti_user_id=str(uuid.uuid4()),
            user_id=user.pk,
        )
        self.assertEqual(LtiUserAssociation.objects.count(), 1)
