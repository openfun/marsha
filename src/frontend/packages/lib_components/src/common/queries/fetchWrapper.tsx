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
  if (!options?.withoutReconnectWrapper) {
    return fetchReconnectWrapper(input, init, options?.optionsReconnectWrapper);
  }

  return fetch(input, init);
};
