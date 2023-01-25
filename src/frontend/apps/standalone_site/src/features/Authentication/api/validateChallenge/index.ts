import { fetchWrapper } from 'lib-components';

interface ValidateChallengeResponse {
  access: string;
}

const isValidateChallenge = (
  response: unknown,
): response is ValidateChallengeResponse => {
  if (response && typeof response === 'object') {
    const access: unknown = (response as ValidateChallengeResponse).access;
    if (access && typeof access === 'string') {
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
    return responseContent.access;
  }

  throw new Error('Missing access token in response.');
};
