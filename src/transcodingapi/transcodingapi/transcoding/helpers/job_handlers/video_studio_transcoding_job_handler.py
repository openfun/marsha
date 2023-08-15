# from server.lib.video_studio import onVideoStudioEnded, safeCleanupStudioTMPFiles
# from server.models.video.video_job_info import VideoJobInfoModel
# from server.types.models import MVideo
# from ...models import RunnerJob, RunnerJobState
# from .abstract_job_handler import AbstractJobHandler
# from .shared import loadTranscodingRunnerVideo
# from .runner_urls import (
#     generateRunnerEditionTranscodingVideoInputFileUrl,
#     generateRunnerTranscodingVideoInputFileUrl,
# )

# import logging


# logger = logging.getLogger(__name__)


# class VideoStudioTranscodingJobHandler(AbstractJobHandler):
#     async def create(self, options):
#         video = options["video"]
#         tasks = options["tasks"]
#         priority = options["priority"]

#         job_uuid = build_uuid()

#         payload = RunnerJobStudioTranscodingPayload(
#             input={
#                 "videoFileUrl": generateRunnerTranscodingVideoInputFileUrl(
#                     job_uuid, video.uuid
#                 ),
#             },
#             tasks=list(map(lambda t: self._map_task(t, job_uuid, video.uuid), tasks)),
#         )

#         private_payload = RunnerJobVideoStudioTranscodingPrivatePayload(
#             videoUUID=video.uuid,
#             originalTasks=tasks,
#         )

#         job = await self.create_runner_job(
#             type="video-studio-transcoding",
#             jobUUID=job_uuid,
#             payload=payload,
#             privatePayload=private_payload,
#             priority=priority,
#         )

#         return job

#     async def specific_complete(self, options):
#         runner_job = options["runnerJob"]
#         result_payload = options["resultPayload"]
#         private_payload = runner_job.privatePayload

#         video = await loadTranscodingRunnerVideo(runner_job, self.lTags)
#         if not video:
#             await safeCleanupStudioTMPFiles(private_payload.originalTasks)
#             return

#         video_file_path = result_payload.videoFile

#         await onVideoStudioEnded(
#             video=video,
#             editionResultPath=video_file_path,
#             tasks=private_payload.originalTasks,
#         )

#         logger.info(
#             "Runner video edition transcoding job %s for %s ended.",
#             runner_job.uuid,
#             video.uuid,
#             self.lTags(video.uuid, runner_job.uuid),
#         )

#     def _map_task(self, task, job_uuid: str, video_uuid: str):
#         if (
#             isVideoStudioTaskIntro(task)
#             or isVideoStudioTaskOutro(task)
#             or isVideoStudioTaskWatermark(task)
#         ):
#             return {
#                 **task,
#                 "options": {
#                     **task["options"],
#                     "file": generateRunnerEditionTranscodingVideoInputFileUrl(
#                         job_uuid, video_uuid, basename(task["options"]["file"])
#                     ),
#                 },
#             }

#         return task

#     def specific_error(self, options):
#         if options["nextState"] == RunnerJobState.ERRORED:
#             return self.specific_error_or_cancel(options)

#         return super().specific_error(options)

#     def specific_cancel(self, options):
#         return self.specific_error_or_cancel(options)

#     def specific_error_or_cancel(self, options):
#         runner_job = options["runnerJob"]
#         payload = runner_job.privatePayload

#         safeCleanupStudioTMPFiles(payload.originalTasks)

#         video = await loadTranscodingRunnerVideo(runner_job, self.lTags)
#         if not video:
#             return

#         return video.setNewState(VideoState.PUBLISHED, False, None)
