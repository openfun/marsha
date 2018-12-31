import jwt_decode from 'jwt-decode';
import Plyr from 'plyr';
import { DecodedJwt } from 'types/jwt';
import * as xapi from '../XAPI';

export function createPlyrPlayer(ref: HTMLVideoElement, jwt: string): Plyr {
  const player = new Plyr(ref);
  const decodedToken: DecodedJwt = jwt_decode(jwt);

  // canplay is the event when the video is really initialized and
  // information can be found in plyr object. Don't use ready event
  player.on('canplay', event => {
    const plyr = event.detail.plyr;
    const contextExtensions: xapi.InitializedContextExtensions = {
      ccSubtitleEnabled: plyr.currentTrack === -1 ? false : true,
      fullScreen: plyr.fullscreen.active,
      length: plyr.duration,
      sessionId: decodedToken.session_id,
      speed: `${plyr.speed || 1}x`,
      volume: plyr.volume,
    };

    if (plyr.currentTrack > -1 && plyr.source.tracks) {
      const track = plyr.source.tracks[plyr.currentTrack];

      if (track.srcLang) {
        contextExtensions.ccSubtitleLanguage = track.srcLang;
      }
    }
    xapi.initialized(jwt, contextExtensions);
  });

  player.on('playing', event => {});

  return player;
};
