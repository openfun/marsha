import { getDecodedJwt } from 'data/appData';
import { checkLtiToken } from './checkLtiToken';
import { getAnonymousId, setAnonymousId } from './localstorage';

export const getOrInitAnonymousId = () => {
  const decodedJwt = getDecodedJwt();
  let anonymousId = decodedJwt.user?.anonymous_id;
  if (anonymousId) {
    setAnonymousId(anonymousId);
  } else if (!checkLtiToken(decodedJwt)) {
    anonymousId = getAnonymousId();
  }

  return anonymousId;
};
