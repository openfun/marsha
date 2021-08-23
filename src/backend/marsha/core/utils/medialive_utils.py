"""Utils to create MediaLive configuration."""
import json
import os

from django.conf import settings

import boto3
import requests


class ManifestMissingException(Exception):
    """Exception used when a mediapackage manifest is missing."""

    pass


aws_credentials = {
    "aws_access_key_id": settings.AWS_ACCESS_KEY_ID,
    "aws_secret_access_key": settings.AWS_SECRET_ACCESS_KEY,
    "region_name": settings.AWS_S3_REGION_NAME,
}

# Configure medialive client
medialive_client = boto3.client("medialive", **aws_credentials)

# Configure mediapackage client
mediapackage_client = boto3.client("mediapackage", **aws_credentials)

# Configure SSM client
ssm_client = boto3.client("ssm", **aws_credentials)


def create_mediapackage_channel(key):
    """Create an AWS mediapackage channel.

    An endpoint is created and attached to this channel and password
    are added in SSM service.

    Parameters
    ----------
    key : string
        key representing the video in AWS

    Returns
    -------
    dictionnary
        Dictrionnary returned by the AWS API once a channel created

    """
    # Create mediapackage channel
    channel = mediapackage_client.create_channel(
        Id=f"{settings.AWS_BASE_NAME}_{key}",
        Tags={"environment": settings.AWS_BASE_NAME},
    )

    # Add primary U/P to SSM parameter store
    ssm_client.put_parameter(
        Name=f"{settings.AWS_BASE_NAME}_{channel['HlsIngest']['IngestEndpoints'][0]['Username']}",
        Description=f"{key} MediaPackage Primary Ingest Username",
        Value=channel["HlsIngest"]["IngestEndpoints"][0]["Password"],
        Type="String",
        Tags=[{"Key": "environment", "Value": settings.AWS_BASE_NAME}],
    )

    # Add Secondary U/P to SSM Parameter store
    ssm_client.put_parameter(
        Name=f"{settings.AWS_BASE_NAME}_{channel['HlsIngest']['IngestEndpoints'][1]['Username']}",
        Description=f"{key} MediaPackage Secondary Ingest Username",
        Value=channel["HlsIngest"]["IngestEndpoints"][1]["Password"],
        Type="String",
        Tags=[{"Key": "environment", "Value": settings.AWS_BASE_NAME}],
    )

    # Create a HLS endpoint. This endpoint will be used to watch the stream.
    hls_endpoint = mediapackage_client.create_origin_endpoint(
        ChannelId=channel["Id"],
        Id=f"{channel['Id']}_hls",
        ManifestName=f"{channel['Id']}_hls",
        StartoverWindowSeconds=86400,
        TimeDelaySeconds=0,
        HlsPackage={
            "AdMarkers": "PASSTHROUGH",
            "IncludeIframeOnlyStream": False,
            "PlaylistType": "EVENT",
            "PlaylistWindowSeconds": settings.LIVE_PLAYLIST_WINDOW_SECONDS,
            "ProgramDateTimeIntervalSeconds": 0,
            "SegmentDurationSeconds": settings.LIVE_SEGMENT_DURATION_SECONDS,
        },
        Tags={"environment": settings.AWS_BASE_NAME},
    )

    return [channel, hls_endpoint]


def get_or_create_input_security_group():
    """Create or fetch an existing security group.

    The number of input security group is limited to 5 by default. We create one and after
    we only use this one. To identify it we tag it with a `marsha_live` label.

    Returns
    -------
    string
        The input security group to use
    """
    input_security_groups = medialive_client.list_input_security_groups()

    for input_security_group in input_security_groups["InputSecurityGroups"]:
        if input_security_group["Tags"].get("marsha_live"):
            return input_security_group["Id"]

    security_group = medialive_client.create_input_security_group(
        WhitelistRules=[{"Cidr": "0.0.0.0/0"}], Tags={"marsha_live": "1"}
    )

    return security_group["SecurityGroup"]["Id"]


def create_medialive_input(key):
    """Create AWS medialive input.

    The medialive input is created to receive a RTMP stream from OBS for example.
    The security group used accepts all incoming traffic, there is no IP restriction.

    Parameters
    ----------
    key : string
        key representing the video in AWS

    Returns
    -------
    dictionary
        Dictionary returned by the AWS API once a medialive input is created
    """
    medialive_input = medialive_client.create_input(
        InputSecurityGroups=[get_or_create_input_security_group()],
        Name=f"{settings.AWS_BASE_NAME}_{key}",
        Type="RTMP_PUSH",
        Destinations=[
            {"StreamName": f"{key}-primary"},
            {"StreamName": f"{key}-secondary"},
        ],
        Tags={"environment": settings.AWS_BASE_NAME},
    )

    return medialive_input


