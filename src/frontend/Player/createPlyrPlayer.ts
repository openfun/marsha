import jwt_decode from 'jwt-decode';
import Plyr from 'plyr';
import { DecodedJwt } from 'types/jwt';
import { InitializedContextExtensions } from '../types/XAPI';
import { XAPIStatement } from '../XAPI/XAPIStatement';

export const createPlyrPlayer = (ref: HTMLVideoElement, jwt: string): Plyr => {
  const player = new Plyr(ref, { debug: true });
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

  player.on('timeupdate', event => {
    if (true === isInitialized && false === event.detail.plyr.seeking) {
      currentTime = event.detail.plyr.currentTime;
    }
  });
  player.on('seeking', event => {
    if (true === isInitialized) {
      return;
    }

    seekingAt = currentTime;
    hasSeeked = true;
  });
  player.on('seeked', event => {
    if (false === hasSeeked || false === isInitialized) {
      return;
    }
    hasSeeked = false;
    xapiStatement.seeked({
      timeFrom: seekingAt,
      timeTo: event.detail.plyr.currentTime,
    });
  });

  player.on('ended', event => {
    xapiStatement.completed({});
  });

  return player;
};
