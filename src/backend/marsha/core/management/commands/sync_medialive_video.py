"""Check every existing medialive channel and check if the related video is still usable."""
from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from marsha.core.defaults import IDLE, RUNNING, STOPPED
from marsha.core.models import Video
from marsha.core.utils.medialive_utils import list_medialive_channels, update_id3_tags
from marsha.core.utils.time_utils import to_timestamp


class Command(BaseCommand):
    """
    Once a live started, video states becomes indirectly linked to medialive channel state.
    There is a risk that sometimes, states are not sync for an unknown reason,
    for example, the api was down when aws was calling our callback to update video states.
    This can let us with media channel "IDLE", while in our side, the video state is "RUNNING"
    In this case, the video becomes soft locked, the possible actions for a "RUNNING"
    video will fail because the medialive channel state is "IDLE"
    This command iterates on medialive channel and ensure that linked videos are
    state synced to avoid this kind of soft lock.
    """

    help = __doc__

    def is_channel_sync_with_video(self, live_state, channel_state):
        """Check if channel state and video state are sync.

        Medialive channel states are not exactly 1-1 with video states:
        - Creating
        - Deleting
        - Idle -> IDLE
        - Recovering
        - Running -> RUNNING
        - Starting -> STARTING
        - Stopping -> STOPPING
        - Updating

        """
        if channel_state == live_state:
            # Sync for 1-1 cases
            return True

        if channel_state in ["creating", "recovering", "updating", "deleting"]:
            # Video states do not handle these AWS states
            return True

        if channel_state == IDLE and live_state in [STOPPED, IDLE]:
            # In this case STOPPED is an idle started live
            return True

        return False

    def update_video_state(self, live, channel_state):
        """Update video states depending on the channel states"""
        now = timezone.now()
        stamp = to_timestamp(now)

        live_state = live.live_state
        live_info = live.live_info
        live.live_state = channel_state

        if channel_state == RUNNING:
            live_info.update({"started_at": stamp})
            live_info.pop("stopped_at", None)
            update_id3_tags(live)

        if channel_state == IDLE and live_state == RUNNING:
            live.live_state = STOPPED
            live_info.update({"stopped_at": stamp})

        live.live_info = live_info
        live.save(update_fields=["live_info", "live_state"])

    def handle(self, *args, **options):
        """Execute management command."""
        for medialive_channel in list_medialive_channels():
            # Don't work with stack not belonging to the current environment
            if (
                medialive_channel.get("Tags", {}).get("environment")
                != settings.AWS_BASE_NAME
            ):
                continue

            # the channel name contains the environment, the primary key and the created_at
            # stamp. Here we want to use the primary key
            _environment, live_pk, _stamp = medialive_channel["Name"].split("_")
            live = Video.objects.get(pk=live_pk)
            self.stdout.write(f"Checking video {live.id}")
            channel_state = medialive_channel.get("State").casefold()

            # If the live state in not sync with media channel state,
            # we manually update to avoid soft lock
            live_state = live.live_state.casefold()
            if not self.is_channel_sync_with_video(live_state, channel_state):
                self.stdout.write(
                    f"""
                    Video {live.id} not sync: (video) {live_state} != {channel_state} (medialive)
                    """
                )
                self.update_video_state(live, channel_state)
