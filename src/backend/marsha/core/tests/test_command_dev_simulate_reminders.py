"""Tests for dev_simulate_reminders command."""
from io import StringIO

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase, override_settings


class DevSimulateRemindersTest(TestCase):
    """Test dev_simulate_reminders command."""

    @override_settings(DEBUG=False)
    def test_dev_simulate_send_reminders_not_on_dev(self):
        """Command should do nothing if we are not in the Debug mode."""

        with self.assertRaises(CommandError) as context:
            call_command("dev_simulate_reminders")

        self.assertEqual(
            str(context.exception),
            "This command can only be executed when settings.DEBUG is True.",
        )

    @override_settings(DEBUG=True)
    def test_dev_simulate_send_reminders_we_are_on_dev(self):
        """Command should be executed if we are in the Debug mode."""
        out = StringIO()
        call_command("dev_simulate_reminders", stdout=out)
        self.assertEqual(
            "Command was executed in DEBUG mode.\n",
            out.getvalue(),
        )
        out.close()
