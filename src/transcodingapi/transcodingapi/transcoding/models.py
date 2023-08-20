"""

"""
import logging
from datetime import timedelta
from typing import Optional
from uuid import uuid4

from django.db import models
from django.utils import timezone

from transcodingapi.transcoding.helpers.paths import get_fs_video_file_output_path

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
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    runnerRegistrationToken = models.ForeignKey(
        RunnerRegistrationToken, on_delete=models.CASCADE
    )

    def update_last_contact(self, ip_address):
        if timezone.now() - self.lastContact < timedelta(minutes=5):
            return
        self.lastContact = timezone.datetime.now()
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
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    dependsOnRunnerJob = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.CASCADE
    )
    runner = models.ForeignKey(Runner, null=True, blank=True, on_delete=models.SET_NULL)

    def list_children(self):
        return RunnerJob.objects.filter(dependsOnRunnerJob=self)

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
        children = self.list_children()
        num_updated = children.update(state=RunnerJobState.PENDING)
        return num_updated


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

    def get_max_quality_file(self):
        return max(self.files.all(), key=lambda f: f.resolution)

    def remove_all_web_video_files(self):
        for file in self.files.all():
            file.remove_web_video_file()
            file.delete()


class VideoJobInfoColumnType(models.TextChoices):
    PENDING_MOVE = "pendingMove"
    PENDING_TRANSCODE = "pendingTranscode"


class VideoJobInfo(models.Model):
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    pendingMove = models.IntegerField(default=0)
    pendingTranscode = models.IntegerField(default=0)
    video = models.OneToOneField(
        "Video", on_delete=models.CASCADE, related_name="jobInfo"
    )

    @staticmethod
    def load(video_id: int) -> Optional["VideoJobInfo"]:
        try:
            return VideoJobInfo.objects.get(video_id=video_id)
        except VideoJobInfo.DoesNotExist:
            return None

    @staticmethod
    def increase_or_create(video_uuid: str, column: str, amount: int = 1) -> int:
        video = Video.objects.get(uuid=video_uuid)
        job_info, created = VideoJobInfo.objects.get_or_create(video=video)
        setattr(job_info, column, getattr(job_info, column) + amount)
        job_info.save()
        return getattr(job_info, column)

    @staticmethod
    def decrease(video_uuid: str, column: str) -> int | None:
        try:
            video = Video.objects.get(uuid=video_uuid)
            job_info = VideoJobInfo.objects.get(video=video)
            setattr(job_info, column, getattr(job_info, column) - 1)
            job_info.save()
            return getattr(job_info, column)
        except (Video.DoesNotExist, VideoJobInfo.DoesNotExist):
            return None

    @staticmethod
    def abort_all_tasks(video_uuid: str, column: str) -> None:
        try:
            video = Video.objects.get(uuid=video_uuid)
            job_info = VideoJobInfo.objects.get(video=video)
            setattr(job_info, column, 0)
            job_info.save()
        except (Video.DoesNotExist, VideoJobInfo.DoesNotExist):
            pass


class VideoStorage(models.TextChoices):
    FILE_SYSTEM = "FILE_SYSTEM"
    OBJECT_STORAGE = "OBJECT_STORAGE"


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


class VideoFile(models.Model):
    resolution = models.IntegerField(choices=VideoResolution.choices)
    size = models.BigIntegerField()
    extname = models.CharField(max_length=255)
    infoHash = models.CharField(max_length=255, null=True, blank=True)
    fps = models.IntegerField(default=-1)
    metadata = models.JSONField(null=True, blank=True)
    metadataUrl = models.CharField(max_length=255, null=True, blank=True)
    fileUrl = models.CharField(max_length=255, null=True, blank=True)
    filename = models.CharField(max_length=255, null=True, blank=True)
    torrentUrl = models.CharField(max_length=255, null=True, blank=True)
    torrentFilename = models.CharField(max_length=255, null=True, blank=True)
    video = models.ForeignKey(
        to="Video", on_delete=models.CASCADE, related_name="files"
    )
    storage = models.CharField(
        max_length=255, choices=VideoStorage.choices, default=VideoStorage.FILE_SYSTEM
    )
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "video_files"
        indexes = [
            models.Index(fields=["video"]),
        ]

    def remove_web_video_file(self):
        file_path = get_fs_video_file_output_path(self)
        logger.warn("Should remove web video file %s using s3 for example", file_path)

    def is_audio(self):
        return self.resolution == VideoResolution.H_NOVIDEO
