import { v4 as uuidv4 } from 'uuid';

import { report } from './errors/report';

export const ANONYMOUS_ID_KEY = 'marsha_anonymous_id';

const localStorageEnabled = (): boolean => {
  try {
    localStorage.setItem('enabled', '1');
    localStorage.removeItem('enabled');
    return true;
  } catch (e) {
    return false;
  }
};

const isLocaleStorageEnabled = localStorageEnabled();

export const getAnonymousId = (): string => {
  if (!isLocaleStorageEnabled) {
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
  if (isLocaleStorageEnabled) {
    localStorage.setItem(ANONYMOUS_ID_KEY, anonymousId);
  }
};
