import {
  AnonymousUser,
  checkToken,
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

  if (anonymousId) {
    setAnonymousId(anonymousId);
  } else if (!checkToken(decodeJwt(jwt))) {
    anonymousId = getAnonymousId();
  }

  return anonymousId;
};
