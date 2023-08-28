import logging

from ...models import RunnerJob, RunnerJobType
from .abstract_job_handler import AbstractJobHandler
from .live_rtmp_hls_transcoding_job_handler import LiveRTMPHLSTranscodingJobHandler
from .video_studio_transcoding_job_handler import VideoStudioTranscodingJobHandler
from .vod_audio_merge_transcoding_job_handler import VODAudioMergeTranscodingJobHandler
from .vod_hls_transcoding_job_handler import VODHLSTranscodingJobHandler
from .vod_web_video_transcoding_job_handler import VODWebVideoTranscodingJobHandler

logger = logging.getLogger(__name__)

processors: dict[RunnerJobType, type[AbstractJobHandler]] = {
    RunnerJobType.VOD_WEB_VIDEO_TRANSCODING: VODWebVideoTranscodingJobHandler,
    RunnerJobType.VOD_HLS_TRANSCODING: VODHLSTranscodingJobHandler,
    RunnerJobType.VOD_AUDIO_MERGE_TRANSCODING: VODAudioMergeTranscodingJobHandler,
    RunnerJobType.LIVE_RTMP_HLS_TRANSCODING: LiveRTMPHLSTranscodingJobHandler,
    RunnerJobType.VIDEO_STUDIO_TRANSCODING: VideoStudioTranscodingJobHandler,
}


def get_runner_job_handler_class(job: RunnerJob) -> type[AbstractJobHandler]:
    return processors[job.type]
