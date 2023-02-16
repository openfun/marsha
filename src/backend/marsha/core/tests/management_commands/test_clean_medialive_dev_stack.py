"""Test clean_medialive_dev_stack command."""
from datetime import datetime, timezone
from io import StringIO
from unittest import mock

from django.core.management import call_command
from django.test import TestCase

from botocore.stub import Stubber

from marsha.core.management.commands import clean_medialive_dev_stack


class CleanMedialigeDevStackCommandTest(TestCase):
    """Test clean_medialive_dev_stack command."""

    def test_clean_medialive_dev_stack_non_running_medialive_channel(self):
        """Dev stack is deleted and channel waiter not used when channel is not running."""
        out = StringIO()
        with mock.patch(
            "marsha.core.management.commands.clean_medialive_dev_stack.list_medialive_channels"
        ) as list_medialive_channels_mock, mock.patch(
            "marsha.core.management.commands.clean_medialive_dev_stack.delete_mediapackage_channel"
        ) as delete_mediapackage_channel_mock, mock.patch(
            "django.utils.timezone.now",
            return_value=datetime(2021, 8, 26, 13, 25, tzinfo=timezone.utc),
        ), Stubber(
            clean_medialive_dev_stack.medialive_client
        ) as medialive_client_stubber:
            list_medialive_channels_mock.return_value = [
                {
                    # non dev environment are ignored
                    "Name": "production_333c8b00-bb21-44e8-b1b4-286f7e83dd2e_1629984950",
                    "Tags": {
                        "app": "marsha",
                        "environment": "production",
                    },
                },
                {
                    "Name": "dev-foo_2389cabd-fc46-4ead-8f82-610f35c37d63_1629984950",
                    "Tags": {"app": "marsha", "environment": "dev-foo"},
                },
                {
                    "Name": "dev-bar_99d60314-20f2-4847-84a4-d2f47bf7fe38_1629982356",
                    "Tags": {
                        "app": "marsha",
                        "environment": "dev-bar",
                    },
                    "Id": "562345",
                    "State": "IDLE",
                    "InputAttachments": [
                        {
                            "InputId": "876294",
                        }
                    ],
                },
            ]

            medialive_client_stubber.add_response(
                "delete_channel",
                expected_params={"ChannelId": "562345"},
                service_response={},
            )

            medialive_client_stubber.add_response(
                "describe_input",
                expected_params={"InputId": "876294"},
                service_response={"State": "DETACHED"},
            )
            medialive_client_stubber.add_response(
                "delete_input",
                expected_params={"InputId": "876294"},
                service_response={},
            )

            call_command("clean_medialive_dev_stack", stdout=out)

            delete_mediapackage_channel_mock.assert_called_once_with(
                "dev-bar_99d60314-20f2-4847-84a4-d2f47bf7fe38_1629982356"
            )
            medialive_client_stubber.assert_no_pending_responses()

        self.assertEqual(
            (
                "Cleaning stack with name "
                "dev-bar_99d60314-20f2-4847-84a4-d2f47bf7fe38_1629982356\n"
                "Stack with name "
                "dev-bar_99d60314-20f2-4847-84a4-d2f47bf7fe38_1629982356 deleted\n"
            ),
            out.getvalue(),
        )
        out.close()

    def test_clean_medialive_dev_stack_running_medialive_channel(self):
        """Running medialive channel is stopped before deleting all the stack."""
        out = StringIO()
        with mock.patch(
            "marsha.core.management.commands.clean_medialive_dev_stack.list_medialive_channels"
        ) as list_medialive_channels_mock, mock.patch(
            "marsha.core.management.commands.clean_medialive_dev_stack.delete_mediapackage_channel"
        ) as delete_mediapackage_channel_mock, mock.patch(
            "django.utils.timezone.now",
            return_value=datetime(2021, 8, 26, 13, 25, tzinfo=timezone.utc),
        ), Stubber(
            clean_medialive_dev_stack.medialive_client
        ) as medialive_client_stubber:
            list_medialive_channels_mock.return_value = [
                {
                    # non dev environment are ignored
                    "Name": "production_333c8b00-bb21-44e8-b1b4-286f7e83dd2e_1629984950",
                    "Tags": {
                        "app": "marsha",
                        "environment": "production",
                    },
                },
                {
                    "Name": "dev-foo_2389cabd-fc46-4ead-8f82-610f35c37d63_1629984950",
                    "Tags": {"app": "marsha", "environment": "dev-foo"},
                },
                {
                    "Name": "dev-bar_99d60314-20f2-4847-84a4-d2f47bf7fe38_1629982356",
                    "Tags": {
                        "app": "marsha",
                        "environment": "dev-bar",
                    },
                    "Id": "562345",
                    "State": "RUNNING",
                    "InputAttachments": [
                        {
                            "InputId": "876294",
                        }
                    ],
                },
            ]

            medialive_client_stubber.add_response(
                "stop_channel",
                expected_params={"ChannelId": "562345"},
                service_response={},
            )
            medialive_client_stubber.add_response(
                "describe_channel",
                expected_params={"ChannelId": "562345"},
                service_response={"State": "IDLE"},
            )
            medialive_client_stubber.add_response(
                "delete_channel",
                expected_params={"ChannelId": "562345"},
                service_response={},
            )

            medialive_client_stubber.add_response(
                "describe_input",
                expected_params={"InputId": "876294"},
                service_response={"State": "DETACHED"},
            )
            medialive_client_stubber.add_response(
                "delete_input",
                expected_params={"InputId": "876294"},
                service_response={},
            )

            call_command("clean_medialive_dev_stack", stdout=out)

            delete_mediapackage_channel_mock.assert_called_once_with(
                "dev-bar_99d60314-20f2-4847-84a4-d2f47bf7fe38_1629982356"
            )
            medialive_client_stubber.assert_no_pending_responses()

        self.assertEqual(
            (
                "Cleaning stack with name "
                "dev-bar_99d60314-20f2-4847-84a4-d2f47bf7fe38_1629982356\n"
                "Medialive channel is running, we must stop it first.\n"
                "Stack with name "
                "dev-bar_99d60314-20f2-4847-84a4-d2f47bf7fe38_1629982356 deleted\n"
            ),
            out.getvalue(),
        )
        out.close()

    def test_clean_medialive_dev_stack_multiple_outdated_medialive_channels(self):
        """Multiple channels are outdates and must be deleted."""
        out = StringIO()
        with mock.patch(
            "marsha.core.management.commands.clean_medialive_dev_stack.list_medialive_channels"
        ) as list_medialive_channels_mock, mock.patch(
            "marsha.core.management.commands.clean_medialive_dev_stack.delete_mediapackage_channel"
        ) as delete_mediapackage_channel_mock, mock.patch(
            "django.utils.timezone.now",
            return_value=datetime(2021, 8, 26, 13, 25, tzinfo=timezone.utc),
        ), Stubber(
            clean_medialive_dev_stack.medialive_client
        ) as medialive_client_stubber:
            list_medialive_channels_mock.return_value = [
                {
                    # non dev environment are ignored
                    "Name": "production_333c8b00-bb21-44e8-b1b4-286f7e83dd2e_1629984950",
                    "Tags": {
                        "app": "marsha",
                        "environment": "production",
                    },
                },
                {
                    "Name": "dev-foo_2389cabd-fc46-4ead-8f82-610f35c37d63_1629984950",
                    "Tags": {"app": "marsha", "environment": "dev-foo"},
                },
                {
                    "Name": "dev-bar_99d60314-20f2-4847-84a4-d2f47bf7fe38_1629982356",
                    "Tags": {
                        "app": "marsha",
                        "environment": "dev-bar",
                    },
                    "Id": "562345",
                    "State": "RUNNING",
                    "InputAttachments": [
                        {
                            "InputId": "876294",
                        }
                    ],
                },
                {
                    "Name": "dev-baz_fe8a4a85-f955-4db5-ac25-e7972c3095a4_1629982356",
                    "Tags": {
                        "app": "marsha",
                        "environment": "dev-baz",
                    },
                    "Id": "194672",
                    "State": "IDLE",
                    "InputAttachments": [
                        {
                            "InputId": "375107",
                        }
                    ],
                },
            ]

            medialive_client_stubber.add_response(
                "stop_channel",
                expected_params={"ChannelId": "562345"},
                service_response={},
            )
            medialive_client_stubber.add_response(
                "describe_channel",
                expected_params={"ChannelId": "562345"},
                service_response={"State": "IDLE"},
            )
            medialive_client_stubber.add_response(
                "delete_channel",
                expected_params={"ChannelId": "562345"},
                service_response={},
            )
            medialive_client_stubber.add_response(
                "describe_input",
                expected_params={"InputId": "876294"},
                service_response={"State": "DETACHED"},
            )
            medialive_client_stubber.add_response(
                "delete_input",
                expected_params={"InputId": "876294"},
                service_response={},
            )

            medialive_client_stubber.add_response(
                "delete_channel",
                expected_params={"ChannelId": "194672"},
                service_response={},
            )
            medialive_client_stubber.add_response(
                "describe_input",
                expected_params={"InputId": "375107"},
                service_response={"State": "DETACHED"},
            )
            medialive_client_stubber.add_response(
                "delete_input",
                expected_params={"InputId": "375107"},
                service_response={},
            )

            call_command("clean_medialive_dev_stack", stdout=out)

            delete_mediapackage_channel_mock.assert_any_call(
                "dev-bar_99d60314-20f2-4847-84a4-d2f47bf7fe38_1629982356"
            )
            delete_mediapackage_channel_mock.assert_any_call(
                "dev-baz_fe8a4a85-f955-4db5-ac25-e7972c3095a4_1629982356"
            )
            medialive_client_stubber.assert_no_pending_responses()

        self.assertEqual(
            (
                "Cleaning stack with name "
                "dev-bar_99d60314-20f2-4847-84a4-d2f47bf7fe38_1629982356\n"
                "Medialive channel is running, we must stop it first.\n"
                "Stack with name "
                "dev-bar_99d60314-20f2-4847-84a4-d2f47bf7fe38_1629982356 deleted\n"
                "Cleaning stack with name "
                "dev-baz_fe8a4a85-f955-4db5-ac25-e7972c3095a4_1629982356\n"
                "Stack with name "
                "dev-baz_fe8a4a85-f955-4db5-ac25-e7972c3095a4_1629982356 deleted\n"
            ),
            out.getvalue(),
        )
        out.close()
