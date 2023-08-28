from django.contrib import admin

from transcode_api.models import (
    Runner,
    RunnerJob,
    RunnerRegistrationToken,
    Video,
    VideoFile,
    VideoJobInfo,
    VideoStreamingPlaylist,
)


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


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ("uuid", "name", "state", "duration", "thumbnailFilename")


@admin.register(VideoStreamingPlaylist)
class VideoStreamingPlaylistAdmin(admin.ModelAdmin):
    list_display = ("id", "playlistFilename", "video")


@admin.register(VideoFile)
class VideoFileAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "resolution",
        "size",
        "extname",
        "fps",
        "createdAt",
        "updatedAt",
    )
    list_filter = ("resolution", "createdAt", "updatedAt")
    search_fields = ("id", "extname", "filename", "torrentFilename")


@admin.register(VideoJobInfo)
class VideoJobInfoAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "createdAt",
        "updatedAt",
        "pendingMove",
        "pendingTranscode",
        "video",
    )
    list_filter = ("createdAt", "updatedAt", "pendingMove", "pendingTranscode")
    search_fields = ("id", "video__id")

    def video(self, obj):
        return obj.video.id

    video.short_description = "Video ID"
