import logging
from uuid import uuid4

from django.http import FileResponse, Http404
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from transcode_api.models import Runner, RunnerJob, RunnerJobState, Video
from transcode_api.serializers import (
    RunnerJobSerializer,
    SimpleRunnerJobSerializer,
)
from transcode_api.storage import video_storage
from transcode_api.utils.job_handlers.class_handler import get_runner_job_handler_class

from .mixins import ListMixin

logger = logging.getLogger(__name__)


class RunnerJobViewSet(viewsets.GenericViewSet, ListMixin, mixins.DestroyModelMixin):
    queryset = RunnerJob.objects.all()
    serializer_class = RunnerJobSerializer
    lookup_field = "uuid"

    def _get_runner_from_token(self, request):
        try:
            runner = Runner.objects.get(runnerToken=request.data.get("runnerToken", ""))
        except Runner.DoesNotExist:
            raise Http404("Unknown runner token")
        return runner

    def _get_job_from_uuid(self, uuid):
        try:
            runner = self.get_queryset().get(uuid=uuid)
        except RunnerJob.DoesNotExist:
            raise Http404("Unknown job uuid")
        return runner

    def _get_video_from_uuid(self, uuid):
        try:
            runner = Video.objects.get(uuid=uuid)
        except Video.DoesNotExist:
            raise Http404("Unknown video uuid")
        return runner

    @action(detail=False, methods=["post"], url_path="request")
    def request_runner_job(self, request):
        runner = self._get_runner_from_token(request)
        jobs = RunnerJob.objects.list_available_jobs()

        runner.update_last_contact(request.META.get("REMOTE_ADDR"))

        serializer = SimpleRunnerJobSerializer(jobs, many=True)

        logger.debug(f"Runner {runner.name} requests for a job.")
        return Response({"availableJobs": serializer.data}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="accept")
    def accept_runner_job(self, request, uuid=None):
        runner = self._get_runner_from_token(request)
        job = self._get_job_from_uuid(uuid)
        if job.state != RunnerJobState.PENDING:
            return Response(
                "This job is not in pending state anymore",
                status=status.HTTP_409_CONFLICT,
            )

        job.state = RunnerJobState.PROCESSING
        job.processingJobToken = "ptrjt-" + str(uuid4())
        job.startedAt = timezone.now()
        job.runner = runner
        job.save()

        runner.update_last_contact(request.META.get("REMOTE_ADDR"))

        logger.info(
            f"Remote runner {runner.name} has accepted job {job.uuid} ({job.type})"
        )

        serializer = self.get_serializer(job)
        return Response({"job": serializer.data}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="abort")
    def abort_runner_job(self, request, uuid=None):
        runner = self._get_runner_from_token(request)
        job = self._get_job_from_uuid(uuid)
        job.failures += 1

        logger.info(
            f"Remote runner {runner.name} is aborting job {job.uuid} ({job.type})"
        )

        runner_job_handler = get_runner_job_handler_class(job)
        runner_job_handler().abort(runner_job=job)

        runner.update_last_contact(request.META.get("REMOTE_ADDR"))
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="error")
    def error_runner_job(self, request, uuid=None):
        runner = self._get_runner_from_token(request)
        job = self._get_job_from_uuid(uuid)
        job.failures += 1

        logger.error(
            f"Remote runner {runner.name} had an error with job {job.uuid} ({job.type})"
        )

        runner_job_handler = get_runner_job_handler_class(job)
        runner_job_handler().error(runner_job=job, message=request.data.get("message"))

        runner.update_last_contact(request.META.get("REMOTE_ADDR"))

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="update")
    def update_runner_job(self, request, uuid=None):
        runner = self._get_runner_from_token(request)
        job = self._get_job_from_uuid(uuid)

        runner_job_handler = get_runner_job_handler_class(job)

        runner_job_handler().update(
            runner_job=job, progress=request.data.get("progress")
        )

        runner.update_last_contact(request.META.get("REMOTE_ADDR"))

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="success")
    def success_runner_job(self, request, uuid=None):
        runner = self._get_runner_from_token(request)
        job = self._get_job_from_uuid(uuid)

        runner_job_handler = get_runner_job_handler_class(job)

        result = {
            "video_file": request.data.get("payload[videoFile]", None),
            "resolution_playlist_file": request.data.get(
                "payload[resolutionPlaylistFile]", None
            ),
        }

        runner_job_handler().complete(runner_job=job, result_payload=result)

        runner.update_last_contact(request.META.get("REMOTE_ADDR"))

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(
        detail=True,
        methods=["post"],
        url_path="files/videos/(?P<video_id>[^/.]+)/max-quality",
        url_name="download_video_file",
    )
    def download_video_file(self, request, uuid=None, video_id=None):
        runner = self._get_runner_from_token(request)
        job = self._get_job_from_uuid(uuid)
        video = self._get_video_from_uuid(video_id)

        logger.info(
            f"Get max quality file of video {video.uuid} of job {job.uuid} for runner {runner.name}"
        )

        video_file = video.get_max_quality_file()

        return FileResponse(video_storage.open(video_file.filename, "rb"))
