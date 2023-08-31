import uuid

from django.core.exceptions import ObjectDoesNotExist
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from transcode_api.forms import (
    RunnerForm,
)
from transcode_api.models import Runner, RunnerRegistrationToken
from transcode_api.serializers import (
    RunnerSerializer,
)

from .mixins import ListMixin


class RunnerViewSet(mixins.DestroyModelMixin, ListMixin, viewsets.GenericViewSet):
    queryset = Runner.objects.all()
    serializer_class = RunnerSerializer

    @action(detail=False, methods=["post"], url_path="register")
    def register(self, request):
        try:
            form = RunnerForm(request.data)
            runner = form.save(commit=False)
        except ValueError:
            return Response({"errors": [dict(form.errors)]}, status=400)

        try:
            runnerRegistrationToken = RunnerRegistrationToken.objects.get(
                registrationToken=request.data.get("registrationToken", "")
            )
        except ObjectDoesNotExist:
            return Response(
                status=status.HTTP_404_NOT_FOUND,
                data={"message": "Registration token is invalid"},
            )

        runner.runnerToken = "ptrt-" + str(uuid.uuid4())
        runner.ip = request.META.get("REMOTE_ADDR")
        runner.runnerRegistrationToken = runnerRegistrationToken
        runner.lastContact = timezone.datetime.now(tz=timezone.utc)
        runner.save()

        serializer = self.get_serializer(runner)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="unregister")
    def unregister(self, request):
        try:
            runner = Runner.objects.get(runnerToken=request.data.get("runnerToken", ""))
        except ObjectDoesNotExist:
            return Response(
                status=status.HTTP_404_NOT_FOUND,
                data={"message": "Registration token is invalid"},
            )
        runner.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
