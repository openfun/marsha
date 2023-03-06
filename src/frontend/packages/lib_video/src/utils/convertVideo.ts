import { Maybe } from 'lib-common';
import { Live, LiveJitsi, LiveModeType, Video } from 'lib-components';

function isLive(video: Video | Live): video is Live {
  return video.is_live;
}

export const convertVideoToLive = (video: Video): Maybe<Live> => {
  if (isLive(video)) {
    return {
      ...video,
      live_state: video.live_state,
      live_type: video.live_type,
    };
  }

  return undefined;
};

export const convertLiveToJitsiLive = (live: Live): Maybe<LiveJitsi> => {
  if (
    live.live_type === LiveModeType.JITSI &&
    live.live_info.jitsi?.external_api_url &&
    live.live_info.jitsi.domain
  ) {
    return {
      ...live,
      live_info: {
        ...live.live_info,
        jitsi: {
          ...live.live_info.jitsi,
          external_api_url: live.live_info.jitsi.external_api_url,
          domain: live.live_info.jitsi.domain,
        },
      },
      live_type: LiveModeType.JITSI,
    };
  }

  return undefined;
};

export const convertVideoToJitsiLive = (video: Video): Maybe<LiveJitsi> => {
  if (
    video.live_type === LiveModeType.JITSI &&
    video.live_info.jitsi?.external_api_url &&
    video.live_info.jitsi.domain &&
    isLive(video)
  ) {
    return {
      ...video,
      live_state: video.live_state,
      live_info: {
        ...video.live_info,
        jitsi: {
          ...video.live_info.jitsi,
          external_api_url: video.live_info.jitsi.external_api_url,
          domain: video.live_info.jitsi.domain,
        },
      },
      live_type: LiveModeType.JITSI,
    };
  }
  return undefined;
};
