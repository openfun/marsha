import { FetchResponseError } from '@lib-components/utils/errors/exception';

interface fetchResponseHandlerOptions {
  errorMessage?: string | { [key: number]: string }; // 'Bad Request' | { 400: 'Bad Request', 401: 'Unauthorized' }
  invalidStatus?: number[];
  withoutBody?: boolean;
}

export const fetchResponseHandler = async <T>(
  response: Response,
  options?: fetchResponseHandlerOptions,
): Promise<T> => {
  const { errorMessage, invalidStatus, withoutBody } = { ...options };

  if (response.ok) {
    if (withoutBody) {
      return {} as unknown as T;
    } else {
      return (await response.json()) as T;
    }
  }

  let bodyResponse;
  try {
    bodyResponse = withoutBody ? undefined : ((await response.json()) as T);
  } catch (e) {
    bodyResponse = {};
  }

  let message = '';
  if (errorMessage) {
    message = errorMessage[response.status] || '';
    if (!message) {
      message = typeof errorMessage === 'string' ? errorMessage : '';
    }
  }
  if (!message) {
    message = response.statusText || 'Unknown error';
  }

  throw new FetchResponseError({
    code:
      response.status === 400 || invalidStatus?.includes(response.status)
        ? 'invalid'
        : 'exception',
    status: response.status,
    message,
    response: response,
    ...bodyResponse,
  });
};
