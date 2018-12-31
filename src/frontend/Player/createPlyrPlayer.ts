import jwt_decode from 'jwt-decode';
import Plyr from 'plyr';
import { DecodedJwt } from 'types/jwt';
import { InitializedContextExtensions } from '../types/XAPI';
import { XAPIStatement } from '../XAPI/XAPIStatement';

export const createPlyrPlayer = (ref: HTMLVideoElement, jwt: string): Plyr => {
  const player = new Plyr(ref, { debug: true });
  const decodedToken: DecodedJwt = jwt_decode(jwt);

  const xapiStatement = new XAPIStatement(jwt, decodedToken.session_id);

  // canplay is the event when the video is really initialized and
  // information can be found in plyr object. Don't use ready event
  player.on('canplay', event => {
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

  return player;
};
