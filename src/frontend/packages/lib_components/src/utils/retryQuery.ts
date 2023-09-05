import { FetchResponseError } from './errors/exception';

type ShouldRetryFunction<TError> = (
  failureCount: number,
  error: TError,
) => boolean;

export const retryQuery: ShouldRetryFunction<unknown> = (
  failureCount: number,
  error,
) => {
  if (error instanceof FetchResponseError && error.status === 403) {
    return false;
  }
  return failureCount < 3;
};
