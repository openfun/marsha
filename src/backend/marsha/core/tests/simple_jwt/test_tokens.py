"""Test Marsha JWTs"""
import uuid

from django.test import RequestFactory, TestCase

from rest_framework_simplejwt.exceptions import TokenError

from marsha.core.factories import LiveSessionFactory, UserFactory, VideoFactory
from marsha.core.lti import LTI
from marsha.core.models import INSTRUCTOR, NONE, STUDENT
from marsha.core.simple_jwt.tokens import (
    LTISelectFormAccessToken,
    ResourceAccessToken,
    ResourceRefreshToken,
    UserAccessToken,
)
from marsha.core.tests.testing_utils import generate_passport_and_signed_lti_parameters


class LTISelectFormAccessTokenTestCase(TestCase):
    """Test suite for the LTISelectFormAccessToken"""

    @classmethod
    def setUpClass(cls):
        """Provides test case with some common `lti_select_form_data`"""
        super().setUpClass()

        # `lti_select_form_data` should be a `self.request.POST` which behaves like a dict
        cls.lti_select_form_data = {"lti_message_type": "ContentItemSelection"}

    def test_for_lti_select_form_data(self):
        """Test JWT initialization from `for_lti_select_form_data` method"""
        # The `lti_select_form_data` content is not tested here
        token = LTISelectFormAccessToken.for_lti_select_form_data(
            self.lti_select_form_data
        )

        # Assert the payload contains the expected value
        self.assertDictEqual(
            token.payload["lti_select_form_data"], self.lti_select_form_data
        )

    def test_verify(self):
        """Test JWT `verify` method"""

        # The `lti_select_form_data` content is not tested here
        token = LTISelectFormAccessToken.for_lti_select_form_data(
            self.lti_select_form_data
        )

        token.verify()  # Should not raise

        handmade_token = LTISelectFormAccessToken()  # new empty token
        with self.assertRaises(TokenError):
            handmade_token.verify()

        handmade_token.payload["lti_select_form_data"] = self.lti_select_form_data
        handmade_token.verify()  # Should not raise


