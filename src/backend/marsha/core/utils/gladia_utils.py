"""Gladia utils."""
import requests
from django.conf import settings


def get_transcript(video_url, callback_url):
    """Get a transcript for a video.

    Parameters
    ----------
    video_url : string
        The url of the video in the highest resolution available.
    callback_url : string
        The url to call when the transcript is ready.

    Returns
    -------
    string
        The url of the transcript.

    """

    headers = {
        "accept": "application/json",
        "x-gladia-key": settings.GLADIA_API_KEY,
    }

    files = {
        "video_url": (None, video_url),
        "output_format": (None, "srt"),
        "webhook_url": (None, callback_url),
    }

    response = requests.post(
        "https://api.gladia.io/video/text/video-transcription/",
        headers=headers,
        files=files,
    )
    from pprint import pprint

    #
    pprint(files)
    #
    pprint(response.json())
