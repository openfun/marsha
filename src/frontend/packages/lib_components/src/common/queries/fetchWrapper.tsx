import { getIntl } from 'lib-common';

import {
  fetchReconnectWrapper,
  fetchReconnectWrapperOptions,
} from './fetchReconnectWrapper';

interface FetchWrapperOptions {
  withoutReconnectWrapper?: boolean;
  optionsReconnectWrapper?: fetchReconnectWrapperOptions;
}

export const fetchWrapper = (
  input: RequestInfo,
  init?: RequestInit,
  options?: FetchWrapperOptions,
): Promise<Response> => {
  const headers = init?.headers as Record<string, string> | undefined;
  init = {
    ...init,
    headers: {
      ...headers,
      'Accept-Language': headers?.['Accept-Language'] || getIntl().locale,
    },
  };

  if (!options?.withoutReconnectWrapper) {
    return fetchReconnectWrapper(input, init, options?.optionsReconnectWrapper);
  }

  return fetch(input, init);
};
