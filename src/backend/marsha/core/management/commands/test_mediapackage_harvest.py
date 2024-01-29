"""Test recording slicing management command."""

import datetime
from pprint import pprint
import time

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from marsha.core.models import Video
from marsha.core.services.video_recording import start_recording, stop_recording


class Command(BaseCommand):
    """Creates recording slices for a live and waits for the videos to be harvested."""

    help = (
        "Creates recording slices for a live and waits for the videos to be harvested."
    )

    def add_arguments(self, parser):
        """Add arguments to the command."""
        parser.add_argument(
            "-s", "--slices", type=int, default=3, help="Number of slices"
        )
        parser.add_argument(
            "-l", "--length", type=int, default=30, help="Length of slices in seconds"
        )
        parser.add_argument(
            "-w",
            "--wait",
            type=int,
            default=20,
            help="Number of seconds between slices",
        )
        parser.add_argument(
            "-r", "--reset", action="store_true", help="Reset slices before creation"
        )
        parser.add_argument(
            "-m", "--manual", action="store_true", help="Manually create slices"
        )

    def handle(self, *args, **options):
        """Execute management command."""

        if not settings.DEBUG:
            raise CommandError(
                "This command can only be executed when settings.DEBUG is True."
            )
        slices = options["slices"]
        length = options["length"]
        wait = options["wait"]
        reset = options["reset"]
        manual = options["manual"]

        video = Video.objects.order_by("created_on").last()
        self.stdout.write(f"\nTesting recording slices for {video.id} {video.title}")

        if reset:
            self.reset_slices(video)

        self.wait_video_state(video, "live_state", "running", delay=5)

        if manual:
            self.manual_slices(video)
        else:
            if not video.recording_slices:
                self.automatic_slices(video, slices, length, wait)

        self.wait_video_state(video, "live_state", "stopped")

        self.wait_slices_harvesting(video)

        self.wait_video_state(video, "live_state", "harvested")

        self.stdout.write(f"\nvideo harvested {video.id} {video.title}")

    def reset_slices(self, video):
        """Reset slices for a video."""
        self.stdout.write("\nForcing slices re-creation")
        video.recording_slices = []
        video.save()

    def wait_seconds(self, seconds):
        """Wait for `seconds` seconds."""
        print("")
        for seconds_left in range(seconds, 0, -1):
            self.stdout.write(f"Waiting {seconds_left} seconds...", ending="\r")
            time.sleep(1)
        print("")

    def wait_video_state(self, video, attribute, expected_state, delay=0):
        """Wait for a video to be in a specific state."""
        self.stdout.write(
            f"\nWaiting for the video {attribute} to be {expected_state}..."
        )
        video_live_state = ""
        while True:
            video.refresh_from_db()
            video_attribute = getattr(video, attribute)
            if video_live_state != video_attribute:
                video_live_state = video_attribute
                self.stdout.write(
                    f"Current video {attribute}: {video_attribute}", ending="\r"
                )
                if video_attribute == expected_state:
                    break
            time.sleep(5)
        if delay:
            self.wait_seconds(delay)

    def manual_slices(self, video):
        """Create slices manually."""
        self.stdout.write("\nCreating recording slices from user inputs...")
        while True:
            manual_start_recording = input("\nStart recording? (y/N)")
            if manual_start_recording.lower() == "y":
                start_recording(video)

                manual_stop_recording = input("Stop recording? (y/N)")
                if manual_stop_recording.lower() == "y":
                    stop_recording(video)
                else:
                    break
            else:
                break

    def automatic_slices(self, video, slices, length, wait):
        """Create slices automatically."""
        self.stdout.write(
            f"\nCreating {slices} slices of {length} seconds each "
            f"with a wait of {wait} seconds between slices..."
        )
        for i in range(1, slices + 1):
            self.stdout.write(f"Start recording slice {i} {datetime.datetime.now()}")
            start_recording(video)
            self.wait_seconds(length)
            self.stdout.write(f"Stop recording slice {i} {datetime.datetime.now()}")
            stop_recording(video)
            self.stdout.write(str(video.recording_slices[-1]))
            if i == 3:
                break
            self.wait_seconds(wait)

    def wait_slices_harvesting(self, video):
        """Wait for the slices to be harvested."""
        self.stdout.write("\nWaiting for the slices to be harvested...")
        status = ""
        while True:
            video.refresh_from_db()
            slices_statuses = str([s.get("status") for s in video.recording_slices])
            self.stdout.write(f"{status} {slices_statuses}", ending="\r")
            if status != video.get_recording_slices_state().get("status"):
                status = video.get_recording_slices_state().get("status")
                if video.get_recording_slices_state().get("status") == "harvested":
                    pprint(video.get_recording_slices_state())
                    break
            self.wait_seconds(5)
