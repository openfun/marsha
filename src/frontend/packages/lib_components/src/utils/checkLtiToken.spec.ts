import { DecodedJwt } from '@lib-components/types/jwt';

import { checkLtiToken } from './checkLtiToken';

describe('checkLtiToken', () => {
  it('should return true when the JWT token is a LTI one', () => {
    const token: DecodedJwt = {
      context_id: 'course-v1:ufr+mathematics+0001',
      consumer_site: '112cf553-b8c3-4b98-9d47-d0793284b9b3',
      locale: 'en_US',
      maintenance: false,
      permissions: {
        can_access_dashboard: false,
        can_update: false,
      },
      resource_id: '26debfee-8c3b-4c23-b08f-67f223de9832',
      roles: ['student'],
      session_id: '6bbb8d1d-442d-4575-a0ad-d1e34f37cae3',
      user: {
        email: null,
        id: 'aaace992-49e3-4e01-b809-7a84b1b55b72',
        username: null,
        user_fullname: null,
      },
    };

    expect(checkLtiToken(token)).toEqual(true);
  });
  it('should return false when context_id is missing', () => {
    const token: DecodedJwt = {
      consumer_site: '112cf553-b8c3-4b98-9d47-d0793284b9b3',
      locale: 'en_US',
      maintenance: false,
      permissions: {
        can_access_dashboard: false,
        can_update: false,
      },
      resource_id: '26debfee-8c3b-4c23-b08f-67f223de9832',
      roles: ['student'],
      session_id: '6bbb8d1d-442d-4575-a0ad-d1e34f37cae3',
      user: {
        email: null,
        id: 'aaace992-49e3-4e01-b809-7a84b1b55b72',
        username: null,
        user_fullname: null,
      },
    };

    expect(checkLtiToken(token)).toEqual(false);
  });

  it('should return false when consumer_site is missing', () => {
    const token: DecodedJwt = {
      context_id: 'course-v1:ufr+mathematics+0001',
      locale: 'en_US',
      maintenance: false,
      permissions: {
        can_access_dashboard: false,
        can_update: false,
      },
      resource_id: '26debfee-8c3b-4c23-b08f-67f223de9832',
      roles: ['student'],
      session_id: '6bbb8d1d-442d-4575-a0ad-d1e34f37cae3',
      user: {
        email: null,
        id: 'aaace992-49e3-4e01-b809-7a84b1b55b72',
        username: null,
        user_fullname: null,
      },
    };

    expect(checkLtiToken(token)).toEqual(false);
  });

  it('should return false when user is missing', () => {
    const token: DecodedJwt = {
      context_id: 'course-v1:ufr+mathematics+0001',
      consumer_site: '112cf553-b8c3-4b98-9d47-d0793284b9b3',
      locale: 'en_US',
      maintenance: false,
      permissions: {
        can_access_dashboard: false,
        can_update: false,
      },
      resource_id: '26debfee-8c3b-4c23-b08f-67f223de9832',
      roles: ['student'],
      session_id: '6bbb8d1d-442d-4575-a0ad-d1e34f37cae3',
    };

    expect(checkLtiToken(token)).toEqual(false);
  });
});
