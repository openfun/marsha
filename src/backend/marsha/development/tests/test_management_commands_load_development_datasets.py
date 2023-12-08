"""Test the development ``load_development_datasets` management command."""
from io import StringIO

from django.core.management import call_command
from django.test import TransactionTestCase


class LoadDevelopmentDatasetsTestCase(TransactionTestCase):
    """Test the ``load_development_datasets` management command."""

    maxDiff = None

    def test_command(self):
        """Coverage test to assert the command runs properly."""
        initial_output = StringIO()

        call_command(
            "load_development_datasets",
            stdout=initial_output,
        )

        self.assertListEqual(
            initial_output.getvalue().splitlines(),
            [
                "Creating custom frontend...",
                " - done.",
                "Creating pages...",
                " - done.",
                "Creating superuser...",
                " - done.",
                "Creating consumer_site_admin...",
                " - done.",
                "Creating consumer_site_instructor...",
                " - done.",
                "Creating consumer_site_student...",
                " - done.",
                "Creating organization_admin...",
                " - done.",
                "Creating organization_instructor...",
                " - done.",
                "Creating organization_student...",
                " - done.",
                "Creating playlist_admin...",
                " - done.",
                "Creating playlist_instructor...",
                " - done.",
                "Creating playlist_student...",
                " - done.",
                "Creating instructor...",
                " - done.",
                "Creating consumer sites...",
                " - done.",
                "Creating organizations...",
                " - done.",
                "Creating playlists...",
                " - done.",
                "Creating LTI passports...",
                " - done.",
                "Creating peertube runner token...",
                " - done.",
            ],
        )

        second_output = StringIO()
        call_command(
            "load_development_datasets",
            stdout=second_output,
        )

        self.assertListEqual(
            second_output.getvalue().splitlines(),
            [
                "Creating custom frontend...",
                " - done.",
                "Creating pages...",
                " - done.",
                "Creating superuser...",
                " - superuser already exists.",
                "Creating consumer_site_admin...",
                " - consumer_site_admin already exists.",
                "Creating consumer_site_instructor...",
                " - consumer_site_instructor already exists.",
                "Creating consumer_site_student...",
                " - consumer_site_student already exists.",
                "Creating organization_admin...",
                " - organization_admin already exists.",
                "Creating organization_instructor...",
                " - organization_instructor already exists.",
                "Creating organization_student...",
                " - organization_student already exists.",
                "Creating playlist_admin...",
                " - playlist_admin already exists.",
                "Creating playlist_instructor...",
                " - playlist_instructor already exists.",
                "Creating playlist_student...",
                " - playlist_student already exists.",
                "Creating instructor...",
                " - instructor already exists.",
                "Creating consumer sites...",
                " - done.",
                "Creating organizations...",
                " - done.",
                "Creating playlists...",
                " - done.",
                "Creating LTI passports...",
                " - done.",
                "Creating peertube runner token...",
                " - done.",
            ],
        )

        with_flush_output = StringIO()

        call_command(
            "load_development_datasets",
            stdout=with_flush_output,
            flush_db=True,
        )

        self.assertListEqual(
            with_flush_output.getvalue().splitlines(),
            [
                "Flushing database...",
                " - done.",
                "Creating custom frontend...",
                " - done.",
                "Creating pages...",
                " - done.",
                "Creating superuser...",
                " - done.",
                "Creating consumer_site_admin...",
                " - done.",
                "Creating consumer_site_instructor...",
                " - done.",
                "Creating consumer_site_student...",
                " - done.",
                "Creating organization_admin...",
                " - done.",
                "Creating organization_instructor...",
                " - done.",
                "Creating organization_student...",
                " - done.",
                "Creating playlist_admin...",
                " - done.",
                "Creating playlist_instructor...",
                " - done.",
                "Creating playlist_student...",
                " - done.",
                "Creating instructor...",
                " - done.",
                "Creating consumer sites...",
                " - done.",
                "Creating organizations...",
                " - done.",
                "Creating playlists...",
                " - done.",
                "Creating LTI passports...",
                " - done.",
                "Creating peertube runner token...",
                " - done.",
            ],
        )
