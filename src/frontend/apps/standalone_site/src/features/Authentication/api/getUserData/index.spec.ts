import fetchMock from 'fetch-mock';
import { AnonymousUser, User } from 'lib-components';

import { getCurrentUser } from '.';

describe('getCurrentUser()', () => {
  beforeEach(() => {
    fetchMock.restore();
  });

  it('returns an anonymous use if response 401', async () => {
    fetchMock.get('/api/users/whoami/', 401);

    expect(await getCurrentUser('some_jwt')).toEqual(AnonymousUser.ANONYMOUS);
  });

  it('throws an error if request fail', async () => {
    fetchMock.get('/api/users/whoami/', 500);

    await expect(getCurrentUser('some_jwt')).rejects.toThrow(
      'Failed to get current user : 500.',
    );
  });

  it('throws an error if response can not be parsed as a User', async () => {
    const someResponse = {
      content: 'not a user',
    };
    fetchMock.get('/api/users/whoami/', someResponse);

    await expect(getCurrentUser('some_jwt')).rejects.toThrow(
      'Failed to get current user, format invalid',
    );
  });

  it('returns the user', async () => {
    const user: User = {
      date_joined: 'date_joined',
      email: 'email',
      full_name: 'full name',
      id: 'id',
      is_staff: false,
      is_superuser: false,
      organization_accesses: [],
    };
    fetchMock.get('/api/users/whoami/', user);

    expect(await getCurrentUser('some_jwt')).toEqual(user);
  });
});
