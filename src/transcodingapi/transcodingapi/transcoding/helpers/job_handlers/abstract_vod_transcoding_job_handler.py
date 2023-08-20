from __future__ import annotations

import logging

from ...models import RunnerJobState, VideoJobInfo
from ..video_state import move_to_failed_transcoding_state, move_to_next_state
from .abstract_job_handler import AbstractJobHandler
from .utils import load_transcoding_runner_video

logger = logging.getLogger(__name__)


class AbstractVODTranscodingJobHandler(AbstractJobHandler):
    def is_abort_supported(self):
        return True

    def specific_update(self, options):
        pass

    def specific_abort(self, options):
        pass

    def specific_error(self, runner_job, message, next_state):
        if next_state != RunnerJobState.ERRORED:
            return

        video = load_transcoding_runner_video(runner_job)
        if not video:
            return

        move_to_failed_transcoding_state(video)
        VideoJobInfo.decrease(video.uuid, "pendingTranscode")

    def specific_cancel(self, runner_job):
        video = load_transcoding_runner_video(runner_job)
        if not video:
            return

        pending = VideoJobInfo.decrease(video.uuid, "pendingTranscode")

        logger.debug(
            f"Pending transcode decreased to {pending} after cancel",
            self.lTags(video.uuid),
        )

        if pending == 0:
            logger.info(
                f"All transcoding jobs of {video.uuid} have been "
                "processed or canceled, moving it to its next state",
            )

            private_payload = runner_job.privatePayload
            move_to_next_state(video=video, is_new_video=private_payload.isNewVideo)
