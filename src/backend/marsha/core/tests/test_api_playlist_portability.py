"""Tests for the Playlist API of the Marsha project."""

import json
from uuid import uuid4

from django.test import TestCase

from marsha.core import factories
from marsha.core.simple_jwt.factories import InstructorOrAdminLtiTokenFactory


class PlaylistPortabilityAPITest(TestCase):
    """Test the API for playlist portability."""

    def _jwt_token(self, playlist):
        """Build JWT token for a playlist with admin or instructor role."""
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=playlist)
        return jwt_token

    def _patch_video(self, video, params):
        """Send patch request for a video with admin or instructor role."""
        return self.client.patch(
            f"/api/playlists/{video.playlist_id}/",
            json.dumps(params),
            HTTP_AUTHORIZATION=f"Bearer {self._jwt_token(video.playlist)}",
            content_type="application/json",
        )

    def test_no_portability_no_portable_to(self):
        """
        Update playlist portability.

        No portability should be added for a playlist without existing portability
        when no portable_to param is sent.
        """
        video = factories.VideoFactory()

        with self.assertNumQueries(8):
            response = self._patch_video(video, {})

        self.assertEqual(response.status_code, 200)
        self.assertQuerySetEqual(video.playlist.portable_to.all(), [])

    def test_no_portability_empty_portable_to(self):
        """
        Update playlist portability.

        No portability should be added for a playlist without existing portability
        when portable_to param is empty.
        """
        video = factories.VideoFactory()

        with self.assertNumQueries(9):
            response = self._patch_video(video, {"portable_to": []})

        self.assertEqual(response.status_code, 200)
        self.assertQuerySetEqual(video.playlist.portable_to.all(), [])

    def test_no_portability_portable_to_new(self):
        """
        Update playlist portability.

        Portability should be added for a playlist without existing portability
        when portable_to param contains a playlist id.
        """
        video = factories.VideoFactory()
        new_playlist = factories.PlaylistFactory()

        with self.assertNumQueries(12):
            response = self._patch_video(video, {"portable_to": [str(new_playlist.id)]})

        self.assertEqual(response.status_code, 200)
        self.assertQuerySetEqual(video.playlist.portable_to.all(), [new_playlist])

    def test_no_portability_portable_to_invalid_uuid(self):
        """
        Update playlist portability.

        No portability should be added for a playlist without existing portability
        when portable_to param contains an invalid uuid.
        A 400 error should be raised when invalid uuid is sent.
        """
        video = factories.VideoFactory()

        response = self._patch_video(video, {"portable_to": ["invalid_uuid"]})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(), {"portable_to": "“invalid_uuid” is not a valid UUID."}
        )
        self.assertQuerySetEqual(video.playlist.portable_to.all(), [])

    def test_no_portability_portable_to_unknown(self):
        """
        Update playlist portability.

        No portability should be added for a playlist without existing portability
        when portable_to param contains an unknown playlist id.
        A 400 error should be raised when unknown playlist id is sent.
        """
        video = factories.VideoFactory()
        unknown_id = str(uuid4())

        response = self._patch_video(video, {"portable_to": [unknown_id]})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"portable_to": f"Some playlists don't exist: {unknown_id}."},
        )
        self.assertQuerySetEqual(video.playlist.portable_to.all(), [])

    def test_no_portability_portable_to_unknown_and_new(self):
        """
        Update playlist portability.

        Portability should be added for a playlist without existing portability
        when portable_to param contains an unknown playlist id and a playlist id.
        A 400 error should be raised when unknown playlist id is sent.
        """
        video = factories.VideoFactory()
        new_playlist = factories.PlaylistFactory()
        unknown_id = str(uuid4())

        response = self._patch_video(
            video, {"portable_to": [unknown_id, str(new_playlist.id)]}
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"portable_to": f"Some playlists don't exist: {unknown_id}."},
        )
        self.assertQuerySetEqual(video.playlist.portable_to.all(), [])

    def test_no_portability_portable_to_self(self):
        """
        Update playlist portability.

        No portability should be added for a playlist without existing portability
        when portable_to param contains self playlist id.
        A 400 error should be raised when self playlist id is sent.
        """
        video = factories.VideoFactory()

        response = self._patch_video(video, {"portable_to": [str(video.playlist_id)]})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(), {"portable_to": "Playlist is not portable to itself."}
        )
        self.assertQuerySetEqual(video.playlist.portable_to.all(), [])

    def test_no_portability_portable_to_multiple_self(self):
        """
        Update playlist portability.

        No portability should be added for a playlist without existing portability
        when portable_to param contains multiple self playlist id.
        A 400 error should be raised when self playlist id is sent.
        """
        video = factories.VideoFactory()

        response = self._patch_video(
            video, {"portable_to": [str(video.playlist_id), str(video.playlist_id)]}
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(), {"portable_to": "Playlist is not portable to itself."}
        )
        self.assertQuerySetEqual(video.playlist.portable_to.all(), [])

    def test_no_portability_portable_to_self_and_new(self):
        """
        Update playlist portability.

        Portability should be added for a playlist without existing portability
        when portable_to param contains self playlist id and a playlist id.
        A 400 error should be raised when self playlist id is sent.
        """
        video = factories.VideoFactory()
        new_playlist = factories.PlaylistFactory()

        response = self._patch_video(
            video, {"portable_to": [str(video.playlist_id), str(new_playlist.id)]}
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(), {"portable_to": "Playlist is not portable to itself."}
        )
        self.assertQuerySetEqual(video.playlist.portable_to.all(), [])

    def test_no_portability_portable_to_self_and_unknown(self):
        """
        Update playlist portability.

        No portability should be added for a playlist without existing portability
        when portable_to param contains self playlist id and an unknown playlist id.
        A 400 error should be raised when self or unknown playlist id is sent.
        """
        video = factories.VideoFactory()
        unknown_id = str(uuid4())

        response = self._patch_video(
            video, {"portable_to": [str(video.playlist_id), unknown_id]}
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(), {"portable_to": "Playlist is not portable to itself."}
        )
        self.assertQuerySetEqual(video.playlist.portable_to.all(), [])

    def test_no_portability_portable_to_self_new_and_unknown(self):
        """
        Update playlist portability.

        No portability should be added for a playlist without existing portability
        when portable_to param contains self playlist id and an unknown playlist id.
        A 400 error should be raised when self or unknown playlist id is sent.
        """
        video = factories.VideoFactory()
        new_playlist = factories.PlaylistFactory()
        unknown_id = str(uuid4())

        response = self._patch_video(
            video,
            {
                "portable_to": [
                    str(video.playlist_id),
                    str(new_playlist.id),
                    unknown_id,
                ]
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(), {"portable_to": "Playlist is not portable to itself."}
        )
        self.assertQuerySetEqual(video.playlist.portable_to.all(), [])

    def test_has_portability_no_portable_to(self):
        """
        Update playlist portability.

        No portability should be added nor removed for a playlist with an existing portability
        when no portable_to param is sent.
        """
        video = factories.VideoFactory()
        ported_to_playlist = factories.PlaylistFactory()
        video.playlist.portable_to.add(ported_to_playlist)

        with self.assertNumQueries(8):
            response = self._patch_video(video, {})

        self.assertEqual(response.status_code, 200)
        self.assertQuerySetEqual(video.playlist.portable_to.all(), [ported_to_playlist])

    def test_has_portability_empty_portable_to(self):
        """
        Update playlist portability.

        Portability should be removed for a playlist with an existing portability
        when portable_to param is empty.
        """
        video = factories.VideoFactory()
        ported_to_playlist = factories.PlaylistFactory()
        video.playlist.portable_to.add(ported_to_playlist)

        with self.assertNumQueries(11):
            response = self._patch_video(video, {"portable_to": []})

        self.assertEqual(response.status_code, 200)
        self.assertQuerySetEqual(video.playlist.portable_to.all(), [])

    def test_has_portability_portable_to_ported(self):
        """
        Update playlist portability.

        No portability should be added nor removed for a playlist with an existing portability
        when portable_to param contains a playlist id already set.
        """
        video = factories.VideoFactory()
        ported_to_playlist = factories.PlaylistFactory()
        video.playlist.portable_to.add(ported_to_playlist)

        with self.assertNumQueries(10):
            response = self._patch_video(
                video, {"portable_to": [str(ported_to_playlist.id)]}
            )

        self.assertEqual(response.status_code, 200)
        self.assertQuerySetEqual(video.playlist.portable_to.all(), [ported_to_playlist])

    def test_has_portability_portable_to_new(self):
        """
        Update playlist portability.

        Portability should be changed for a playlist with an existing portability
        when portable_to param contains a new playlist id.
        """
        video = factories.VideoFactory()
        ported_to_playlist = factories.PlaylistFactory()
        video.playlist.portable_to.add(ported_to_playlist)
        new_playlist = factories.PlaylistFactory()

        response = self._patch_video(video, {"portable_to": [str(new_playlist.id)]})

        self.assertEqual(response.status_code, 200)
        self.assertQuerySetEqual(video.playlist.portable_to.all(), [new_playlist])

    def test_has_portability_portable_to_unknown(self):
        """
        Update playlist portability.

        No portability should be changed for a playlist with an existing portability
        when portable_to param contains an unknown playlist id.
        A 400 error should be raised when unknown playlist id is sent.
        """
        video = factories.VideoFactory()
        ported_to_playlist = factories.PlaylistFactory()
        video.playlist.portable_to.add(ported_to_playlist)
        unknown_id = str(uuid4())

        response = self._patch_video(video, {"portable_to": [unknown_id]})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"portable_to": f"Some playlists don't exist: {unknown_id}."},
        )
        self.assertQuerySetEqual(video.playlist.portable_to.all(), [ported_to_playlist])

    def test_has_portability_portable_to_unknown_and_ported(self):
        """
        Update playlist portability.

        No portability should be changed for a playlist with an existing portability
        when portable_to param contains an unknown playlist id and a playlist id already set.
        A 400 error should be raised when unknown playlist id is sent.
        """
        video = factories.VideoFactory()
        ported_to_playlist = factories.PlaylistFactory()
        video.playlist.portable_to.add(ported_to_playlist)
        unknown_id = str(uuid4())

        response = self._patch_video(
            video, {"portable_to": [unknown_id, str(ported_to_playlist.id)]}
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"portable_to": f"Some playlists don't exist: {unknown_id}."},
        )
        self.assertQuerySetEqual(video.playlist.portable_to.all(), [ported_to_playlist])

    def test_has_portability_portable_to_new_and_ported(self):
        """
        Update playlist portability.

        Portability should be added for a playlist with an existing portability
        when portable_to param contains a new playlist id and already ported playlist id.
        """
        video = factories.VideoFactory()
        ported_to_playlist = factories.PlaylistFactory()
        video.playlist.portable_to.add(ported_to_playlist)
        new_playlist = factories.PlaylistFactory()

        response = self._patch_video(
            video, {"portable_to": [str(new_playlist.id), str(ported_to_playlist.id)]}
        )

        self.assertEqual(response.status_code, 200)
        self.assertQuerySetEqual(
            video.playlist.portable_to.all(),
            [new_playlist, ported_to_playlist],
            ordered=False,
        )

    def test_has_portability_portable_to_unknown_and_new(self):
        """
        Update playlist portability.

        No Portability should be changed for a playlist with an existing portability
        when portable_to param contains an unknown playlist id and a new playlist id.
        A 400 error should be raised when unknown playlist id is sent.
        """
        video = factories.VideoFactory()
        ported_to_playlist = factories.PlaylistFactory()
        video.playlist.portable_to.add(ported_to_playlist)
        new_playlist = factories.PlaylistFactory()
        unknown_id = str(uuid4())

        response = self._patch_video(
            video, {"portable_to": [unknown_id, str(new_playlist.id)]}
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"portable_to": f"Some playlists don't exist: {unknown_id}."},
        )
        self.assertQuerySetEqual(video.playlist.portable_to.all(), [ported_to_playlist])

    def test_has_portability_portable_to_unknown_ported_and_new(self):
        """
        Update playlist portability.

        No portability should be added for a playlist with an existing portability
        when portable_to param contains an unknown playlist id, a playlist id already set
        and a new playlist id.
        A 400 error should be raised when unknown playlist id is sent.
        """
        video = factories.VideoFactory()
        ported_to_playlist = factories.PlaylistFactory()
        video.playlist.portable_to.add(ported_to_playlist)
        new_playlist = factories.PlaylistFactory()
        unknown_id = str(uuid4())

        response = self._patch_video(
            video,
            {
                "portable_to": [
                    unknown_id,
                    str(ported_to_playlist.id),
                    str(new_playlist.id),
                ]
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"portable_to": f"Some playlists don't exist: {unknown_id}."},
        )
        self.assertQuerySetEqual(video.playlist.portable_to.all(), [ported_to_playlist])

    def test_has_portability_portable_to_unknown_self_ported_and_new(self):
        """
        Update playlist portability.

        Portability should be added for a playlist with an existing portability
        when portable_to param contains an unknown playlist id, self playlist id,
        a playlist id already set and a new playlist id.
        A 400 error should be raised when self or unknown playlist id is sent.
        """
        video = factories.VideoFactory()
        ported_to_playlist = factories.PlaylistFactory()
        video.playlist.portable_to.add(ported_to_playlist)
        new_playlist = factories.PlaylistFactory()
        unknown_id = str(uuid4())

        response = self._patch_video(
            video,
            {
                "portable_to": [
                    unknown_id,
                    str(video.playlist_id),
                    str(ported_to_playlist.id),
                    str(new_playlist.id),
                ]
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(), {"portable_to": "Playlist is not portable to itself."}
        )
        self.assertQuerySetEqual(video.playlist.portable_to.all(), [ported_to_playlist])
