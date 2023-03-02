import { fetchWrapper, TokenResponse } from 'lib-components';

const isValidateChallenge = (response: unknown): response is TokenResponse => {
  if (response && typeof response === 'object') {
    const access: unknown = (response as TokenResponse).access;
    const refresh: unknown = (response as TokenResponse).refresh;
    if (
      access &&
      typeof access === 'string' &&
      refresh &&
      typeof refresh === 'string'
    ) {
      return true;
    }
  }

  return false;
};

export const validateChallenge = async (token: string) => {
  const response = await fetchWrapper('/api/auth/challenge/', {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    throw new Error('failed');
  }

  const responseContent: unknown = await response.json();
  if (isValidateChallenge(responseContent)) {
    return responseContent;
  }

  throw new Error('Missing access token in response.');
};
