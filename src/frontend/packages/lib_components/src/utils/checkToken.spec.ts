import { DecodedJwt } from '@lib-components/types/jwt';

import { checkToken } from './checkToken';

describe('checkToken', () => {
  describe('checkToken LTI', () => {
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
        playlist_id: '26debfee-8c3b-4c23-b08f-67f223de9832',
        roles: ['student'],
        session_id: '6bbb8d1d-442d-4575-a0ad-d1e34f37cae3',
        user: {
          email: null,
          id: 'aaace992-49e3-4e01-b809-7a84b1b55b72',
          username: null,
          user_fullname: null,
        },
      };

      expect(checkToken(token)).toEqual(true);
    });
    it('should return false when it is a lti token and the context_id is missing', () => {
      const token: DecodedJwt = {
        consumer_site: '112cf553-b8c3-4b98-9d47-d0793284b9b3',
        locale: 'en_US',
        maintenance: false,
        permissions: {
          can_access_dashboard: false,
          can_update: false,
        },
        playlist_id: '26debfee-8c3b-4c23-b08f-67f223de9832',
        roles: ['student'],
        session_id: '6bbb8d1d-442d-4575-a0ad-d1e34f37cae3',
        user: {
          email: null,
          id: 'aaace992-49e3-4e01-b809-7a84b1b55b72',
          username: null,
          user_fullname: null,
        },
      };

      expect(checkToken(token)).toEqual(false);
    });

    it('should return false when it is a lti token and the consumer_site is missing', () => {
      const token: DecodedJwt = {
        context_id: 'course-v1:ufr+mathematics+0001',
        locale: 'en_US',
        maintenance: false,
        permissions: {
          can_access_dashboard: false,
          can_update: false,
        },
        playlist_id: '26debfee-8c3b-4c23-b08f-67f223de9832',
        roles: ['student'],
        session_id: '6bbb8d1d-442d-4575-a0ad-d1e34f37cae3',
        user: {
          email: null,
          id: 'aaace992-49e3-4e01-b809-7a84b1b55b72',
          username: null,
          user_fullname: null,
        },
      };

      expect(checkToken(token)).toEqual(false);
    });

    it('should return false when it is a lti token and the user is missing', () => {
      const token: DecodedJwt = {
        context_id: 'course-v1:ufr+mathematics+0001',
        consumer_site: '112cf553-b8c3-4b98-9d47-d0793284b9b3',
        locale: 'en_US',
        maintenance: false,
        permissions: {
          can_access_dashboard: false,
          can_update: false,
        },
        playlist_id: '26debfee-8c3b-4c23-b08f-67f223de9832',
        roles: ['student'],
        session_id: '6bbb8d1d-442d-4575-a0ad-d1e34f37cae3',
      };

      expect(checkToken(token)).toEqual(false);
    });
  });

  describe('checkToken WEB', () => {
    it('should return true when the JWT token is a web one', () => {
      const token: DecodedJwt = {
        token_type: 'user_access',
        exp: 1678973516,
        iat: 1678971446,
        jti: '525a39a45c7347b8af36a0c3b904309d',
        user_id: '602fc5bf-377d-4295-8c26-e7c57a30c454',
      };

      expect(checkToken(token)).toEqual(true);
    });

    it('should return false when it is a web token and the user is missing', () => {
      const token: DecodedJwt = {
        token_type: 'user_access',
        exp: 1678973516,
        iat: 1678971446,
        jti: '525a39a45c7347b8af36a0c3b904309d',
        user_id: '',
      };

      expect(checkToken(token)).toEqual(false);
    });
  });
});
