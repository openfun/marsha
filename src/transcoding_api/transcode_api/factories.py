import factory
from django.utils import timezone
from factory.django import DjangoModelFactory

from .models import (
    Runner,
    RunnerJob,
    RunnerJobState,
    RunnerRegistrationToken,
    Video,
    VideoFile,
    VideoJobInfo,
    VideoState,
    VideoStreamingPlaylist,
)


class RunnerRegistrationTokenFactory(DjangoModelFactory):
    class Meta:
        model = RunnerRegistrationToken

    registrationToken = factory.Faker("uuid4")


class RunnerFactory(DjangoModelFactory):
    class Meta:
        model = Runner

    runnerToken = factory.Faker("uuid4")
    name = factory.Faker("name")
    description = factory.Faker("sentence")
    lastContact = factory.Faker(
        "date_time_this_month", tzinfo=timezone.get_current_timezone()
    )
    ip = factory.Faker("ipv4")
    runnerRegistrationToken = factory.SubFactory(RunnerRegistrationTokenFactory)


class RunnerJobFactory(DjangoModelFactory):
    class Meta:
        model = RunnerJob

    uuid = factory.Faker("uuid4")
    type = factory.Faker(
        "random_element",
        elements=[
            "vod-web-video-transcoding",
            "vod-hls-transcoding",
            "vod-audio-merge-transcoding",
            "live-rtmp-hls-transcoding",
            "video-studio-transcoding",
        ],
    )
    payload = factory.Faker("json")
    privatePayload = factory.Faker("json")
    state = RunnerJobState.PENDING
    failures = 0
    priority = 1
    processingJobToken = factory.Faker("uuid4")
    progress = 0
    runner = factory.SubFactory(RunnerFactory)


class VideoFactory(DjangoModelFactory):
    class Meta:
        model = Video

    uuid = factory.Faker("uuid4")
    state = VideoState.TO_TRANSCODE
    duration = factory.Faker("random_int", min=0, max=3600)
    name = factory.Faker("sentence")
    thumbnailFilename = factory.Faker("file_name")


class VideoJobInfoFactory(DjangoModelFactory):
    class Meta:
        model = VideoJobInfo

    pendingMove = factory.Faker("random_int", min=0, max=10)
    pendingTranscode = factory.Faker("random_int", min=0, max=10)
    video = factory.SubFactory(VideoFactory)


class VideoStreamingPlaylistFactory(DjangoModelFactory):
    class Meta:
        model = VideoStreamingPlaylist

    playlistFilename = factory.Faker("file_name")
    video = factory.SubFactory(VideoFactory)


class VideoFileFactory(DjangoModelFactory):
    class Meta:
        model = VideoFile

    resolution = factory.Faker(
        "random_element", elements=[0, 144, 240, 360, 480, 720, 1080, 1440, 2160]
    )
    size = factory.Faker("random_int", min=0, max=1000000)
    extname = factory.Faker("file_extension")
    fps = factory.Faker("random_int", min=-1, max=60)
    metadata = factory.Faker("json")
    filename = factory.Faker("file_name")
    video = factory.SubFactory(VideoFactory)
