import 'video.js/dist/video-js.css';
import videojs, {
  VideoJsPlayer,
  VideoJsPlayerOptions,
  VideoJsPlayerPluginOptions,
} from 'video.js';
import 'videojs-contrib-quality-levels';
import 'videojs-http-source-selector';
import './videojs/qualitySelectorPlugin';

import { appData, getDecodedJwt } from '../data/appData';
import { useTranscriptTimeSelector } from '../data/stores/useTranscriptTimeSelector';
import {
  QualityLevels,
  VideoJsExtendedSourceObject,
} from '../types/libs/video.js/extend';
import { Video, videoSize } from '../types/tracks';
import {
  InitializedContextExtensions,
  InteractedContextExtensions,
} from '../types/XAPI';
import { report } from '../utils/errors/report';
import { isMSESupported } from '../utils/isMSESupported';
import { Nullable } from '../utils/types';
import { VideoXAPIStatementInterface, XAPIStatement } from '../XAPI';

import { intl } from '../index';
import { Events } from './videojs/qualitySelectorPlugin/types';

export const createVideojsPlayer = (
  videoNode: HTMLVideoElement,
  dispatchPlayerTimeUpdate: (time: number) => void,
  video: Video,
): VideoJsPlayer => {
  // add the video-js class name to the video attribute.
  videoNode.classList.add('video-js', 'vjs-big-play-centered');

  const sources: VideoJsExtendedSourceObject[] = [];
  const plugins: VideoJsPlayerPluginOptions = {};

  if (!isMSESupported()) {
    plugins.qualitySelector = {
      default: '480',
    };
    Object.keys(video.urls!.mp4)
      .map((size) => Number(size) as videoSize)
      .sort((a, b) => b - a)
      .forEach((size) => {
        sources.push({
          type: 'video/mp4',
          src: video.urls!.mp4[size]!,
          size: size.toString(),
        });
      });
  } else {
    sources.push({
      type: 'application/x-mpegURL',
      src: video.urls!.manifests.hls,
    });
  }

  const options: VideoJsPlayerOptions = {
    autoplay: !!video.live_state,
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
    language: intl.locale,
    liveui: video.live_state !== null,
    playbackRates:
      video.live_state !== null ? [] : [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 4],
    plugins,
    responsive: true,
    sources,
  };

  const player = videojs(videoNode, options);

  if (isMSESupported()) {
    player.httpSourceSelector();
    const qualityLevels = player.qualityLevels();
    qualityLevels.on('change', () => interacted(qualityLevels));
  } else {
    player.on(Events.PLAYER_SOURCES_CHANGED, () => interacted());
  }

  const tracks = player.remoteTextTracks();

  useTranscriptTimeSelector.subscribe(
    (state) => state.time,
    (time) => player.currentTime(time),
  );

  /************************** XAPI **************************/

  let xapiStatement: VideoXAPIStatementInterface;
  try {
    xapiStatement = XAPIStatement(
      appData.jwt!,
      getDecodedJwt().session_id,
      video,
    );
  } catch (error) {
    report(error);
    throw error;
  }

  let currentTime: number = 0;
  let seekingAt: number = 0;
  let hasSeeked: boolean = false;
  let isInitialized: boolean = false;

  const getCurrentTrack = (): Nullable<TextTrack> => {
    // TextTrackList is not an iterable object
    // tslint:disable-next-line:prefer-for-of
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
      if (video.live_state) {
        initialize();
      }
      return;
    }
    let quality: string | number;

    if (qualityLevels) {
      quality = qualityLevels[qualityLevels.selectedIndex]?.height;
    } else {
      quality = player.currentSource().size!;
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
  });

  return player;
};
