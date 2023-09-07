from __future__ import annotations

import logging

from django_peertube_runner_connector.models import RunnerJob, RunnerJobState
from django_peertube_runner_connector.utils.job_handlers.abstract_job_handler import AbstractJobHandler
from django_peertube_runner_connector.utils.job_handlers.utils import load_transcoding_runner_video
from django_peertube_runner_connector.utils.video_state import (
    move_to_failed_transcoding_state,
    move_to_next_state,
)

logger = logging.getLogger(__name__)


class AbstractVODTranscodingJobHandler(AbstractJobHandler):
    def is_abort_supported(self):
        return True

    def specific_update(
        self,
        runner_job: RunnerJob,
        update_payload=None,
    ) -> None:
        pass

    def specific_abort(self, runner_job: RunnerJob) -> None:
        pass

    def specific_error(self, runner_job, message, next_state):
        if next_state != RunnerJobState.ERRORED:
            return

        video = load_transcoding_runner_video(runner_job)
        if not video:
            return

        move_to_failed_transcoding_state(video)
        video.decrease_job_info("pendingTranscode")

    def specific_cancel(self, runner_job):
        video = load_transcoding_runner_video(runner_job)
        if not video:
            return

        pending = video.decrease_job_info("pendingTranscode")

        logger.debug(
            f"Pending transcode decreased to {pending} after cancel",
        )

        if pending == 0:
            logger.info(
                f"All transcoding jobs of {video.uuid} have been "
                "processed or canceled, moving it to its next state",
            )

            private_payload = runner_job.privatePayload
            move_to_next_state(video=video, is_new_video=private_payload["isNewVideo"])