class ResourceAccessTokenTestCase(TestCase):
    """Test suite for the ResourceAccessToken"""

    maxDiff = None

    def make_lti_instance(self, resource_id=None, role=None):
        """Helper to init some LTI context."""
        url = f"http://testserver/lti/videos/{resource_id or uuid.uuid4()}"
        lti_parameters, passport = generate_passport_and_signed_lti_parameters(
            url=url,
            lti_parameters={
                "resource_link_id": "df7",
                "context_id": "course-v1:ufr+mathematics+0001",
                "roles": role or INSTRUCTOR,
                "user_id": "56255f3807599c377bf0e5bf072359fd",
                "lis_person_sourcedid": "jane_doe",
                "lis_person_contact_email_primary": "jane@test-mooc.fr",
            },
        )

        request = RequestFactory().post(
            url, lti_parameters, HTTP_REFERER="https://testserver"
        )
        lti = LTI(request, resource_id)
        self.assertTrue(lti.verify())

        return lti, passport

    def test_for_resource_id(self):
        """Test JWT initialization from `for_resource_id` method without LTI"""
        session_id = str(uuid.uuid4())
        resource_id = str(uuid.uuid4())

        refresh_token = ResourceRefreshToken.for_resource_id(resource_id, session_id)
        token = refresh_token.access_token

        refresh_token.verify()  # Must not raise
        token.verify()  # Must not raise
        self.assertEqual(refresh_token.payload["access_token_type"], "resource_access")
        self.assertEqual(token.payload["token_type"], "resource_access")
        self.assertEqual(token.payload["session_id"], session_id)
        self.assertEqual(token.payload["resource_id"], resource_id)
        self.assertListEqual(token.payload["roles"], [NONE])
        self.assertEqual(token.payload["locale"], "en_US")  # settings.REACT_LOCALES[0]
        self.assertDictEqual(
            token.payload["permissions"],
            {"can_access_dashboard": False, "can_update": False},
        )
        self.assertFalse(token.payload["maintenance"])  # settings.MAINTENANCE_MODE

        token = ResourceAccessToken.for_resource_id(
            resource_id,
            session_id,
            roles=[STUDENT],
        )
        token.verify()  # Must not raise
        self.assertEqual(token.payload["roles"], [STUDENT])

        token = ResourceAccessToken.for_resource_id(
            resource_id,
            session_id,
            locale="fr_FR",
        )
        token.verify()  # Must not raise
        self.assertEqual(token.payload["locale"], "fr_FR")

        token = ResourceAccessToken.for_resource_id(
            resource_id,
            session_id,
            permissions={"can_access_dashboard": True},
        )
        token.verify()  # Must not raise
        self.assertDictEqual(
            token.payload["permissions"],
            {"can_access_dashboard": True, "can_update": False},
        )

    def test_for_lti(self):
        """Test JWT initialization from `for_lti` method"""
        permissions = {"can_access_dashboard": False, "can_update": False}
        session_id = str(uuid.uuid4())
        resource_id = str(uuid.uuid4())
        lti, passport = self.make_lti_instance(resource_id=resource_id)

        refresh_token = ResourceRefreshToken.for_lti(lti, permissions, session_id)
        token = refresh_token.access_token

        refresh_token.verify()  # Must not raise
        token.verify()  # Must not raise
        self.assertEqual(refresh_token.payload["access_token_type"], "resource_access")
        self.assertEqual(token.payload["token_type"], "resource_access")
        self.assertEqual(token.payload["session_id"], session_id)
        self.assertEqual(token.payload["resource_id"], resource_id)
        self.assertEqual(token.payload["roles"], [INSTRUCTOR])
        self.assertEqual(token.payload["locale"], "en_US")
        self.assertDictEqual(token.payload["permissions"], permissions)
        self.assertFalse(token.payload["maintenance"])  # settings.MAINTENANCE_MODE

        self.assertEqual(token.payload["context_id"], "course-v1:ufr+mathematics+0001")
        self.assertEqual(token.payload["consumer_site"], str(passport.consumer_site.pk))
        self.assertDictEqual(
            token.payload["user"],
            {
                "email": "jane@test-mooc.fr",
                "id": "56255f3807599c377bf0e5bf072359fd",
                "user_fullname": None,
                "username": "jane_doe",
            },
        )

    def test_for_lti_with_playlist(self):
        """Test JWT initialization from `for_lti` method with a playlist"""
        permissions = {"can_access_dashboard": False, "can_update": False}
        session_id = str(uuid.uuid4())
        resource_id = str(uuid.uuid4())
        lti, passport = self.make_lti_instance(resource_id=resource_id)

        playlist_id = str(uuid.uuid4())
        refresh_token = ResourceRefreshToken.for_lti(
            lti,
            permissions,
            session_id,
            playlist_id=playlist_id,
        )
        token = refresh_token.access_token

        refresh_token.verify()  # Must not raise
        token.verify()  # Must not raise
        self.assertEqual(refresh_token.payload["access_token_type"], "resource_access")
        self.assertEqual(token.payload["token_type"], "resource_access")
        self.assertEqual(token.payload["session_id"], session_id)
        self.assertEqual(token.payload["resource_id"], resource_id)
        self.assertEqual(token.payload["roles"], [INSTRUCTOR])
        self.assertEqual(token.payload["locale"], "en_US")
        self.assertDictEqual(token.payload["permissions"], permissions)
        self.assertFalse(token.payload["maintenance"])  # settings.MAINTENANCE_MODE

        self.assertEqual(token.payload["context_id"], "course-v1:ufr+mathematics+0001")
        self.assertEqual(token.payload["consumer_site"], str(passport.consumer_site.pk))
        self.assertDictEqual(
            token.payload["user"],
            {
                "email": "jane@test-mooc.fr",
                "id": "56255f3807599c377bf0e5bf072359fd",
                "user_fullname": None,
                "username": "jane_doe",
            },
        )
        self.assertEqual(token.payload["playlist_id"], playlist_id)

    def test_for_lti_with_playlist_for_student(self):
        """Test JWT initialization from `for_lti` method with a playlist but student role."""
        permissions = {"can_access_dashboard": False, "can_update": False}
        session_id = str(uuid.uuid4())
        resource_id = str(uuid.uuid4())
        lti, _passport = self.make_lti_instance(resource_id=resource_id, role=STUDENT)

        playlist_id = str(uuid.uuid4())

        with self.assertRaises(AssertionError):
            ResourceAccessToken.for_lti(
                lti,
                permissions,
                session_id,
                playlist_id=playlist_id,
            )

        with self.assertRaises(AssertionError):
            ResourceRefreshToken.for_lti(
                lti,
                permissions,
                session_id,
                playlist_id=playlist_id,
            )

    def test_for_live_session_anonymous(self):
        """Test JWT initialization from `for_live_session` method with public session."""
        permissions = {"can_access_dashboard": False, "can_update": False}
        session_id = str(uuid.uuid4())
        anonymous_id = str(uuid.uuid4())
        live_session = LiveSessionFactory(
            anonymous_id=anonymous_id,
            email="chantal@test-fun-mooc.fr",
        )

        refresh_token = ResourceRefreshToken.for_live_session(live_session, session_id)
        token = refresh_token.access_token

        refresh_token.verify()  # Must not raise
        token.verify()  # Must not raise
        self.assertEqual(refresh_token.payload["access_token_type"], "resource_access")
        self.assertEqual(token.payload["token_type"], "resource_access")
        self.assertEqual(token.payload["session_id"], session_id)
        self.assertEqual(token.payload["locale"], "en_US")  # settings.REACT_LOCALES[0]
        self.assertDictEqual(token.payload["permissions"], permissions)
        self.assertFalse(token.payload["maintenance"])  # settings.MAINTENANCE_MODE

        self.assertEqual(token.payload["resource_id"], str(live_session.video.pk))
        self.assertDictEqual(
            token.payload["user"],
            {
                "email": "chantal@test-fun-mooc.fr",
                "anonymous_id": anonymous_id,
            },
        )
        self.assertListEqual(token.payload["roles"], [NONE])

    def test_for_live_session_lti(self):
        """Test JWT initialization from `for_live_session` method with LTI session."""
        permissions = {"can_access_dashboard": False, "can_update": False}
        session_id = str(uuid.uuid4())
        video = VideoFactory()
        live_session = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="chantal@test-fun-mooc.fr",
            lti_id="Maths",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            username="chantal",
            video=video,
        )

        self.assertTrue(live_session.is_from_lti_connection)

        refresh_token = ResourceRefreshToken.for_live_session(live_session, session_id)
        token = refresh_token.access_token

        refresh_token.verify()  # Must not raise
        token.verify()  # Must not raise
        self.assertEqual(refresh_token.payload["access_token_type"], "resource_access")
        self.assertEqual(token.payload["token_type"], "resource_access")
        self.assertEqual(token.payload["session_id"], session_id)
        self.assertEqual(token.payload["locale"], "en_US")  # settings.REACT_LOCALES[0]
        self.assertDictEqual(token.payload["permissions"], permissions)
        self.assertFalse(token.payload["maintenance"])  # settings.MAINTENANCE_MODE

        self.assertEqual(
            token.payload["consumer_site"], str(video.playlist.consumer_site.pk)
        )
        self.assertEqual(token.payload["context_id"], str(video.playlist.lti_id))
        self.assertEqual(token.payload["resource_id"], str(video.pk))
        self.assertDictEqual(
            token.payload["user"],
            {
                "email": "chantal@test-fun-mooc.fr",
                "id": "56255f3807599c377bf0e5bf072359fd",
                "username": "chantal",
            },
        )
        self.assertListEqual(token.payload["roles"], [STUDENT])

    def test_verify_fails(self):
        """Test JWT when `verify` method fails."""
        session_id = str(uuid.uuid4())
        resource_id = str(uuid.uuid4())

        # Build a proper token
        token = ResourceAccessToken.for_resource_id(resource_id, session_id)

        # Mess with the permissions
        token.payload["permissions"] = {"can_break_everything": True}

        with self.assertRaises(TokenError):
            token.verify()


class UserAccessTokenTestCase(TestCase):
    """Test suite for the ResourceAccessToken"""

    @classmethod
    def setUpClass(cls):
        """Provides test case with some common `user` data"""
        super().setUpClass()

        cls.user = UserFactory()

    def test_for_user(self):
        """Test JWT initialization from `for_user` method"""
        token = UserAccessToken.for_user(self.user)
        self.assertEqual(token.payload["user_id"], str(self.user.pk))

    def test_verify(self):
        """Test JWT `verify` method"""

        token = UserAccessToken.for_user(self.user)
        token.verify()  # Should not raise

        handmade_token = UserAccessToken()  # new empty token
        with self.assertRaises(TokenError):
            # missing in payload: user
            handmade_token.verify()

        handmade_token.payload["user_id"] = self.user.pk
        handmade_token.verify()  # Should not raise
