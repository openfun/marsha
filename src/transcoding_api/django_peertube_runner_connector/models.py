"""

"""
import logging
from datetime import timedelta
from uuid import uuid4

from django.db import models
from django.utils import timezone

from django_peertube_runner_connector.storage import video_storage

logger = logging.getLogger(__name__)


class RunnerRegistrationToken(models.Model):
    registrationToken = models.CharField(max_length=255, unique=True)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)


class Runner(models.Model):
    runnerToken = models.CharField(max_length=255)
    name = models.CharField(max_length=255, unique=True)
    description = models.CharField(max_length=255, null=True)
    lastContact = models.DateTimeField()
    ip = models.CharField(max_length=255)
    runnerRegistrationToken = models.ForeignKey(
        RunnerRegistrationToken, on_delete=models.CASCADE
    )
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def update_last_contact(self, ip_address):
        if timezone.now() - self.lastContact < timedelta(minutes=5):
            return
        self.lastContact = timezone.now()
        self.ip = ip_address
        self.save()


class RunnerJobState(models.IntegerChoices):
    PENDING = 1, "Pending"
    PROCESSING = 2, "Processing"
    COMPLETED = 3, "Completed"
    ERRORED = 4, "Errored"
    WAITING_FOR_PARENT_JOB = 5, "Waiting for parent job"
    CANCELLED = 6, "Cancelled"
    PARENT_ERRORED = 7, "Parent errored"
    PARENT_CANCELLED = 8, "Parent cancelled"
    COMPLETING = 9, "Completing"


class RunnerJobType(models.TextChoices):
    VOD_WEB_VIDEO_TRANSCODING = "vod-web-video-transcoding"
    VOD_HLS_TRANSCODING = "vod-hls-transcoding"
    VOD_AUDIO_MERGE_TRANSCODING = "vod-audio-merge-transcoding"
    LIVE_RTMP_HLS_TRANSCODING = "live-rtmp-hls-transcoding"
    VIDEO_STUDIO_TRANSCODING = "video-studio-transcoding"


class RunnerJobQuerySet(models.QuerySet):
    def list_available_jobs(self):
        return self.filter(state=RunnerJobState.PENDING).order_by("priority")[:10]


class RunnerJob(models.Model):
    objects = RunnerJobQuerySet.as_manager()

    uuid = models.UUIDField(unique=True, default=uuid4)
    type = models.CharField(max_length=255, choices=RunnerJobType.choices)
    payload = models.JSONField()
    privatePayload = models.JSONField()
    state = models.IntegerField(choices=RunnerJobState.choices)
    failures = models.IntegerField(default=0)
    error = models.CharField(max_length=255, null=True, blank=True)
    priority = models.IntegerField()
    processingJobToken = models.CharField(max_length=255, null=True, blank=True)
    progress = models.FloatField(null=True, blank=True)
    startedAt = models.DateTimeField(null=True, blank=True)
    finishedAt = models.DateTimeField(null=True, blank=True)
    dependsOnRunnerJob = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.CASCADE, related_name="children"
    )
    runner = models.ForeignKey(Runner, null=True, blank=True, on_delete=models.SET_NULL)

    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def set_to_error_or_cancel(self, state):
        self.state = state
        self.processingJobToken = None
        self.finishedAt = timezone.now()
        self.save()

    def reset_to_pending(self):
        self.state = RunnerJobState.PENDING
        self.processingJobToken = None
        self.progress = None
        self.finishedAt = None
        self.startedAt = None

    def update_dependant_jobs(self):
        num_updated = self.children.update(state=RunnerJobState.PENDING)
        return num_updated


class VideoJobInfoColumnType(models.TextChoices):
    PENDING_MOVE = "pendingMove"
    PENDING_TRANSCODE = "pendingTranscode"


class VideoState(models.IntegerChoices):
    PUBLISHED = 1, "Published"
    TO_TRANSCODE = 2, "To transcode"
    TO_IMPORT = 3, "To import"
    WAITING_FOR_LIVE = 4, "Waiting for live"
    LIVE_ENDED = 5, "Live ended"
    TO_MOVE_TO_EXTERNAL_STORAGE = 6, "To move to external storage"
    TRANSCODING_FAILED = 7, "Transcoding failed"
    TO_MOVE_TO_EXTERNAL_STORAGE_FAILED = 8, "To move to external storage failed"
    TO_EDIT = 9, "To edit"


class Video(models.Model):
    uuid = models.UUIDField(unique=True, default=uuid4)
    state = models.IntegerField(choices=VideoState.choices)
    duration = models.IntegerField(null=True, blank=True)
    name = models.CharField(max_length=255)
    thumbnailFilename = models.CharField(max_length=255, null=True, blank=True)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def get_max_quality_file(self):
        if not self.files.count():
            return None
        return max(self.files.all(), key=lambda f: f.resolution)

    def remove_all_web_video_files(self):
        for file in self.files.all():
            file.remove_web_video_file()
            file.delete()

    def get_bandwidth_bits(self, video_file: "VideoFile"):
        if not self.duration:
            return video_file.size

        return int((video_file.size * 8) / self.duration)

    def increase_or_create_job_info(
        self, column: VideoJobInfoColumnType, amount: int = 1
    ) -> int:
        job_info, created = VideoJobInfo.objects.get_or_create(video=self)
        setattr(job_info, column, getattr(job_info, column) + amount)
        job_info.save()
        return getattr(job_info, column)

    def decrease_job_info(self, column: VideoJobInfoColumnType) -> int | None:
        try:
            job_info = VideoJobInfo.objects.get(video=self)
            setattr(job_info, column, getattr(job_info, column) - 1)
            job_info.save()
            return getattr(job_info, column)
        except VideoJobInfo.DoesNotExist:
            return None


class VideoJobInfo(models.Model):
    pendingMove = models.IntegerField(default=0)
    pendingTranscode = models.IntegerField(default=0)
    video = models.OneToOneField(
        "Video", on_delete=models.CASCADE, related_name="jobInfo"
    )
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)


class VideoResolution(models.IntegerChoices):
    H_NOVIDEO = 0
    H_144P = 144
    H_240P = 240
    H_360P = 360
    H_480P = 480
    H_720P = 720
    H_1080P = 1080
    H_1440P = 1440
    H_4K = 2160


class VideoStreamingPlaylist(models.Model):
    playlistFilename = models.CharField(max_length=255, null=True, blank=True)
    video = models.OneToOneField(
        Video, on_delete=models.CASCADE, related_name="streamingPlaylist"
    )
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)


class VideoFile(models.Model):
    resolution = models.IntegerField(choices=VideoResolution.choices)
    size = models.BigIntegerField()
    extname = models.CharField(max_length=255)
    fps = models.IntegerField(default=-1)
    metadata = models.JSONField(null=True, blank=True)
    filename = models.CharField(max_length=255, null=True, blank=True)
    video = models.ForeignKey(
        to="Video", on_delete=models.CASCADE, related_name="files"
    )
    streamingPlaylist = models.ForeignKey(
        VideoStreamingPlaylist,
        related_name="videoFiles",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def remove_web_video_file(self):
        video_storage.delete(self.filename)

    def is_audio(self):
        return self.resolution == VideoResolution.H_NOVIDEO
