import jwt_decode from 'jwt-decode';
import Plyr from 'plyr';
import { Dispatch } from 'redux';

import { notifyPlayerTimeUpdate } from '../data/player/actions';
import { DecodedJwt } from '../types/jwt';
import {
  InitializedContextExtensions,
  InteractedContextExtensions,
} from '../types/XAPI';
import { isMSESupported } from '../utils/isAbrSupported';
import { XAPIStatement } from '../XAPI/XAPIStatement';

export const createPlyrPlayer = (
  ref: HTMLVideoElement,
  jwt: string,
  dispatch: Dispatch,
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
    settings,
  });
  const decodedToken: DecodedJwt = jwt_decode(jwt);

  const xapiStatement = new XAPIStatement(jwt, decodedToken.session_id);

  let currentTime: number = 0;
  let seekingAt: number = 0;
  let hasSeeked: boolean = false;
  let isInitialized = false;

  // canplay is the event when the video is really initialized and
  // information can be found in plyr object. Don't use ready event
  player.on('canplay', event => {
    if (true === isInitialized) {
      return;
    }
    isInitialized = true;

    const plyr = event.detail.plyr;
    const contextExtensions: InitializedContextExtensions = {
      ccSubtitleEnabled: plyr.currentTrack === -1 ? false : true,
      fullScreen: plyr.fullscreen.active,
      length: plyr.duration,
      speed: `${plyr.speed || 1}x`,
      volume: plyr.volume,
    };

    if (plyr.currentTrack > -1 && plyr.source.tracks) {
      const track = plyr.source.tracks[plyr.currentTrack];

      if (track.srcLang) {
        contextExtensions.ccSubtitleLanguage = track.srcLang;
      }
    }
    xapiStatement.initialized(contextExtensions);
  });

  player.on('playing', event => {
    xapiStatement.played({
      time: event.detail.plyr.currentTime,
    });
  });

  player.on('pause', event => {
    xapiStatement.paused(
      {},
      {
        time: event.detail.plyr.currentTime,
      },
    );
  });

  /**************** Seeked statement ***********************/
  player.on('timeupdate', event => {
    if (true === isInitialized && false === event.detail.plyr.seeking) {
      currentTime = event.detail.plyr.currentTime;
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
      event.detail.plyr.currentTime = 0;
      return;
    }
    if (false === hasSeeked) {
      return;
    }
    hasSeeked = false;
    xapiStatement.seeked({
      timeFrom: seekingAt,
      timeTo: event.detail.plyr.currentTime,
    });
  });

  /**************** Interacted event *************************/
  const interacted = (event: Plyr.PlyrEvent): void => {
    if (false === isInitialized) {
      return;
    }

    const plyr = event.detail.plyr;
    const contextExtensions: InteractedContextExtensions = {
      ccSubtitleEnabled: plyr.currentTrack === -1 ? false : true,
      fullScreen: plyr.fullscreen.active,
      quality: plyr.quality,
      speed: `${plyr.speed || 1}x`,
      volume: plyr.volume,
    };

    if (plyr.currentTrack > -1 && plyr.source.tracks) {
      const track = plyr.source.tracks[plyr.currentTrack];

      if (track.srcLang) {
        contextExtensions.ccSubtitleLanguage = track.srcLang;
      }
    }
    xapiStatement.interacted(contextExtensions);
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
    dispatch(notifyPlayerTimeUpdate(event.detail.plyr.currentTime));
  });
  /**************** End dispatch time updated *********************/

  return player;
};
