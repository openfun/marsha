from rest_framework import serializers

from transcode_api.models import (
    Runner,
    RunnerJob,
    RunnerJobState,
    RunnerRegistrationToken,
)


class RunnerRegistrationTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = RunnerRegistrationToken
        fields = ("id", "registrationToken")


class RunnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Runner
        fields = (
            "id",
            "name",
            "runnerToken",
        )
        read_only_fields = (
            "runnerRegistrationToken",
            "lastContact",
            "ip",
        )


class SimpleRunnerJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = RunnerJob
        fields = (
            "uuid",
            "type",
            "payload",
        )


class BaseRunnerJobSerializer(serializers.ModelSerializer):
    state = serializers.SerializerMethodField(read_only=True)

    def get_state(self, obj):
        return {
            "id": obj.state,
            "label": RunnerJobState(obj.state).label,
        }


class ParentRunnerJobSerializer(BaseRunnerJobSerializer):
    class Meta:
        model = RunnerJob
        fields = (
            "id",
            "uuid",
            "type",
            "state",
        )


class RunnerJobSerializer(BaseRunnerJobSerializer):
    jobToken = serializers.CharField(source="processingJobToken", read_only=True)
    runner = RunnerSerializer()
    parent = ParentRunnerJobSerializer(source="dependsOnRunnerJob")

    class Meta:
        model = RunnerJob
        fields = (
            "uuid",
            "type",
            "state",
            "progress",
            "priority",
            "failures",
            "error",
            "payload",
            "startedAt",
            "finishedAt",
            "jobToken",
            "runner",
            "parent",
        )
