import { report, isLocalStorageEnabled } from 'lib-components';
import { v4 as uuidv4 } from 'uuid';

export const ANONYMOUS_ID_KEY = 'marsha_anonymous_id';

export const getAnonymousId = (): string => {
  if (!isLocalStorageEnabled()) {
    return uuidv4();
  }

  let anonymousId = localStorage.getItem(ANONYMOUS_ID_KEY);

  if (!anonymousId) {
    anonymousId = uuidv4();
    try {
      setAnonymousId(anonymousId);
    } catch (e) {
      report(e);
      return anonymousId;
    }
  }

  return anonymousId;
};

export const setAnonymousId = (anonymousId: string): void => {
  if (isLocalStorageEnabled()) {
    localStorage.setItem(ANONYMOUS_ID_KEY, anonymousId);
  }
};
