import { fetchWrapper, useCurrentUser, useJwt } from 'lib-components';

export const logout = async () => {
  const refreshToken = useJwt.getState().getRefreshJwt();
  useJwt.getState().resetJwt();
  useCurrentUser.setState({
    currentUser: null,
  });

  const response = await fetchWrapper('/account/api/logout/', {
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
