import logging

from .abstract_vod_transcoding_job_handler import AbstractVODTranscodingJobHandler

logger = logging.getLogger(__name__)

# This file should reproduce:
# https://github.com/Chocobozzz/PeerTube/blob/develop/server/lib/runners/job-handlers/vod-audio-merge-transcoding-job-handler.ts


class VODAudioMergeTranscodingJobHandler(AbstractVODTranscodingJobHandler):
    pass
    # async def create(
    #     self,
    #     video: Video,
    #     resolution: int,
    #     fps: int,
    #     depends_on_runner_job: RunnerJob | None,
    #     priority: int,
    # ):
    #     job_uuid = uuid.uuid4()

    #     payload = {
    #         "input": {
    #             "audioFileUrl": generate_runner_transcoding_video_input_file_url(
    #                 job_uuid, video.uuid
    #             ),
    #             "previewFileUrl": generate_runner_transcoding_video_preview_file_url(
    #                 job_uuid, video.uuid
    #             ),
    #         },
    #         "output": {
    #             "resolution": resolution,
    #             "fps": fps,
    #         },
    #     }

    #     private_payload = {
    #         "isNewVideo": True,
    #         "videoUUID": video.uuid,
    #     }

    #     job = await self.create_runner_job(
    #         type="vod-audio-merge-transcoding",
    #         job_uuid=job_uuid,
    #         payload=payload,
    #         private_payload=private_payload,
    #         depends_on_runner_job=depends_on_runner_job,
    #         priority=priority,
    #     )

    #     await VideoJobInfo.increase_or_create(video.uuid, "pendingTranscode")

    #     return job

    # async def specific_complete(self, runner_job, result_payload):
    #     private_payload = runner_job.privatePayload

    #     video = await load_transcoding_runner_video(runner_job)
    #     if not video:
    #         return

    #     video_file_path = result_payload.videoFile

    #     # ffmpeg generated a new video file, so update the video duration
    #     # See https://trac.ffmpeg.org/ticket/5456
    #     video.duration = await get_video_stream_duration(video_file_path)
    #     await video.save()

    #     # We can remove the old audio file
    #     old_audio_file = video.files[0]
    #     await old_audio_file.remove_web_video_file()
    #     await old_audio_file.delete()

    #     await on_vod_web_video_or_audio_merge_transcoding_job(
    #         video=video,
    #         video_file_path=video_file_path,
    #         private_payload=private_payload,
    #     )

    #     logger.info(
    #         "Runner VOD audio merge transcoding job %s for %s ended.",
    #         runner_job.uuid,
    #         video.uuid,
    #         self.lTags(video.uuid, runner_job.uuid),
    #     )
