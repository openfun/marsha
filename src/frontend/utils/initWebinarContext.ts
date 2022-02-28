import { getDecodedJwt } from 'data/appData';
import { getLiveRegistrations } from 'data/sideEffects/getLiveRegistrations';
import { pushAttendance } from 'data/sideEffects/pushAttendance';
import { useLiveRegistration } from 'data/stores/useLiveRegistration';
import { Video } from 'types/tracks';
import { checkLtiToken } from './checkLtiToken';
import { getAnonymousId, setAnonymousId } from './localstorage';

export const initWebinarContext = async (video: Video) => {
  // if not a live, stop it.
  if (!video.live_state) return;

  // If live registration already present, stop it.
  if (useLiveRegistration.getState().liveRegistration) return;
  const decodedJwt = getDecodedJwt();
  let anonymousId = decodedJwt.user?.anonymous_id;
  if (anonymousId) {
    setAnonymousId(anonymousId);
  } else if (!checkLtiToken(decodedJwt)) {
    anonymousId = getAnonymousId();
  }

  // check if registered
  const results = await getLiveRegistrations(anonymousId);
  // There is a record, we use it
  if (results.count > 0) {
    useLiveRegistration.getState().setLiveRegistration(results.results[0]);
  } else {
    // push an empty attendance to create the live registration
    // and then register it in the store
    useLiveRegistration
      .getState()
      .setLiveRegistration(await pushAttendance({}, anonymousId));
  }
};
