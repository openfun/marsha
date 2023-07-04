import 'video.js/dist/video-js.css';

import 'videojs-contrib-quality-levels';
import 'videojs-http-source-selector';
import './videojs/qualitySelectorPlugin';
import './videojs/p2pHlsPlugin';
import { Maybe, Nullable } from 'lib-common';
import {
  useCurrentSession,
  useJwt,
  liveState,
  Video,
  videoSize,
  Id3VideoType,
  report,
  InitializedContextExtensions,
  InteractedContextExtensions,
  VideoXAPIStatementInterface,
  XAPIStatement,
  useVideo,
  useP2PConfig,
} from 'lib-components';
import videojs, {
  VideoJsPlayer,
  VideoJsPlayerOptions,
  VideoJsPlayerPluginOptions,
} from 'video.js';

import { pushAttendance } from '@lib-video/api/pushAttendance';
import { useAttendance } from '@lib-video/hooks/useAttendance';
import { useTranscriptTimeSelector } from '@lib-video/hooks/useTranscriptTimeSelector';
import {
  QualityLevels,
  VideoJsExtendedSourceObject,
} from '@lib-video/types/libs/video.js/extend';
import { getOrInitAnonymousId } from '@lib-video/utils/getOrInitAnonymousId';
import { isMSESupported } from '@lib-video/utils/isMSESupported';

import { Events } from './videojs/qualitySelectorPlugin/types';

type Id3MessageType = {
  video: Id3VideoType;
};

