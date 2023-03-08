import {
  AnonymousUser,
  checkLtiToken,
  decodeJwt,
  useCurrentUser,
  useJwt,
} from 'lib-components';

import { getAnonymousId, setAnonymousId } from './localstorage';

export const getOrInitAnonymousId = () => {
  const jwt = useJwt.getState().getJwt();
  const user = useCurrentUser.getState().currentUser;
  let anonymousId =
    user !== AnonymousUser.ANONYMOUS ? user?.anonymous_id : undefined;

  try {
    if (anonymousId) {
      setAnonymousId(anonymousId);
    } else if (!checkLtiToken(decodeJwt(jwt))) {
      anonymousId = getAnonymousId();
    }
  } catch (e) {
    anonymousId = getAnonymousId();
  }

  return anonymousId;
};
