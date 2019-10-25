import Plyr from 'plyr';

import { appData, getDecodedJwt } from '../data/appData';
import { useTranscriptTimeSelectorApi } from '../data/stores/useTranscriptTimeSelector';
import { intl } from '../index';
import {
  InitializedContextExtensions,
  InteractedContextExtensions,
} from '../types/XAPI';
import { report } from '../utils/errors/report';
import { isMSESupported } from '../utils/isAbrSupported';
import { XAPIStatement } from '../XAPI/XAPIStatement';
import { i18nMessages } from './i18n/plyrTranslation';

export const createPlyrPlayer = (
  ref: HTMLVideoElement,
  dispatchPlayerTimeUpdate: (time: number) => void,
): Plyr => {
  const settings = ['captions', 'speed', 'loop'];
  if (!isMSESupported()) {
    settings.push('quality');
  }

  const player = new Plyr(ref, {
    captions: {
      active: true,
      update: true,
    },
    i18n: {
      advertisement: intl.formatMessage(i18nMessages.advertisement),
      all: intl.formatMessage(i18nMessages.all),
      buffered: intl.formatMessage(i18nMessages.buffered),
      captions: intl.formatMessage(i18nMessages.captions),
      currentTime: intl.formatMessage(i18nMessages.currentTime),
      disableCaptions: intl.formatMessage(i18nMessages.disableCaptions),
      disabled: intl.formatMessage(i18nMessages.disabled),
      download: intl.formatMessage(i18nMessages.download),
      duration: intl.formatMessage(i18nMessages.duration),
      enableCaptions: intl.formatMessage(i18nMessages.enableCaptions),
      enabled: intl.formatMessage(i18nMessages.enabled),
      end: intl.formatMessage(i18nMessages.end),
      enterFullscreen: intl.formatMessage(i18nMessages.enterFullscreen),
      exitFullscreen: intl.formatMessage(i18nMessages.exitFullscreen),
      fastForward: intl.formatMessage(i18nMessages.fastForward),
      frameTitle: intl.formatMessage(i18nMessages.frameTitle),
      loop: intl.formatMessage(i18nMessages.loop),
      menuBack: intl.formatMessage(i18nMessages.menuBack),
      mute: intl.formatMessage(i18nMessages.mute),
      normal: intl.formatMessage(i18nMessages.normal),
      pause: intl.formatMessage(i18nMessages.pause),
      play: intl.formatMessage(i18nMessages.play),
      played: intl.formatMessage(i18nMessages.played),
      quality: intl.formatMessage(i18nMessages.quality),
      qualityBadge: {
        2160: intl.formatMessage(i18nMessages[2160]),
        1440: intl.formatMessage(i18nMessages[1440]),
        1080: intl.formatMessage(i18nMessages[1080]),
        720: intl.formatMessage(i18nMessages[720]),
        576: intl.formatMessage(i18nMessages[576]),
        480: intl.formatMessage(i18nMessages[480]),
      },
      reset: intl.formatMessage(i18nMessages.reset),
      restart: intl.formatMessage(i18nMessages.restart),
      rewind: intl.formatMessage(i18nMessages.rewind),
      seek: intl.formatMessage(i18nMessages.seek),
      seekLabel: intl.formatMessage(i18nMessages.seekLabel),
      settings: intl.formatMessage(i18nMessages.settings),
      speed: intl.formatMessage(i18nMessages.speed),
      start: intl.formatMessage(i18nMessages.start),
      unmute: intl.formatMessage(i18nMessages.unmute),
      volume: intl.formatMessage(i18nMessages.volume),
    },
    iconUrl: appData.static.svg.plyr,
    seekTime: 5,
    settings,
  });

  if (player.elements.buttons.play) {
    if (Array.isArray(player.elements.buttons.play)) {
      player.elements.buttons.play.forEach(button => {
        // the tabIndex of this play button is set to -1. It must not be
        // focusable when a user navigate with their keyboard. The play button in
        // control bar is enough.
        if (button.classList.contains('plyr__control--overlaid')) {
          button.tabIndex = -1;
          button.setAttribute('aria-hidden', 'true');
        }
      });
    } else {
      const playButton = player.elements.buttons.play;
      if (playButton.classList.contains('plyr__control--overlaid')) {
        playButton.tabIndex = -1;
        playButton.setAttribute('aria-hidden', 'true');
      }
    }
  }

  useTranscriptTimeSelectorApi.subscribe(
    time => (player.currentTime = time as number),
    {
      selector: state => state.time,
    },
  );

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

  const changePlayButtonAriaLabel = (label: string) => {
    // change button control aria-label to given label.
    const playButtons = document.querySelectorAll('button[data-plyr="play"]');
    for (const playButton of playButtons) {
      if (playButton.hasAttribute('aria-label')) {
        playButton.setAttribute('aria-label', label);
      }
    }
  };

  // canplay is the event when the video is really initialized and
  // information can be found in plyr object. Don't use ready event
  player.on('canplay', event => {
    if (true === isInitialized) {
      return;
    }
    isInitialized = true;

    const contextExtensions: InitializedContextExtensions = {
      ccSubtitleEnabled: player.currentTrack === -1 ? false : true,
      fullScreen: player.fullscreen.active,
      length: player.duration,
      speed: `${player.speed || 1}x`,
      volume: player.volume,
    };

    if (player.currentTrack > -1 && player.source.tracks) {
      const track = player.source.tracks[player.currentTrack];

      if (track.srcLang) {
        contextExtensions.ccSubtitleLanguage = track.srcLang;
      }
    }
    xapiStatement.initialized(contextExtensions);
  });

  player.on('playing', event => {
    xapiStatement.played({
      time: player.currentTime,
    });

    changePlayButtonAriaLabel(player.config.i18n.pause);
  });

  player.on('pause', event => {
    xapiStatement.paused({
      time: player.currentTime,
    });

    changePlayButtonAriaLabel(player.config.i18n.play);
  });

  /**************** Seeked statement ***********************/
  player.on('timeupdate', event => {
    if (true === isInitialized && false === player.seeking) {
      currentTime = player.currentTime;
    }
  });

  player.on('seeking', event => {
    if (false === isInitialized) {
      return;
    }

    seekingAt = currentTime;
    hasSeeked = true;
  });
  player.on('seeked', event => {
    if (false === isInitialized) {
      // this is a workaround to force the player to stay on the first frame (time code 0)
      // while the video is not played. Without this, the state seeks a little bit
      // when loaded and the poster is not displayed.
      // see: https://github.com/sampotts/plyr/issues/1397
      player.currentTime = 0;
      return;
    }
    if (false === hasSeeked) {
      return;
    }
    hasSeeked = false;
    xapiStatement.seeked({
      timeFrom: seekingAt,
      timeTo: player.currentTime,
    });
  });

  /**************** Interacted event *************************/
  const interacted = (event: Plyr.PlyrEvent): void => {
    if (false === isInitialized) {
      return;
    }

    const contextExtensions: InteractedContextExtensions = {
      ccSubtitleEnabled: player.currentTrack === -1 ? false : true,
      fullScreen: player.fullscreen.active,
      quality: player.quality,
      speed: `${player.speed || 1}x`,
      volume: player.volume,
    };

    if (player.currentTrack > -1 && player.source.tracks) {
      const track = player.source.tracks[player.currentTrack];

      if (track.srcLang) {
        contextExtensions.ccSubtitleLanguage = track.srcLang;
      }
    }
    xapiStatement.interacted({ time: player.currentTime }, contextExtensions);
  };

  player.on('captionsdisabled', event => interacted(event));
  player.on('captionsenabled', event => interacted(event));
  player.on('enterfullscreen', event => interacted(event));
  player.on('exitfullscreen', event => interacted(event));
  player.on('languagechange', event => interacted(event));
  player.on('qualitychange', event => interacted(event));
  player.on('ratechange', event => interacted(event));
  player.on('volumechange', event => interacted(event));
  /**************** End interacted event *************************/

  /**************** Dispatch time updated ************************/
  player.on('timeupdate', event => {
    dispatchPlayerTimeUpdate(player.currentTime);
  });
  /**************** End dispatch time updated *********************/

  player.on('ended', event => {
    // change button control aria-label to play.
    changePlayButtonAriaLabel(player.config.i18n.play);
  });

  window.addEventListener('unload', () => {
    if (false === isInitialized) {
      return;
    }

    xapiStatement.terminated({ time: player.currentTime });
  });

  return player;
};
