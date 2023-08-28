from __future__ import annotations

import logging
import os
import uuid

from transcode_api.models import RunnerJob, RunnerJobType, Video
from transcode_api.storage import video_storage
from transcode_api.utils.files import (
    build_new_file,
    generate_hls_video_filename,
    get_hls_resolution_playlist_filename,
    get_video_directory,
)
from transcode_api.utils.transcoding.hls_playlist import (
    on_hls_video_file_transcoding,
    rename_video_file_in_playlist,
)

from .abstract_vod_transcoding_job_handler import AbstractVODTranscodingJobHandler
from .utils import (
    generate_runner_transcoding_video_input_file_url,
    load_transcoding_runner_video,
    on_transcoding_ended,
)

logger = logging.getLogger(__name__)


class VODHLSTranscodingJobHandler(AbstractVODTranscodingJobHandler):
    def create(self, video: Video, resolution, fps, depends_on_runner_job, priority):
        job_uuid = uuid.uuid4()

        payload = {
            "input": {
                "videoFileUrl": generate_runner_transcoding_video_input_file_url(
                    str(job_uuid), str(video.uuid)
                ),
            },
            "output": {
                "resolution": resolution,
                "fps": fps,
            },
        }

        private_payload = {
            "isNewVideo": False,
            "deleteWebVideoFiles": False,
            "videoUUID": str(video.uuid),
        }

        job = self.create_runner_job(
            type=RunnerJobType.VOD_HLS_TRANSCODING,
            job_uuid=job_uuid,
            payload=payload,
            private_payload=private_payload,
            priority=priority,
            depends_on_runner_job=depends_on_runner_job,
        )

        video.increase_or_create_job_info("pendingTranscode")

        return job

    def specific_complete(self, runner_job: RunnerJob, result_payload):
        private_payload = runner_job.privatePayload

        video = load_transcoding_runner_video(runner_job)
        if not video:
            return

        # Saving the mp4 file in the video folder and creating the VideoFile object
        uploaded_video_file = result_payload["video_file"]
        resolution = runner_job.payload["output"]["resolution"]
        filename = video_storage.save(
            get_video_directory(video, generate_hls_video_filename(resolution)),
            uploaded_video_file,
        )
        video_file = build_new_file(video=video, filename=filename, mode="hls")

        # Saving the associated m3u8 file
        resolution_playlist_file = result_payload["resolution_playlist_file"]
        resolution_playlist_filename = video_storage.save(
            get_hls_resolution_playlist_filename(video_file.filename),
            resolution_playlist_file,
        )
        resolution_playlist_file_path = video_storage.path(resolution_playlist_filename)

        # The content of the m3u8 file is not correct, we need to replace the video filename
        # because we gave it a new name
        rename_video_file_in_playlist(
            resolution_playlist_file_path, os.path.basename(video_file.filename)
        )

        on_hls_video_file_transcoding(
            video=video,
            video_file=video_file,
        )

        on_transcoding_ended(
            is_new_video=private_payload["isNewVideo"],
            move_video_to_next_state=True,
            video=video,
        )

        if private_payload["deleteWebVideoFiles"]:
            logger.info(
                "Removing web video files of %s now we have a HLS version of it.",
                video.uuid,
            )

            video.remove_all_web_video_files()

        logger.info(
            "Runner VOD HLS job %s for %s ended.",
            runner_job.uuid,
            video.uuid,
        )
