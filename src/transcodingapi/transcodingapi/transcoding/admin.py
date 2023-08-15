from django.contrib import admin

from .models import Runner, RunnerJob, RunnerRegistrationToken


@admin.register(RunnerRegistrationToken)
class RunnerRegistrationTokenAdmin(admin.ModelAdmin):
    list_display = ("registrationToken", "createdAt", "updatedAt")


@admin.register(Runner)
class RunnerAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "description",
        "lastContact",
        "ip",
        "createdAt",
        "updatedAt",
        "runnerRegistrationToken",
    )


@admin.register(RunnerJob)
class RunnerJobAdmin(admin.ModelAdmin):
    list_display = (
        "uuid",
        "type",
        "payload",
        "privatePayload",
        "state",
        "failures",
        "error",
        "priority",
        "processingJobToken",
        "progress",
        "startedAt",
        "finishedAt",
        "createdAt",
        "updatedAt",
        "dependsOnRunnerJob",
        "runner",
    )
