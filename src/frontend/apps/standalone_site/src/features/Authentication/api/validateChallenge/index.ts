import {
  TokenResponse,
  fetchResponseHandler,
  fetchWrapper,
} from 'lib-components';

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

  const responseContent = await fetchResponseHandler<TokenResponse>(response);
  if (isValidateChallenge(responseContent)) {
    return responseContent;
  }

  throw new Error('Missing access token in response.');
};
