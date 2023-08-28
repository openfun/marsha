import uuid

from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from transcode_api.models import RunnerRegistrationToken
from transcode_api.serializers import (
    RunnerRegistrationTokenSerializer,
)

from .mixins import ListMixin


class RunnerRegistrationTokenViewSet(
    mixins.DestroyModelMixin, ListMixin, viewsets.GenericViewSet
):
    queryset = RunnerRegistrationToken.objects.all()
    serializer_class = RunnerRegistrationTokenSerializer

    @action(detail=False, methods=["post"], url_path="generate")
    def generate(self, request):
        serializer = self.get_serializer(
            data={"registrationToken": "ptrrt-" + str(uuid.uuid4())}
        )
        serializer.is_valid(raise_exception=True)
        runner = serializer.save()

        serializer = self.get_serializer(runner)

        return Response(serializer.data, status=status.HTTP_201_CREATED)
