import logging
from enum import IntEnum

from .abstract_job_handler import AbstractJobHandler

logger = logging.getLogger(__name__)


class LiveVideoError(IntEnum):
    BAD_SOCKET_HEALTH = 1
    DURATION_EXCEEDED = 2
    QUOTA_EXCEEDED = 3
    FFMPEG_ERROR = 4
    BLACKLISTED = 5
    RUNNER_JOB_ERROR = 6
    RUNNER_JOB_CANCEL = 7


class LiveRTMPHLSTranscodingJobHandler(AbstractJobHandler):
    pass
    # async def create(self, options: CreateOptions) -> RunnerJob:
    #     video = options["video"]
    #     rtmpUrl = options["rtmpUrl"]
    #     toTranscode = options["toTranscode"]
    #     playlist = options["playlist"]
    #     segmentDuration = options["segmentDuration"]
    #     segmentListSize = options["segmentListSize"]
    #     outputDirectory = options["outputDirectory"]
    #     sessionId = options["sessionId"]

    #     jobUUID = str(uuid4())
    #     payload = {
    #         "input": {
    #             "rtmpUrl": rtmpUrl,
    #         },
    #         "output": {
    #             "toTranscode": toTranscode,
    #             "segmentListSize": segmentListSize,
    #             "segmentDuration": segmentDuration,
    #         },
    #     }

    #     privatePayload = {
    #         "videoUUID": video.uuid,
    #         "masterPlaylistName": playlist.playlistFilename,
    #         "sessionId": sessionId,
    #         "outputDirectory": outputDirectory,
    #     }

    #     job = await self.createRunnerJob(
    #         type="live-rtmp-hls-transcoding",
    #         jobUUID=jobUUID,
    #         payload=payload,
    #         privatePayload=privatePayload,
    #         priority=100,  # TODO: get priority from settings,
    #     )

    #     return job

    # async def specificUpdate(self, runnerJob: RunnerJob, updatePayload) -> None:
    #     privatePayload = runnerJob.privatePayload
    #     outputDirectory = privatePayload.outputDirectory
    #     videoUUID = privatePayload.videoUUID

    #     if updatePayload.type == "add-chunk":
    #         move(
    #             updatePayload.videoChunkFile,
    #             join(outputDirectory, updatePayload.videoChunkFilename),
    #         )
    #     elif updatePayload.type == "remove-chunk":
    #         os.remove(join(outputDirectory, updatePayload.videoChunkFilename))

    #     if (
    #         updatePayload.resolutionPlaylistFile
    #         and updatePayload.resolutionPlaylistFilename
    #     ):
    #         move(
    #             updatePayload.resolutionPlaylistFile,
    #             join(outputDirectory, updatePayload.resolutionPlaylistFilename),
    #         )

    #     if updatePayload.masterPlaylistFile:
    #         move(
    #             updatePayload.masterPlaylistFile,
    #             join(outputDirectory, privatePayload.masterPlaylistName),
    #         )

    #     logger.debug(
    #         f"Runner live RTMP to HLS job {runnerJob.uuid} for {videoUUID} updated.",
    #         extra={
    #             "updatePayload": updatePayload,
    #             **self.lTags(videoUUID, runnerJob.uuid),
    #         },
    #     )

    # def specificComplete(self, runnerJob: RunnerJob) -> None:
    #     self.stopLive(runnerJob, "ended")

    # def isAbortSupported(self) -> bool:
    #     return False

    # def specificAbort(self) -> None:
    #     raise NotImplementedError("Not implemented")

    # def specificError(self, runnerJob: RunnerJob, nextState: RunnerJobState) -> None:
    #     self.stopLive(runnerJob, "errored")

    # def specificCancel(self, runnerJob: RunnerJob) -> None:
    #     self.stopLive(runnerJob, "cancelled")

    # def stopLive(self, runnerJob: RunnerJob, type: str) -> None:
    #     privatePayload = runnerJob.privatePayload
    #     videoUUID = privatePayload.videoUUID

    #     # TODO: Live management ?
    #     # LiveManager.Instance.stopSessionOf(privatePayload.videoUUID, errorType[type])

    #     logger.info(
    #         f"Runner live RTMP to HLS job {runnerJob.uuid} for video {videoUUID} {type}.",
    #         extra={
    #             **self.lTags(runnerJob.uuid, videoUUID),
    #         },
    #     )
