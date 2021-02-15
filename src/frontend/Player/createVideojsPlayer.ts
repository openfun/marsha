import 'video.js/dist/video-js.css';
import videojs, { VideoJsPlayer, VideoJsPlayerOptions } from 'video.js';
import 'videojs-contrib-quality-levels';
import 'videojs-http-source-selector';
import './videojs/qualitySelectorPlugin';

import { appData, getDecodedJwt } from '../data/appData';
import { QualityLevels } from '../types/libs/video.js/extend';
import { Video } from '../types/tracks';
import {
  InitializedContextExtensions,
  InteractedContextExtensions,
} from '../types/XAPI';
import { report } from '../utils/errors/report';
import { isMSESupported } from '../utils/isMSESupported';
import { Nullable } from '../utils/types';
import { XAPIStatement } from '../XAPI/XAPIStatement';

import { intl } from '../index';
import { Events } from './videojs/qualitySelectorPlugin/types';

export const createVideojsPlayer = (
  videoNode: HTMLVideoElement,
  dispatchPlayerTimeUpdate: (time: number) => void,
  video: Video,
): VideoJsPlayer => {
  // add the video-js class name to the video attribute.
  videoNode.classList.add('video-js', 'vjs-big-play-centered');

  const options: VideoJsPlayerOptions = {
    controls: true,
    debug: false,
    fluid: true,
    html5: {
      vhs: {
        overrideNative: !videojs.browser.IS_SAFARI,
      },
    },
    language: intl.locale,
    liveui: video.live_state !== null,
    playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 4],
    responsive: true,
  };

  if (!isMSESupported()) {
    options.plugins = {
      qualitySelector: {
        default: '480',
      },
    };
  }

  const player = videojs(videoNode, options);

  if (isMSESupported()) {
    player.httpSourceSelector();
    const qualityLevels = player.qualityLevels();
    qualityLevels.on('change', () => interacted(qualityLevels));
  } else {
    player.on(Events.PLAYER_SOURCES_CHANGED, () => interacted());
  }

  const tracks = player.remoteTextTracks();

  /************************** XAPI **************************/

  let xapiStatement: XAPIStatement;
  try {
    xapiStatement = new XAPIStatement(appData.jwt!, getDecodedJwt().session_id);
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

  player.on('canplaythrough', () => {
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
  });

  player.on('playing', () => {
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
