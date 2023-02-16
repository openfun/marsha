"""Test the LTI interconnection with Open edX."""
from datetime import timedelta
import random
from unittest import mock
import uuid

from django.test import RequestFactory, TestCase
from django.utils import timezone

from pylti.common import LTIOAuthServer

from marsha.core import factories, models
from marsha.core.defaults import IDLE, LIVE_CHOICES, RAW, RUNNING, STATE_CHOICES
from marsha.core.lti import LTI
from marsha.core.lti.utils import (
    PortabilityError,
    get_or_create_resource,
    get_resource_closest_owners_and_playlist,
    get_selectable_resources,
)


# We don't enforce arguments documentation in tests
# pylint: disable=too-many-lines,too-many-public-methods,unused-argument


class PortabilityLTITestCase(TestCase):
    """Test the portability of uploadable resource beween playlists and consumer sites.

    We need to test the portability behavior of uploadable resource in all the following cases:

        1) resource with same lti_id exists
            1-1) resource exists in same playlist, same site**
                **1-1-1) instructor**
                **1-1-2) student**
            1-2) resource exists in playlist with same lti_id, other site
                1-2-1) resource playlist is portable to any consumer site
                    **1-2-1-1) resource is ready to show**
                    1-2-1-2) resource is not ready to show
                        **1-2-1-2-1) instructor**
                        **1-2-1-2-2) student**
                1-2-2) resource's consumer site is portable to requested consumer site
                    **1-2-2-1) resource is ready to show**
                    1-2-2-2) resource is not ready to show
                        **1-2-2-2-1) instructor**
                        **1-2-2-2-2) student**
                1-2-3) resource playlist is portable to a playlist with lti_id same as requested
                    1-2-3-1) resource is ready to show
                        **1-2-3-1-1) instructor**
                        **1-2-3-1-2) student**
                    1-2-3-2) resource is not ready to show
                        **1-2-3-2-1) instructor**
                        **1-2-3-2-2) student**
                1-2-4) resource playlist is not portable to consumer site
                    **1-2-4-1) instructor**
                    **1-2-4-2) student**
            1-3) resource exists in other playlist, same site
                1-3-1) resource is portable to playlist
                    **1-3-1-1) resource is ready to show**
                    1-3-1-2) resource is not ready to show
                        **1-3-1-2-1) instructor**
                        **1-3-1-2-2) student**
                1-3-2) resource is not portable to playlist
                    **1-3-2-1) instructor**
                    **1-3-2-2) student**
            1-4) resource exists in other playlist, other site
                1-4-1) resource is portable to playlist
                    1-4-1-1) resource playlist is portable to any consumer site
                        **1-4-1-1-1) resource is ready to show**
                        1-4-1-1-2) resource is not ready to show
                            **1-4-1-1-2-1) instructor**
                            **1-4-1-1-2-2) student**
                    1-4-1-2) resource's consumer site is portable to requested consumer site
                        **1-4-1-2-1) resource is ready to show**
                        1-4-1-2-2) resource is not ready to show
                            **1-4-1-2-2-1) instructor**
                            **1-4-1-2-2-2) student**
                    1-4-1-3) resource playlist is portable to requested playlist
                        **1-4-1-3-1) resource is ready to show**
                        1-4-1-3-2) resource is not ready to show
                            **1-4-1-3-2-1) instructor**
                            **1-4-1-3-2-2) student**
                    1-4-1-4) resource is not portable to consumer site
                        **1-4-1-4-1) instructor**
                        **1-4-1-4-2) student**
                1-4-2) resource is not portable to playlist
                    **1-4-2-1) instructor**
                    **1-4-2-2) student**
        2) resource with same lti_id does not exist
            **2-1) instructor**
            **2-2) student**

    We only write tests for leaf cases marked in bold above. The other cases are covered by
    varying the parameters randomly in the tests to limit the number of tests and time to run
    them while still providing a good coverage.

    """

    def setUp(self):
        """Override the setUp method to instanciate and serve a request factory."""
        super().setUp()
        self.factory = RequestFactory()

    def _test_lti_get_resource_same_playlist_same_site_instructor(
        self, factory, model, factory_parameters
    ):
        """Above case 1-1-1.

        A resource that exists for the requested playlist and consumer site should be returned
        to an instructor whatever its upload state.
        """
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )
        resource = factory(
            playlist__consumer_site=passport.consumer_site,
            **factory_parameters,
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
        self.assertEqual(models.Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_same_playlist_same_site_instructor(self, mock_verify):
        """Above case 1-1-1.

        A video that exists for the requested playlist and consumer site should be returned
        to an instructor whatever its upload state.
        """
        self._test_lti_get_resource_same_playlist_same_site_instructor(
            factories.VideoFactory,
            models.Video,
            {
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_live_same_playlist_same_site_instructor(self, mock_verify):
        """Above case 1-1-1.

        A video live that exists for the requested playlist and consumer site should be returned
        to an instructor whatever its upload state.
        """
        self._test_lti_get_resource_same_playlist_same_site_instructor(
            factories.VideoFactory,
            models.Video,
            {
                "live_state": random.choice([s[0] for s in LIVE_CHOICES]),
                "live_type": RAW,
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_same_playlist_same_site_instructor(
        self, mock_verify
    ):
        """Above case 1-1-1.

        A video scheduled that exists for the requested playlist and consumer site should be
        returned to an instructor.
        """
        self._test_lti_get_resource_same_playlist_same_site_instructor(
            factories.VideoFactory,
            models.Video,
            {
                "live_state": IDLE,
                "live_type": RAW,
                "starting_at": timezone.now() + timedelta(hours=1),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_past_date_same_playlist_same_site_instructor(
        self, mock_verify
    ):
        """Above case 1-1-1.

        A video scheduled that exists for the requested playlist and consumer site should be
        returned to an instructor even if date is past.
        """
        initial_starting_at = timezone.now() + timedelta(hours=1)
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )
        video = factories.VideoFactory(
            playlist__consumer_site=passport.consumer_site,
            live_state=IDLE,
            live_type=RAW,
            starting_at=initial_starting_at,
        )
        # originally video is scheduled
        self.assertTrue(video.is_scheduled)
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "Instructor",
            "tool_consumer_instance_guid": video.playlist.consumer_site.domain,
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        # now is set after video.starting_at
        now = initial_starting_at + timedelta(days=10)
        with mock.patch.object(timezone, "now", return_value=now):
            # date is past, video is no longer in scheduled mode
            self.assertFalse(video.is_scheduled)
            self.assertEqual(video.live_state, IDLE)
            request = self.factory.post(
                "/", data, HTTP_REFERER="https://example.com/route"
            )
            lti = LTI(request, video.pk)
            lti.verify()
            retrieved_resource = get_or_create_resource(models.Video, lti)
            self.assertIsInstance(retrieved_resource, models.Video)
            self.assertEqual(retrieved_resource, video)

            # No new playlist or resource are created
            self.assertEqual(models.Playlist.objects.count(), 1)
            self.assertEqual(models.Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_same_playlist_same_site_instructor(self, mock_verify):
        """Above case 1-1-1.

        A document that exists for the requested playlist and consumer site should be returned
        to an instructor whatever its upload state.
        """
        self._test_lti_get_resource_same_playlist_same_site_instructor(
            factories.DocumentFactory,
            models.Document,
            {
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
            },
        )

    def _test_lti_get_resource_same_playlist_same_site_student_ready_to_show(
        self, factory, model, factory_parameters
    ):
        """Above case 1-1-2 upload state ready.

        A resource that exists for the requested playlist and consumer site should be returned
        to a student if it is ready.
        """
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )
        resource = factory(
            playlist__consumer_site=passport.consumer_site,
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
            **factory_parameters,
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
        self.assertEqual(models.Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_same_playlist_same_site_student_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-1-2 upload state ready.

        A video that exists for the requested playlist and consumer site should be returned
        to a student if it is ready.
        """
        self._test_lti_get_resource_same_playlist_same_site_student_ready_to_show(
            factories.VideoFactory,
            models.Video,
            {
                "uploaded_on": "2019-09-24 07:24:40+00",
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_live_same_playlist_same_site_student_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-1-2 live state running.

        A video live that exists for the requested playlist and consumer site should be returned
        to a student if it is running.
        """
        self._test_lti_get_resource_same_playlist_same_site_student_ready_to_show(
            factories.VideoFactory,
            models.Video,
            {
                "live_state": random.choice([lc[0] for lc in LIVE_CHOICES]),
                "live_type": RAW,
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_same_playlist_same_site_student_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-1-2 scheduled video.

        A video that exists for the requested playlist and consumer site should be returned
        to a student if it is scheduled.
        """
        self._test_lti_get_resource_same_playlist_same_site_student_ready_to_show(
            factories.VideoFactory,
            models.Video,
            {
                "live_state": IDLE,
                "live_type": RAW,
                "starting_at": timezone.now() + timedelta(hours=1),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_past_same_playlist_same_site_student_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-1-2 scheduled video with a date past.

        A video that exists for the requested playlist and consumer site should be returned
        to a student if was supposed to be scheduled, date is past, but still in ILDE live_state.
        """
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )
        initial_starting_at = timezone.now() + timedelta(days=2)
        video = factories.VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=initial_starting_at,
            playlist__consumer_site=passport.consumer_site,
        )
        # originally video is scheduled
        self.assertTrue(video.is_scheduled)
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "Student",
            "tool_consumer_instance_guid": video.playlist.consumer_site.domain,
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        # now is set after video.starting_at
        now = initial_starting_at + timedelta(days=10)
        with mock.patch.object(timezone, "now", return_value=now):
            # date is past, video is no longer in scheduled mode
            self.assertFalse(video.is_scheduled)
            request = self.factory.post(
                "/", data, HTTP_REFERER="https://example.com/route"
            )
            lti = LTI(request, video.pk)
            lti.verify()
            retrieved_resource = get_or_create_resource(models.Video, lti)
            self.assertIsInstance(retrieved_resource, models.Video)
            self.assertEqual(retrieved_resource, video)

            # No new playlist or resource are created
            self.assertEqual(models.Playlist.objects.count(), 1)
            self.assertEqual(models.Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_same_playlist_same_site_student_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-1-2 upload state ready.

        A Document that exists for the requested playlist and consumer site should be returned
        to a student if it is ready.
        """
        self._test_lti_get_resource_same_playlist_same_site_student_ready_to_show(
            factories.DocumentFactory,
            models.Document,
            {
                "uploaded_on": "2019-09-24 07:24:40+00",
            },
        )

    def _test_lti_get_resource_same_playlist_same_site_student_not_ready_to_show(
        self, factory, model, factory_parameters
    ):
        """Above case 1-1-2 upload state not ready.

        A resource that exists for the requested playlist and consumer site should not be returned
        to a student if it is not ready.
        """
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )
        resource = factory(
            playlist__consumer_site=passport.consumer_site,
            **factory_parameters,
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
        self.assertEqual(models.Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_same_playlist_same_site_student_not_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-1-2 upload state not ready.

        A video that exists for the requested playlist and consumer site should not be returned
        to a student if it is not ready.
        """
        self._test_lti_get_resource_same_playlist_same_site_student_not_ready_to_show(
            factories.VideoFactory,
            models.Video,
            {
                "upload_state": random.choice(
                    [s[0] for s in STATE_CHOICES if s[0] != "ready"]
                )
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_same_playlist_same_site_student_not_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-1-2 upload state not ready.

        A Document that exists for the requested playlist and consumer site should not be returned
        to a student if it is not ready.
        """
        self._test_lti_get_resource_same_playlist_same_site_student_not_ready_to_show(
            factories.DocumentFactory,
            models.Document,
            {
                "upload_state": random.choice(
                    [s[0] for s in STATE_CHOICES if s[0] != "ready"]
                )
            },
        )

    def _test_lti_get_resource_other_site_playlist_portable_ready_to_show(
        self, factory, model, factory_parameters
    ):
        """Above case 1-2-1-1.

        The existing resource should be returned if a student or instructor tries to retrieve a
        resource that is ready but on another consumer site if it is marked as portable to another
        consumer site.
        """
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )
        resource = factory(
            playlist__is_portable_to_consumer_site=True, **factory_parameters
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
        self.assertEqual(models.Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_playlist_portable_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-2-1-1.

        The existing video should be returned if a student or instructor tries to retrieve a
        video that is ready but on another consumer site if it is marked as portable to another
        consumer site.
        """
        self._test_lti_get_resource_other_site_playlist_portable_ready_to_show(
            factories.VideoFactory,
            models.Video,
            {
                "uploaded_on": timezone.now(),
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_live_other_site_playlist_portable_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-2-1-1.

        The existing video live should be returned if a student or instructor tries to retrieve a
        video live that is running but on another consumer site if it is marked as portable to
        another consumer site.
        """
        self._test_lti_get_resource_other_site_playlist_portable_ready_to_show(
            factories.VideoFactory,
            models.Video,
            {
                "live_state": random.choice([lc[0] for lc in LIVE_CHOICES]),
                "live_type": RAW,
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_other_site_playlist_portable_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-2-1-1.

        The existing video scheduled should be returned if a student or instructor tries to
        retrieve a video that is scheduled but on another consumer site if it is marked as portable
        to another consumer site.
        """
        self._test_lti_get_resource_other_site_playlist_portable_ready_to_show(
            factories.VideoFactory,
            models.Video,
            {
                "live_state": IDLE,
                "live_type": RAW,
                "starting_at": timezone.now() + timedelta(hours=1),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_past_other_site_playlist_portable_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-2-1-1.

        The existing video should be returned if a student or instructor tries to retrieve a
        video that was scheduled with a date past but on another consumer site if it is marked as
        portable to another consumer site even if the date is past as long as it's still in IDLE
        live_state.
        """

        initial_starting_at = timezone.now() + timedelta(hours=1)
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )
        video = factories.VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            playlist__is_portable_to_consumer_site=True,
            starting_at=initial_starting_at,
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": random.choice(["Student", "Instructor"]),
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        # originally video is scheduled
        self.assertTrue(video.is_scheduled)
        # now is set after video.starting_at
        now = initial_starting_at + timedelta(days=10)
        with mock.patch.object(timezone, "now", return_value=now):
            # date is past, video is no longer in scheduled mode
            self.assertFalse(video.is_scheduled)
            self.assertEqual(video.live_state, IDLE)
            request = self.factory.post(
                "/", data, HTTP_REFERER="https://example.com/route"
            )

            lti = LTI(request, video.pk)
            lti.verify()
            retrieved_resource = get_or_create_resource(models.Video, lti)
            self.assertIsInstance(retrieved_resource, models.Video)
            self.assertEqual(retrieved_resource, video)

            # No new playlist or resource are created
            self.assertEqual(models.Playlist.objects.count(), 1)
            self.assertEqual(models.Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_site_playlist_portable_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-2-1-1.

        The existing document should be returned if a student or instructor tries to retrieve a
        document that is ready but on another consumer site if it is marked as portable to another
        consumer site.
        """
        self._test_lti_get_resource_other_site_playlist_portable_ready_to_show(
            factories.DocumentFactory,
            models.Document,
            {
                "uploaded_on": timezone.now(),
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
            },
        )

    def _test_lti_get_resource_other_site_playlist_portable_not_ready_to_show_instructor(
        self, factory, model, factory_parameters
    ):
        """Above case 1-2-1-2-1.

        The resource should be returned if an instructor tries to retrieve a resource that
        is already existing for a consumer site but not ready and it is portable to another
        consumer site.
        """
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )
        resource = factory(
            id="77fbf317-3e99-41bd-819c-130531313139",
            playlist__lti_id="a-playlist",
            playlist__is_portable_to_consumer_site=True,
            **factory_parameters,
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
        retrieved_resource = get_or_create_resource(model, lti)
        self.assertIsInstance(retrieved_resource, model)
        self.assertEqual(retrieved_resource, resource)

        # No new playlist or resource are created
        self.assertEqual(models.Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_playlist_portable_not_ready_to_show_instructor(
        self, mock_verify
    ):
        """Above case 1-2-1-2-1.

        The resource should be returned if an instructor tries to retrieve a resource that
        is already existing for a consumer site but not ready and it is portable to another
        consumer site.
        """
        self._test_lti_get_resource_other_site_playlist_portable_not_ready_to_show_instructor(
            factories.VideoFactory,
            models.Video,
            {
                "upload_state": random.choice(
                    [s[0] for s in STATE_CHOICES if s[0] != "ready"]
                ),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_site_playlist_portable_not_ready_to_show_instructor(
        self, mock_verify
    ):
        """Above case 1-2-1-2-1.

        The resource should be returned if an instructor tries to retrieve a resource that
        is already existing for a consumer site but not ready and it is portable to another
        consumer site.
        """
        self._test_lti_get_resource_other_site_playlist_portable_not_ready_to_show_instructor(
            factories.DocumentFactory,
            models.Document,
            {
                "upload_state": random.choice(
                    [s[0] for s in STATE_CHOICES if s[0] != "ready"]
                ),
            },
        )

    def _test_lti_get_resource_other_site_playlist_portable_not_ready_to_show_student(
        self, factory, model, factory_parameters
    ):
        """Above case 1-2-1-2-2.

        No resource is returned to a student trying to access a resource that is existing
        for another consumer site but not ready, even if it is portable to another
        consumer site.
        """
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )
        resource = factory(
            playlist__is_portable_to_consumer_site=True, **factory_parameters
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
        self.assertEqual(models.Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_playlist_portable_not_ready_to_show_student(
        self, mock_verify
    ):
        """Above case 1-2-1-2-2.

        No video is returned to a student trying to access a video that is existing for another
        consumer site but not ready, even if it is portable to another consumer site.
        """
        self._test_lti_get_resource_other_site_playlist_portable_not_ready_to_show_student(
            factories.VideoFactory,
            models.Video,
            {
                "upload_state": random.choice(
                    [s[0] for s in STATE_CHOICES if s[0] != "ready"]
                ),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_site_playlist_portable_not_ready_to_show_student(
        self, mock_verify
    ):
        """Above case 1-2-1-2-2.

        No document is returned to a student trying to access a resource that is existing for
        another consumer site but not ready, even if it is portable to another consumer site.
        """
        self._test_lti_get_resource_other_site_playlist_portable_not_ready_to_show_student(
            factories.DocumentFactory,
            models.Document,
            {
                "upload_state": random.choice(
                    [s[0] for s in STATE_CHOICES if s[0] != "ready"]
                ),
            },
        )

    def _test_lti_get_resource_other_site_auto_portable_ready_to_show(
        self, factory, model, factory_parameters
    ):
        """Above case 1-2-2-1.

        Same as 1-2-1-1 but portability is automatic from the site of the resource to the site
        of the passport.
        """
        consumer_site = factories.ConsumerSiteFactory(domain="example.com")
        passport = factories.ConsumerSiteLTIPassportFactory(consumer_site=consumer_site)
        resource = factory(
            playlist__is_portable_to_consumer_site=False, **factory_parameters
        )

        # Add automatic portability from the site of the resource to the site of the passport
        models.ConsumerSitePortability.objects.create(
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
        self.assertEqual(models.Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_auto_portable_ready_to_show(self, mock_verify):
        """Above case 1-2-2-1.

        Same as 1-2-1-1 but portability is automatic from the site of the video to the site
        of the passport.
        """
        self._test_lti_get_resource_other_site_auto_portable_ready_to_show(
            factories.VideoFactory,
            models.Video,
            {
                "uploaded_on": timezone.now(),
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_live_other_site_auto_portable_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-2-2-1.

        Same as 1-2-1-1 but portability is automatic from the site of the video live to the site
        of the passport.
        """
        self._test_lti_get_resource_other_site_auto_portable_ready_to_show(
            factories.VideoFactory,
            models.Video,
            {
                "live_state": random.choice([lc[0] for lc in LIVE_CHOICES]),
                "live_type": RAW,
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_other_site_auto_portable_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-2-2-1.

        Same as 1-2-1-1 but portability is automatic from the site of the video scheduled
        to the site of the passport.
        """
        self._test_lti_get_resource_other_site_auto_portable_ready_to_show(
            factories.VideoFactory,
            models.Video,
            {
                "live_state": IDLE,
                "live_type": RAW,
                "starting_at": timezone.now() + timedelta(hours=1),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_past_other_site_auto_portable_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-2-2-1.

        Same as 1-2-1-1 but portability is automatic from the site of the scheduled video with
        a date past but still in IDLE live_state to the site of the passport.
        """

        consumer_site = factories.ConsumerSiteFactory(domain="example.com")
        passport = factories.ConsumerSiteLTIPassportFactory(consumer_site=consumer_site)
        initial_starting_at = timezone.now() + timedelta(days=2)
        video = factories.VideoFactory(
            playlist__is_portable_to_consumer_site=False,
            live_state=IDLE,
            live_type=RAW,
            starting_at=initial_starting_at,
        )

        # Add automatic portability from the site of the resource to the site of the passport
        models.ConsumerSitePortability.objects.create(
            source_site=video.playlist.consumer_site, target_site=consumer_site
        )
        # originally video is scheduled
        self.assertTrue(video.is_scheduled)
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": random.choice(["Student", "Instructor"]),
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        now = initial_starting_at + timedelta(days=10)
        with mock.patch.object(timezone, "now", return_value=now):
            # date is past, video is no longer in scheduled mode
            self.assertFalse(video.is_scheduled)
            self.assertEqual(video.live_state, IDLE)

            request = self.factory.post(
                "/", data, HTTP_REFERER="https://example.com/route"
            )
            lti = LTI(request, video.pk)
            lti.verify()
            retrieved_resource = get_or_create_resource(models.Video, lti)
            self.assertIsInstance(retrieved_resource, models.Video)
            self.assertEqual(retrieved_resource, video)

            # No new playlist or resource are created
            self.assertEqual(models.Playlist.objects.count(), 1)
            self.assertEqual(models.Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_site_auto_portable_ready_to_show(self, mock_verify):
        """Above case 1-2-2-1.

        Same as 1-2-1-1 but portability is automatic from the site of the document to the site
        of the passport.
        """
        self._test_lti_get_resource_other_site_auto_portable_ready_to_show(
            factories.DocumentFactory,
            models.Document,
            {
                "uploaded_on": timezone.now(),
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
            },
        )

    def _test_lti_get_resource_other_site_auto_portable_not_ready_to_show_instructor(
        self, factory, model, factory_parameters
    ):
        """Above case 1-2-2-2-1.

        Same as 1-2-1-2-1 but portability is automatic from the site of the video to the site
        of the passport.
        """
        consumer_site = factories.ConsumerSiteFactory(domain="example.com")
        passport = factories.ConsumerSiteLTIPassportFactory(consumer_site=consumer_site)
        resource = factory(
            id="77fbf317-3e99-41bd-819c-130531313139",
            playlist__lti_id="a-playlist",
            playlist__is_portable_to_consumer_site=False,
            **factory_parameters,
        )
        # Add automatic portability from the site of the video to the site of the passport
        models.ConsumerSitePortability.objects.create(
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
        retrieved_resource = get_or_create_resource(model, lti)
        self.assertIsInstance(retrieved_resource, model)
        self.assertEqual(retrieved_resource, resource)

        # No new playlist or resource are created
        self.assertEqual(models.Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_auto_portable_not_ready_to_show_instructor(
        self, mock_verify
    ):
        """Above case 1-2-2-2-1.

        Same as 1-2-1-2-1 but portability is automatic from the site of the video to the site
        of the passport.
        """
        self._test_lti_get_resource_other_site_auto_portable_not_ready_to_show_instructor(
            factories.VideoFactory,
            models.Video,
            {
                "upload_state": random.choice(
                    [s[0] for s in STATE_CHOICES if s[0] != "ready"]
                ),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_site_auto_portable_not_ready_to_show_instructor(
        self, mock_verify
    ):
        """Above case 1-2-2-2-1.

        Same as 1-2-1-2-1 but portability is automatic from the site of the video to the site
        of the passport.
        """
        self._test_lti_get_resource_other_site_auto_portable_not_ready_to_show_instructor(
            factories.DocumentFactory,
            models.Document,
            {
                "upload_state": random.choice(
                    [s[0] for s in STATE_CHOICES if s[0] != "ready"]
                ),
            },
        )

    def _test_lti_get_resource_other_site_auto_portable_not_ready_to_show_student(
        self, factory, model, factory_parameters
    ):
        """Above case 1-2-2-2-2.

        Same as 1-2-1-2-2 but portability is automatic from the site of the video to the site
        of the passport.
        """
        consumer_site = factories.ConsumerSiteFactory(domain="example.com")
        passport = factories.ConsumerSiteLTIPassportFactory(consumer_site=consumer_site)
        resource = factory(
            playlist__is_portable_to_consumer_site=False,
            **factory_parameters,
        )

        # Add automatic portability from the site of the video to the site of the passport
        models.ConsumerSitePortability.objects.create(
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
        self.assertEqual(models.Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_auto_portable_not_ready_to_show_student(
        self, mock_verify
    ):
        """Above case 1-2-2-2-2.

        Same as 1-2-1-2-2 but portability is automatic from the site of the video to the site
        of the passport.
        """
        self._test_lti_get_resource_other_site_auto_portable_not_ready_to_show_student(
            factories.VideoFactory,
            models.Video,
            {
                "upload_state": random.choice(
                    [s[0] for s in STATE_CHOICES if s[0] != "ready"]
                ),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_site_auto_portable_not_ready_to_show_student(
        self, mock_verify
    ):
        """Above case 1-2-2-2-2.

        Same as 1-2-1-2-2 but portability is automatic from the site of the video to the site
        of the passport.
        """
        self._test_lti_get_resource_other_site_auto_portable_not_ready_to_show_student(
            factories.DocumentFactory,
            models.Document,
            {
                "upload_state": random.choice(
                    [s[0] for s in STATE_CHOICES if s[0] != "ready"]
                ),
            },
        )

    def _test_lti_get_resource_other_site_pl_auto_portable_instructor(
        self, factory, model, is_portable_to_playlist, factory_parameters
    ):
        """Above cases 1-2-3-1-1 and 1-2-3-2-1."""
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )

        resource = factory(
            id="77fbf317-3e99-41bd-819c-130531313139",
            playlist__lti_id="a-playlist",
            playlist__is_portable_to_consumer_site=False,
            **factory_parameters,
        )
        if is_portable_to_playlist:
            # Add automatic portability from the playlist of the video to another playlist sharing
            # the same lti_id
            target_playlist = factories.PlaylistFactory(lti_id=resource.playlist.lti_id)
            models.PlaylistPortability.objects.create(
                source_playlist=resource.playlist, target_playlist=target_playlist
            )

        nb_playlist = models.Playlist.objects.count()
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
                f"The {model.__name__} ID 77fbf317-3e99-41bd-819c-130531313139 already exists but "
                "is not portable to your playlist (a-playlist) and/or consumer site "
                "(example.com)."
            ),
        )
        # No new playlist or resource are created
        self.assertEqual(models.Playlist.objects.count(), nb_playlist)
        self.assertEqual(model.objects.count(), 1)

    def _test_lti_get_resource_other_site_pl_auto_portable_student(
        self, factory, model, is_portable_to_playlist, factory_parameters
    ):
        """Above cases 1-2-3-1-2 and 1-2-3-2-2."""
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )
        resource = factory(
            id="77fbf317-3e99-41bd-819c-130531313139",
            playlist__lti_id="a-playlist",
            playlist__is_portable_to_consumer_site=False,
            **factory_parameters,
        )
        if is_portable_to_playlist:
            # Add automatic portability from the playlist of the video to another playlist sharing
            # the same lti_id
            target_playlist = factories.PlaylistFactory(lti_id=resource.playlist.lti_id)
            models.PlaylistPortability.objects.create(
                source_playlist=resource.playlist, target_playlist=target_playlist
            )

        nb_playlist = models.Playlist.objects.count()
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
        self.assertEqual(models.Playlist.objects.count(), nb_playlist)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_pl_auto_portable_ready_to_show_instructor(
        self, mock_verify
    ):
        """Above case 1-2-3-1-1 for Video."""
        self._test_lti_get_resource_other_site_pl_auto_portable_instructor(
            factories.VideoFactory,
            models.Video,
            is_portable_to_playlist=True,
            factory_parameters={
                "uploaded_on": "2019-09-24 07:24:40+00",
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_live_other_site_pl_auto_portable_ready_to_show_instructor(
        self, mock_verify
    ):
        """Above case 1-2-3-1-1 for Video live."""
        self._test_lti_get_resource_other_site_pl_auto_portable_instructor(
            factories.VideoFactory,
            models.Video,
            is_portable_to_playlist=True,
            factory_parameters={"live_state": "running", "live_type": RAW},
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_other_site_pl_auto_portable_ready_to_show_instructor(
        self, mock_verify
    ):
        """Above case 1-2-3-1-1 for scheduled video."""
        self._test_lti_get_resource_other_site_pl_auto_portable_instructor(
            factories.VideoFactory,
            models.Video,
            is_portable_to_playlist=True,
            factory_parameters={
                "live_state": IDLE,
                "live_type": RAW,
                "starting_at": timezone.now() + timedelta(hours=1),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_past_other_site_pl_auto_portable_ready_to_show_instructor(
        self, mock_verify
    ):
        """Above case 1-2-3-1-1 for scheduled video that are past but still in IDLE live_state."""
        initial_starting_at = timezone.now() + timedelta(days=2)
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )

        video = factories.VideoFactory(
            id="77fbf317-3e99-41bd-819c-130531313139",
            live_state=IDLE,
            live_type=RAW,
            playlist__lti_id="a-playlist",
            playlist__is_portable_to_consumer_site=False,
            starting_at=initial_starting_at,
        )
        # Add automatic portability from the playlist of the video to another playlist sharing
        # the same lti_id
        target_playlist = factories.PlaylistFactory(lti_id=video.playlist.lti_id)
        models.PlaylistPortability.objects.create(
            source_playlist=video.playlist, target_playlist=target_playlist
        )

        nb_playlist = models.Playlist.objects.count()

        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "Instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        # now is set after video.starting_at
        now = initial_starting_at + timedelta(days=10)
        with mock.patch.object(timezone, "now", return_value=now):
            # date is past, video is no longer in scheduled mode
            self.assertFalse(video.is_scheduled)
            self.assertEqual(video.live_state, IDLE)

            request = self.factory.post(
                "/", data, HTTP_REFERER="https://example.com/route"
            )
            lti = LTI(request, video.pk)
            lti.verify()
            with self.assertRaises(PortabilityError) as context:
                get_or_create_resource(models.Video, lti)
            self.assertEqual(
                context.exception.args[0],
                (
                    f"The {models.Video.__name__} ID 77fbf317-3e99-41bd-819c-130531313139 "
                    "already exists but is not portable to your playlist (a-playlist) and/or "
                    "consumer site (example.com)."
                ),
            )
            # No new playlist or resource are created
            self.assertEqual(models.Playlist.objects.count(), nb_playlist)
            self.assertEqual(models.Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_site_pl_auto_portable_ready_to_show_instructor(
        self, mock_verify
    ):
        """Above case 1-2-3-1-1 for Document."""
        self._test_lti_get_resource_other_site_pl_auto_portable_instructor(
            factories.DocumentFactory,
            models.Document,
            is_portable_to_playlist=True,
            factory_parameters={
                "uploaded_on": "2019-09-24 07:24:40+00",
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_pl_auto_portable_ready_to_show_student(
        self, mock_verify
    ):
        """Above case 1-2-3-1-2 for Video."""
        self._test_lti_get_resource_other_site_pl_auto_portable_student(
            factories.VideoFactory,
            models.Video,
            is_portable_to_playlist=True,
            factory_parameters={
                "uploaded_on": "2019-09-24 07:24:40+00",
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_other_site_pl_auto_portable_ready_to_show_student(
        self, mock_verify
    ):
        """Above case 1-2-3-1-2 for scheduled video."""
        self._test_lti_get_resource_other_site_pl_auto_portable_student(
            factories.VideoFactory,
            models.Video,
            is_portable_to_playlist=True,
            factory_parameters={
                "live_state": IDLE,
                "live_type": RAW,
                "starting_at": timezone.now() + timedelta(hours=1),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_past_other_site_pl_auto_portable_ready_to_show_student(
        self, mock_verify
    ):
        """Above case 1-2-3-1-2 for scheduled video that have a date that is past but is still
        in IDLE live_state.

        """
        initial_starting_at = timezone.now() + timedelta(hours=1)
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )
        video = factories.VideoFactory(
            id="77fbf317-3e99-41bd-819c-130531313139",
            live_state=IDLE,
            live_type=RAW,
            playlist__lti_id="a-playlist",
            playlist__is_portable_to_consumer_site=False,
            starting_at=initial_starting_at,
        )

        # Add automatic portability from the playlist of the video to another playlist sharing
        # the same lti_id
        target_playlist = factories.PlaylistFactory(lti_id=video.playlist.lti_id)
        models.PlaylistPortability.objects.create(
            source_playlist=video.playlist, target_playlist=target_playlist
        )

        nb_playlist = models.Playlist.objects.count()
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "Student",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        # originally video is scheduled
        self.assertTrue(video.is_scheduled)
        # now is set after video.starting_at
        now = initial_starting_at + timedelta(days=10)
        with mock.patch.object(timezone, "now", return_value=now):
            # date is past, video is no longer in scheduled mode
            self.assertFalse(video.is_scheduled)
            self.assertEqual(video.live_state, IDLE)
            request = self.factory.post(
                "/", data, HTTP_REFERER="https://example.com/route"
            )
            lti = LTI(request, video.pk)
            lti.verify()
            self.assertIsNone(get_or_create_resource(models.Video, lti))

            # No new playlist or resource are created
            self.assertEqual(models.Playlist.objects.count(), nb_playlist)
            self.assertEqual(models.Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_site_pl_auto_portable_ready_to_show_student(
        self, mock_verify
    ):
        """Above case 1-2-3-1-2 for Document."""
        self._test_lti_get_resource_other_site_pl_auto_portable_student(
            factories.DocumentFactory,
            models.Document,
            is_portable_to_playlist=True,
            factory_parameters={
                "uploaded_on": "2019-09-24 07:24:40+00",
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_pl_auto_portable_not_ready_to_show_instructor(
        self, mock_verify
    ):
        """Above case 1-2-3-2-1."""
        self._test_lti_get_resource_other_site_pl_auto_portable_instructor(
            factories.VideoFactory,
            models.Video,
            is_portable_to_playlist=True,
            factory_parameters={
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_live_other_site_pl_auto_portable_not_ready_to_show_instructor(
        self, mock_verify
    ):
        """Above case 1-2-3-2-1 for video live."""
        self._test_lti_get_resource_other_site_pl_auto_portable_instructor(
            factories.VideoFactory,
            models.Video,
            is_portable_to_playlist=True,
            factory_parameters={
                "live_state": random.choice(
                    [lc[0] for lc in LIVE_CHOICES if lc[0] != "running"]
                ),
                "live_type": RAW,
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_other_site_pl_auto_portable_not_ready_to_show_instructor(
        self, mock_verify
    ):
        """Above case 1-2-3-2-1 for video scheduled not in default mode."""
        self._test_lti_get_resource_other_site_pl_auto_portable_instructor(
            factories.VideoFactory,
            models.Video,
            is_portable_to_playlist=True,
            factory_parameters={
                "live_state": IDLE,
                "live_type": RAW,
                "starting_at": timezone.now() + timedelta(hours=1),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_past_other_site_pl_auto_portable_not_ready_to_show_instructor(
        self, mock_verify
    ):
        """Above case 1-2-3-2-1 for video scheduled that have a date that is past but still a
        live_state equals to IDLE."""

        initial_starting_at = timezone.now() + timedelta(days=2)
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )

        video = factories.VideoFactory(
            id="77fbf317-3e99-41bd-819c-130531313139",
            playlist__lti_id="a-playlist",
            playlist__is_portable_to_consumer_site=False,
            live_state=IDLE,
            live_type=RAW,
            starting_at=initial_starting_at,
        )

        # Add automatic portability from the playlist of the video to another playlist sharing
        # the same lti_id
        target_playlist = factories.PlaylistFactory(lti_id=video.playlist.lti_id)
        models.PlaylistPortability.objects.create(
            source_playlist=video.playlist, target_playlist=target_playlist
        )

        nb_playlist = models.Playlist.objects.count()
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "Instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        now = initial_starting_at + timedelta(days=10)
        with mock.patch.object(timezone, "now", return_value=now):
            # date is past, video is no longer in scheduled mode
            self.assertFalse(video.is_scheduled)
            self.assertEqual(video.live_state, IDLE)
            request = self.factory.post(
                "/", data, HTTP_REFERER="https://example.com/route"
            )
            lti = LTI(request, video.pk)
            lti.verify()
            with self.assertRaises(PortabilityError) as context:
                get_or_create_resource(models.Video, lti)
            self.assertEqual(
                context.exception.args[0],
                (
                    f"The {models.Video.__name__} ID 77fbf317-3e99-41bd-819c-130531313139 "
                    "already exists but is not portable to your playlist (a-playlist) and/or"
                    " consumer site (example.com)."
                ),
            )
            # No new playlist or resource are created
            self.assertEqual(models.Playlist.objects.count(), nb_playlist)
            self.assertEqual(models.Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_site_pl_auto_portable_not_ready_to_show_instructor(
        self, mock_verify
    ):
        """Above case 1-2-3-2-1."""
        self._test_lti_get_resource_other_site_pl_auto_portable_instructor(
            factories.DocumentFactory,
            models.Document,
            is_portable_to_playlist=True,
            factory_parameters={
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_pl_auto_portable_not_ready_to_show_student(
        self, mock_verify
    ):
        """Above case 1-2-3-2-2 for Video."""
        self._test_lti_get_resource_other_site_pl_auto_portable_student(
            factories.VideoFactory,
            models.Video,
            is_portable_to_playlist=True,
            factory_parameters={
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_site_pl_auto_portable_not_ready_to_show_student(
        self, mock_verify
    ):
        """Above case 1-2-3-2-2 for Document."""
        self._test_lti_get_resource_other_site_pl_auto_portable_student(
            factories.DocumentFactory,
            models.Document,
            is_portable_to_playlist=True,
            factory_parameters={
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_not_portable_instructor(self, mock_verify):
        """Above case 1-2-4-1 for Video.

        A PortabilityError should be raised if an instructor tries to retrieve a video that is
        already existing for a consumer site but not portable to another consumer site, even if it
        is ready.
        """
        self._test_lti_get_resource_other_site_pl_auto_portable_instructor(
            factories.VideoFactory,
            models.Video,
            is_portable_to_playlist=False,
            factory_parameters={
                "uploaded_on": "2019-09-24 07:24:40+00",
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_other_site_not_portable_instructor(
        self, mock_verify
    ):
        """Above case 1-2-4-1 for Video.

        A PortabilityError should be raised if an instructor tries to retrieve a video that is
        already existing for a consumer site but not portable to another consumer site, even if it
        is scheduled.
        """
        self._test_lti_get_resource_other_site_pl_auto_portable_instructor(
            factories.VideoFactory,
            models.Video,
            is_portable_to_playlist=False,
            factory_parameters={
                "live_state": IDLE,
                "live_type": RAW,
                "starting_at": timezone.now() + timedelta(hours=1),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_past_other_site_not_portable_instructor(
        self, mock_verify
    ):
        """Above case 1-2-4-1 for scheduled videos that are past but still with an IDLE live_state.

        A PortabilityError should be raised if an instructor tries to retrieve a video that is
        already existing for a consumer site but not portable to another consumer site, even if it
        is scheduled and date is past.
        """
        initial_starting_at = timezone.now() + timedelta(hours=1)
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )

        video = factories.VideoFactory(
            id="77fbf317-3e99-41bd-819c-130531313139",
            live_state=IDLE,
            live_type=RAW,
            playlist__lti_id="a-playlist",
            playlist__is_portable_to_consumer_site=False,
            starting_at=initial_starting_at,
        )

        nb_playlist = models.Playlist.objects.count()
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "Instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        # now is set after video.starting_at
        now = initial_starting_at + timedelta(days=10)
        with mock.patch.object(timezone, "now", return_value=now):
            # date is past, video is no longer in scheduled mode
            self.assertFalse(video.is_scheduled)
            self.assertEqual(video.live_state, IDLE)
            request = self.factory.post(
                "/", data, HTTP_REFERER="https://example.com/route"
            )
            lti = LTI(request, video.pk)
            lti.verify()
            with self.assertRaises(PortabilityError) as context:
                get_or_create_resource(models.Video, lti)
            self.assertEqual(
                context.exception.args[0],
                (
                    f"The {models.Video.__name__} ID 77fbf317-3e99-41bd-819c-130531313139 "
                    "already exists but is not portable to your playlist (a-playlist) and/or "
                    "consumer site (example.com)."
                ),
            )
            # No new playlist or resource are created
            self.assertEqual(models.Playlist.objects.count(), nb_playlist)
            self.assertEqual(models.Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_site_not_portable_instructor(self, mock_verify):
        """Above case 1-2-4-1 for Document.

        A PortabilityError should be raised if an instructor tries to retrieve a video that is
        already existing for a consumer site but not portable to another consumer site, even if it
        is ready.
        """
        self._test_lti_get_resource_other_site_pl_auto_portable_instructor(
            factories.DocumentFactory,
            models.Document,
            is_portable_to_playlist=False,
            factory_parameters={
                "uploaded_on": "2019-09-24 07:24:40+00",
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
            },
        )

    def _test_lti_get_resource_other_site_not_portable_student(
        self, factory, model, factory_parameters
    ):
        """Above case 1-2-4-2.

        No video is returned to a student trying to access a video that is existing for a
        consumer site but not portable to another consumer site.
        """
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )
        resource = factory(**factory_parameters)
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
        self.assertEqual(models.Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_not_portable_student(self, mock_verify):
        """Above case 1-2-4-2 for Video.

        No video is returned to a student trying to access a video that is existing for a
        consumer site but not portable to another consumer site.
        """
        self._test_lti_get_resource_other_site_not_portable_student(
            factories.VideoFactory,
            models.Video,
            {"upload_state": random.choice([s[0] for s in STATE_CHOICES])},
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_live_other_site_not_portable_student(self, mock_verify):
        """Above case 1-2-4-2 for video live.

        No video is returned to a student trying to access a video that is existing for a
        consumer site but not portable to another consumer site.
        """
        self._test_lti_get_resource_other_site_not_portable_student(
            factories.VideoFactory,
            models.Video,
            {
                "live_state": random.choice([lc[0] for lc in LIVE_CHOICES]),
                "live_type": RAW,
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_other_site_not_portable_student(self, mock_verify):
        """Above case 1-2-4-2 for a scheduled video.

        No video is returned to a student trying to access a video that is existing for a
        consumer site but not portable to another consumer site.
        """
        self._test_lti_get_resource_other_site_not_portable_student(
            factories.VideoFactory,
            models.Video,
            {
                "live_state": IDLE,
                "live_type": RAW,
                "starting_at": timezone.now() + timedelta(hours=1),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_past_other_site_not_portable_student(
        self, mock_verify
    ):
        """Above case 1-2-4-2 for a scheduled video with a date past but still in IDLE live_state.

        No video is returned to a student trying to access a video that is existing for a
        consumer site but not portable to another consumer site.
        """
        initial_starting_at = timezone.now() + timedelta(days=2)
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )
        video = factories.VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=initial_starting_at,
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "Student",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        now = initial_starting_at + timedelta(days=10)
        with mock.patch.object(timezone, "now", return_value=now):
            # date is past, video is no longer in scheduled mode
            self.assertFalse(video.is_scheduled)
            self.assertEqual(video.live_state, IDLE)

            request = self.factory.post(
                "/", data, HTTP_REFERER="https://example.com/route"
            )
            lti = LTI(request, video.pk)
            lti.verify()
            self.assertIsNone(get_or_create_resource(models.Video, lti))

            # No new playlist or resource are created
            self.assertEqual(models.Playlist.objects.count(), 1)
            self.assertEqual(models.Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_site_not_portable_student(self, mock_verify):
        """Above case 1-2-4-2 for Document.

        No document is returned to a student trying to access a document that is existing for a
        consumer site but not portable to another consumer site.
        """
        self._test_lti_get_resource_other_site_not_portable_student(
            factories.DocumentFactory,
            models.Document,
            {"upload_state": random.choice([s[0] for s in STATE_CHOICES])},
        )

    def _test_lti_get_resource_other_playlist_portable_ready_to_show(
        self, factory, model, factory_parameters
    ):
        """Above case 1-3-1-1.

        The existing resource should be returned if a student or instructor tries to retrieve a
        resource that is ready but linked to another playlist if it is marked as portable to
        another playlist.
        """
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )
        resource = factory(
            playlist__consumer_site=passport.consumer_site,
            **factory_parameters,
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
        self.assertEqual(models.Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_playlist_portable_ready_to_show(self, mock_verify):
        """Above case 1-3-1-1 for Video.

        The existing video should be returned if a student or instructor tries to retrieve a
        video that is ready but linked to another playlist if it is marked as portable to another
        playlist.
        """
        self._test_lti_get_resource_other_playlist_portable_ready_to_show(
            factories.VideoFactory,
            models.Video,
            {
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
                "uploaded_on": "2019-09-24 07:24:40+00",
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_live_other_playlist_portable_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-3-1-1 for Video.

        The existing video should be returned if a student or instructor tries to retrieve a
        video live that is running but linked to another playlist if it is marked as portable
        to another playlist.
        """
        self._test_lti_get_resource_other_playlist_portable_ready_to_show(
            factories.VideoFactory,
            models.Video,
            {
                "live_state": random.choice([lc[0] for lc in LIVE_CHOICES]),
                "live_type": RAW,
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_other_playlist_portable_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-3-1-1 for scheduled Video.

        The existing video should be returned if a student or instructor tries to retrieve a
        video that is scheduled but linked to another playlist if it is marked as portable
        to another playlist.
        """
        self._test_lti_get_resource_other_playlist_portable_ready_to_show(
            factories.VideoFactory,
            models.Video,
            {
                "live_state": IDLE,
                "live_type": RAW,
                "starting_at": timezone.now() + timedelta(hours=1),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_past_other_playlist_portable_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-3-1-1 for scheduled Video with a date past but still in IDLE live_state.

        The existing video should be returned if a student or instructor tries to retrieve a
        video that is scheduled but linked to another playlist if it is marked as portable
        to another playlist.
        """
        initial_starting_at = timezone.now() + timedelta(days=2)
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )
        video = factories.VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            playlist__consumer_site=passport.consumer_site,
            starting_at=initial_starting_at,
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": random.choice(["Student", "Instructor"]),
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        # now is set after video.starting_at
        now = initial_starting_at + timedelta(days=10)
        with mock.patch.object(timezone, "now", return_value=now):
            # date is past, video is no longer in scheduled mode
            self.assertFalse(video.is_scheduled)
            self.assertEqual(video.live_state, IDLE)
            request = self.factory.post(
                "/", data, HTTP_REFERER="https://example.com/route"
            )
            lti = LTI(request, video.pk)
            lti.verify()
            retrieved_resource = get_or_create_resource(models.Video, lti)
            self.assertIsInstance(retrieved_resource, models.Video)
            self.assertEqual(retrieved_resource, video)

            # No new playlist or resource are created
            self.assertEqual(models.Playlist.objects.count(), 1)
            self.assertEqual(models.Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_playlist_portable_ready_to_show(self, mock_verify):
        """Above case 1-3-1-1 for Document.

        The existing document should be returned if a student or instructor tries to retrieve a
        document that is ready but linked to another playlist if it is marked as portable to
        another playlist.
        """
        self._test_lti_get_resource_other_playlist_portable_ready_to_show(
            factories.DocumentFactory,
            models.Document,
            {
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
                "uploaded_on": "2019-09-24 07:24:40+00",
            },
        )

    def _test_lti_get_resource_other_pl_portable_not_ready_to_show_instructor(
        self, factory, model, factory_parameters
    ):
        """Above case 1-3-1-2-1.

        The resource should be returned if an instructor tries to retrieve a video that is
        already existing in a playlist but not ready, and if it is portable to another
        playlist.
        """
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )
        resource = factory(
            id="77fbf317-3e99-41bd-819c-130531313139",
            playlist__lti_id="a-playlist",
            playlist__consumer_site=passport.consumer_site,
            playlist__is_portable_to_playlist=True,
            **factory_parameters,
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
        retrieved_resource = get_or_create_resource(model, lti)
        self.assertIsInstance(retrieved_resource, model)
        self.assertEqual(retrieved_resource, resource)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_portable_not_ready_to_show_instructor(
        self, mock_verify
    ):
        """Above case 1-3-1-2-1 for Video.

        The resource should be returned if an instructor tries to retrieve a video that is
        already existing in a playlist but not ready, and if it is portable to another
        playlist.
        """
        self._test_lti_get_resource_other_pl_portable_not_ready_to_show_instructor(
            factories.VideoFactory,
            models.Video,
            {
                "upload_state": random.choice(
                    [s[0] for s in STATE_CHOICES if s[0] != "ready"]
                ),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_pl_portable_not_ready_to_show_instructor(
        self, mock_verify
    ):
        """Above case 1-3-1-2-1 for Document.

        The resource should be returned if an instructor tries to retrieve a video that is
        already existing in a playlist but not ready, and if it is portable to another
        playlist.
        """
        self._test_lti_get_resource_other_pl_portable_not_ready_to_show_instructor(
            factories.DocumentFactory,
            models.Document,
            {
                "upload_state": random.choice(
                    [s[0] for s in STATE_CHOICES if s[0] != "ready"]
                ),
            },
        )

    def _test_lti_get_resource_other_playlist_portable_not_ready_to_show_student(
        self, factory, model, factory_parameters
    ):
        """Above case 1-3-1-2-2.

        No resource is returned to a student trying to access a resource that is
        existing in another playlist but not ready, even if it is portable to another playlist.
        """
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )
        resource = factory(
            playlist__consumer_site=passport.consumer_site,
            playlist__is_portable_to_playlist=True,
            **factory_parameters,
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
        self.assertEqual(models.Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_playlist_portable_not_ready_to_show_student(
        self, mock_verify
    ):
        """Above case 1-3-1-2-2 for Video.

        No video is returned to a student trying to access a video that is existing in another
        playlist but not ready, even if it is portable to another playlist.
        """
        self._test_lti_get_resource_other_playlist_portable_not_ready_to_show_student(
            factories.VideoFactory,
            models.Video,
            {
                "upload_state": random.choice(
                    [s[0] for s in STATE_CHOICES if s[0] != "ready"]
                ),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_playlist_portable_not_ready_to_show_student(
        self, mock_verify
    ):
        """Above case 1-3-1-2-2 for Document.

        No document is returned to a student trying to access a document that is existing in
        another playlist but not ready, even if it is portable to another playlist.
        """
        self._test_lti_get_resource_other_playlist_portable_not_ready_to_show_student(
            factories.DocumentFactory,
            models.Document,
            {
                "upload_state": random.choice(
                    [s[0] for s in STATE_CHOICES if s[0] != "ready"]
                ),
            },
        )

    def _test_lti_get_resource_other_playlist_not_portable_instructor(
        self, factory, model, factory_parameters
    ):
        """Above case 1-3-2-1.

        A PortabilityError should be raised if an instructor tries to retrieve a video that is
        existing in a playlist but not portable to another playlist, even if it
        is ready.
        """
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )
        resource = factory(
            id="77fbf317-3e99-41bd-819c-130531313139",
            lti_id="df7",
            playlist__lti_id="a-playlist",
            playlist__consumer_site=passport.consumer_site,
            playlist__is_portable_to_playlist=False,
            **factory_parameters,
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
                f"The {model.__name__} ID 77fbf317-3e99-41bd-819c-130531313139 already exists but "
                "is not portable to your playlist (another-playlist) and/or consumer site "
                "(example.com)."
            ),
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_playlist_not_portable_instructor(self, mock_verify):
        """Above case 1-3-2-1 for Video.

        A PortabilityError should be raised if an instructor tries to retrieve a video that is
        existing in a playlist but not portable to another playlist, even if it
        is ready.
        """
        self._test_lti_get_resource_other_playlist_not_portable_instructor(
            factories.VideoFactory,
            models.Video,
            {
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_live_other_playlist_not_portable_instructor(
        self, mock_verify
    ):
        """Above case 1-3-2-1 for video live.

        A PortabilityError should be raised if an instructor tries to retrieve a video that is
        existing in a playlist but not portable to another playlist, even if it
        is running.
        """
        self._test_lti_get_resource_other_playlist_not_portable_instructor(
            factories.VideoFactory,
            models.Video,
            {
                "live_state": random.choice([lc[0] for lc in LIVE_CHOICES]),
                "live_type": RAW,
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_other_playlist_not_portable_instructor(
        self, mock_verify
    ):
        """Above case 1-3-2-1 for video scheduled.

        A PortabilityError should be raised if an instructor tries to retrieve a video that is
        existing in a playlist but not portable to another playlist, even if it
        is scheduled.
        """
        self._test_lti_get_resource_other_playlist_not_portable_instructor(
            factories.VideoFactory,
            models.Video,
            {
                "live_state": IDLE,
                "live_type": RAW,
                "starting_at": timezone.now() + timedelta(hours=1),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_past_other_playlist_not_portable_instructor(
        self, mock_verify
    ):
        """Above case 1-3-2-1 for video scheduled with a date past and IDLE live_state.

        A PortabilityError should be raised if an instructor tries to retrieve a video that is
        existing in a playlist but not portable to another playlist, even if it
        is scheduled  a date past and IDLE live_state.
        """
        initial_starting_at = timezone.now() + timedelta(days=2)
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )
        video = factories.VideoFactory(
            id="77fbf317-3e99-41bd-819c-130531313139",
            live_state=IDLE,
            live_type=RAW,
            lti_id="df7",
            playlist__lti_id="a-playlist",
            playlist__consumer_site=passport.consumer_site,
            playlist__is_portable_to_playlist=False,
            starting_at=initial_starting_at,
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": "another-playlist",
            "roles": "Instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        # now is set after video.starting_at
        now = initial_starting_at + timedelta(days=10)
        with mock.patch.object(timezone, "now", return_value=now):
            # date is past, video is no longer in scheduled mode
            self.assertFalse(video.is_scheduled)
            self.assertEqual(video.live_state, IDLE)
            request = self.factory.post(
                "/", data, HTTP_REFERER="https://example.com/route"
            )
            lti = LTI(request, video.pk)
            lti.verify()
            with self.assertRaises(PortabilityError) as context:
                get_or_create_resource(models.Video, lti)
            self.assertEqual(
                context.exception.args[0],
                (
                    f"The {models.Video.__name__} ID 77fbf317-3e99-41bd-819c-130531313139 "
                    "already exists but is not portable to your playlist (another-playlist) "
                    "and/or consumer site (example.com)."
                ),
            )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_playlist_not_portable_instructor(self, mock_verify):
        """Above case 1-3-2-1 for Document.

        A PortabilityError should be raised if an instructor tries to retrieve a document that is
        existing in a playlist but not portable to another playlist, even if it
        is ready.
        """
        self._test_lti_get_resource_other_playlist_not_portable_instructor(
            factories.DocumentFactory,
            models.Document,
            {
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
            },
        )

    def _test_lti_get_resource_other_playlist_not_portable_student(
        self, factory, model, factory_parameters
    ):
        """Above case 1-3-2-2.

        No resource is returned to a student trying to access a resource that is
        existing in another playlist but not portable to another playlist, even if it is ready.
        """
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )
        resource = factory(
            playlist__consumer_site=passport.consumer_site,
            playlist__is_portable_to_playlist=False,
            **factory_parameters,
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
        self.assertEqual(models.Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_playlist_not_portable_student(self, mock_verify):
        """Above case 1-3-2-2 for Video.

        No video is returned to a student trying to access a video that is existing in another
        playlist but not portable to another playlist, even if it is ready.
        """
        self._test_lti_get_resource_other_playlist_not_portable_student(
            factories.VideoFactory,
            models.Video,
            {
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_live_other_playlist_not_portable_student(self, mock_verify):
        """Above case 1-3-2-2 for video live.

        No video is returned to a student trying to access a video that is existing in another
        playlist but not portable to another playlist, even if it is running.
        """
        self._test_lti_get_resource_other_playlist_not_portable_student(
            factories.VideoFactory,
            models.Video,
            {
                "live_state": random.choice([lc[0] for lc in LIVE_CHOICES]),
                "live_type": RAW,
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_other_playlist_not_portable_student(
        self, mock_verify
    ):
        """Above case 1-3-2-2 for scheduled video.

        No video is returned to a student trying to access a video that is existing in another
        playlist but not portable to another playlist, even if it is scheduled.
        """
        self._test_lti_get_resource_other_playlist_not_portable_student(
            factories.VideoFactory,
            models.Video,
            {
                "live_state": IDLE,
                "live_type": RAW,
                "starting_at": timezone.now() + timedelta(hours=1),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_past_other_playlist_not_portable_student(
        self, mock_verify
    ):
        """Above case 1-3-2-2 for scheduled video with a date past and live_state to IDLE.

        No video is returned to a student trying to access a video that is existing in another
        playlist but not portable to another playlist, even if it is scheduled with a date past
        and live_state to IDLE.
        """
        initial_starting_at = timezone.now() + timedelta(hours=1)
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )
        video = factories.VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            playlist__consumer_site=passport.consumer_site,
            playlist__is_portable_to_playlist=False,
            starting_at=initial_starting_at,
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": "another-playlist",
            "roles": "Student",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        # originally video is scheduled
        self.assertTrue(video.is_scheduled)
        # now is set after video.starting_at
        now = initial_starting_at + timedelta(days=10)
        with mock.patch.object(timezone, "now", return_value=now):
            # date is past, video is no longer in scheduled mode
            self.assertFalse(video.is_scheduled)
            self.assertEqual(video.live_state, IDLE)

            request = self.factory.post(
                "/", data, HTTP_REFERER="https://example.com/route"
            )
            lti = LTI(request, video.pk)
            lti.verify()
            self.assertIsNone(get_or_create_resource(models.Video, lti))

            # No new playlist or resource are created
            self.assertEqual(models.Playlist.objects.count(), 1)
            self.assertEqual(models.Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_playlist_not_portable_student(self, mock_verify):
        """Above case 1-3-2-2 for Document.

        No document is returned to a student trying to access a document that is existing in
        another playlist but not portable to another playlist, even if it is ready.
        """
        self._test_lti_get_resource_other_playlist_not_portable_student(
            factories.DocumentFactory,
            models.Document,
            {
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
            },
        )

    def _test_lti_get_resource_other_pl_site_portable_ready_to_show(
        self, factory, model, factory_parameters
    ):
        """Above case 1-4-1-1-1.

        The existing resource should be returned if a student or instructor tries to retrieve a
        resource that is ready but in another playlist on another consumer site if it is marked as
        portable to another playlist AND to another consumer site.
        """
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )
        resource = factory(
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=True,
            **factory_parameters,
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
        self.assertEqual(models.Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_site_portable_ready_to_show(self, mock_verify):
        """Above case 1-4-1-1-1 for Video.

        The existing video should be returned if a student or instructor tries to retrieve a
        video that is ready but in another playlist on another consumer site if it is marked as
        portable to another playlist AND to another consumer site.
        """
        self._test_lti_get_resource_other_pl_site_portable_ready_to_show(
            factories.VideoFactory,
            models.Video,
            {
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
                "uploaded_on": "2019-09-24 07:24:40+00",
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_live_other_pl_site_portable_ready_to_show(self, mock_verify):
        """Above case 1-4-1-1-1 for video live.

        The existing video should be returned if a student or instructor tries to retrieve a
        video live that is running but in another playlist on another consumer site if it is
        marked as portable to another playlist AND to another consumer site.
        """
        self._test_lti_get_resource_other_pl_site_portable_ready_to_show(
            factories.VideoFactory,
            models.Video,
            {
                "live_state": random.choice([lc[0] for lc in LIVE_CHOICES]),
                "live_type": RAW,
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_other_pl_site_portable_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-4-1-1-1 for video scheduled.

        The existing video should be returned if a student or instructor tries to retrieve a
        video that is scheduled but in another playlist on another consumer site if it is
        marked as portable to another playlist AND to another consumer site.
        """
        self._test_lti_get_resource_other_pl_site_portable_ready_to_show(
            factories.VideoFactory,
            models.Video,
            {
                "live_state": IDLE,
                "live_type": RAW,
                "starting_at": timezone.now() + timedelta(hours=1),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_past_other_pl_site_portable_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-4-1-1-1 for video scheduled with a date past and live_state to IDLE.

        The existing video should be returned if a student or instructor tries to retrieve a
        video that is scheduled but in another playlist on another consumer site if it is
        marked as portable to another playlist AND to another consumer site.
        """
        initial_starting_at = timezone.now() + timedelta(days=2)
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )
        video = factories.VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=True,
            starting_at=initial_starting_at,
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": "another-playlist",
            "roles": random.choice(["Student", "Instructor"]),
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        now = initial_starting_at + timedelta(days=10)
        with mock.patch.object(timezone, "now", return_value=now):
            # date is past, video is no longer in scheduled mode
            self.assertFalse(video.is_scheduled)
            self.assertEqual(video.live_state, IDLE)
            request = self.factory.post(
                "/", data, HTTP_REFERER="https://example.com/route"
            )
            lti = LTI(request, video.pk)
            lti.verify()
            retrieved_resource = get_or_create_resource(models.Video, lti)
            self.assertIsInstance(retrieved_resource, models.Video)
            self.assertEqual(retrieved_resource, video)

            # No new playlist or resource are created
            self.assertEqual(models.Playlist.objects.count(), 1)
            self.assertEqual(models.Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_pl_site_portable_ready_to_show(self, mock_verify):
        """Above case 1-4-1-1-1 for Document.

        The existing document should be returned if a student or instructor tries to retrieve a
        document that is ready but in another playlist on another consumer site if it is marked as
        portable to another playlist AND to another consumer site.
        """
        self._test_lti_get_resource_other_pl_site_portable_ready_to_show(
            factories.DocumentFactory,
            models.Document,
            {
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
                "uploaded_on": "2019-09-24 07:24:40+00",
            },
        )

    def _test_lti_get_resource_other_pl_site_portable_not_ready_to_show_instructor(
        self, factory, model, factory_parameters
    ):
        """Above case 1-4-1-1-2-1.

        The resource should be returned if an instructor tries to retrieve a resource that is
        already existing in a playlist on another consumer site but not ready, and if it is
        portable to another playlist AND to another consumer site.
        """
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )
        resource = factory(
            id="77fbf317-3e99-41bd-819c-130531313139",
            playlist__lti_id="a-playlist",
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=True,
            **factory_parameters,
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
        retrieved_resource = get_or_create_resource(model, lti)
        self.assertIsInstance(retrieved_resource, model)
        self.assertEqual(retrieved_resource, resource)

        # No new playlist or resource are created
        self.assertEqual(models.Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_site_portable_not_ready_to_show_instructor(
        self, mock_verify
    ):
        """Above case 1-4-1-1-2-1 for Video.

        The resource should be returned if an instructor tries to retrieve a resource that is
        already existing in a playlist on another consumer site but not ready, and if it is
        portable to another playlist AND to another consumer site.
        """
        self._test_lti_get_resource_other_pl_site_portable_not_ready_to_show_instructor(
            factories.VideoFactory,
            models.Video,
            {
                "upload_state": random.choice(
                    [s[0] for s in STATE_CHOICES if s[0] != "ready"]
                ),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_pl_site_portable_not_ready_to_show_instructor(
        self, mock_verify
    ):
        """Above case 1-4-1-1-2-1 for Document.

        The resource should be returned if an instructor tries to retrieve a resource that is
        already existing in a playlist on another consumer site but not ready, and if it is
        portable to another playlist AND to another consumer site.
        """
        self._test_lti_get_resource_other_pl_site_portable_not_ready_to_show_instructor(
            factories.DocumentFactory,
            models.Document,
            {
                "upload_state": random.choice(
                    [s[0] for s in STATE_CHOICES if s[0] != "ready"]
                ),
            },
        )

    def _test_lti_get_resource_other_pl_site_portable_not_ready_to_show_student(
        self, factory, model, factory_parameters
    ):
        """Above case 1-4-1-1-2-2.

        No resource is returned to a student trying to access a resource that is existing
        in another playlist for another consumer site but not ready, even if it is portable
        to another playlist AND to another consumer site.
        """
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )
        resource = factory(
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=True,
            **factory_parameters,
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
        self.assertEqual(models.Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_site_portable_not_ready_to_show_student(
        self, mock_verify
    ):
        """Above case 1-4-1-1-2-2 for Video.

        No video is returned to a student trying to access a video that is existing in another
        playlist for another consumer site but not ready, even if it is portable to another
        playlist AND to another consumer site.
        """
        self._test_lti_get_resource_other_pl_site_portable_not_ready_to_show_student(
            factories.VideoFactory,
            models.Video,
            {
                "upload_state": random.choice(
                    [s[0] for s in STATE_CHOICES if s[0] != "ready"]
                ),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_pl_site_portable_not_ready_to_show_student(
        self, mock_verify
    ):
        """Above case 1-4-1-1-2-2 for Document.

        No document is returned to a student trying to access a document that is existing in
        another playlist for another consumer site but not ready, even if it is portable to another
        playlist AND to another consumer site.
        """
        self._test_lti_get_resource_other_pl_site_portable_not_ready_to_show_student(
            factories.DocumentFactory,
            models.Document,
            {
                "upload_state": random.choice(
                    [s[0] for s in STATE_CHOICES if s[0] != "ready"]
                ),
            },
        )

    def _test_lti_get_resource_other_pl_site_auto_portable_ready_to_show(
        self, factory, model, factory_parameters
    ):
        """Above case 1-4-1-2-1.

        Same as 1-4-1-1-1 but portability is automatic from the site of the resource to the site
        of the passport.
        """
        consumer_site = factories.ConsumerSiteFactory(domain="example.com")
        passport = factories.ConsumerSiteLTIPassportFactory(consumer_site=consumer_site)
        resource = factory(
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=False,
            **factory_parameters,
        )
        # Add automatic portability from the site of the video to the site of the passport
        models.ConsumerSitePortability.objects.create(
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
        self.assertEqual(models.Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_site_auto_portable_ready_to_show(self, mock_verify):
        """Above case 1-4-1-2-1 for Video.

        Same as 1-4-1-1-1 but portability is automatic from the site of the video to the site
        of the passport.
        """
        self._test_lti_get_resource_other_pl_site_auto_portable_ready_to_show(
            factories.VideoFactory,
            models.Video,
            {
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
                "uploaded_on": "2019-09-24 07:24:40+00",
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_live_other_pl_site_auto_portable_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-4-1-2-1 for Video.

        Same as 1-4-1-1-1 but portability is automatic from the site of the video to the site
        of the passport.
        """
        self._test_lti_get_resource_other_pl_site_auto_portable_ready_to_show(
            factories.VideoFactory,
            models.Video,
            {
                "live_state": random.choice([lc[0] for lc in LIVE_CHOICES]),
                "live_type": RAW,
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_other_pl_site_auto_portable_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-4-1-2-1 for scheduled Video.

        Same as 1-4-1-1-1 but portability is automatic from the site of the video to the site
        of the passport.
        """
        self._test_lti_get_resource_other_pl_site_auto_portable_ready_to_show(
            factories.VideoFactory,
            models.Video,
            {
                "live_state": IDLE,
                "live_type": RAW,
                "starting_at": timezone.now() + timedelta(hours=1),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_past_other_pl_site_auto_portable_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-4-1-2-1 for scheduled Video with a date past and live_state to IDLE.

        Same as 1-4-1-1-1 but portability is automatic from the site of the video to the site
        of the passport.
        """
        initial_starting_at = timezone.now() + timedelta(days=2)
        consumer_site = factories.ConsumerSiteFactory(domain="example.com")
        passport = factories.ConsumerSiteLTIPassportFactory(consumer_site=consumer_site)
        video = factories.VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=False,
            starting_at=initial_starting_at,
        )
        # Add automatic portability from the site of the video to the site of the passport
        models.ConsumerSitePortability.objects.create(
            source_site=video.playlist.consumer_site, target_site=consumer_site
        )

        data = {
            "resource_link_id": video.lti_id,
            "context_id": "another-playlist",
            "roles": random.choice(["Student", "Instructor"]),
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        now = initial_starting_at + timedelta(days=10)
        with mock.patch.object(timezone, "now", return_value=now):
            # date is past, video is no longer in scheduled mode
            self.assertFalse(video.is_scheduled)
            self.assertEqual(video.live_state, IDLE)

            request = self.factory.post(
                "/", data, HTTP_REFERER="https://example.com/route"
            )
            lti = LTI(request, video.pk)
            lti.verify()
            retrieved_resource = get_or_create_resource(models.Video, lti)
            self.assertIsInstance(retrieved_resource, models.Video)
            self.assertEqual(retrieved_resource, video)

            # No new playlist or resource are created
            self.assertEqual(models.Playlist.objects.count(), 1)
            self.assertEqual(models.Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_pl_site_auto_portable_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-4-1-2-1 for Document.

        Same as 1-4-1-1-1 but portability is automatic from the site of the document to the site
        of the passport.
        """
        self._test_lti_get_resource_other_pl_site_auto_portable_ready_to_show(
            factories.DocumentFactory,
            models.Document,
            {
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
                "uploaded_on": "2019-09-24 07:24:40+00",
            },
        )

    def _test_lti_get_resource_other_pl_site_auto_portable_not_ready_to_show_instructor(
        self, factory, model, factory_parameters
    ):
        """Above case 1-4-1-2-2-1.

        Same as 1-4-1-1-2-1 but portability is automatic from the site of the resource to the site
        of the passport.
        """
        consumer_site = factories.ConsumerSiteFactory(domain="example.com")
        passport = factories.ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site=consumer_site
        )
        resource = factory(
            id="77fbf317-3e99-41bd-819c-130531313139",
            lti_id="df7",
            playlist__lti_id="a-playlist",
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=False,
            **factory_parameters,
        )
        # Add automatic portability from the site of the video to the site of the passport
        models.ConsumerSitePortability.objects.create(
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
        retrieved_resource = get_or_create_resource(model, lti)
        self.assertIsInstance(retrieved_resource, model)
        self.assertEqual(retrieved_resource, resource)

        # No new playlist or resource are created
        self.assertEqual(models.Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_site_auto_portable_not_ready_to_show_instructor(
        self, mock_verify
    ):
        """Above case 1-4-1-2-2-1 for Video.

        Same as 1-4-1-1-2-1 but portability is automatic from the site of the video to the site
        of the passport.
        """
        self._test_lti_get_resource_other_pl_site_auto_portable_not_ready_to_show_instructor(
            factories.VideoFactory,
            models.Video,
            {
                "upload_state": random.choice(
                    [s[0] for s in STATE_CHOICES if s[0] != "ready"]
                ),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_pl_site_auto_portable_not_ready_to_show_instructor(
        self, mock_verify
    ):
        """Above case 1-4-1-2-2-1 for Document.

        Same as 1-4-1-1-2-1 but portability is automatic from the site of the document to the site
        of the passport.
        """
        self._test_lti_get_resource_other_pl_site_auto_portable_not_ready_to_show_instructor(
            factories.DocumentFactory,
            models.Document,
            {
                "upload_state": random.choice(
                    [s[0] for s in STATE_CHOICES if s[0] != "ready"]
                ),
            },
        )

    def _test_lti_get_resource_other_pl_site_auto_portable_not_ready_to_show_student(
        self, factory, model, factory_parameters
    ):
        """Above case 1-4-1-2-2-2.

        Same as 1-4-1-1-2-2 but portability is automatic from the site of the resource to the site
        of the passport.
        """
        consumer_site = factories.ConsumerSiteFactory(domain="example.com")
        passport = factories.ConsumerSiteLTIPassportFactory(consumer_site=consumer_site)
        resource = factory(
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=False,
            **factory_parameters,
        )
        # Add automatic portability from the site of the resource to the site of the passport
        models.ConsumerSitePortability.objects.create(
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
        self.assertEqual(models.Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_site_auto_portable_not_ready_to_show_student(
        self, mock_verify
    ):
        """Above case 1-4-1-2-2-2 for Video.

        Same as 1-4-1-1-2-2 but portability is automatic from the site of the video to the site
        of the passport.
        """
        self._test_lti_get_resource_other_pl_site_auto_portable_not_ready_to_show_student(
            factories.VideoFactory,
            models.Video,
            {
                "upload_state": random.choice(
                    [s[0] for s in STATE_CHOICES if s[0] != "ready"]
                ),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_pl_site_auto_portable_not_ready_to_show_student(
        self, mock_verify
    ):
        """Above case 1-4-1-2-2-2 for Document.

        Same as 1-4-1-1-2-2 but portability is automatic from the site of the document to the site
        of the passport.
        """
        self._test_lti_get_resource_other_pl_site_auto_portable_not_ready_to_show_student(
            factories.DocumentFactory,
            models.Document,
            {
                "upload_state": random.choice(
                    [s[0] for s in STATE_CHOICES if s[0] != "ready"]
                ),
            },
        )

    def _test_lti_get_resource_other_pl_pl_auto_portable_ready_to_show(
        self, factory, model, factory_parameters
    ):
        """Above case 1-4-1-3-1.

        Same as 1-4-1-1-1 but portability is automatic from the playlist of the resource to the
        requested playlist.
        """
        playlist = factories.PlaylistFactory(consumer_site__domain="example.com")
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site=playlist.consumer_site
        )
        resource = factory(
            playlist__is_portable_to_playlist=False,
            playlist__is_portable_to_consumer_site=False,
            **factory_parameters,
        )
        # Add automatic portability from the playlist of the video to the requested playlist
        models.PlaylistPortability.objects.create(
            source_playlist=resource.playlist, target_playlist=playlist
        )

        data = {
            "resource_link_id": resource.lti_id,
            "context_id": playlist.lti_id,
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
        self.assertEqual(models.Playlist.objects.count(), 2)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_pl_auto_portable_ready_to_show(self, mock_verify):
        """Above case 1-4-1-3-1 for Video.

        Same as 1-4-1-1-1 but portability is automatic from the playlist of the video to the
        requested playlist.
        """
        self._test_lti_get_resource_other_pl_pl_auto_portable_ready_to_show(
            factories.VideoFactory,
            models.Video,
            {
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
                "uploaded_on": "2019-09-24 07:24:40+00",
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_live_other_pl_pl_auto_portable_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-4-1-3-1 for Video.

        Same as 1-4-1-1-1 but portability is automatic from the playlist of the video to the
        requested playlist.
        """
        self._test_lti_get_resource_other_pl_pl_auto_portable_ready_to_show(
            factories.VideoFactory,
            models.Video,
            {
                "live_state": random.choice([lc[0] for lc in LIVE_CHOICES]),
                "live_type": RAW,
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_other_pl_pl_auto_portable_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-4-1-3-1 for Video scheduled.

        Same as 1-4-1-1-1 but portability is automatic from the playlist of the video to the
        requested playlist.
        """
        self._test_lti_get_resource_other_pl_pl_auto_portable_ready_to_show(
            factories.VideoFactory,
            models.Video,
            {
                "live_state": IDLE,
                "live_type": RAW,
                "starting_at": timezone.now() + timedelta(hours=1),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_past_other_pl_pl_auto_portable_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-4-1-3-1 for Video scheduled with a date past and live_state to IDLE.

        Same as 1-4-1-1-1 but portability is automatic from the playlist of the video to the
        requested playlist.
        """
        initial_starting_at = timezone.now() + timedelta(days=2)
        playlist = factories.PlaylistFactory(consumer_site__domain="example.com")
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site=playlist.consumer_site
        )
        video = factories.VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            playlist__is_portable_to_playlist=False,
            playlist__is_portable_to_consumer_site=False,
            starting_at=initial_starting_at,
        )
        # Add automatic portability from the playlist of the video to the requested playlist
        models.PlaylistPortability.objects.create(
            source_playlist=video.playlist, target_playlist=playlist
        )

        data = {
            "resource_link_id": video.lti_id,
            "context_id": playlist.lti_id,
            "roles": random.choice(["Student", "Instructor"]),
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        now = initial_starting_at + timedelta(days=10)
        with mock.patch.object(timezone, "now", return_value=now):
            # date is past, video is no longer in scheduled mode
            self.assertFalse(video.is_scheduled)
            self.assertEqual(video.live_state, IDLE)
            request = self.factory.post(
                "/", data, HTTP_REFERER="https://example.com/route"
            )
            lti = LTI(request, video.pk)
            lti.verify()
            retrieved_resource = get_or_create_resource(models.Video, lti)
            self.assertIsInstance(retrieved_resource, models.Video)
            self.assertEqual(retrieved_resource, video)

            # No new playlist or resource are created
            self.assertEqual(models.Playlist.objects.count(), 2)
            self.assertEqual(models.Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_pl_pl_auto_portable_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-4-1-3-1 for Document.

        Same as 1-4-1-1-1 but portability is automatic from the playlist of the document to the
        requested playlist.
        """
        self._test_lti_get_resource_other_pl_pl_auto_portable_ready_to_show(
            factories.DocumentFactory,
            models.Document,
            {
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
                "uploaded_on": "2019-09-24 07:24:40+00",
            },
        )

    def _test_lti_get_resource_other_pl_pl_auto_portable_not_ready_to_show_instructor(
        self, factory, model, factory_parameters
    ):
        """Above case 1-4-1-3-2-1.

        Same as 1-4-1-1-2-1 but portability is automatic from the playlist of the resource to the
        requested playlist.
        """
        playlist = factories.PlaylistFactory(consumer_site__domain="example.com")
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site=playlist.consumer_site
        )
        resource = factory(
            id="77fbf317-3e99-41bd-819c-130531313139",
            lti_id="df7",
            playlist__lti_id="a-playlist",
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=False,
            **factory_parameters,
        )
        # Add automatic portability from the playlist of the video to the requested playlist
        models.PlaylistPortability.objects.create(
            source_playlist=resource.playlist, target_playlist=playlist
        )

        data = {
            "resource_link_id": resource.lti_id,
            "context_id": playlist.lti_id,
            "roles": "Instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, resource.pk)
        lti.verify()
        retrieved_resource = get_or_create_resource(model, lti)
        self.assertIsInstance(retrieved_resource, model)
        self.assertEqual(retrieved_resource, resource)

        # No new playlist or resource are created
        self.assertEqual(models.Playlist.objects.count(), 2)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_pl_auto_portable_not_ready_to_show_instructor(
        self, mock_verify
    ):
        """Above case 1-4-1-3-2-1 for Video.

        Same as 1-4-1-1-2-1 but portability is automatic from the site of the video to the site
        of the passport.
        """
        self._test_lti_get_resource_other_pl_pl_auto_portable_not_ready_to_show_instructor(
            factories.VideoFactory,
            models.Video,
            {
                "upload_state": random.choice(
                    [s[0] for s in STATE_CHOICES if s[0] != "ready"]
                ),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_pl_pl_auto_portable_not_ready_to_show_instructor(
        self, mock_verify
    ):
        """Above case 1-4-1-3-2-1 for Document.

        Same as 1-4-1-1-2-1 but portability is automatic from the site of the document to the site
        of the passport.
        """
        self._test_lti_get_resource_other_pl_pl_auto_portable_not_ready_to_show_instructor(
            factories.DocumentFactory,
            models.Document,
            {
                "upload_state": random.choice(
                    [s[0] for s in STATE_CHOICES if s[0] != "ready"]
                ),
            },
        )

    def _test_lti_get_resource_other_pl_pl_auto_portable_not_ready_to_show_student(
        self, factory, model, factory_parameters
    ):
        """Above case 1-4-1-3-2-2.

        Same as 1-4-1-1-2-2 but portability is automatic from the site of the resource to the site
        of the passport.
        """
        playlist = factories.PlaylistFactory(consumer_site__domain="example.com")
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site=playlist.consumer_site
        )
        resource = factory(
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=False,
            **factory_parameters,
        )
        # Add automatic portability from the playlist of the video to the requested playlist
        models.PlaylistPortability.objects.create(
            source_playlist=resource.playlist, target_playlist=playlist
        )

        data = {
            "resource_link_id": resource.lti_id,
            "context_id": playlist.lti_id,
            "roles": "Student",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, resource.pk)
        lti.verify()
        self.assertIsNone(get_or_create_resource(model, lti))

        # No new playlist or resource are created
        self.assertEqual(models.Playlist.objects.count(), 2)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_pl_auto_portable_not_ready_to_show_student(
        self, mock_verify
    ):
        """Above case 1-4-1-3-2-2 for Video.

        Same as 1-4-1-1-2-2 but portability is automatic from the site of the video to the site
        of the passport.
        """
        self._test_lti_get_resource_other_pl_pl_auto_portable_not_ready_to_show_student(
            factories.VideoFactory,
            models.Video,
            {
                "upload_state": random.choice(
                    [s[0] for s in STATE_CHOICES if s[0] != "ready"]
                ),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_pl_pl_auto_portable_not_ready_to_show_student(
        self, mock_verify
    ):
        """Above case 1-4-1-3-2-2 for Document.

        Same as 1-4-1-1-2-2 but portability is automatic from the site of the document to the site
        of the passport.
        """
        self._test_lti_get_resource_other_pl_pl_auto_portable_not_ready_to_show_student(
            factories.DocumentFactory,
            models.Document,
            {
                "upload_state": random.choice(
                    [s[0] for s in STATE_CHOICES if s[0] != "ready"]
                ),
            },
        )

    def _test_lti_get_resource_other_pl_site_not_portable_instructor(
        self, factory, model, factory_parameters
    ):
        """Above cases 1-4-1-4-1 and 1-4-2-1.

        A PortabilityError should be raised if an instructor tries to retrieve a resource already
        existing in a playlist and another consumer site but not portable either to another
        playlist or to another consumer site, even if it is ready.
        """
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )
        resource = factory(
            id="77fbf317-3e99-41bd-819c-130531313139",
            playlist__lti_id="a-playlist",
            playlist__is_portable_to_playlist=False,
            playlist__is_portable_to_consumer_site=False,
            **factory_parameters,
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
                f"The {model.__name__} ID 77fbf317-3e99-41bd-819c-130531313139 already exists but "
                "is not portable to your playlist (another-playlist) and/or consumer site "
                "(example.com)."
            ),
        )
        # No new playlist or resource are created
        self.assertEqual(models.Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_site_not_portable_instructor(self, mock_verify):
        """Above cases 1-4-1-4-1 and 1-4-2-1 for Video.

        A PortabilityError should be raised if an instructor tries to retrieve a video already
        existing in a playlist and another consumer site but not portable either to another
        playlist or to another consumer site, even if it is ready.
        """
        self._test_lti_get_resource_other_pl_site_not_portable_instructor(
            factories.VideoFactory,
            models.Video,
            {
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
                "uploaded_on": timezone.now(),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_live_other_pl_site_not_portable_instructor(
        self, mock_verify
    ):
        """Above cases 1-4-1-4-1 and 1-4-2-1 for Video.

        A PortabilityError should be raised if an instructor tries to retrieve a video already
        existing in a playlist and another consumer site but not portable either to another
        playlist or to another consumer site, even if it is running.
        """
        self._test_lti_get_resource_other_pl_site_not_portable_instructor(
            factories.VideoFactory,
            models.Video,
            {"live_state": RUNNING, "live_type": RAW},
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_other_pl_site_not_portable_instructor(
        self, mock_verify
    ):
        """Above cases 1-4-1-4-1 and 1-4-2-1 for Video scheduled.

        A PortabilityError should be raised if an instructor tries to retrieve a video already
        existing in a playlist and another consumer site but not portable either to another
        playlist or to another consumer site, even if it is scheduled.
        """
        self._test_lti_get_resource_other_pl_site_not_portable_instructor(
            factories.VideoFactory,
            models.Video,
            {
                "live_state": IDLE,
                "live_type": RAW,
                "starting_at": timezone.now() + timedelta(hours=1),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_past_other_pl_site_not_portable_instructor(
        self, mock_verify
    ):
        """Above cases 1-4-1-4-1 and 1-4-2-1 for Video scheduled with a date past and IDLE state.

        A PortabilityError should be raised if an instructor tries to retrieve a video already
        existing in a playlist and another consumer site but not portable either to another
        playlist or to another consumer site, even if it is scheduled with a date past and
        live_state to IDLE.
        """
        initial_starting_at = timezone.now() + timedelta(hours=1)
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )
        video = factories.VideoFactory(
            id="77fbf317-3e99-41bd-819c-130531313139",
            live_state=IDLE,
            live_type=RAW,
            playlist__lti_id="a-playlist",
            playlist__is_portable_to_playlist=False,
            playlist__is_portable_to_consumer_site=False,
            starting_at=initial_starting_at,
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": "another-playlist",
            "roles": "Instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        # now is set after video.starting_at
        now = initial_starting_at + timedelta(days=10)
        with mock.patch.object(timezone, "now", return_value=now):
            # date is past, video is no longer in scheduled mode
            self.assertFalse(video.is_scheduled)
            self.assertEqual(video.live_state, IDLE)
            request = self.factory.post(
                "/", data, HTTP_REFERER="https://example.com/route"
            )
            lti = LTI(request, video.pk)
            lti.verify()
            with self.assertRaises(PortabilityError) as context:
                get_or_create_resource(models.Video, lti)
            self.assertEqual(
                context.exception.args[0],
                (
                    f"The {models.Video.__name__} ID 77fbf317-3e99-41bd-819c-130531313139 already "
                    "exists but is not portable to your playlist (another-playlist) and/or "
                    "consumer site (example.com)."
                ),
            )
            # No new playlist or resource are created
            self.assertEqual(models.Playlist.objects.count(), 1)
            self.assertEqual(models.Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_pl_site_not_portable_instructor(self, mock_verify):
        """Above cases 1-4-1-4-1 and 1-4-2-1 for Document.

        A PortabilityError should be raised if an instructor tries to retrieve a document already
        existing in a playlist and another consumer site but not portable either to another
        playlist or to another consumer site, even if it is ready.
        """
        self._test_lti_get_resource_other_pl_site_not_portable_instructor(
            factories.DocumentFactory,
            models.Document,
            {
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
                "uploaded_on": timezone.now(),
            },
        )

    def _test_lti_get_resource_other_pl_site_not_portable_student(
        self, factory, model, factory_parameters
    ):
        """Above case 1-4-1-4-2 and 1-4-2-2.

        No resource is returned to a student trying to access a resource that is existing
        in another playlist on another consumer site but not portable either to another playlist
        or to another consumer site, even if it is ready.
        """
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )

        resource = factory(
            playlist__is_portable_to_playlist=False,
            playlist__is_portable_to_consumer_site=False,
            **factory_parameters,
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
        self.assertEqual(models.Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_site_not_portable_student(self, mock_verify):
        """Above case 1-4-1-4-2 and 1-4-2-2 for Video.

        No video is returned to a student trying to access a video that is existing in another
        playlist on another consumer site but not portable either to another playlist or to
        another consumer site, even if it is ready.
        """
        self._test_lti_get_resource_other_pl_site_not_portable_student(
            factories.VideoFactory,
            models.Video,
            {
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
                "uploaded_on": timezone.now(),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_live_other_pl_site_not_portable_student(self, mock_verify):
        """Above case 1-4-1-4-2 and 1-4-2-2 for Video.

        No video is returned to a student trying to access a video that is existing in another
        playlist on another consumer site but not portable either to another playlist or to
        another consumer site, even if it is ready.
        """
        self._test_lti_get_resource_other_pl_site_not_portable_student(
            factories.VideoFactory,
            models.Video,
            {"live_state": RUNNING, "live_type": RAW},
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_other_pl_site_not_portable_student(
        self, mock_verify
    ):
        """Above case 1-4-1-4-2 and 1-4-2-2 for Video scheduled.

        No video is returned to a student trying to access a video that is existing in another
        playlist on another consumer site but not portable either to another playlist or to
        another consumer site, even if it is scheduled.
        """
        self._test_lti_get_resource_other_pl_site_not_portable_student(
            factories.VideoFactory,
            models.Video,
            {
                "live_state": IDLE,
                "live_type": RAW,
                "starting_at": timezone.now() + timedelta(hours=1),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_past_other_pl_site_not_portable_student(
        self, mock_verify
    ):
        """Above case 1-4-1-4-2 and 1-4-2-2 for Video scheduled with a date past and IDLE state.

        No video is returned to a student trying to access a video that is existing in another
        playlist on another consumer site but not portable either to another playlist or to
        another consumer site, even if it is scheduled with a date past and live_state to IDLE.
        """
        initial_starting_at = timezone.now() + timedelta(days=2)
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )

        video = factories.VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            playlist__is_portable_to_playlist=False,
            playlist__is_portable_to_consumer_site=False,
            starting_at=initial_starting_at,
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": "another-playlist",
            "roles": "Student",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        # now is set after video.starting_at
        now = initial_starting_at + timedelta(days=10)
        with mock.patch.object(timezone, "now", return_value=now):
            # date is past, video is no longer in scheduled mode
            self.assertFalse(video.is_scheduled)
            self.assertEqual(video.live_state, IDLE)
            request = self.factory.post(
                "/", data, HTTP_REFERER="https://example.com/route"
            )
            lti = LTI(request, video.pk)
            lti.verify()
            self.assertIsNone(get_or_create_resource(models.Video, lti))

            # No new playlist or resource are created
            self.assertEqual(models.Playlist.objects.count(), 1)
            self.assertEqual(models.Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_other_pl_site_not_portable_student(self, mock_verify):
        """Above case 1-4-1-4-2 and 1-4-2-2 for Document.

        No document is returned to a student trying to access a document that is existing in
        another playlist on another consumer site but not portable either to another playlist or to
        another consumer site, even if it is ready.
        """
        self._test_lti_get_resource_other_pl_site_not_portable_student(
            factories.DocumentFactory,
            models.Document,
            {
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
                "uploaded_on": timezone.now(),
            },
        )

    def _test_lti_get_resource_wrong_lti_id_intructor(
        self, factory, model, factory_parameters
    ):
        """Above case 2-1.

        A new resource should be created and returned if an instructor tries to access an unknown
        resource for an existing playlist.
        """
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )
        resource = factory(
            playlist__consumer_site=passport.consumer_site, **factory_parameters
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
        self.assertEqual(models.Playlist.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_wrong_lti_id_intructor(self, mock_verify):
        """Above case 2-1 for Video.

        A new video should be created and returned if an instructor tries to access an unknown
        video for an existing playlist.
        """
        self._test_lti_get_resource_wrong_lti_id_intructor(
            factories.VideoFactory, models.Video, {"uploaded_on": timezone.now()}
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_live_wrong_lti_id_intructor(self, mock_verify):
        """Above case 2-1 for Video.

        A new video should be created and returned if an instructor tries to access an unknown
        video for an existing playlist.
        """
        self._test_lti_get_resource_wrong_lti_id_intructor(
            factories.VideoFactory,
            models.Video,
            {"live_state": "running", "live_type": RAW},
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_wrong_lti_id_intructor(self, mock_verify):
        """Above case 2-1 for Video scheduled.

        A new video should be created and returned if an instructor tries to access an unknown
        video for an existing playlist.
        """
        self._test_lti_get_resource_wrong_lti_id_intructor(
            factories.VideoFactory,
            models.Video,
            {
                "live_state": IDLE,
                "live_type": RAW,
                "starting_at": timezone.now() + timedelta(hours=1),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_scheduled_past_wrong_lti_id_intructor(self, mock_verify):
        """Above case 2-1 for Video scheduled with a date past and live_state to IDLE.

        A new video should be created and returned if an instructor tries to access an unknown
        video for an existing playlist.
        """
        initial_starting_at = timezone.now() + timedelta(days=2)
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )
        video = factories.VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            playlist__consumer_site=passport.consumer_site,
            starting_at=initial_starting_at,
        )
        data = {
            "resource_link_id": "new_lti_id",
            "context_id": video.playlist.lti_id,
            "roles": "Instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        now = initial_starting_at + timedelta(days=10)
        with mock.patch.object(timezone, "now", return_value=now):
            # date is past, video is no longer in scheduled mode
            self.assertFalse(video.is_scheduled)
            self.assertEqual(video.live_state, IDLE)
            request = self.factory.post(
                "/", data, HTTP_REFERER="https://example.com/route"
            )
            lti = LTI(request, uuid.uuid4())
            lti.verify()
            new_resource = get_or_create_resource(models.Video, lti)

            # A new resource is created
            self.assertEqual(models.Video.objects.count(), 2)
            self.assertIsInstance(new_resource, models.Video)
            self.assertEqual(
                new_resource, models.Video.objects.exclude(id=video.id).get()
            )
            self.assertEqual(new_resource.playlist, video.playlist)
            self.assertEqual(new_resource.upload_state, "pending")
            self.assertIsNone(new_resource.uploaded_on)
            self.assertEqual(new_resource.lti_id, "new_lti_id")

            # No new playlist is created
            self.assertEqual(models.Playlist.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_wrong_lti_id_intructor(self, mock_verify):
        """Above case 2-1 for Document.

        A new document should be created and returned if an instructor tries to access an unknown
        document for an existing playlist.
        """
        self._test_lti_get_resource_wrong_lti_id_intructor(
            factories.DocumentFactory, models.Document, {"uploaded_on": timezone.now()}
        )

    def _test_lti_get_resource_wrong_lti_id_student(self, factory, model):
        """Above case 2-2.

        The resource should not be retrieved if a student tries to access an unknown resource.
        """
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )
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
        self.assertEqual(models.Playlist.objects.count(), 1)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_wrong_lti_id_student(self, mock_verify):
        """Above case 2-2 for Video.

        The video should not be retrieved if a student tries to access an unknown video.
        """
        self._test_lti_get_resource_wrong_lti_id_student(
            factories.VideoFactory, models.Video
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_document_wrong_lti_id_student(self, mock_verify):
        """Above case 2-2 for Document.

        The document should not be retrieved if a student tries to access an unknown document.
        """
        self._test_lti_get_resource_wrong_lti_id_student(
            factories.DocumentFactory, models.Document
        )


class LTISelectTestCase(TestCase):
    """Test the availability of selectable resource between playlists and consumer sites.

    We need to test the content of selectable resource in a subset of
    PortabilityLTITestCase cases.

    Same case identifiers are used for convenience.
    """

    def setUp(self):
        """Override the setUp method to instanciate and serve a request factory."""
        super().setUp()
        self.factory = RequestFactory()

    def _test_lti_get_selectable_resource_same_playlist_same_site_student_ready_to_show(
        self, factory, model, factory_parameters
    ):
        """Above case 1-1-2 upload state ready.

        No content should be selectable by a student.
        """
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )
        resource = factory(
            playlist__consumer_site=passport.consumer_site,
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
            **factory_parameters,
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

        self.assertNotIn(resource, get_selectable_resources(model, lti))

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_selectable_video_same_playlist_same_site_student_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-1-2 upload state ready.

        A video that exists for the requested playlist and consumer site shouldn't be selectable
        by a student even if it is ready.
        """
        self._test_lti_get_selectable_resource_same_playlist_same_site_student_ready_to_show(
            factories.VideoFactory,
            models.Video,
            {
                "uploaded_on": "2019-09-24 07:24:40+00",
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_selectable_document_same_playlist_same_site_student_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-1-2 upload state ready.

        A document that exists for the requested playlist and consumer site shouldn't be selectable
        by a student even if it is ready.
        """
        self._test_lti_get_selectable_resource_same_playlist_same_site_student_ready_to_show(
            factories.DocumentFactory,
            models.Document,
            {
                "uploaded_on": "2019-09-24 07:24:40+00",
            },
        )

    def _test_lti_get_selectable_resource_same_playlist_same_site_instructor(
        self, factory, model, factory_parameters
    ):
        """Above case 1-1-1.

        A resource that exists for the requested playlist and consumer site should be selectable
        by an instructor whatever its upload state.
        """
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )
        resource = factory(
            playlist__consumer_site=passport.consumer_site,
            **factory_parameters,
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

        self.assertIn(resource, get_selectable_resources(model, lti))

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_selectable_video_same_playlist_same_site_instructor(
        self, mock_verify
    ):
        """Above case 1-1-1.

        A video that exists for the requested playlist and consumer site should be selectable
        by an instructor whatever its upload state.
        """
        self._test_lti_get_selectable_resource_same_playlist_same_site_instructor(
            factories.VideoFactory,
            models.Video,
            {
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_selectable_video_live_same_playlist_same_site_instructor(
        self, mock_verify
    ):
        """Above case 1-1-1.

        A video live that exists for the requested playlist and consumer site should be selectable
        by an instructor whatever its upload state.
        """
        self._test_lti_get_selectable_resource_same_playlist_same_site_instructor(
            factories.VideoFactory,
            models.Video,
            {
                "live_state": random.choice([s[0] for s in LIVE_CHOICES]),
                "live_type": RAW,
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_selectable_video_scheduled_same_playlist_same_site_instructor(
        self, mock_verify
    ):
        """Above case 1-1-1.

        A video scheduled that exists for the requested playlist and consumer site should be
        selectable by an instructor.
        """
        self._test_lti_get_selectable_resource_same_playlist_same_site_instructor(
            factories.VideoFactory,
            models.Video,
            {
                "live_state": IDLE,
                "live_type": RAW,
                "starting_at": timezone.now() + timedelta(hours=1),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_selectable_video_scheduled_past_same_playlist_same_site_instructor(
        self, mock_verify
    ):
        """Above case 1-1-1 for a scheduled video with a date past and live_state to IDLE.

        A video scheduled with a date past and live_state to IDLE that exists for the requested
        playlist and consumer site should be selectable by an instructor.
        """
        initial_starting_at = timezone.now() + timedelta(days=2)
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site__domain="example.com"
        )
        video = factories.VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            playlist__consumer_site=passport.consumer_site,
            starting_at=initial_starting_at,
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "Instructor",
            "tool_consumer_instance_guid": video.playlist.consumer_site.domain,
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        now = initial_starting_at + timedelta(days=10)
        with mock.patch.object(timezone, "now", return_value=now):
            # date is past, video is no longer in scheduled mode
            self.assertFalse(video.is_scheduled)
            self.assertEqual(video.live_state, IDLE)
            request = self.factory.post(
                "/", data, HTTP_REFERER="https://example.com/route"
            )
            lti = LTI(request, video.pk)
            lti.verify()

            self.assertIn(video, get_selectable_resources(models.Video, lti))

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_selectable_document_same_playlist_same_site_instructor(
        self, mock_verify
    ):
        """Above case 1-1-1.

        A document that exists for the requested playlist and consumer site should be selectable
        by an instructor whatever its upload state.
        """
        self._test_lti_get_selectable_resource_same_playlist_same_site_instructor(
            factories.DocumentFactory,
            models.Document,
            {
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
            },
        )

    def _test_lti_get_selectable_resource_other_pl_pl_auto_portable_ready_to_show(
        self, factory, model, factory_parameters
    ):
        """Above case 1-4-1-3-1.

        Same as 1-4-1-1-1 but portability is automatic from the playlist of the resource to the
        requested playlist.
        """
        playlist = factories.PlaylistFactory(consumer_site__domain="example.com")
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site=playlist.consumer_site
        )
        resource = factory(
            playlist__is_portable_to_playlist=False,
            playlist__is_portable_to_consumer_site=False,
            **factory_parameters,
        )
        # Add automatic portability from the playlist of the video to the requested playlist
        models.PlaylistPortability.objects.create(
            source_playlist=resource.playlist, target_playlist=playlist
        )

        data = {
            "resource_link_id": resource.lti_id,
            "context_id": playlist.lti_id,
            "roles": "Instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, resource.pk)
        lti.verify()

        self.assertIn(resource, get_selectable_resources(model, lti))

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_selectable_video_other_pl_pl_auto_portable_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-4-1-3-1 for Video.

        Same as 1-4-1-1-1 but portability is automatic from the playlist of the video to the
        requested playlist.
        """
        self._test_lti_get_selectable_resource_other_pl_pl_auto_portable_ready_to_show(
            factories.VideoFactory,
            models.Video,
            {
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
                "uploaded_on": "2019-09-24 07:24:40+00",
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_selectable_video_live_other_pl_pl_auto_portable_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-4-1-3-1 for Video live.

        Same as 1-4-1-1-1 but portability is automatic from the playlist of the video to the
        requested playlist.
        """
        self._test_lti_get_selectable_resource_other_pl_pl_auto_portable_ready_to_show(
            factories.VideoFactory,
            models.Video,
            {"live_state": "running", "live_type": RAW},
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_selectable_video_scheduled_other_pl_pl_auto_portable_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-4-1-3-1 for Video scheduled.

        Same as 1-4-1-1-1 but portability is automatic from the playlist of the video to the
        requested playlist.
        """
        self._test_lti_get_selectable_resource_other_pl_pl_auto_portable_ready_to_show(
            factories.VideoFactory,
            models.Video,
            {
                "live_state": IDLE,
                "live_type": RAW,
                "starting_at": timezone.now() + timedelta(hours=1),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_selectable_video_scheduled_past_other_pl_pl_auto_portable_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-4-1-3-1 for Video scheduled with a date past and live_state to IDLE.

        Same as 1-4-1-1-1 but portability is automatic from the playlist of the video to the
        requested playlist.
        """
        initial_starting_at = timezone.now() + timedelta(days=2)
        playlist = factories.PlaylistFactory(consumer_site__domain="example.com")
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site=playlist.consumer_site
        )
        video = factories.VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            playlist__is_portable_to_playlist=False,
            playlist__is_portable_to_consumer_site=False,
            starting_at=initial_starting_at,
        )
        # Add automatic portability from the playlist of the video to the requested playlist
        models.PlaylistPortability.objects.create(
            source_playlist=video.playlist, target_playlist=playlist
        )

        data = {
            "resource_link_id": video.lti_id,
            "context_id": playlist.lti_id,
            "roles": "Instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        # now is set after video.starting_at
        now = initial_starting_at + timedelta(days=10)
        with mock.patch.object(timezone, "now", return_value=now):
            # date is past, video is no longer in scheduled mode
            self.assertFalse(video.is_scheduled)
            self.assertEqual(video.live_state, IDLE)
            request = self.factory.post(
                "/", data, HTTP_REFERER="https://example.com/route"
            )
            lti = LTI(request, video.pk)
            lti.verify()

            self.assertIn(video, get_selectable_resources(models.Video, lti))

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_selectable_document_other_pl_pl_auto_portable_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-4-1-3-1 for Document.

        Same as 1-4-1-1-1 but portability is automatic from the playlist of the document to the
        requested playlist.
        """
        self._test_lti_get_selectable_resource_other_pl_pl_auto_portable_ready_to_show(
            factories.DocumentFactory,
            models.Document,
            {
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
                "uploaded_on": "2019-09-24 07:24:40+00",
            },
        )

    def _test_lti_get_selectable_resource_other_pl_pl_auto_portable_not_ready_to_show(
        self, factory, model, factory_parameters
    ):
        """Above case 1-4-1-3-2-1.

        Same as 1-4-1-1-2-1 but portability is automatic from the playlist of the resource to the
        requested playlist.
        """
        playlist = factories.PlaylistFactory(consumer_site__domain="example.com")
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site=playlist.consumer_site
        )
        resource = factory(
            id="77fbf317-3e99-41bd-819c-130531313139",
            lti_id="df7",
            playlist__lti_id="a-playlist",
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=False,
            **factory_parameters,
        )
        # Add automatic portability from the playlist of the video to the requested playlist
        models.PlaylistPortability.objects.create(
            source_playlist=resource.playlist, target_playlist=playlist
        )

        data = {
            "resource_link_id": resource.lti_id,
            "context_id": playlist.lti_id,
            "roles": "Instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, resource.pk)
        lti.verify()

        self.assertIn(resource, get_selectable_resources(model, lti))

        # No new playlist or resource are created
        self.assertEqual(models.Playlist.objects.count(), 2)
        self.assertEqual(model.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_selectable_video_other_pl_pl_auto_portable_not_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-4-1-3-2-1 for Video.

        Same as 1-4-1-1-2-1 but portability is automatic from the playlist of the video to the
        requested playlist.
        """
        self._test_lti_get_selectable_resource_other_pl_pl_auto_portable_not_ready_to_show(
            factories.VideoFactory,
            models.Video,
            {
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
                "uploaded_on": "2019-09-24 07:24:40+00",
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_selectable_video_live_other_pl_pl_auto_portable_not_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-4-1-3-2-1 for Video live.

        Same as 1-4-1-1-2-1 but portability is automatic from the playlist of the video to the
        requested playlist.
        """
        self._test_lti_get_selectable_resource_other_pl_pl_auto_portable_not_ready_to_show(
            factories.VideoFactory,
            models.Video,
            {"live_state": "running", "live_type": RAW},
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_selectable_video_scheduled_other_pl_pl_auto_portable_not_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-4-1-3-2-1 for Video scheduled.

        Same as 1-4-1-1-2-1 but portability is automatic from the playlist of the video to the
        requested playlist.
        """
        self._test_lti_get_selectable_resource_other_pl_pl_auto_portable_not_ready_to_show(
            factories.VideoFactory,
            models.Video,
            {
                "live_state": IDLE,
                "live_type": RAW,
                "starting_at": timezone.now() + timedelta(hours=1),
            },
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_selectable_video_scheduled_past_other_pl_pl_auto_portable_not_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-4-1-3-2-1 for Video scheduled with a date past and live_state to IDLE.

        Same as 1-4-1-1-2-1 but portability is automatic from the playlist of the video to the
        requested playlist.
        """
        initial_starting_at = timezone.now() + timedelta(days=2)
        playlist = factories.PlaylistFactory(consumer_site__domain="example.com")
        passport = factories.ConsumerSiteLTIPassportFactory(
            consumer_site=playlist.consumer_site
        )
        video = factories.VideoFactory(
            id="77fbf317-3e99-41bd-819c-130531313139",
            live_state=IDLE,
            live_type=RAW,
            lti_id="df7",
            playlist__lti_id="a-playlist",
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=False,
            starting_at=initial_starting_at,
        )
        # Add automatic portability from the playlist of the video to the requested playlist
        models.PlaylistPortability.objects.create(
            source_playlist=video.playlist, target_playlist=playlist
        )

        data = {
            "resource_link_id": video.lti_id,
            "context_id": playlist.lti_id,
            "roles": "Instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        # now is set after video.starting_at
        now = initial_starting_at + timedelta(days=10)
        with mock.patch.object(timezone, "now", return_value=now):
            # date is past, video is no longer in scheduled mode
            self.assertFalse(video.is_scheduled)
            self.assertEqual(video.live_state, IDLE)
            request = self.factory.post(
                "/", data, HTTP_REFERER="https://example.com/route"
            )
            lti = LTI(request, video.pk)
            lti.verify()

            self.assertIn(video, get_selectable_resources(models.Video, lti))

            # No new playlist or resource are created
            self.assertEqual(models.Playlist.objects.count(), 2)
            self.assertEqual(models.Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_selectable_document_other_pl_pl_auto_portable_not_ready_to_show(
        self, mock_verify
    ):
        """Above case 1-4-1-3-2-1 for Document.

        Same as 1-4-1-1-2-1 but portability is automatic from the playlist of the document to the
        requested playlist.
        """
        self._test_lti_get_selectable_resource_other_pl_pl_auto_portable_not_ready_to_show(
            factories.DocumentFactory,
            models.Document,
            {
                "upload_state": random.choice([s[0] for s in STATE_CHOICES]),
                "uploaded_on": "2019-09-24 07:24:40+00",
            },
        )


class GetResourceClosestOwnersAndPlaylist(TestCase):
    """Test the get_resource_closest_owners_and_playlist function."""

    def _create_resource(self, playlist=None):
        return factories.VideoFactory(playlist=playlist)

    def assertResultsExpected(self, resource, playlist, expected_users):
        """Assert the result of get_resource_closest_owners_and_playlist is as expected."""
        closest_owners, playlist_id = get_resource_closest_owners_and_playlist(
            resource.__class__,
            resource.pk,
        )

        self.assertEqual(playlist_id, playlist.pk)
        # Owners are not sorted so we compare sets
        self.assertSetEqual(
            set(closest_owners), set(user.pk for user in expected_users)
        )

    def test_playlist_has_no_owners(self):
        """A playlist without owners should return no owners."""
        playlist = factories.PlaylistFactory()
        resource = self._create_resource(playlist=playlist)

        self.assertResultsExpected(resource, playlist, [])

    def test_playlist_has_a_creator(self):
        """A playlist with a creator has this creator as its closest owner."""
        playlist_creator = factories.UserFactory()
        playlist = factories.PlaylistFactory(created_by=playlist_creator)
        resource = self._create_resource(playlist=playlist)

        self.assertResultsExpected(resource, playlist, [playlist_creator])

    def test_playlist_has_administrators(self):
        """A playlist with administrators has these administrators as its closest owners."""
        playlist = factories.PlaylistFactory()
        playlist_accesses = factories.PlaylistAccessFactory.create_batch(
            3, playlist=playlist, role=models.ADMINISTRATOR
        )
        factories.PlaylistAccessFactory(
            playlist=playlist,
            role=models.INSTRUCTOR,
        )
        resource = self._create_resource(playlist=playlist)

        self.assertResultsExpected(
            resource, playlist, [access.user for access in playlist_accesses]
        )

    def test_playlist_has_organization_administrators(self):
        """
        A playlist with organization administrators has these administrators as its closest owners.
        """
        organization = factories.OrganizationFactory()
        playlist = factories.PlaylistFactory(organization=organization)
        organization_accesses = factories.OrganizationAccessFactory.create_batch(
            3, organization=organization, role=models.ADMINISTRATOR
        )
        factories.OrganizationAccessFactory(
            organization=organization,
            role=models.INSTRUCTOR,
        )
        resource = self._create_resource(playlist=playlist)

        self.assertResultsExpected(
            resource, playlist, [access.user for access in organization_accesses]
        )

    def test_playlist_has_consumer_site_administrators(self):
        """
        A playlist with consumer site administrators has these administrators
        as its closest owners.
        """
        consumer_site = factories.ConsumerSiteFactory()
        playlist = factories.PlaylistFactory(consumer_site=consumer_site)
        consumer_site_accesses = factories.ConsumerSiteAccessFactory.create_batch(
            3, consumer_site=consumer_site, role=models.ADMINISTRATOR
        )
        factories.ConsumerSiteAccessFactory(
            consumer_site=consumer_site,
            role=models.INSTRUCTOR,
        )
        resource = self._create_resource(playlist=playlist)

        self.assertResultsExpected(
            resource, playlist, [access.user for access in consumer_site_accesses]
        )

    def test_playlist_has_administrators_and_organization_administrators(self):
        """
        A playlist with administrators and organization administrators has the first ones
        as its closest owners.
        """
        organization = factories.OrganizationFactory()
        playlist = factories.PlaylistFactory(organization=organization)
        playlist_access = factories.PlaylistAccessFactory(
            playlist=playlist,
            role=models.ADMINISTRATOR,
        )
        factories.OrganizationAccessFactory(
            organization=organization,
            role=models.ADMINISTRATOR,
        )
        factories.PlaylistAccessFactory(
            playlist=playlist,
            role=models.INSTRUCTOR,
        )
        factories.OrganizationAccessFactory(
            organization=organization,
            role=models.INSTRUCTOR,
        )
        resource = self._create_resource(playlist=playlist)

        self.assertResultsExpected(resource, playlist, [playlist_access.user])
