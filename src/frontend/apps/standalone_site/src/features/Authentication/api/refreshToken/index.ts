import { TokenResponse } from 'features/Authentication/model/response';

const isValidate = (response: unknown): response is TokenResponse => {
  if (response && typeof response === 'object') {
    const loginResponse = response as TokenResponse;
    const access: unknown = loginResponse.access;
    const refresh: unknown = loginResponse.refresh;
    if (access && typeof access === 'string') {
      if (refresh && typeof refresh === 'string') {
        return true;
      }
    }
  }

  return false;
};

export const refreshToken = async (
  refreshToken: string,
  signal?: AbortSignal,
) => {
  const response = await fetch('/account/api/token/refresh/', {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({ refresh: refreshToken }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`refresh token error`);
  }

  const responseContent: unknown = await response.json();
  if (isValidate(responseContent)) {
    return responseContent;
  }

  throw new Error('Missing token in response.');
};
