from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from transcodingapi.transcoding.helpers.runner_socket import (
    runner_socket,
)

if TYPE_CHECKING:
    from ...models import RunnerJob, RunnerJobState

logger = logging.getLogger(__name__)


class AbstractJobHandler(ABC):
    @abstractmethod
    async def create(self, options: dict) -> RunnerJob:
        pass

    async def create_runner_job(
        self,
        type: str,
        job_uuid: UUID,
        payload: dict,
        private_payload: dict,
        priority: int,
        depends_on_runner_job: RunnerJob | None,
    ) -> RunnerJob:
        runner_job = RunnerJob(
            type=type,
            payload=payload,
            privatePayload=private_payload,
            uuid=job_uuid,
            state=RunnerJobState.WAITING_FOR_PARENT_JOB
            if depends_on_runner_job
            else RunnerJobState.PENDING,
            dependsOnRunnerJob=depends_on_runner_job,
            priority=priority,
        )

        runner_job.save()

        if runner_job.state == RunnerJobState.PENDING:
            runner_socket.send_available_jobs_ping_to_runners()

        return runner_job

    @abstractmethod
    async def specific_update(
        self,
        runner_job: RunnerJob,
        update_payload=None,
    ) -> None:
        pass

    async def update(
        self,
        runner_job: RunnerJob,
        progress: int | None = None,
        update_payload=None,
    ) -> None:
        await self.specific_update(runner_job, update_payload=update_payload)

        if progress is not None:
            runner_job.progress = progress

        runner_job.save()

    @abstractmethod
    async def specific_complete(self, runner_job: RunnerJob, result_payload) -> None:
        pass

    async def complete(self, runner_job: RunnerJob, result_payload) -> None:
        runner_job.state = RunnerJobState.COMPLETING
        runner_job.save()

        try:
            await self.specific_complete(runner_job, result_payload)
            runner_job.state = RunnerJobState.COMPLETED
        except Exception as err:
            runner_job.state = RunnerJobState.ERRORED
            runner_job.error = err.message

        runner_job.progress = None
        runner_job.finished_at = datetime.now()

        runner_job.save()

        affected_count = await RunnerJob.update_dependant_jobs_of(
            runner_job
        )  # TODO: Implement this
        if affected_count != 0:
            runner_socket.send_available_jobs_ping_to_runners()

    @abstractmethod
    async def specific_cancel(self, runner_job: RunnerJob) -> None:
        pass

    async def cancel(self, runner_job: RunnerJob, from_parent: bool = False) -> None:
        await self.specific_cancel(runner_job)

        cancel_state = (
            RunnerJobState.PARENT_CANCELLED if from_parent else RunnerJobState.CANCELLED
        )
        runner_job.set_to_error_or_cancel(cancel_state)

        runner_job.save()

        children = await RunnerJob.list_children_of(runner_job)
        for child in children:
            await self.cancel(child, from_parent=True)

    @abstractmethod
    def is_abort_supported(self) -> bool:
        pass

    async def abort(self, runner_job: RunnerJob) -> None:
        if not self.is_abort_supported():
            return self.error(
                runner_job,
                "Job has been aborted but it is not supported by this job type",
            )

        await self.specific_abort(runner_job)
        runner_job.reset_to_pending()
        runner_job.save()

    def set_abort_state(self, runner_job: RunnerJob) -> None:
        runner_job.reset_to_pending()

    @abstractmethod
    async def specific_abort(self, runner_job: RunnerJob) -> None:
        pass

    async def error(
        self, runner_job: RunnerJob, message: str, from_parent: bool = False
    ) -> None:
        error_state = (
            RunnerJobState.PARENT_ERRORED if from_parent else RunnerJobState.ERRORED
        )
        next_state = (
            error_state
            if runner_job.failures >= 5  # TODO: to put in settings
            or not self.is_abort_supported()
            else RunnerJobState.PENDING
        )

        await self.specific_error(runner_job, message, next_state)

        if next_state == error_state:
            runner_job.set_to_error_or_cancel(error_state)
            runner_job.error = message
        else:
            runner_job.reset_to_pending()

        runner_job.save()

        if runner_job.state == error_state:
            children = await runner_job.list_children().all()
            for child in children:
                await self.error(child, "Parent error", from_parent=True)

    @abstractmethod
    async def specific_error(
        self, runner_job: RunnerJob, message: str, next_state: RunnerJobState
    ) -> None:
        pass
