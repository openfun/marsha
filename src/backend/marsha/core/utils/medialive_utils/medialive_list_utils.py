"""Utils to create MediaLive configuration."""
from marsha.core.utils.medialive_utils.medialive_client_utils import (
    medialive_client,
    mediapackage_client,
)


def _get_items(  # nosec
    get_items, items_key, params=None, next_token=None, next_token_key="NextToken"
):
    """
    Recursive generic function call which concatenates results.

    Returns a list of items from the same items_key in response.
    If response contains a next token, get_items is called again, and items are concatenated.

    Parameters
    ----------
    get_items : function
        function that returns items which may return a next token
    items_key : string
        key containing items
    params : dict
        params passed to get_items function
    next_token : string
        token returned by first get_items call
    next_token_key : string
        key from get_items response that may contain a next_token

    Returns
    -------
    list
        list of items returned by recursive get_items calls
    """
    if not params:
        params = {}

    if next_token:
        params[next_token_key] = next_token

    response = get_items(**params)
    items = response.get(items_key)
    next_token = response.get(next_token_key)

    if next_token:
        items.extend(
            _get_items(get_items, items_key, params, next_token, next_token_key)
        )
    return items


def list_mediapackage_channels():
    """List all mediapackage channels."""
    return _get_items(mediapackage_client.list_channels, items_key="Channels")


def list_mediapackage_channel_harvest_jobs(channel_id):
    """List all harvest jobs for a mediapackage channel."""
    return _get_items(
        mediapackage_client.list_harvest_jobs,
        items_key="HarvestJobs",
        params={"IncludeChannelId": channel_id},
    )


def list_mediapackage_channel_origin_endpoints(channel_id):
    """List all origin endpoints for a mediapackage channel."""
    return _get_items(
        mediapackage_client.list_origin_endpoints,
        items_key="OriginEndpoints",
        params={"ChannelId": channel_id},
    )


def list_medialive_channels():
    """List all medialive channels."""
    return _get_items(medialive_client.list_channels, items_key="Channels")


def list_indexed_medialive_channels():
    """List and index all medialive channels by their name."""
    return {
        medialive_channel.get("Name"): medialive_channel
        for medialive_channel in list_medialive_channels()
    }
