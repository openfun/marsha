"""Tests for the models in the ``core`` app of the Marsha project."""

from importlib import import_module
import uuid

from django.apps import apps
from django.db import connection
from django.test import TestCase

from marsha.core.factories import LiveSessionFactory


data_migration = import_module(
    "marsha.core.migrations.0052_migrate_livesession_liveattendance"
)


class LiveSessionModelsMigrationLiveAttendanceTestCase(TestCase):
    """Test livesession model's migration for the field live_attendance."""

    def test_migration_livesession_liveattendance(self):
        """Test the migration applied on field live_attendance from the
        model LiveSession"""

        # livesession with one good key, one key in milliseconds and one wrong key
        livesession_mixed = LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            live_attendance={
                "1657032736123": {"milliseconds": True, "well_formatted": False},
                "1657032745": {"well_formatted": True},
                "wrong_key": {"well_formatted": False},
            },
        )

        livesession_milliseconds = LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            live_attendance={
                "1657032736123": {"milliseconds": True, "well_formatted": False},
                "1657032745123": {"milliseconds": True, "well_formatted": False},
                "1657032768123": {"milliseconds": True, "well_formatted": False},
                "1657032778123": {"milliseconds": True, "well_formatted": False},
                "1657032788123": {"milliseconds": True, "well_formatted": False},
                "1657032798123": {"milliseconds": True, "well_formatted": False},
            },
        )

        livesession_empty = LiveSessionFactory(
            anonymous_id=uuid.uuid4(), live_attendance={}
        )

        livesession_none = LiveSessionFactory(
            anonymous_id=uuid.uuid4(), live_attendance=None
        )

        livesession_timestamps = LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            live_attendance={
                "1657032736": {"well_formatted": True},
                "1657032745": {"well_formatted": True},
                "1657032768": {"well_formatted": True},
            },
        )
        data_migration.migrate_live_attendance(apps, connection.schema_editor())

        livesession_mixed.refresh_from_db()
        livesession_empty.refresh_from_db()
        livesession_none.refresh_from_db()
        livesession_timestamps.refresh_from_db()
        livesession_milliseconds.refresh_from_db()

        # wrong key has been dropped and millisecond's one has been reformatted
        self.assertEqual(
            livesession_mixed.live_attendance,
            {
                "1657032736": {"milliseconds": True, "well_formatted": False},
                "1657032745": {"well_formatted": True},
            },
        )
        # all keys have been set in seconds
        self.assertEqual(
            livesession_milliseconds.live_attendance,
            {
                "1657032736": {"milliseconds": True, "well_formatted": False},
                "1657032745": {"milliseconds": True, "well_formatted": False},
                "1657032768": {"milliseconds": True, "well_formatted": False},
                "1657032778": {"milliseconds": True, "well_formatted": False},
                "1657032788": {"milliseconds": True, "well_formatted": False},
                "1657032798": {"milliseconds": True, "well_formatted": False},
            },
        )
        # nothing has changed
        self.assertEqual(livesession_empty.live_attendance, {})
        self.assertEqual(livesession_none.live_attendance, None)

        self.assertEqual(
            livesession_timestamps.live_attendance,
            {
                "1657032736": {"well_formatted": True},
                "1657032745": {"well_formatted": True},
                "1657032768": {"well_formatted": True},
            },
        )
