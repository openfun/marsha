import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';

import { logout } from '.';

describe('logout()', () => {
  beforeEach(() => {
    fetchMock.restore();

    useJwt.setState({
      jwt: 'some jwt',
      refreshJwt: 'some refresh',
    });
  });

  it('throws an error if request failed', async () => {
    fetchMock.post('/account/api/logout/', 500);

    await expect(logout()).rejects.toThrow('Fail to logout user.');
    expect(useJwt.getState().getJwt()).toEqual(undefined);
    expect(useJwt.getState().getRefreshJwt()).toEqual(undefined);
  });

  it('clear jwt store on success', async () => {
    fetchMock.post('/account/api/logout/', 200);

    await expect(logout()).resolves.toEqual(undefined);
    expect(useJwt.getState().getJwt()).toEqual(undefined);
    expect(useJwt.getState().getRefreshJwt()).toEqual(undefined);
  });
});
