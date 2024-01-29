"""Test clean_medialive_dev_stack command."""

from datetime import datetime, timezone
from unittest import mock

from django.core.management import call_command
from django.test import TestCase


class CleanMedialigeDevStackCommandTest(TestCase):
    """Test clean_medialive_dev_stack command."""

    def test_clean_medialive_dev_stack_non_running_medialive_channel(self):
        """Dev stack is deleted and channel waiter not used when channel is not running."""
        with mock.patch(
            "marsha.core.management.commands.clean_medialive_dev_stack.list_medialive_channels"
        ) as list_medialive_channels_mock, mock.patch(
            "marsha.core.management.commands.clean_medialive_dev_stack.delete_medialive_stack"
        ) as delete_medialive_stack_mock, mock.patch(
            "django.utils.timezone.now",
            return_value=datetime(2021, 8, 26, 13, 25, tzinfo=timezone.utc),
        ):
            live_to_delete = {
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
            }
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
                live_to_delete,
            ]

            call_command("clean_medialive_dev_stack")

            delete_medialive_stack_mock.assert_called_once_with(
                live_to_delete, mock.ANY
            )

    def test_clean_medialive_dev_stack_running_medialive_channel(self):
        """Running medialive channel is stopped before deleting all the stack."""
        with mock.patch(
            "marsha.core.management.commands.clean_medialive_dev_stack.list_medialive_channels"
        ) as list_medialive_channels_mock, mock.patch(
            "marsha.core.management.commands.clean_medialive_dev_stack.delete_medialive_stack"
        ) as delete_medialive_stack_mock, mock.patch(
            "django.utils.timezone.now",
            return_value=datetime(2021, 8, 26, 13, 25, tzinfo=timezone.utc),
        ):
            live_to_delete = {
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
            }
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
                live_to_delete,
            ]

            call_command("clean_medialive_dev_stack")

            delete_medialive_stack_mock.assert_called_once_with(
                live_to_delete, mock.ANY
            )

    def test_clean_medialive_dev_stack_multiple_outdated_medialive_channels(self):
        """Multiple channels are outdated and must be deleted."""
        with mock.patch(
            "marsha.core.management.commands.clean_medialive_dev_stack.list_medialive_channels"
        ) as list_medialive_channels_mock, mock.patch(
            "marsha.core.management.commands.clean_medialive_dev_stack.delete_medialive_stack"
        ) as delete_medialive_stack_mock, mock.patch(
            "django.utils.timezone.now",
            return_value=datetime(2021, 8, 26, 13, 25, tzinfo=timezone.utc),
        ):
            live_to_delete_1 = {
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
            }
            live_to_delete_2 = {
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
            }
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
                live_to_delete_1,
                live_to_delete_2,
            ]

            call_command("clean_medialive_dev_stack")

            delete_medialive_stack_mock.assert_any_call(live_to_delete_1, mock.ANY)
            delete_medialive_stack_mock.assert_any_call(live_to_delete_2, mock.ANY)
