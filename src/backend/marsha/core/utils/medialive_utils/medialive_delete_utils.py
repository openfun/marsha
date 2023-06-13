"""Utils to create MediaLive configuration."""
from django.conf import settings

from botocore.exceptions import WaiterError
from sentry_sdk import capture_exception

from .medialive_client_utils import medialive_client, mediapackage_client
from .medialive_list_utils import list_mediapackage_channel_origin_endpoints


def delete_aws_element_stack(video):
    """Delete all AWS elemental.

    Instances used:
        - medialive input and channel
    """
    # Medialive
    # First delete the channel
    medialive_client.delete_channel(ChannelId=video.get_medialive_channel().get("id"))

    # Once channel deleted we have to wait until input is detached
    input_waiter = medialive_client.get_waiter("input_detached")
    medialive_input_id = video.get_medialive_input().get("id")
    try:
        input_waiter.wait(
            InputId=medialive_input_id,
            WaiterConfig={
                "Delay": settings.AWS_MEDIALIVE_INPUT_WAITER_DELAY,
                "MaxAttempts": settings.AWS_MEDIALIVE_INPUT_WAITER_MAX_ATTEMPTS,
            },
        )
        medialive_client.delete_input(InputId=medialive_input_id)
    except WaiterError as exception:
        capture_exception(exception)


def delete_mediapackage_channel(channel_id):
    """Delete a mediapackage channel and related enpoints."""
    origin_endpoints = list_mediapackage_channel_origin_endpoints(channel_id=channel_id)
    deleted_endpoints = []
    for origin_endpoint in origin_endpoints:
        mediapackage_client.delete_origin_endpoint(Id=origin_endpoint.get("Id"))
        deleted_endpoints.append(origin_endpoint.get("Id"))
    mediapackage_client.delete_channel(Id=channel_id)
    return deleted_endpoints
