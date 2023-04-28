import fetchMock from 'fetch-mock';
import { useCurrentUser, useJwt } from 'lib-components';

import { logout } from '.';

describe('logout()', () => {
  beforeEach(() => {
    fetchMock.restore();

    useJwt.setState({
      jwt: 'some jwt',
      refreshJwt: 'some refresh',
    });
    useCurrentUser.setState({
      currentUser: {
        full_name: 'John Doe',
      } as any,
    });
  });

  it('throws an error if request failed', async () => {
    fetchMock.post('/account/api/logout/', 500);

    await expect(logout()).rejects.toThrow('Fail to logout user.');
    expect(useJwt.getState().getJwt()).toBeUndefined();
    expect(useJwt.getState().getRefreshJwt()).toBeUndefined();
    expect(useCurrentUser.getState().currentUser).toBeNull();
  });

  it('clear jwt store on success', async () => {
    fetchMock.post('/account/api/logout/', 200);

    await expect(logout()).resolves.toBeUndefined();
    expect(useJwt.getState().getJwt()).toBeUndefined();
    expect(useJwt.getState().getRefreshJwt()).toBeUndefined();
    expect(useCurrentUser.getState().currentUser).toBeNull();
  });
});
