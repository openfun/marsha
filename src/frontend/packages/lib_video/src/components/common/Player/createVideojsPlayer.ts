import 'video.js/dist/video-js.css';

import 'videojs-contrib-quality-levels';
import 'videojs-http-source-selector';
import './videojs/qualitySelectorPlugin';
import { Maybe, Nullable } from 'lib-common';
import {
  useCurrentSession,
  useJwt,
  liveState,
  Video,
  videoSize,
  report,
  InitializedContextExtensions,
  InteractedContextExtensions,
  VideoXAPIStatementInterface,
  XAPIStatement,
} from 'lib-components';
import videojs, {
  VideoJsPlayer,
  VideoJsPlayerOptions,
  VideoJsPlayerPluginOptions,
} from 'video.js';

import { pushAttendance } from 'api/pushAttendance';
import { useAttendance } from 'hooks/useAttendance';
import { useTranscriptTimeSelector } from 'hooks/useTranscriptTimeSelector';
import {
  QualityLevels,
  VideoJsExtendedSourceObject,
} from 'types/libs/video.js/extend';
import { getOrInitAnonymousId } from 'utils/getOrInitAnonymousId';
import { isMSESupported } from 'utils/isMSESupported';

import { Events } from './videojs/qualitySelectorPlugin/types';

export const createVideojsPlayer = (
  videoNode: HTMLVideoElement,
  dispatchPlayerTimeUpdate: (time: number) => void,
  video: Video,
  locale: Maybe<string>,
  onReady: Maybe<(player: VideoJsPlayer) => void> = undefined,
): VideoJsPlayer => {
  const { getDecodedJwt, jwt } = useJwt.getState();

  if (!video.urls) {
    throw new Error('urls are not defined.');
  }
  const urls = video.urls;

  // add the video-js class name to the video attribute.
  videoNode.classList.add('video-js', 'vjs-big-play-centered');

  const isLive =
    video.live_state !== null && video.live_state !== liveState.ENDED;

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
    autoplay: isLive,
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
    liveui: isLive,
    playbackRates: isLive ? [] : [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 4],
    plugins,
    responsive: true,
    sources,
  };

  const player = videojs(videoNode, options, function () {
    if (isLive) {
      this.play();
    }

    onReady?.(this);
  });

  if (isMSESupported()) {
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

  // When the player is dispose, unsubscribe to the useTranscriptTimeSelector store.
  player.on('dispose', () => {
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
    video.live_state === liveState.RUNNING &&
    getDecodedJwt().permissions.can_update === false;

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
    pushAttendance(attendance, locale, anonymousId);
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
      if (isLive) {
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
