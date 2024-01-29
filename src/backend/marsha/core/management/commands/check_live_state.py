"""Check live state management command."""

from datetime import datetime, timedelta, timezone
import json
import re

from django.conf import settings
from django.core.management.base import BaseCommand

import boto3
from dateutil.parser import isoparse

from marsha.core.defaults import RUNNING, STOPPING
from marsha.core.models import Video
from marsha.core.utils.medialive_utils import stop_live_channel


aws_credentials = {
    "aws_access_key_id": settings.AWS_ACCESS_KEY_ID,
    "aws_secret_access_key": settings.AWS_SECRET_ACCESS_KEY,
    "region_name": settings.AWS_S3_REGION_NAME,
}

# Configure medialive client
medialive_client = boto3.client("medialive", **aws_credentials)

# Configure cloudwatch logs client
logs_client = boto3.client("logs", **aws_credentials)


def parse_iso_date(iso_date):
    """Parse an iso 8601 date and return a datetime object."""
    return isoparse(iso_date)


def generate_expired_date():
    """Generate a datetime object 25 minutes in the past."""
    return datetime.now(tz=timezone.utc) - timedelta(minutes=25)


# pylint: disable=too-many-locals
class Command(BaseCommand):
    """Check every live streaming running state on AWS."""

    help = (
        "Check activity on AWS for every live streaming running"
        "and close them if there is not."
    )

    def handle(self, *args, **options):
        """Execute management command."""
        extract_message_pattern = (
            r"^(?P<ingestion_time>.*)\t"
            r"(?P<request_id>.*)\t"
            r"(?P<level>.*)\t"
            r"Received event:(?P<message>.*)$"
        )
        extract_message_regex = re.compile(extract_message_pattern)

        videos = Video.objects.filter(live_state=RUNNING)
        for video in videos:
            # For each running live video, we query cloudwatch on the current live
            # to search messages having detail.alert_type set to `RTMP Has No Audio/Video`.
            # This alert tell us there is no stream and the live can be stopped if the message is
            # older than 25 minutes.
            self.stdout.write(f"Checking video {video.id}")
            live_info = video.live_info
            logs = logs_client.filter_log_events(
                logGroupName=live_info["cloudwatch"]["logGroupName"],
                startTime=int(int(video.live_info.get("started_at")) * 1000),
                filterPattern=(
                    "{"
                    '($.detail-type = "MediaLive Channel Alert") && '
                    f"($.resources[0] = \"{live_info['medialive']['channel']['arn']}\") &&"
                    '($.detail.alert_type = "RTMP Has No Audio/Video")'
                    "}"
                ),
            )

            pipelines_queue = {"0": [], "1": []}

            for event in logs["events"]:
                # All events must be parsed to extract the JSON message. When an alert is added,
                # the `alarm_state` property value is `SET` and when the alert is removed,
                # the `alarm_state` property value is `CLEARED`.
                # We have 2 pipelines, a live is over when the 2 pipeline have `SET` value
                # in `alarm_state`.
                # Alarm state act like a list with all the event history. It means a `CLEARED`
                # event is related to a `SET` one. So we have to look over all events, put in
                # a list all `SET` events and remove it if a `CLEARED` event is here. At the
                # end if we have 2 `SET` events, the live has no activity and we have to check
                # the time of the last `SET` event. If this time is older than 25 minutes we
                # stop the channel.
                log = extract_message_regex.match(event["message"])
                message = json.loads(log.group("message"))

                if message["detail"]["alarm_state"] == "SET":
                    pipelines_queue[message["detail"]["pipeline"]].append(message)
                else:
                    pipelines_queue[message["detail"]["pipeline"]].pop()

            if len(pipelines_queue["0"]) == 1 and len(pipelines_queue["1"]) == 1:
                # Both pipelines receive no stream, we have to check the more recent one
                # and if the time is older than 25 minutes we stop the channel.
                datetime_pipeline0 = parse_iso_date(pipelines_queue["0"][0]["time"])
                datetime_pipeline1 = parse_iso_date(pipelines_queue["1"][0]["time"])
                expired_date = generate_expired_date()

                if (
                    datetime_pipeline0 < expired_date
                    or datetime_pipeline1 < expired_date
                ):
                    # Stop this channel
                    self.stdout.write(
                        f"Stopping channel with id {live_info['medialive']['channel']['id']}"
                    )
                    stop_live_channel(live_info["medialive"]["channel"]["id"])

                    video.live_state = STOPPING
                    video.save()
                    self.stdout.write("Channel stopped")
