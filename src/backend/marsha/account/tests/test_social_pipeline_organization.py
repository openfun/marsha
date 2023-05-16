"""Tests for the social pipeline `organization` module."""

from django.test import TestCase

from social_django.utils import load_strategy

from marsha.account.models import IdpOrganizationAssociation
from marsha.account.social_pipeline.organization import create_organization_from_saml
from marsha.account.tests.utils import MockedFERSAMLAuth, override_saml_fer_settings
from marsha.core.factories import OrganizationFactory, UserFactory
from marsha.core.models import (
    INSTRUCTOR,
    NONE,
    STUDENT,
    Organization,
    OrganizationAccess,
)


@override_saml_fer_settings()
class OrganizationPipelineTestCase(TestCase):
    """Test case for Renater SAML authentication Organization pipeline step."""

    @classmethod
    def setUpClass(cls):
        """
        Init backend for the test case: A fake SAML backend which
        always uses a configured Identity Provider with driven attributes.
        Also init common data: SAML response, SAML details,  a User in database.
        """
        super().setUpClass()

        # Init a fake backend with only what we need
        cls.backend = MockedFERSAMLAuth(
            load_strategy(),
            redirect_uri="http://testserver/",
        )

        cls.saml_response = {
            "idp_name": "marsha-local-idp",
            "attributes": {
                "attributes_are_unused_here": None,
            },
            "session_index": "unused",
        }

        # Prepare common data
        cls.default_saml_details = {
            "first_name": "unused",
            "last_name": "unused",
            "username": "rsanchez@samltest.id",  # unused
            "email": "rsanchez@samltest.id",  # unused
        }
        cls.user = UserFactory(
            username=cls.default_saml_details["username"],
            email=cls.default_saml_details["email"],
        )

    def setUp(self) -> None:
        """Always test there are no pre-existing data, or it may break tests for nothing."""
        # Pre-flight assertions
        self.assertEqual(IdpOrganizationAssociation.objects.count(), 0)
        self.assertEqual(Organization.objects.count(), 0)
        self.assertEqual(OrganizationAccess.objects.count(), 0)

    def assertLatestOrganizationAccessIsConsistent(
        self, role=NONE, access_count=None, user=None
    ):
        """
        Main test method used everywhere in following tests.

        This asserts the values for Organization and linking objects are properly defined.
        This expects only one organization for all tests.

        Parameters
        ----------
        role : str
        The expected attributed role. This comes from `marsha.core.models`

        access_count: int
        If not provided, we expect only one organization access to exist.
        If provided, we expect the access count to match this number, and
        we make our assertion against the latest created object (based on `created_on`)

        user: Type[User]
        If not provided we use the test case's user to make assertions, if provided
        we make assertions against him.
        """
        idp_organization_association = (
            IdpOrganizationAssociation.objects.get()  # ie count = 1
        )
        organization = Organization.objects.get()  # ie count = 1
        if access_count is None:
            organization_access = OrganizationAccess.objects.get()  # ie count = 1
        else:
            self.assertEqual(OrganizationAccess.objects.count(), access_count)
            organization_access = OrganizationAccess.objects.latest("created_on")

        self.assertEqual(
            idp_organization_association.idp_identifier, "http://marcha.local/idp/"
        )
        self.assertEqual(idp_organization_association.organization_id, organization.pk)

        self.assertEqual(organization.name, "Marsha organization")

        self.assertEqual(organization_access.organization_id, organization.pk)
        self.assertEqual(organization_access.user_id, (user or self.user).pk)
        self.assertEqual(organization_access.role, role)

    def test_create_organization_from_saml_teacher_new(self):
        """Assert new teacher from new organization initializes properly."""
        # Prepare data
        saml_details = {"roles": ["teacher"], **self.default_saml_details}

        # Call pipeline step "create_organization_from_saml"
        with self.assertNumQueries(
            # so many requests added by django-safedelete
            2  # @atomic(): 2 savepoints
            + 1  # try select IdpOrganizationAssociation
            + 5  # get_or_create Organization: 2 savepoints + 2 SELECT + get + create
            + 4  # create IdpOrganizationAssociation: 3 SELECT + 1 INSERT
            + 4,  # create OrganizationAccess: 3 SELECT + 1 INSERT
        ):
            create_organization_from_saml(
                None,  # strategy is unused
                saml_details,
                self.backend,
                user=self.user,
                response=self.saml_response,
                new_association=True,
            )

        # Test results
        self.assertLatestOrganizationAccessIsConsistent(role=INSTRUCTOR)

        # Call pipeline step again
        with self.assertNumQueries(2):  # @atomic(): 2 savepoints
            create_organization_from_saml(
                None,  # strategy is unused
                saml_details,
                self.backend,
                user=self.user,
                response=self.saml_response,
                new_association=False,  # association has been initiated on first call
            )

        # Test results are still unique
        self.assertLatestOrganizationAccessIsConsistent(role=INSTRUCTOR)

        # Edge case: assert we don't fail if `new_association` with already existing data
        create_organization_from_saml(
            None,  # strategy is unused
            saml_details,
            self.backend,
            user=self.user,
            response=self.saml_response,
            new_association=True,
        )
        self.assertLatestOrganizationAccessIsConsistent(role=INSTRUCTOR)

    def test_create_organization_from_saml_student_or_unknown_new(self):
        """Assert new student from new organization initializes properly."""
        # Prepare data
        saml_details = {"roles": [], **self.default_saml_details}

        # Call pipeline step "create_organization_from_saml"
        with self.assertNumQueries(
            # so many requests added by django-safedelete
            2  # @atomic(): 2 savepoints
            + 1  # try select IdpOrganizationAssociation
            + 5  # get_or_create Organization: 2 savepoints + 2 SELECT + get + create
            + 4  # create IdpOrganizationAssociation: 3 SELECT + 1 INSERT
            + 4,  # create OrganizationAccess: 3 SELECT + 1 INSERT
        ):
            create_organization_from_saml(
                None,  # strategy is unused
                saml_details,
                self.backend,
                user=self.user,
                response=self.saml_response,
                new_association=True,
            )

        # Test results
        self.assertLatestOrganizationAccessIsConsistent(role=STUDENT)

        # Call pipeline step again
        with self.assertNumQueries(2):  # @atomic(): 2 savepoints
            create_organization_from_saml(
                None,  # strategy is unused
                saml_details,
                self.backend,
                user=self.user,
                response=self.saml_response,
                new_association=False,  # association has been initiated on first call
            )

        # Test results are still unique
        self.assertLatestOrganizationAccessIsConsistent(role=STUDENT)

        # Edge case: assert we don't fail if `new_association` with already existing data
        create_organization_from_saml(
            None,  # strategy is unused
            saml_details,
            self.backend,
            user=self.user,
            response=self.saml_response,
            new_association=True,
        )
        self.assertLatestOrganizationAccessIsConsistent(role=STUDENT)

    def test_create_organization_from_saml_teacher_existing_organization(self):
        """
        Assert new teacher from existing organization without linked IdP
        initializes properly.
        """
        # Existing data in database
        OrganizationFactory(name="Marsha organization")

        # Prepare data
        saml_details = {"roles": ["teacher"], **self.default_saml_details}

        # Call pipeline step "create_organization_from_saml"
        with self.assertNumQueries(
            # so many requests added by django-safedelete
            2  # @atomic(): 2 savepoints
            + 1  # try select IdpOrganizationAssociation
            + 1  # get_or_create Organization: get
            + 4  # create IdpOrganizationAssociation: 3 SELECT + 1 INSERT
            + 4,  # create OrganizationAccess: 3 SELECT + 1 INSERT
        ):
            create_organization_from_saml(
                None,  # strategy is unused
                saml_details,
                self.backend,
                user=self.user,
                response=self.saml_response,
                new_association=True,
            )

        # Test results
        self.assertLatestOrganizationAccessIsConsistent(role=INSTRUCTOR)

        # Call pipeline step again
        with self.assertNumQueries(2):  # @atomic(): 2 savepoints
            create_organization_from_saml(
                None,  # strategy is unused
                saml_details,
                self.backend,
                user=self.user,
                response=self.saml_response,
                new_association=False,  # association has been initiated on first call
            )

        # Test results are still unique
        self.assertLatestOrganizationAccessIsConsistent(role=INSTRUCTOR)

    def test_create_organization_from_saml_student_existing_organization(self):
        """
        Assert new student from existing organization without linked IdP
        initializes properly.
        """
        # Existing data in database
        OrganizationFactory(name="Marsha organization")

        # Prepare data
        saml_details = {"roles": ["not_teacher"], **self.default_saml_details}

        # Call pipeline step "create_organization_from_saml"
        with self.assertNumQueries(
            # so many requests added by django-safedelete
            2  # @atomic(): 2 savepoints
            + 1  # try select IdpOrganizationAssociation
            + 1  # get_or_create Organization: get
            + 4  # create IdpOrganizationAssociation: 3 SELECT + 1 INSERT
            + 4,  # create OrganizationAccess: 3 SELECT + 1 INSERT
        ):
            create_organization_from_saml(
                None,  # strategy is unused
                saml_details,
                self.backend,
                user=self.user,
                response=self.saml_response,
                new_association=True,
            )

        # Test results
        self.assertLatestOrganizationAccessIsConsistent(role=STUDENT)

        # Call pipeline step again
        with self.assertNumQueries(2):  # @atomic(): 2 savepoints
            create_organization_from_saml(
                None,  # strategy is unused
                saml_details,
                self.backend,
                user=self.user,
                response=self.saml_response,
                new_association=False,  # association has been initiated on first call
            )

        # Test results are still unique
        self.assertLatestOrganizationAccessIsConsistent(role=STUDENT)

    def test_create_organization_from_saml_new_user_existing_organization(self):
        """
        Assert new student from existing organization linked to an IdP
        initializes properly.
        """
        saml_details = {"roles": ["not_teacher"], **self.default_saml_details}

        # Init organization with already one user
        create_organization_from_saml(
            None,  # strategy is unused
            saml_details,
            self.backend,
            user=self.user,
            response=self.saml_response,
            new_association=True,
        )

        # Create new user context
        saml_details["username"] = "msmith@samltest.id"  # unused
        saml_details["email"] = "msmith@samltest.id"  # unused
        new_user = UserFactory(
            username=saml_details["username"],
            email=saml_details["email"],
        )

        # Call pipeline step "create_organization_from_saml"
        with self.assertNumQueries(
            # so many requests added by django-safedelete
            2  # @atomic(): 2 savepoints
            + 1  # try select IdpOrganizationAssociation
            + 4,  # create OrganizationAccess: 3 SELECT + 1 INSERT
        ):
            create_organization_from_saml(
                None,  # strategy is unused
                saml_details,
                self.backend,
                user=new_user,
                response=self.saml_response,
                new_association=True,
            )

        self.assertLatestOrganizationAccessIsConsistent(
            role=STUDENT,
            access_count=2,
            user=new_user,
        )

    def test_create_organization_from_saml_new_user_new_organization(self):
        """
        Assert everything works when a new organization is created
        while other already exist.
        """
        # Init organization with already one user
        saml_details = {"roles": ["not_teacher"], **self.default_saml_details}

        create_organization_from_saml(
            None,  # strategy is unused
            saml_details,
            self.backend,
            user=self.user,
            response=self.saml_response,
            new_association=True,
        )

        # Test new user from new organization arrives
        new_backend = MockedFERSAMLAuth(
            load_strategy(),
            redirect_uri="http://testserver/",
            idp_name="another-idp",
            entity_id="http://other.provider/idp/",
            organization_display_name="Another Organization",
        )

        new_saml_response = {
            "idp_name": "another-idp",
            "attributes": {
                "attributes_are_unused_here": None,
            },
            "session_index": "unused",
        }

        saml_details["username"] = "msmith@samltest.id"  # unused
        saml_details["email"] = "msmith@samltest.id"  # unused
        new_user = UserFactory(
            username=saml_details["username"],
            email=saml_details["email"],
        )

        with self.assertNumQueries(
            # so many requests added by django-safedelete
            2  # @atomic(): 2 savepoints
            + 1  # try select IdpOrganizationAssociation
            + 5  # get_or_create Organization: 2 savepoints + 2 SELECT + get + create
            + 4  # create IdpOrganizationAssociation: 3 SELECT + 1 INSERT
            + 4,  # create OrganizationAccess: 3 SELECT + 1 INSERT
        ):
            create_organization_from_saml(
                None,  # strategy is unused
                saml_details,
                new_backend,
                user=new_user,
                response=new_saml_response,
                new_association=True,
            )

        self.assertEqual(IdpOrganizationAssociation.objects.count(), 2)
        self.assertEqual(Organization.objects.count(), 2)
        self.assertEqual(OrganizationAccess.objects.count(), 2)

        idp_organization_association = IdpOrganizationAssociation.objects.latest(
            "created_on"
        )
        organization = Organization.objects.latest("created_on")
        organization_access = OrganizationAccess.objects.latest("created_on")

        self.assertEqual(
            idp_organization_association.idp_identifier, "http://other.provider/idp/"
        )
        self.assertEqual(idp_organization_association.organization_id, organization.pk)

        self.assertEqual(organization.name, "Another Organization")

        self.assertEqual(organization_access.organization_id, organization.pk)
        self.assertEqual(organization_access.user_id, new_user.pk)
        self.assertEqual(organization_access.role, STUDENT)

    def test_create_organization_from_saml_new_association_is_none(self):
        """
        Assert the pipeline step fails if `new_association` has not been already defined.
        """
        saml_details = {"roles": ["not_teacher"], **self.default_saml_details}

        with self.assertRaises(RuntimeError):
            create_organization_from_saml(
                None,  # strategy is unused
                saml_details,
                self.backend,
                user=self.user,
                response=self.saml_response,
                new_association=None,
            )