export const createVideojsPlayer = (
  videoNode: HTMLVideoElement,
  dispatchPlayerTimeUpdate: (time: number) => void,
  video: Video,
  locale: Maybe<string>,
  onReady: Maybe<(player: VideoJsPlayer) => void> = undefined,
): VideoJsPlayer => {
  const { jwt } = useJwt.getState();
  const videoState = useVideo.getState();
  let lastReceivedVideo: Id3VideoType;
  const { isP2PEnabled } = useP2PConfig.getState();
  // This property should be deleted once the feature has been
  // deployed, tested and approved in a production environment
  const isP2pQueryEnabled = new URLSearchParams(window.location.search).has(
    'p2p',
  );

  if (!video.urls) {
    throw new Error('urls are not defined.');
  }
  const urls = video.urls;

  // add the video-js class name to the video attribute.
  videoNode.classList.add('video-js', 'vjs-big-play-centered');

  const sources: VideoJsExtendedSourceObject[] = [];
  const plugins: VideoJsPlayerPluginOptions = {};
  const anonymousId = getOrInitAnonymousId();

  if (!isMSESupported()) {
    plugins.qualitySelector = {
      default: '480',
    };
    Object.keys(urls.mp4)
      .map((size) => Number(size) as videoSize)
      .sort((a, b) => b - a)
      .forEach((size) => {
        sources.push({
          type: 'video/mp4',
          src: urls.mp4[size] ?? '',
          size: size.toString(),
        });
      });
  } else {
    sources.push({
      type: 'application/x-mpegURL',
      src: urls.manifests.hls,
    });
  }

  const options: VideoJsPlayerOptions = {
    autoplay: video.is_live,
    controls: true,
    debug: false,
    fluid: true,
    html5: {
      vhs: {
        // prevent to have a resolution selected higher than
        // the player size. By default this is set to true.
        // We set it to true here to remember this undocumented option.
        limitRenditionByPlayerDimensions: true,
        overrideNative: !videojs.browser.IS_SAFARI,
        // take the device pixel ratio into account when doing rendition switching.
        // This means that if you have a player with the width of 540px in a high density
        // display with a device pixel ratio of 2, a rendition of 1080p will be allowed.
        useDevicePixelRatio: true,
      },
      nativeAudioTracks: videojs.browser.IS_SAFARI,
      nativeVideoTracks: videojs.browser.IS_SAFARI,
    },
    language: locale,
    liveui: video.is_live,
    playbackRates: video.is_live ? [] : [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 4],
    plugins,
    responsive: true,
    sources,
  };

  const player = videojs(videoNode, options, function () {
    if (video.is_live) {
      videoState.setIsWatchingVideo(true);
      this.play();
    }
    onReady?.(this);
  });

  player.on('loadedmetadata', () => {
    const tracks = player.textTracks();
    for (let index = 0; index < tracks.length; index++) {
      const track = tracks[index];
      if (track.label === 'Timed Metadata') {
        track.addEventListener('cuechange', () => {
          // VTTCue normally doesn't have value property
          // Nonetheless, value is set when cue comes from id3 tags
          // and has a property key: "TXXX" in it
          const cue = track.activeCues?.[0] as
            | { value: { key: string } | undefined; text: string }
            | undefined;
          if (cue) {
            if (cue.value?.key !== 'PRIV') {
              // cue.text should be a video object
              const data = JSON.parse(cue.text) as Id3MessageType;
              if (
                data &&
                useVideo.getState().isWatchingVideo &&
                JSON.stringify(data.video) !== JSON.stringify(lastReceivedVideo)
              ) {
                lastReceivedVideo = data.video;
                videoState.setId3Video(data.video);
              }
            }
          }
        });
      }
    }
  });

  if (isMSESupported()) {
    if (isP2pQueryEnabled && isP2PEnabled) {
      player.p2pHlsPlugin();
    }
    player.httpSourceSelector();
    const qualityLevels = player.qualityLevels();
    qualityLevels.on('change', () => interacted(qualityLevels));
  } else {
    player.on(Events.PLAYER_SOURCES_CHANGED, () => interacted());
  }

  const tracks = player.remoteTextTracks();

  const unsubscribeTranscriptTimeSelector = useTranscriptTimeSelector.subscribe(
    (state) => state.time,
    (time) => player.currentTime(time),
  );

  player.on('ended', () => {
    videoState.setId3Video(null);
    videoState.setIsWatchingVideo(false);
  });

  // When the player is dispose, unsubscribe to the useTranscriptTimeSelector store.
  player.on('dispose', () => {
    videoState.setId3Video(null);
    videoState.setIsWatchingVideo(false);
    unsubscribeTranscriptTimeSelector();
  });

  /************************** XAPI **************************/

  if (!jwt) {
    throw new Error('Authenticated jwt is required.');
  }

  let xapiStatement: VideoXAPIStatementInterface;
  try {
    xapiStatement = XAPIStatement(
      jwt,
      useCurrentSession.getState().sessionId,
      video,
    );
  } catch (error) {
    report(error);
    throw error;
  }

  let currentTime = 0;
  let seekingAt = 0;
  let hasSeeked = false;
  let isInitialized = false;
  let interval: number;
  const hasAttendance =
    video.live_state === liveState.RUNNING && video.can_edit === false;

  const trackAttendance = () => {
    const attendance = {
      [Math.round(Date.now() / 1000)]: {
        fullScreen: player.isFullscreen(),
        muted: player.muted(),
        player_timer: player.currentTime(),
        playing: !player.paused(),
        timestamp: Date.now(),
        volume: player.volume(),
      },
    };
    if (!locale) {
      throw new Error('Locale is undefined.');
    }
    pushAttendance(video.id, attendance, locale, anonymousId);
  };
  const getCurrentTrack = (): Nullable<TextTrack> => {
    // TextTrackList is not an iterable object
    for (let i = 0; i < tracks.length; i++) {
      if (tracks[i].mode === 'showing') {
        return tracks[i];
      }
    }

    return null;
  };
  let currentTrack = getCurrentTrack();

  const initialize = () => {
    if (isInitialized) {
      return;
    }

    const contextExtensions: InitializedContextExtensions = {
      ccSubtitleEnabled: currentTrack !== null,
      fullScreen: player.isFullscreen(),
      length: player.duration(),
      speed: `${player.playbackRate()}x`,
      volume: player.volume(),
    };

    xapiStatement.initialized(contextExtensions);
    isInitialized = true;
    // setTimer
    if (hasAttendance) {
      const delay = useAttendance.getState().delay;
      interval = player.setInterval(trackAttendance, delay);
    }
  };

  player.on('canplaythrough', initialize);

  player.on('play', () => {
    xapiStatement.played({
      time: player.currentTime(),
    });
  });

  player.on('pause', () => {
    xapiStatement.paused({
      time: player.currentTime(),
    });
  });

  /**************** Seeked statement ***********************/

  player.on('timeupdate', () => {
    if (isInitialized && !player.seeking()) {
      currentTime = player.currentTime();
    }
    dispatchPlayerTimeUpdate(player.currentTime());
  });

  player.on('seeking', () => {
    seekingAt = currentTime;
    hasSeeked = true;
  });

  player.on('seeked', () => {
    if (!hasSeeked) {
      return;
    }
    hasSeeked = false;
    xapiStatement.seeked({
      timeFrom: seekingAt,
      timeTo: player.currentTime(),
    });
  });

  /**************** Interacted event *************************/
  const interacted = (qualityLevels?: QualityLevels): void => {
    if (!isInitialized) {
      // For a live video, no event to detect when the video is fully initialized is triggered
      // before the first "play" action. To mitigate this, we can call "initialize"
      // on the first "interact" action and we don't log this interaction. The first interact
      // action is when the first quality to play is chosen, the default one. To choose it,
      // all quality available must be read in the HLS manifest. So we can consider at this
      // time that the video is initialized.
      if (video.is_live) {
        initialize();
      }
      return;
    }
    let quality: string | number | undefined;

    if (qualityLevels) {
      quality = qualityLevels[qualityLevels.selectedIndex]?.height;
    } else {
      quality = player.currentSource().size;
    }

    const contextExtensions: InteractedContextExtensions = {
      ccSubtitleEnabled: currentTrack !== null,
      fullScreen: player.isFullscreen(),
      quality,
      speed: `${player.playbackRate()}x`,
      volume: player.volume(),
    };

    if (currentTrack !== null) {
      contextExtensions.ccSubtitleLanguage = currentTrack.language;
    }
    xapiStatement.interacted({ time: player.currentTime() }, contextExtensions);
  };

  player.on('fullscreenchange', () => interacted());
  player.on('languagechange', () => interacted());
  player.on('ratechange', () => interacted());
  player.on('volumechange', () => interacted());
  tracks.addEventListener('change', () => {
    currentTrack = getCurrentTrack();
    interacted();
  });
  /**************** End interacted event *************************/

  window.addEventListener('unload', () => {
    if (!isInitialized) {
      return;
    }

    xapiStatement.terminated({ time: player.currentTime() });

    if (interval) {
      player.clearInterval(interval);
    }
  });

  return player;
};