def create_medialive_channel(key, medialive_input, mediapackage_channel):
    """Create an AWS medialive channel.

    The medialive channel is the glue between medialive input and mediapackage channel.
    The encoding is also managed here. All encoding parameters come from a json file
    stored in marsha/core/utils/medialive_profiles

    Parameters
    ----------
    key : string
        key representing the video in AWS

    medialive_input: dictionary
        dictionary containing newly created medialive input

    mediapackage_channel: dictionary
        dictionary containing newly created mediapackage channel

    Returns
    -------
    dictionary
        Dictionary returned by the AWS API once a medialive channel is created
    """
    dir_path = os.path.dirname(os.path.realpath(__file__))
    with open(f"{dir_path}/medialive_profiles/medialive-720p.json") as encoding:
        encoder_settings = json.load(encoding)

    # update encoder settings with marsha settings
    for video_description in encoder_settings.get("VideoDescriptions"):
        video_description["CodecSettings"]["H264Settings"].update(
            {
                "FramerateDenominator": settings.LIVE_FRAMERATE_DENOMINATOR,
                "FramerateNumerator": settings.LIVE_FRAMERATE_NUMERATOR,
                "GopSize": settings.LIVE_GOP_SIZE,
            }
        )

    medialive_channel = medialive_client.create_channel(
        InputSpecification={
            "Codec": "AVC",
            "Resolution": "HD",
            "MaximumBitrate": "MAX_10_MBPS",
        },
        InputAttachments=[{"InputId": medialive_input["Input"]["Id"]}],
        Destinations=[
            {
                "Id": "destination1",
                "Settings": [
                    {
                        "PasswordParam": "{environment}_{username}".format(
                            environment=settings.AWS_BASE_NAME,
                            username=mediapackage_channel["HlsIngest"][
                                "IngestEndpoints"
                            ][0]["Username"],
                        ),
                        "Url": mediapackage_channel["HlsIngest"]["IngestEndpoints"][0][
                            "Url"
                        ],
                        "Username": mediapackage_channel["HlsIngest"][
                            "IngestEndpoints"
                        ][0]["Username"],
                    },
                    {
                        "PasswordParam": "{environment}_{username}".format(
                            environment=settings.AWS_BASE_NAME,
                            username=mediapackage_channel["HlsIngest"][
                                "IngestEndpoints"
                            ][1]["Username"],
                        ),
                        "Url": mediapackage_channel["HlsIngest"]["IngestEndpoints"][1][
                            "Url"
                        ],
                        "Username": mediapackage_channel["HlsIngest"][
                            "IngestEndpoints"
                        ][1]["Username"],
                    },
                ],
            }
        ],
        Name=f"{settings.AWS_BASE_NAME}_{key}",
        RoleArn=settings.AWS_MEDIALIVE_ROLE_ARN,
        EncoderSettings=encoder_settings,
        Tags={"environment": settings.AWS_BASE_NAME},
    )

    return medialive_channel


def create_live_stream(key):
    """Create all AWS stack needed to stream a video.

    Parameters
    ----------
    key : string
        key representing the video in AWS

    Returns
    -------
    dictionary
        Dictionary containing all information to store in order to manage
        a live stream life cycle.
    """
    mediapackage_channel, hls_endpoint = create_mediapackage_channel(key)
    medialive_input = create_medialive_input(key)

    medialive_channel = create_medialive_channel(
        key, medialive_input, mediapackage_channel
    )

    return {
        "medialive": {
            "input": {
                "id": medialive_input["Input"]["Id"],
                "endpoints": [
                    medialive_input["Input"]["Destinations"][0]["Url"],
                    medialive_input["Input"]["Destinations"][1]["Url"],
                ],
            },
            "channel": {
                "arn": medialive_channel["Channel"]["Arn"],
                "id": medialive_channel["Channel"]["Id"],
            },
        },
        "mediapackage": {
            "channel": {"id": mediapackage_channel["Id"]},
            "endpoints": {
                "hls": {"id": hls_endpoint["Id"], "url": hls_endpoint["Url"]},
            },
        },
    }


def start_live_channel(channel_id):
    """Start an existing medialive channel."""
    medialive_client.start_channel(ChannelId=channel_id)


def stop_live_channel(channel_id):
    """Stop an existing medialive channel."""
    medialive_client.stop_channel(ChannelId=channel_id)


def create_mediapackage_harvest_job(video):
    """Create a mediapackage harvest job."""
    request = requests.get(video.get_mediapackage_endpoints().get("hls").get("url"))
    if request.status_code == 404:
        raise ManifestMissingException

    hls_endpoint = video.get_mediapackage_endpoints().get("hls").get("id")
    channel_id = video.get_mediapackage_channel().get("id")

    # split channel id to take the stamp in it {env}_{pk}_{stamp}
    elements = channel_id.split("_")

    mediapackage_client.create_harvest_job(
        Id=channel_id,
        StartTime=video.live_info.get("started_at"),
        EndTime=video.live_info.get("stopped_at"),
        OriginEndpointId=hls_endpoint,
        S3Destination={
            "BucketName": settings.AWS_DESTINATION_BUCKET_NAME,
            "ManifestKey": f"{video.pk}/cmaf/{elements[2]}.m3u8",
            "RoleArn": settings.AWS_MEDIAPACKAGE_HARVEST_JOB_ARN,
        },
    )


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
    input_waiter.wait(InputId=medialive_input_id)
    medialive_client.delete_input(InputId=medialive_input_id)


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


def delete_mediapackage_channel(channel_id):
    """Delete a mediapackage channel and related enpoints."""
    origin_endpoints = list_mediapackage_channel_origin_endpoints(channel_id=channel_id)
    deleted_endpoints = []
    for origin_endpoint in origin_endpoints:
        mediapackage_client.delete_origin_endpoint(Id=origin_endpoint.get("Id"))
        deleted_endpoints.append(origin_endpoint.get("Id"))
    mediapackage_client.delete_channel(Id=channel_id)
    return deleted_endpoints
