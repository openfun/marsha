import { refreshToken } from 'data/sideEffects/refreshToken';
import { useJwt } from 'hooks/stores/useJwt';

let routesExclude = ['/account/api/token/', '/e2e/api/'];
let routesInclude = ['/api/', '/xapi/'];

export interface fetchReconnectWrapperOptions {
  isRetry?: boolean;
  routesExclude?: string[];
  routesInclude?: string[];
  verbose?: boolean;
}

export const fetchReconnectWrapper = async (
  input: RequestInfo,
  init?: RequestInit,
  options?: fetchReconnectWrapperOptions,
): Promise<Response> => {
  if (options?.routesExclude) {
    routesExclude = [...routesExclude, ...options.routesExclude];
  }
  if (options?.routesInclude) {
    routesInclude = [...routesInclude, ...options.routesInclude];
  }

  /**
   * Cases where we don't want to use the fetchWrapper.
   */
  const isExcluded = routesExclude.some((route) =>
    typeof input === 'string'
      ? input.includes(route)
      : input.url.includes(route),
  );
  const isIncluded = routesInclude.some((route) =>
    typeof input === 'string'
      ? input.includes(route)
      : input.url.includes(route),
  );
  const isNoRetry = typeof options?.isRetry === 'boolean' && !options.isRetry;
  if (isExcluded || !isIncluded || isNoRetry) {
    return await fetch(input, init);
  }

  // We need to clone the request to be able to use it twice if input is a Request object (PUT)
  const initialRequest = typeof input !== 'string' ? input.clone() : input;

  const response = await fetch(input, init);
  if (response.status !== 401) {
    return response;
  }

  const refreshJwt = useJwt.getState().getRefreshJwt();
  let jwt = useJwt.getState().getJwt();
  if (refreshJwt && jwt) {
    try {
      const token = await refreshToken(refreshJwt);
      useJwt.getState().setJwt(token.access);
      useJwt.getState().setRefreshJwt(token.refresh);
      return fetchReconnect(token.access, initialRequest, init);
    } catch (error) {
      if (options?.verbose) {
        console.error(error);
      }
      /**
       * - If multiple requests are made very quickly, the refresh token can be blacklisted,
       *   in this case, we try to reconnect with the potential new access token.
       */
      jwt = useJwt.getState().getJwt();
      if (jwt) {
        try {
          const response = await fetchReconnect(jwt, initialRequest, init);
          if (response.status === 401) {
            throw new Error('Access token is not valid');
          }
          return response;
        } catch (error) {
          if (options?.verbose) {
            console.error(error);
          }
        }
      }
    }
  }

  return logout(response);
};

const logout = (response: Response) => {
  useJwt.getState().resetJwt();
  return response;
};

const fetchReconnect = async (
  freshAccessToken: string,
  currentRequest: RequestInfo,
  init?: RequestInit,
): Promise<Response> => {
  if (typeof currentRequest !== 'string') {
    let body: BodyInit | null | undefined;
    if (currentRequest.body) {
      if (currentRequest.body.constructor.name === 'ReadableStream') {
        const bodyResult = await currentRequest.body
          .pipeThrough(new TextDecoderStream())
          .getReader()
          .read();

        body = bodyResult.value;
      } else if (currentRequest.body.constructor.name === 'Buffer') {
        body = currentRequest.body.toString();
      }
    }

    return fetch(
      new Request(currentRequest.url, {
        method: currentRequest.method,
        body,
        headers: {
          ...currentRequest.headers,
          'Content-Type':
            currentRequest.headers.get('content-Type') || undefined,
          Authorization: `Bearer ${freshAccessToken}`,
        },
      }),
    );
  } else {
    return fetch(currentRequest, {
      ...init,
      headers: {
        ...init?.headers,
        Authorization: `Bearer ${freshAccessToken}`,
      },
    });
  }
};
