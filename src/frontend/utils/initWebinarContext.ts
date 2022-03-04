import { getDecodedJwt } from 'data/appData';
import { getLiveSessions } from 'data/sideEffects/getLiveSessions';
import { pushAttendance } from 'data/sideEffects/pushAttendance';
import { useLiveSession } from 'data/stores/useLiveSession';
import { Video } from 'types/tracks';
import { checkLtiToken } from './checkLtiToken';
import { getAnonymousId, setAnonymousId } from './localstorage';

export const initWebinarContext = async (video: Video) => {
  // if not a live, stop it.
  if (!video.live_state) return;

  // If live registration already present, stop it.
  if (useLiveSession.getState().liveSession) return;
  const decodedJwt = getDecodedJwt();
  let anonymousId = decodedJwt.user?.anonymous_id;
  if (anonymousId) {
    setAnonymousId(anonymousId);
  } else if (!checkLtiToken(decodedJwt)) {
    anonymousId = getAnonymousId();
  }

  // check if registered
  const results = await getLiveSessions(anonymousId);
  // There is a record, we use it
  if (results.count > 0) {
    useLiveSession.getState().setLiveSession(results.results[0]);
  } else {
    // push an empty attendance to create the live registration
    // and then register it in the store
    useLiveSession
      .getState()
      .setLiveSession(await pushAttendance({}, anonymousId));
  }
};
