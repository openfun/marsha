from __future__ import annotations

import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ...models import RunnerJobState, VideoJobInfo

from ..video_state import move_to_failed_transcoding_state, move_to_next_state
from .abstract_job_handler import AbstractJobHandler
from .utils import load_transcoding_runner_video

logger = logging.getLogger(__name__)


class AbstractVODTranscodingJobHandler(AbstractJobHandler):
    def isAbortSupported(self):
        return True

    def specificUpdate(self, options):
        pass

    def specificAbort(self, options):
        pass

    async def specificError(self, options):
        if options["nextState"] != RunnerJobState.ERRORED:
            return

        runner_job = options["runnerJob"]
        video = await load_transcoding_runner_video(runner_job)
        if not video:
            return

        await move_to_failed_transcoding_state(video)
        await VideoJobInfo.decrease(video.uuid, "pendingTranscode")

    async def specificCancel(self, options):
        runner_job = options["runnerJob"]
        video = await load_transcoding_runner_video(runner_job)
        if not video:
            return

        pending = await VideoJobInfo.decrease(video.uuid, "pendingTranscode")

        logger.debug(
            f"Pending transcode decreased to {pending} after cancel",
            self.lTags(video.uuid),
        )

        if pending == 0:
            logger.info(
                f"All transcoding jobs of {video.uuid} have been "
                "processed or canceled, moving it to its next state",
                self.lTags(video.uuid),
            )

            private_payload = runner_job.privatePayload
            move_to_next_state(video=video, is_new_video=private_payload.isNewVideo)
