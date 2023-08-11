import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';

import { resetPassword } from './resetPassword';

describe('resetPassword()', () => {
  beforeEach(() => {
    fetchMock.restore();
  });

  it('throws an error if request failed', async () => {
    useJwt.setState({
      jwt: 'some jwt',
    });
    fetchMock.post('/account/api/password/change/', 500);

    await expect(
      resetPassword('some password', 'an other password', 'an other password'),
    ).rejects.toThrow();
  });

  it('clear jwt store on success', async () => {
    fetchMock.post('/account/api/password/change/', {
      status: 200,
      ok: true,
    });

    await expect(
      resetPassword('some password', 'an other password', 'an other password'),
    ).resolves.toEqual(undefined);
  });
});
