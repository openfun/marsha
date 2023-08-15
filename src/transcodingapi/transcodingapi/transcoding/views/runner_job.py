import uuid

from django.core.exceptions import ObjectDoesNotExist
from django.http import Http404
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..helpers.job_handlers.class_handler import get_runner_job_handler_class
from ..models import Runner, RunnerJob, RunnerJobState
from ..serializers import (
    RunnerJobSerializer,
    SimpleRunnerJobSerializer,
)
from .mixins import ListMixin


class RunnerJobViewSet(mixins.DestroyModelMixin, ListMixin, viewsets.GenericViewSet):
    queryset = RunnerJob.objects.all()
    serializer_class = RunnerJobSerializer

    def _get_runner_from_token(self, request):
        try:
            runner = Runner.objects.get(runnerToken=request.data.get("runnerToken", ""))
        except ObjectDoesNotExist:
            raise Http404("Unknown runner token")
        return runner

    def _get_job_from_uuid(self, uuid):
        try:
            runner = self.get_queryset().get(uuid=uuid)
        except ObjectDoesNotExist:
            raise Http404("Unknown job uuid")
        return runner

    @action(detail=False, methods=["post"], url_path="request")
    def request(self, request):
        runner = self._get_runner_from_token(request)
        jobs = RunnerJob.objects.list_available_jobs()

        runner.update_last_contact(request.META.get("REMOTE_ADDR"))

        serializer = SimpleRunnerJobSerializer(jobs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="accept")
    def accept_runner_job(self, request, pk=None):
        runner = self._get_runner_from_token(request)
        job = self._get_job_from_uuid(pk)

        if job.state is not RunnerJobState.PENDING:
            return Response(
                status=status.HTTP_409_CONFLICT,
                message="This job is not in pending state anymore",
            )

        job.state = RunnerJobState.PROCESSING
        job.processingJobToken = "ptrjt-" + str(uuid.uuid4())
        job.startedAt = timezone.datetime.now()
        job.runner = runner
        job.save()

        runner.update_last_contact(request.META.get("REMOTE_ADDR"))

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="abort")
    def abort_runner_job(self, request, pk=None):
        runner = self._get_runner_from_token(request)
        job = self.get_queryset().get(uuid=pk)
        job.failure += 1

        runner_job_handler = get_runner_job_handler_class(job.type)
        runner_job_handler().abort(runner_job=job)

        runner.update_last_contact(request.META.get("REMOTE_ADDR"))
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="error")
    def error_runner_job(self, request, pk=None):
        runner = self._get_runner_from_token(request)
        job = self.get_queryset().get(uuid=pk)
        job.failure += 1

        runner.update_last_contact(request.META.get("REMOTE_ADDR"))

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="success")
    def success(self, request, pk=None):
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="update")
    def update_runner_job(self, request, pk=None):
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel_runner_job(self, request, pk=None):
        return Response(status=status.HTTP_204_NO_CONTENT)
