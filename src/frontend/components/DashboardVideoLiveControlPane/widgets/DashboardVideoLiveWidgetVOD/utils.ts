import { liveState, Video } from 'types/tracks';

export const shouldDisplayDefaultMessage = (video: Video) => {
  return (
    (video.live_state !== liveState.STOPPED &&
      video.live_state !== liveState.HARVESTED) ||
    !video.recording_time ||
    video.recording_time <= 0
  );
};
