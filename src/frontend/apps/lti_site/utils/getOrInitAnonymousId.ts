import {
  AnonymousUser,
  decodeJwt,
  useCurrentUser,
  useJwt,
} from 'lib-components';

import { checkLtiToken } from './checkLtiToken';
import { getAnonymousId, setAnonymousId } from './localstorage';

export const getOrInitAnonymousId = () => {
  const jwt = useJwt.getState().jwt;
  const user = useCurrentUser.getState().currentUser;
  let anonymousId =
    user !== AnonymousUser.ANONYMOUS ? user?.anonymous_id : undefined;
  if (anonymousId) {
    setAnonymousId(anonymousId);
  } else if (!checkLtiToken(decodeJwt(jwt))) {
    anonymousId = getAnonymousId();
  }

  return anonymousId;
};
