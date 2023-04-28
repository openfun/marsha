import { isLocalStorageEnabled } from 'lib-components';

export function getLocalStorage() {
  if (isLocalStorageEnabled()) {
    return localStorage;
  }
  return undefined;
}
