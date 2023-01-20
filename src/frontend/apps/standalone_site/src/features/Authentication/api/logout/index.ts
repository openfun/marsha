import { useJwt } from 'lib-components';

export const logout = async () => {
  const refreshToken = useJwt.getState().refreshJwt;
  useJwt.getState().resetJwt();

  const response = await fetch('/account/api/logout/', {
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      refresh: refreshToken,
    }),
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Fail to logout user.');
  }
};
