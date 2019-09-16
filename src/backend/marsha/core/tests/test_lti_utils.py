"""Test the LTI interconnection with Open edX."""
import random
from unittest import mock
import uuid

from django.test import RequestFactory, TestCase
from django.utils import timezone

from pylti.common import LTIOAuthServer

from ..defaults import STATE_CHOICES
from ..factories import (
    ConsumerSiteFactory,
    ConsumerSiteLTIPassportFactory,
    DocumentFactory,
    VideoFactory,
)
from ..lti import LTI
from ..lti.utils import PortabilityError, get_or_create_resource
from ..models import ConsumerSitePortability, Document, Playlist, Video


# We don't enforce arguments documentation in tests
# pylint: disable=too-many-lines,too-many-public-methods,unused-argument


class PortabilityLTITestCase(TestCase):
    """Test the portability of uploadable resource beween playlists and consumer sites.

    We need to test the portability behavior of uploadable resource in all the following cases:

        1) resource with same lti_id exists
            1-1) resource exists in same playlist, same site**
                **1-1-1) instructor**
                **1-1-2) student**
            1-2) resource exists in same playlist, other site
                1-2-1) resource playlist is portable to consumer site
                    **1-2-1-1) resource is ready**
                    1-2-1-2) resource is not ready
                        **1-2-1-2-1) instructor**
                        **1-2-1-2-2) student**
                1-2-2) resource is automatically portable to consumer site
                    **1-2-2-1) resource is ready**
                    1-2-2-2) resource is not ready
                        **1-2-2-2-1) instructor**
                        **1-2-2-2-2) student**
                1-2-3) resource playlist is not portable to consumer site
                    **1-2-3-1) instructor**
                    **1-2-3-2) student**
            1-3) resource exists in other playlist, same site
                1-3-1) resource is portable to playlist
                    **1-3-1-1) resource is ready**
                    1-3-1-2) resource is not ready
                        **1-3-1-2-1) instructor**
                        **1-3-1-2-2) student**
                1-3-2) resource is not portable to playlist
                    **1-3-2-1) instructor**
                    **1-3-2-2) student**
            1-4) resource exists in other playlist, other site
                1-4-1) resource is portable to playlist
                    1-4-1-1) resource playlist is portable to consumer site
                        **1-4-1-1-1) resource is ready**
                        1-4-1-1-2) resource is not ready
                            **1-4-1-1-2-1) instructor**
                            **1-4-1-1-2-2) student**
                    1-4-1-2) resource is automatically portable to consumer site
                        **1-4-1-2-1) resource is ready**
                        1-4-1-2-2) resource is not ready
                            **1-4-1-2-2-1) instructor**
                            **1-4-1-2-2-2) student**
                    1-4-1-3) resource is not portable to consumer site
                        **1-4-1-3-1) instructor**
                        **1-4-1-3-2) student**
                1-4-2) resource is not portable to playlist
                    **1-4-2-1) instructor**
                    **1-4-2-2) student**
        2) resource with same lti_id does not exist
            **2-1) instructor**
            **2-2) student**

    We only write tests for leaf cases marked in bold above. This other cases are coverd by
    varying the parameters randomly in the tests to limit the number of tests and time to run
    them while still providing a good coverage.

    """

    def setUp(self):
        """Override the setUp method to instanciate and serve a request factory."""
        super().setUp()
        self.factory = RequestFactory()

    def _test_lti_get_resource_same_playlist_same_site_instructor(self, factory, model):
        """Above case 1-1-1.

        A resource that exists for the requested playlist and consumer site should be returned
        to an instructor whatever its upload state.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        resource = factory(
            playlist__consumer_site=passport.consumer_site,
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
        )
        data = {
            "resource_link_id": resource.lti_id,
            "context_id": resource.playlist.lti_id,
            "roles": "Instructor",
            "tool_consumer_instance_guid": resource.playlist.consumer_site.domain,
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, resource.pk)
        lti.verify()
        retrieved_resource = get_or_create_resource(model, lti)
        self.assertIsInstance(retrieved_resource, model)
        self.assertEqual(retrieved_resource, resource)

        # No new playlist or resource are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_same_playlist_same_site_instructor(self, mock_verify):
        """Above case 1-1-1.

        A video that exists for the requested playlist and consumer site should be returned
        to an instructor whatever its upload state.
        """
        self._test_lti_get_resource_same_playlist_same_site_instructor(
            VideoFactory, Video
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_same_playlist_same_site_instructor(self, mock_verify):
        """Above case 1-1-1.

        A document that exists for the requested playlist and consumer site should be returned
        to an instructor whatever its upload state.
        """
        self._test_lti_get_resource_same_playlist_same_site_instructor(
            DocumentFactory, Document
        )

    def _test_lti_get_resource_same_playlist_same_site_student_ready(
        self, factory, model
    ):
        """Above case 1-1-2 upload state ready.

        A resource that exists for the requested playlist and consumer site should be returned
        to a student if it is ready.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        resource = factory(
            playlist__consumer_site=passport.consumer_site, upload_state="ready"
        )
        data = {
            "resource_link_id": resource.lti_id,
            "context_id": resource.playlist.lti_id,
            "roles": "Student",
            "tool_consumer_instance_guid": resource.playlist.consumer_site.domain,
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, resource.pk)
        lti.verify()
        retrieved_resource = get_or_create_resource(model, lti)
        self.assertIsInstance(retrieved_resource, model)
        self.assertEqual(retrieved_resource, resource)

        # No new playlist or resource are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_same_playlist_same_site_student_ready(self, mock_verify):
        """Above case 1-1-2 upload state ready.

        A video that exists for the requested playlist and consumer site should be returned
        to a student if it is ready.
        """
        self._test_lti_get_resource_same_playlist_same_site_student_ready(
            VideoFactory, Video
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_same_playlist_same_site_student_ready(self, mock_verify):
        """Above case 1-1-2 upload state ready.

        A Document that exists for the requested playlist and consumer site should be returned
        to a student if it is ready.
        """
        self._test_lti_get_resource_same_playlist_same_site_student_ready(
            DocumentFactory, Document
        )

    def _test_lti_get_resource_same_playlist_same_site_student_not_ready(
        self, factory, model
    ):
        """Above case 1-1-2 upload state not ready.

        A resource that exists for the requested playlist and consumer site should not be returned
        to a student if it is not ready.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        resource = factory(
            playlist__consumer_site=passport.consumer_site,
            upload_state=random.choice(
                [s[0] for s in STATE_CHOICES if s[0] != "ready"]
            ),
        )
        data = {
            "resource_link_id": resource.lti_id,
            "context_id": resource.playlist.lti_id,
            "roles": "Student",
            "tool_consumer_instance_guid": resource.playlist.consumer_site.domain,
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, resource.pk)
        lti.verify()
        self.assertIsNone(get_or_create_resource(model, lti))

        # No new playlist or resource are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_same_playlist_same_site_student_not_ready(self, mock_verify):
        """Above case 1-1-2 upload state not ready.

        A video that exists for the requested playlist and consumer site should not be returned
        to a student if it is not ready.
        """
        self._test_lti_get_resource_same_playlist_same_site_student_not_ready(
            VideoFactory, Video
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_same_playlist_same_site_student_not_ready(
        self, mock_verify
    ):
        """Above case 1-1-2 upload state not ready.

        A Document that exists for the requested playlist and consumer site should not be returned
        to a student if it is not ready.
        """
        self._test_lti_get_resource_same_playlist_same_site_student_not_ready(
            DocumentFactory, Document
        )

    def _test_lti_get_resource_other_site_playlist_portable_ready(self, factory, model):
        """Above case 1-2-1-1.

        The existing resource should be returned if a student or instructor tries to retrieve a
        resource that is ready but on another consumer site if it is marked as portable to another
        consumer site.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        resource = factory(
            playlist__is_portable_to_consumer_site=True,
            uploaded_on=timezone.now(),
            upload_state="ready",
        )
        data = {
            "resource_link_id": resource.lti_id,
            "context_id": resource.playlist.lti_id,
            "roles": random.choice(["Student", "Instructor"]),
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")

        lti = LTI(request, resource.pk)
        lti.verify()
        retrieved_resource = get_or_create_resource(model, lti)
        self.assertIsInstance(retrieved_resource, model)
        self.assertEqual(retrieved_resource, resource)

        # No new playlist or resource are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_playlist_portable_ready(self, mock_verify):
        """Above case 1-2-1-1.

        The existing video should be returned if a student or instructor tries to retrieve a
        video that is ready but on another consumer site if it is marked as portable to another
        consumer site.
        """
        self._test_lti_get_resource_other_site_playlist_portable_ready(
            VideoFactory, Video
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_site_playlist_portable_ready(self, mock_verify):
        """Above case 1-2-1-1.

        The existing document should be returned if a student or instructor tries to retrieve a
        document that is ready but on another consumer site if it is marked as portable to another
        consumer site.
        """
        self._test_lti_get_resource_other_site_playlist_portable_ready(
            DocumentFactory, Document
        )

    def _test_lti_get_resource_other_site_playlist_portable_not_ready_instructor(
        self, factory, model
    ):
        """Above case 1-2-1-2-1.

        A PortabilityError should be raised if an instructor tries to retrieve a resource that
        is already existing for a consumer site but not ready, even if it is portable to another
        consumer site.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        resource = factory(
            id="77fbf317-3e99-41bd-819c-130531313139",
            playlist__lti_id="a-playlist",
            playlist__is_portable_to_consumer_site=True,
            upload_state=random.choice(
                [s[0] for s in STATE_CHOICES if s[0] != "ready"]
            ),
        )
        data = {
            "resource_link_id": resource.lti_id,
            "context_id": resource.playlist.lti_id,
            "roles": "Instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, resource.pk)
        lti.verify()
        with self.assertRaises(PortabilityError) as context:
            get_or_create_resource(model, lti)
        self.assertEqual(
            context.exception.args[0],
            (
                "The {!s} ID 77fbf317-3e99-41bd-819c-130531313139 already exists but is not "
                "portable to your playlist (a-playlist) and/or consumer site "
                "(example.com).".format(model.__name__)
            ),
        )
        # No new playlist or resource are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_playlist_portable_not_ready_instructor(
        self, mock_verify
    ):
        """Above case 1-2-1-2-1.

        An LTI Exception should be raised if an instructor tries to retrieve a video that is
        already existing for a consumer site but not ready, even if it is portable to another
        consumer site.
        """
        self._test_lti_get_resource_other_site_playlist_portable_not_ready_instructor(
            VideoFactory, Video
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_site_playlist_portable_not_ready_instructor(
        self, mock_verify
    ):
        """Above case 1-2-1-2-1.

        An LTI Exception should be raised if an instructor tries to retrieve a document that is
        already existing for a consumer site but not ready, even if it is portable to another
        consumer site.
        """
        self._test_lti_get_resource_other_site_playlist_portable_not_ready_instructor(
            DocumentFactory, Document
        )

    def _test_lti_get_resource_other_site_playlist_portable_not_ready_student(
        self, factory, model
    ):
        """Above case 1-2-1-2-2.

        No resource is returned to a student trying to access a resource that is existing
        for another consumer site but not ready, even if it is portable to another
        consumer site.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        resource = factory(
            playlist__is_portable_to_consumer_site=True,
            upload_state=random.choice(
                [s[0] for s in STATE_CHOICES if s[0] != "ready"]
            ),
        )
        data = {
            "resource_link_id": resource.lti_id,
            "context_id": resource.playlist.lti_id,
            "roles": "Student",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, resource.pk)
        lti.verify()
        self.assertIsNone(get_or_create_resource(model, lti))

        # No new playlist or video are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_playlist_portable_not_ready_student(
        self, mock_verify
    ):
        """Above case 1-2-1-2-2.

        No video is returned to a student trying to access a video that is existing for another
        consumer site but not ready, even if it is portable to another consumer site.
        """
        self._test_lti_get_resource_other_site_playlist_portable_not_ready_student(
            VideoFactory, Video
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_site_playlist_portable_not_ready_student(
        self, mock_verify
    ):
        """Above case 1-2-1-2-2.

        No document is returned to a student trying to access a resource that is existing for
        another consumer site but not ready, even if it is portable to another consumer site.
        """
        self._test_lti_get_resource_other_site_playlist_portable_not_ready_student(
            DocumentFactory, Document
        )

    def _test_lti_get_resource_other_site_auto_portable_ready(self, factory, model):
        """Above case 1-2-2-1.

        Same as 1-2-1-1 but portability is automatic from the site of the resource to the site
        of the passport.
        """
        consumer_site = ConsumerSiteFactory(domain="example.com")
        passport = ConsumerSiteLTIPassportFactory(consumer_site=consumer_site)
        resource = factory(
            playlist__is_portable_to_consumer_site=False,
            uploaded_on=timezone.now(),
            upload_state="ready",
        )

        # Add automatic portability from the site of the resource to the site of the passport
        ConsumerSitePortability.objects.create(
            source_site=resource.playlist.consumer_site, target_site=consumer_site
        )

        data = {
            "resource_link_id": resource.lti_id,
            "context_id": resource.playlist.lti_id,
            "roles": random.choice(["Student", "Instructor"]),
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, resource.pk)
        lti.verify()
        retrieved_resource = get_or_create_resource(model, lti)
        self.assertIsInstance(retrieved_resource, model)
        self.assertEqual(retrieved_resource, resource)

        # No new playlist or resource are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_auto_portable_ready(self, mock_verify):
        """Above case 1-2-2-1.

        Same as 1-2-1-1 but portability is automatic from the site of the video to the site
        of the passport.
        """
        self._test_lti_get_resource_other_site_auto_portable_ready(VideoFactory, Video)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_site_auto_portable_ready(self, mock_verify):
        """Above case 1-2-2-1.

        Same as 1-2-1-1 but portability is automatic from the site of the document to the site
        of the passport.
        """
        self._test_lti_get_resource_other_site_auto_portable_ready(
            DocumentFactory, Document
        )

    def _test_lti_get_resource_other_site_auto_portable_not_ready_instructor(
        self, factory, model
    ):
        """Above case 1-2-2-2-1.

        Same as 1-2-1-2-1 but portability is automatic from the site of the video to the site
        of the passport.
        """
        consumer_site = ConsumerSiteFactory(domain="example.com")
        passport = ConsumerSiteLTIPassportFactory(consumer_site=consumer_site)
        resource = factory(
            id="77fbf317-3e99-41bd-819c-130531313139",
            playlist__lti_id="a-playlist",
            playlist__is_portable_to_consumer_site=False,
            upload_state=random.choice(
                [s[0] for s in STATE_CHOICES if s[0] != "ready"]
            ),
        )
        # Add automatic portability from the site of the video to the site of the passport
        ConsumerSitePortability.objects.create(
            source_site=resource.playlist.consumer_site, target_site=consumer_site
        )
        data = {
            "resource_link_id": resource.lti_id,
            "context_id": resource.playlist.lti_id,
            "roles": "Instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, resource.pk)
        lti.verify()
        with self.assertRaises(PortabilityError) as context:
            get_or_create_resource(model, lti)
        self.assertEqual(
            context.exception.args[0],
            (
                "The {!s} ID 77fbf317-3e99-41bd-819c-130531313139 already exists but is not "
                "portable to your playlist (a-playlist) and/or consumer site "
                "(example.com).".format(model.__name__)
            ),
        )
        # No new playlist or resource are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_auto_portable_not_ready_instructor(
        self, mock_verify
    ):
        """Above case 1-2-2-2-1.

        Same as 1-2-1-2-1 but portability is automatic from the site of the video to the site
        of the passport.
        """
        self._test_lti_get_resource_other_site_auto_portable_not_ready_instructor(
            VideoFactory, Video
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_site_auto_portable_not_ready_instructor(
        self, mock_verify
    ):
        """Above case 1-2-2-2-1.

        Same as 1-2-1-2-1 but portability is automatic from the site of the video to the site
        of the passport.
        """
        self._test_lti_get_resource_other_site_auto_portable_not_ready_instructor(
            DocumentFactory, Document
        )

    def _test_lti_get_resource_other_site_auto_portable_not_ready_student(
        self, factory, model
    ):
        """Above case 1-2-2-2-2.

        Same as 1-2-1-2-2 but portability is automatic from the site of the video to the site
        of the passport.
        """
        consumer_site = ConsumerSiteFactory(domain="example.com")
        passport = ConsumerSiteLTIPassportFactory(consumer_site=consumer_site)
        resource = factory(
            playlist__is_portable_to_consumer_site=False,
            upload_state=random.choice(
                [s[0] for s in STATE_CHOICES if s[0] != "ready"]
            ),
        )

        # Add automatic portability from the site of the video to the site of the passport
        ConsumerSitePortability.objects.create(
            source_site=resource.playlist.consumer_site, target_site=consumer_site
        )

        data = {
            "resource_link_id": resource.lti_id,
            "context_id": resource.playlist.lti_id,
            "roles": "Student",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, resource.pk)
        lti.verify()
        self.assertIsNone(get_or_create_resource(model, lti))

        # No new playlist or resource are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_auto_portable_not_ready_student(
        self, mock_verify
    ):
        """Above case 1-2-2-2-2.

        Same as 1-2-1-2-2 but portability is automatic from the site of the video to the site
        of the passport.
        """
        self._test_lti_get_resource_other_site_auto_portable_not_ready_student(
            VideoFactory, Video
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_site_auto_portable_not_ready_student(
        self, mock_verify
    ):
        """Above case 1-2-2-2-2.

        Same as 1-2-1-2-2 but portability is automatic from the site of the video to the site
        of the passport.
        """
        self._test_lti_get_resource_other_site_auto_portable_not_ready_student(
            DocumentFactory, Document
        )

    def _test_lti_get_resource_other_site_not_portable_instructor(self, factory, model):
        """Above case 1-2-3-1.

        A PortabilityError should be raised if an instructor tries to retrieve a video that is
        already existing for a consumer site but not portable to another consumer site, even if it
        is ready.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        resource = factory(
            id="77fbf317-3e99-41bd-819c-130531313139",
            playlist__lti_id="a-playlist",
            playlist__is_portable_to_consumer_site=False,
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
        )
        data = {
            "resource_link_id": resource.lti_id,
            "context_id": resource.playlist.lti_id,
            "roles": "Instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, resource.pk)
        lti.verify()
        with self.assertRaises(PortabilityError) as context:
            get_or_create_resource(model, lti)
        self.assertEqual(
            context.exception.args[0],
            (
                "The {!s} ID 77fbf317-3e99-41bd-819c-130531313139 already exists but is not "
                "portable to your playlist (a-playlist) and/or consumer site "
                "(example.com).".format(model.__name__)
            ),
        )
        # No new playlist or resource are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_not_portable_instructor(self, mock_verify):
        """Above case 1-2-3-1.

        A PortabilityError should be raised if an instructor tries to retrieve a video that is
        already existing for a consumer site but not portable to another consumer site, even if it
        is ready.
        """
        self._test_lti_get_resource_other_site_not_portable_instructor(
            VideoFactory, Video
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_site_not_portable_instructor(self, mock_verify):
        """Above case 1-2-3-1.

        A PortabilityError should be raised if an instructor tries to retrieve a video that is
        already existing for a consumer site but not portable to another consumer site, even if it
        is ready.
        """
        self._test_lti_get_resource_other_site_not_portable_instructor(
            DocumentFactory, Document
        )

    def _test_lti_get_resource_other_site_not_portable_student(self, factory, model):
        """Above case 1-2-3-2.

        No video is returned to a student trying to access a video that is existing for a
        consumer site but not portable to another consumer site.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        resource = factory(upload_state=random.choice([s[0] for s in STATE_CHOICES]))
        data = {
            "resource_link_id": resource.lti_id,
            "context_id": resource.playlist.lti_id,
            "roles": "Student",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, resource.pk)
        lti.verify()
        self.assertIsNone(get_or_create_resource(model, lti))

        # No new playlist or resource are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_not_portable_student(self, mock_verify):
        """Above case 1-2-3-2.

        No video is returned to a student trying to access a video that is existing for a
        consumer site but not portable to another consumer site.
        """
        self._test_lti_get_resource_other_site_not_portable_student(VideoFactory, Video)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_site_not_portable_student(self, mock_verify):
        """Above case 1-2-3-2.

        No document is returned to a student trying to access a document that is existing for a
        consumer site but not portable to another consumer site.
        """
        self._test_lti_get_resource_other_site_not_portable_student(
            DocumentFactory, Document
        )

    def _test_lti_get_resource_other_playlist_portable_ready(self, factory, model):
        """Above case 1-3-1-1.

        The existing resource should be returned if a student or instructor tries to retrieve a
        resource that is ready but linked to another playlist if it is marked as portable to
        another playlist.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        resource = factory(
            playlist__consumer_site=passport.consumer_site, upload_state="ready"
        )
        data = {
            "resource_link_id": resource.lti_id,
            "context_id": resource.playlist.lti_id,
            "roles": random.choice(["Student", "Instructor"]),
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, resource.pk)
        lti.verify()
        retrieved_resource = get_or_create_resource(model, lti)
        self.assertIsInstance(retrieved_resource, model)
        self.assertEqual(retrieved_resource, resource)

        # No new playlist or resource are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_playlist_portable_ready(self, mock_verify):
        """Above case 1-3-1-1.

        The existing video should be returned if a student or instructor tries to retrieve a
        video that is ready but linked to another playlist if it is marked as portable to another
        playlist.
        """
        self._test_lti_get_resource_other_playlist_portable_ready(VideoFactory, Video)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_playlist_portable_ready(self, mock_verify):
        """Above case 1-3-1-1.

        The existing document should be returned if a student or instructor tries to retrieve a
        document that is ready but linked to another playlist if it is marked as portable to
        another playlist.
        """
        self._test_lti_get_resource_other_playlist_portable_ready(
            DocumentFactory, Document
        )

    def _test_lti_get_resource_other_pl_portable_not_ready_instructor(
        self, factory, model
    ):
        """Above case 1-3-1-2-1.

        A PortabilityError should be raised if an instructor tries to retrieve a video that is
        already existing in a playlist but not ready, even if it is portable to another
        playlist.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        resource = factory(
            id="77fbf317-3e99-41bd-819c-130531313139",
            playlist__lti_id="a-playlist",
            playlist__consumer_site=passport.consumer_site,
            playlist__is_portable_to_playlist=True,
            upload_state=random.choice(
                [s[0] for s in STATE_CHOICES if s[0] != "ready"]
            ),
        )
        data = {
            "resource_link_id": resource.lti_id,
            "context_id": "another-playlist",
            "roles": "Instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, resource.pk)
        lti.verify()
        with self.assertRaises(PortabilityError) as context:
            get_or_create_resource(model, lti)
        self.assertEqual(
            context.exception.args[0],
            (
                "The {!s} ID 77fbf317-3e99-41bd-819c-130531313139 already exists but is not "
                "portable to your playlist (another-playlist) and/or consumer site "
                "(example.com).".format(model.__name__)
            ),
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_portable_not_ready_instructor(self, mock_verify):
        """Above case 1-3-1-2-1.

        A PortabilityError should be raised if an instructor tries to retrieve a video that
        is already existing in a playlist but not ready, even if it is portable to another
        playlist.
        """
        self._test_lti_get_resource_other_pl_portable_not_ready_instructor(
            VideoFactory, Video
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_pl_portable_not_ready_instructor(self, mock_verify):
        """Above case 1-3-1-2-1.

        A PortabilityError should be raised if an instructor tries to retrieve a document that
        is already existing in a playlist but not ready, even if it is portable to another
        playlist.
        """
        self._test_lti_get_resource_other_pl_portable_not_ready_instructor(
            DocumentFactory, Document
        )

    def _test_lti_get_resource_other_playlist_portable_not_ready_student(
        self, factory, model
    ):
        """Above case 1-3-1-2-2.

        No resource is returned to a student trying to access a resource that is
        existing in another playlist but not ready, even if it is portable to another playlist.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        resource = factory(
            playlist__consumer_site=passport.consumer_site,
            playlist__is_portable_to_playlist=True,
            upload_state=random.choice(
                [s[0] for s in STATE_CHOICES if s[0] != "ready"]
            ),
        )
        data = {
            "resource_link_id": resource.lti_id,
            "context_id": "another-playlist",
            "roles": "Student",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, resource.pk)
        lti.verify()
        self.assertIsNone(get_or_create_resource(model, lti))

        # No new playlist or resource are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_playlist_portable_not_ready_student(self, mock_verify):
        """Above case 1-3-1-2-2.

        No video is returned to a student trying to access a video that is existing in another
        playlist but not ready, even if it is portable to another playlist.
        """
        self._test_lti_get_resource_other_playlist_portable_not_ready_student(
            VideoFactory, Video
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_playlist_portable_not_ready_student(
        self, mock_verify
    ):
        """Above case 1-3-1-2-2.

        No document is returned to a student trying to access a document that is existing in
        another playlist but not ready, even if it is portable to another playlist.
        """
        self._test_lti_get_resource_other_playlist_portable_not_ready_student(
            DocumentFactory, Document
        )

    def _test_lti_get_resource_other_playlist_not_portable_instructor(
        self, factory, model
    ):
        """Above case 1-3-2-1.

        A PortabilityError should be raised if an instructor tries to retrieve a video that is
        existing in a playlist but not portable to another playlist, even if it
        is ready.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        resource = factory(
            id="77fbf317-3e99-41bd-819c-130531313139",
            lti_id="df7",
            playlist__lti_id="a-playlist",
            playlist__consumer_site=passport.consumer_site,
            playlist__is_portable_to_playlist=False,
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
        )
        data = {
            "resource_link_id": resource.lti_id,
            "context_id": "another-playlist",
            "roles": "Instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, resource.pk)
        lti.verify()
        with self.assertRaises(PortabilityError) as context:
            get_or_create_resource(model, lti)
        self.assertEqual(
            context.exception.args[0],
            (
                "The {!s} ID 77fbf317-3e99-41bd-819c-130531313139 already exists but is not "
                "portable to your playlist (another-playlist) and/or consumer site "
                "(example.com).".format(model.__name__)
            ),
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_playlist_not_portable_instructor(self, mock_verify):
        """Above case 1-3-2-1.

        A PortabilityError should be raised if an instructor tries to retrieve a video that is
        existing in a playlist but not portable to another playlist, even if it
        is ready.
        """
        self._test_lti_get_resource_other_playlist_not_portable_instructor(
            VideoFactory, Video
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_playlist_not_portable_instructor(self, mock_verify):
        """Above case 1-3-2-1.

        A PortabilityError should be raised if an instructor tries to retrieve a document that is
        existing in a playlist but not portable to another playlist, even if it
        is ready.
        """
        self._test_lti_get_resource_other_playlist_not_portable_instructor(
            DocumentFactory, Document
        )

    def _test_lti_get_resource_other_playlist_not_portable_student(
        self, factory, model
    ):
        """Above case 1-3-2-2.

        No resource is returned to a student trying to access a resource that is
        existing in another playlist but not portable to another playlist, even if it is ready.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        resource = factory(
            playlist__consumer_site=passport.consumer_site,
            playlist__is_portable_to_playlist=False,
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
        )
        data = {
            "resource_link_id": resource.lti_id,
            "context_id": "another-playlist",
            "roles": "Student",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, resource.pk)
        lti.verify()
        self.assertIsNone(get_or_create_resource(model, lti))

        # No new playlist or resource are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_playlist_not_portable_student(self, mock_verify):
        """Above case 1-3-2-2.

        No video is returned to a student trying to access a video that is existing in another
        playlist but not portable to another playlist, even if it is ready.
        """
        self._test_lti_get_resource_other_playlist_not_portable_student(
            VideoFactory, Video
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_playlist_not_portable_student(self, mock_verify):
        """Above case 1-3-2-2.

        No document is returned to a student trying to access a document that is existing in
        another playlist but not portable to another playlist, even if it is ready.
        """
        self._test_lti_get_resource_other_playlist_not_portable_student(
            DocumentFactory, Document
        )

    def _test_lti_get_resource_other_pl_site_portable_ready(self, factory, model):
        """Above case 1-4-1-1-1.

        The existing resource should be returned if a student or instructor tries to retrieve a
        resource that is ready but in another playlist on another consumer site if it is marked as
        portable to another playlist AND to another consumer site.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        resource = factory(
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=True,
            upload_state="ready",
        )
        data = {
            "resource_link_id": resource.lti_id,
            "context_id": "another-playlist",
            "roles": random.choice(["Student", "Instructor"]),
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, resource.pk)
        lti.verify()
        retrieved_resource = get_or_create_resource(model, lti)
        self.assertIsInstance(retrieved_resource, model)
        self.assertEqual(retrieved_resource, resource)

        # No new playlist or resource are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_site_portable_ready(self, mock_verify):
        """Above case 1-4-1-1-1.

        The existing video should be returned if a student or instructor tries to retrieve a
        video that is ready but in another playlist on another consumer site if it is marked as
        portable to another playlist AND to another consumer site.
        """
        self._test_lti_get_resource_other_pl_site_portable_ready(VideoFactory, Video)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_pl_site_portable_ready(self, mock_verify):
        """Above case 1-4-1-1-1.

        The existing document should be returned if a student or instructor tries to retrieve a
        document that is ready but in another playlist on another consumer site if it is marked as
        portable to another playlist AND to another consumer site.
        """
        self._test_lti_get_resource_other_pl_site_portable_ready(
            DocumentFactory, Document
        )

    def _test_lti_get_resource_other_pl_site_portable_not_ready_instructor(
        self, factory, model
    ):
        """Above case 1-4-1-1-2-1.

        A PortabilityError should be raised if an instructor tries to retrieve a resource that is
        already existing in a playlist on another consumer site but not ready, even if it is
        portable to another playlist AND to another consumer site.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        resource = factory(
            id="77fbf317-3e99-41bd-819c-130531313139",
            playlist__lti_id="a-playlist",
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=True,
            upload_state=random.choice(
                [s[0] for s in STATE_CHOICES if s[0] != "ready"]
            ),
        )
        data = {
            "resource_link_id": resource.lti_id,
            "context_id": "another-playlist",
            "roles": "Instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, resource.pk)
        lti.verify()
        with self.assertRaises(PortabilityError) as context:
            get_or_create_resource(model, lti)
        self.assertEqual(
            context.exception.args[0],
            (
                "The {!s} ID 77fbf317-3e99-41bd-819c-130531313139 already exists but is not "
                "portable to your playlist (another-playlist) and/or consumer site "
                "(example.com).".format(model.__name__)
            ),
        )
        # No new playlist or resource are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_site_portable_not_ready_instructor(
        self, mock_verify
    ):
        """Above case 1-4-1-1-2-1.

        A PortabilityError should be raised if an instructor tries to retrieve a video that is
        already existing in a playlist on another consumer site but not ready, even if it is
        portable to another playlist AND to another consumer site.
        """
        self._test_lti_get_resource_other_pl_site_portable_not_ready_instructor(
            VideoFactory, Video
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_pl_site_portable_not_ready_instructor(
        self, mock_verify
    ):
        """Above case 1-4-1-1-2-1.

        A PortabilityError should be raised if an instructor tries to retrieve a document that is
        already existing in a playlist on another consumer site but not ready, even if it is
        portable to another playlist AND to another consumer site.
        """
        self._test_lti_get_resource_other_pl_site_portable_not_ready_instructor(
            DocumentFactory, Document
        )

    def _test_lti_get_resource_other_pl_site_portable_not_ready_student(
        self, factory, model
    ):
        """Above case 1-4-1-1-2-2.

        No resource is returned to a student trying to access a resource that is existing
        in another playlist for another consumer site but not ready, even if it is portable
        to another playlist AND to another consumer site.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        resource = factory(
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=True,
            upload_state=random.choice(
                [s[0] for s in STATE_CHOICES if s[0] != "ready"]
            ),
        )
        data = {
            "resource_link_id": resource.lti_id,
            "context_id": "another-playlist",
            "roles": "Student",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, resource.pk)
        lti.verify()
        self.assertIsNone(get_or_create_resource(model, lti))

        # No new playlist or resource are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_site_portable_not_ready_student(self, mock_verify):
        """Above case 1-4-1-1-2-2.

        No video is returned to a student trying to access a video that is existing in another
        playlist for another consumer site but not ready, even if it is portable to another
        playlist AND to another consumer site.
        """
        self._test_lti_get_resource_other_pl_site_portable_not_ready_student(
            VideoFactory, Video
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_pl_site_portable_not_ready_student(
        self, mock_verify
    ):
        """Above case 1-4-1-1-2-2.

        No document is returned to a student trying to access a document that is existing in
        another playlist for another consumer site but not ready, even if it is portable to another
        playlist AND to another consumer site.
        """
        self._test_lti_get_resource_other_pl_site_portable_not_ready_student(
            DocumentFactory, Document
        )

    def _test_lti_get_resource_other_pl_site_auto_portable_ready(self, factory, model):
        """Above case 1-4-1-2-1.

        Same as 1-4-1-1-1 but portability is automatic from the site of the resource to the site
        of the passport.
        """
        consumer_site = ConsumerSiteFactory(domain="example.com")
        passport = ConsumerSiteLTIPassportFactory(consumer_site=consumer_site)
        resource = factory(
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=False,
            upload_state="ready",
        )
        # Add automatic portability from the site of the video to the site of the passport
        ConsumerSitePortability.objects.create(
            source_site=resource.playlist.consumer_site, target_site=consumer_site
        )

        data = {
            "resource_link_id": resource.lti_id,
            "context_id": "another-playlist",
            "roles": random.choice(["Student", "Instructor"]),
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, resource.pk)
        lti.verify()
        retrieved_resource = get_or_create_resource(model, lti)
        self.assertIsInstance(retrieved_resource, model)
        self.assertEqual(retrieved_resource, resource)

        # No new playlist or resource are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_site_auto_portable_ready(self, mock_verify):
        """Above case 1-4-1-2-1.

        Same as 1-4-1-1-1 but portability is automatic from the site of the video to the site
        of the passport.
        """
        self._test_lti_get_resource_other_pl_site_auto_portable_ready(
            VideoFactory, Video
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_pl_site_auto_portable_ready(self, mock_verify):
        """Above case 1-4-1-2-1.

        Same as 1-4-1-1-1 but portability is automatic from the site of the document to the site
        of the passport.
        """
        self._test_lti_get_resource_other_pl_site_auto_portable_ready(
            DocumentFactory, Document
        )

    def _test_lti_get_resource_other_pl_site_auto_portable_not_ready_instructor(
        self, factory, model
    ):
        """Above case 1-4-1-2-2-1.

        Same as 1-4-1-1-2-1 but portability is automatic from the site of the resource to the site
        of the passport.
        """
        consumer_site = ConsumerSiteFactory(domain="example.com")
        passport = ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site=consumer_site
        )
        resource = factory(
            id="77fbf317-3e99-41bd-819c-130531313139",
            lti_id="df7",
            playlist__lti_id="a-playlist",
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=False,
            upload_state=random.choice(
                [s[0] for s in STATE_CHOICES if s[0] != "ready"]
            ),
        )
        # Add automatic portability from the site of the video to the site of the passport
        ConsumerSitePortability.objects.create(
            source_site=resource.playlist.consumer_site, target_site=consumer_site
        )
        data = {
            "resource_link_id": resource.lti_id,
            "context_id": "another-playlist",
            "roles": "Instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, resource.pk)
        lti.verify()
        with self.assertRaises(PortabilityError) as context:
            get_or_create_resource(model, lti)
        self.assertEqual(
            context.exception.args[0],
            (
                "The {!s} ID 77fbf317-3e99-41bd-819c-130531313139 already exists but is not "
                "portable to your playlist (another-playlist) and/or consumer site "
                "(example.com).".format(model.__name__)
            ),
        )
        # No new playlist or resource are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_site_auto_portable_not_ready_instructor(
        self, mock_verify
    ):
        """Above case 1-4-1-2-2-1.

        Same as 1-4-1-1-2-1 but portability is automatic from the site of the video to the site
        of the passport.
        """
        self._test_lti_get_resource_other_pl_site_auto_portable_not_ready_instructor(
            VideoFactory, Video
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_pl_site_auto_portable_not_ready_instructor(
        self, mock_verify
    ):
        """Above case 1-4-1-2-2-1.

        Same as 1-4-1-1-2-1 but portability is automatic from the site of the document to the site
        of the passport.
        """
        self._test_lti_get_resource_other_pl_site_auto_portable_not_ready_instructor(
            DocumentFactory, Document
        )

    def _test_lti_get_resource_other_pl_site_auto_portable_not_ready_student(
        self, factory, model
    ):
        """Above case 1-4-1-2-2-2.

        Same as 1-4-1-1-2-2 but portability is automatic from the site of the resource to the site
        of the passport.
        """
        consumer_site = ConsumerSiteFactory(domain="example.com")
        passport = ConsumerSiteLTIPassportFactory(consumer_site=consumer_site)
        resource = factory(
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=False,
            upload_state=random.choice(
                [s[0] for s in STATE_CHOICES if s[0] != "ready"]
            ),
        )
        # Add automatic portability from the site of the resource to the site of the passport
        ConsumerSitePortability.objects.create(
            source_site=resource.playlist.consumer_site, target_site=consumer_site
        )
        data = {
            "resource_link_id": resource.lti_id,
            "context_id": "another-playlist",
            "roles": "Student",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, resource.pk)
        lti.verify()
        self.assertIsNone(get_or_create_resource(model, lti))

        # No new playlist or resource are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_site_auto_portable_not_ready_student(
        self, mock_verify
    ):
        """Above case 1-4-1-2-2-2.

        Same as 1-4-1-1-2-2 but portability is automatic from the site of the video to the site
        of the passport.
        """
        self._test_lti_get_resource_other_pl_site_auto_portable_not_ready_student(
            VideoFactory, Video
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_pl_site_auto_portable_not_ready_student(
        self, mock_verify
    ):
        """Above case 1-4-1-2-2-2.

        Same as 1-4-1-1-2-2 but portability is automatic from the site of the document to the site
        of the passport.
        """
        self._test_lti_get_resource_other_pl_site_auto_portable_not_ready_student(
            DocumentFactory, Document
        )

    def _test_lti_get_resource_other_pl_site_not_portable_instructor(
        self, factory, model
    ):
        """Above cases 1-4-1-3-1 and 1-4-2-1.

        A PortabilityError should be raised if an instructor tries to retrieve a resource already
        existing in a playlist and another consumer site but not portable either to another
        playlist or to another consumer site, even if it is ready.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        one_not_portable = random.choice([True, False])
        resource = factory(
            id="77fbf317-3e99-41bd-819c-130531313139",
            playlist__lti_id="a-playlist",
            playlist__is_portable_to_playlist=one_not_portable,
            playlist__is_portable_to_consumer_site=not one_not_portable,
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
        )
        data = {
            "resource_link_id": resource.lti_id,
            "context_id": "another-playlist",
            "roles": "Instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, resource.pk)
        lti.verify()
        with self.assertRaises(PortabilityError) as context:
            get_or_create_resource(model, lti)
        self.assertEqual(
            context.exception.args[0],
            (
                "The {!s} ID 77fbf317-3e99-41bd-819c-130531313139 already exists but is not "
                "portable to your playlist (another-playlist) and/or consumer site "
                "(example.com).".format(model.__name__)
            ),
        )
        # No new playlist or resource are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_site_not_portable_instructor(self, mock_verify):
        """Above cases 1-4-1-3-1 and 1-4-2-1.

        A PortabilityError should be raised if an instructor tries to retrieve a video already
        existing in a playlist and another consumer site but not portable either to another
        playlist or to another consumer site, even if it is ready.
        """
        self._test_lti_get_resource_other_pl_site_not_portable_instructor(
            VideoFactory, Video
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_pl_site_not_portable_instructor(self, mock_verify):
        """Above cases 1-4-1-3-1 and 1-4-2-1.

        A PortabilityError should be raised if an instructor tries to retrieve a document already
        existing in a playlist and another consumer site but not portable either to another
        playlist or to another consumer site, even if it is ready.
        """
        self._test_lti_get_resource_other_pl_site_not_portable_instructor(
            DocumentFactory, Document
        )

    def _test_lti_get_resource_other_pl_site_not_portable_student(self, factory, model):
        """Above case 1-4-1-3-2 and 1-4-2-2.

        No resource is returned to a student trying to access a resource that is existing
        in another playlist on another consumer site but not portable either to another playlist
        or to another consumer site, even if it is ready.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        one_not_portable = random.choice([True, False])
        resource = factory(
            playlist__is_portable_to_playlist=one_not_portable,
            playlist__is_portable_to_consumer_site=not one_not_portable,
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
        )
        data = {
            "resource_link_id": resource.lti_id,
            "context_id": "another-playlist",
            "roles": "Student",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, resource.pk)
        lti.verify()
        self.assertIsNone(get_or_create_resource(model, lti))

        # No new playlist or resource are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_site_not_portable_student(self, mock_verify):
        """Above case 1-4-1-3-2 and 1-4-2-2.

        No video is returned to a student trying to access a video that is existing in another
        playlist on another consumer site but not portable either to another playlist or to
        another consumer site, even if it is ready.
        """
        self._test_lti_get_resource_other_pl_site_not_portable_student(
            VideoFactory, Video
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_pl_site_not_portable_student(self, mock_verify):
        """Above case 1-4-1-3-2 and 1-4-2-2.

        No document is returned to a student trying to access a document that is existing in
        another playlist on another consumer site but not portable either to another playlist or to
        another consumer site, even if it is ready.
        """
        self._test_lti_get_resource_other_pl_site_not_portable_student(
            DocumentFactory, Document
        )

    def _test_lti_get_resource_wrong_lti_id_intructor(self, factory, model):
        """Above case 2-1.

        A new resource should be created and returned if an instructor tries to access an unknown
        resource for an existing playlist.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        resource = factory(
            playlist__consumer_site=passport.consumer_site, uploaded_on=timezone.now()
        )
        data = {
            "resource_link_id": "new_lti_id",
            "context_id": resource.playlist.lti_id,
            "roles": "Instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, uuid.uuid4())
        lti.verify()
        new_resource = get_or_create_resource(model, lti)

        # A new resource is created
        self.assertEqual(model.objects.count(), 2)
        self.assertIsInstance(new_resource, model)
        self.assertEqual(new_resource, model.objects.exclude(id=resource.id).get())
        self.assertEqual(new_resource.playlist, resource.playlist)
        self.assertEqual(new_resource.upload_state, "pending")
        self.assertIsNone(new_resource.uploaded_on)
        self.assertEqual(new_resource.lti_id, "new_lti_id")

        # No new playlist is created
        self.assertEqual(Playlist.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_wrong_lti_id_intructor(self, mock_verify):
        """Above case 2-1.

        A new video should be created and returned if an instructor tries to access an unknown
        video for an existing playlist.
        """
        self._test_lti_get_resource_wrong_lti_id_intructor(VideoFactory, Video)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_wrong_lti_id_intructor(self, mock_verify):
        """Above case 2-1.

        A new document should be created and returned if an instructor tries to access an unknown
        document for an existing playlist.
        """
        self._test_lti_get_resource_wrong_lti_id_intructor(DocumentFactory, Document)

    def _test_lti_get_resource_wrong_lti_id_student(self, factory, model):
        """Above case 2-2.

        The resource should not be retrieved if a student tries to access an unknown resource.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        resource = factory(playlist__consumer_site=passport.consumer_site)
        data = {
            "resource_link_id": resource.lti_id,
            "context_id": resource.playlist.lti_id,
            "roles": "Student",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }

        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, uuid.uuid4())
        lti.verify()
        self.assertIsNone(get_or_create_resource(model, lti))

        # No new playlist or resource are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_wrong_lti_id_student(self, mock_verify):
        """Above case 2-2.

        The video should not be retrieved if a student tries to access an unknown video.
        """
        self._test_lti_get_resource_wrong_lti_id_student(VideoFactory, Video)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_wrong_lti_id_student(self, mock_verify):
        """Above case 2-2.

        The document should not be retrieved if a student tries to access an unknown document.
        """
        self._test_lti_get_resource_wrong_lti_id_student(DocumentFactory, Document)
