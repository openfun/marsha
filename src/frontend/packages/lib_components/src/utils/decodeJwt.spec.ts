import { DecodedJwtLTI, DecodedJwtWeb } from '@lib-components/types/jwt';

import { decodeJwt, isDecodedJwtLTI, isDecodedJwtWeb } from './decodeJwt';

describe('decodeJwt', () => {
  it('throws an error when no JWT is provided', () => {
    const jwt = '';

    expect(() => {
      decodeJwt(jwt);
    }).toThrow('Impossible to decode JWT token, there is no jwt to decode.');
  });

  describe('DecodedJwtLTI', () => {
    it('throws an error when LTI JWT has no required attributes: missing resource_id', () => {
      //   "sub": "1234567890",
      //   "name": "John Doe",
      //   "iat": 1516239022
      const jwt =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      expect(() => {
        decodeJwt(jwt);
      }).toThrow('JWT token is invalid');
    });

    it('throws an error when LTI JWT has no required attributes: empty resource_id', () => {
      //   "sub": "1234567890",
      //   "name": "John Doe",
      //   "iat": 1516239022
      //   "resource_id": ""
      const jwt =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJyZXNvdXJjZV9pZCI6IiJ9.2AAf0eZ75jFyAdREUMXr3CyOt9QPoqSuIZ5lNj3c7CE';

      expect(() => {
        decodeJwt(jwt);
      }).toThrow('JWT token is invalid');
    });

    it('returns the payload object when LTI JWT resource is provided', () => {
      //   "sub": "1234567890",
      //   "name": "John Doe",
      //   "iat": 1516239022,
      //   "resource_id": "2c85dc9e-4ee0-11ed-b9c1-635afde8841a"
      const jwt =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJyZXNvdXJjZV9pZCI6IjJjODVkYzllLTRlZTAtMTFlZC1iOWMxLTYzNWFmZGU4ODQxYSJ9.fQuKBTccQyt9fJGctJsLK5KL5lRisAGDZGFrBRdVPg8';

      const decodedJwt = decodeJwt(jwt);
      expect(isDecodedJwtLTI(decodedJwt)).toBeTruthy();
      expect((decodedJwt as DecodedJwtLTI).resource_id).toEqual(
        '2c85dc9e-4ee0-11ed-b9c1-635afde8841a',
      );
    });

    it('returns the payload object when LTI JWT resource is provided with a user', () => {
      //   "sub": "1234567890",
      //   "name": "John Doe",
      //   "iat": 1516239022,
      //   "resource_id": "",
      //   "playlist_id": "8cb4b9fa-4ee0-11ed-a972-87a03ecac56f",
      //   "user": {"id": "8d6d0ec4-4ee0-11ed-8d9b-97f53b688cde"}
      const jwt =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJyZXNvdXJjZV9pZCI6IiIsInBsYXlsaXN0X2lkIjoiOGNiNGI5ZmEtNGVlMC0xMWVkLWE5NzItODdhMDNlY2FjNTZmIiwidXNlciI6eyJpZCI6IjhkNmQwZWM0LTRlZTAtMTFlZC04ZDliLTk3ZjUzYjY4OGNkZSJ9fQ._ha6x03gxBMYXPpofIAVDB3HBJXg0JRnmPUr2YPdG-A';

      const decodedJwt = decodeJwt(jwt);
      expect(isDecodedJwtLTI(decodedJwt)).toBeTruthy();
      expect((decodedJwt as DecodedJwtLTI).resource_id).toEqual('');
      expect((decodedJwt as DecodedJwtLTI).playlist_id).toEqual(
        '8cb4b9fa-4ee0-11ed-a972-87a03ecac56f',
      );
      expect((decodedJwt as DecodedJwtLTI).user!.id).toEqual(
        '8d6d0ec4-4ee0-11ed-8d9b-97f53b688cde',
      );
    });
  });

  describe('DecodedJwtWeb', () => {
    it('throws an error when WEB JWT has no required attributes: missing token_type', () => {
      // {
      //   "exp": 1678973516,
      //   "iat": 1678971446,
      //   "jti": "525a39a45c7347b8af36a0c3b904309d",
      //   "user_id": "602fc5bf-377d-4295-8c26-e7c57a30c454"
      // }
      const jwt =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2Nzg5NzM1MTYsImlhdCI6MTY3ODk3MTQ0NiwianRpIjoiNTI1YTM5YTQ1YzczNDdiOGFmMzZhMGMzYjkwNDMwOWQiLCJ1c2VyX2lkIjoiNjAyZmM1YmYtMzc3ZC00Mjk1LThjMjYtZTdjNTdhMzBjNDU0In0.0H48_mvziM0bbBQ80BrMpS0iYi1x2rV7Uu-HYd3JDU8';

      expect(() => {
        decodeJwt(jwt);
      }).toThrow('JWT token is invalid');
    });

    it('throws an error when WEB JWT has wrong required attributes: token_type is number', () => {
      // {
      //   "token_type": 123456,
      //   "exp": 1678973516,
      //   "iat": 1678971446,
      //   "jti": "525a39a45c7347b8af36a0c3b904309d",
      //   "user_id": "602fc5bf-377d-4295-8c26-e7c57a30c454"
      // }
      const jwt =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoxMjM0NTYsImV4cCI6MTY3ODk3MzUxNiwiaWF0IjoxNjc4OTcxNDQ2LCJqdGkiOiI1MjVhMzlhNDVjNzM0N2I4YWYzNmEwYzNiOTA0MzA5ZCIsInVzZXJfaWQiOiI2MDJmYzViZi0zNzdkLTQyOTUtOGMyNi1lN2M1N2EzMGM0NTQifQ.1_jA1LehiWLdXDuZU-jOXA1fPrZqAKL9CL1lGByU-RA';

      expect(() => {
        decodeJwt(jwt);
      }).toThrow('JWT token is invalid');
    });

    it('returns the payload object when WEB JWT resource is provided', () => {
      // {
      //   "token_type": "123456",
      //   "exp": 1678973516,
      //   "iat": 1678971446,
      //   "jti": "525a39a45c7347b8af36a0c3b904309d",
      //   "user_id": "602fc5bf-377d-4295-8c26-e7c57a30c454"
      // }
      const jwt =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiMTIzNDU2IiwiZXhwIjoxNjc4OTczNTE2LCJpYXQiOjE2Nzg5NzE0NDYsImp0aSI6IjUyNWEzOWE0NWM3MzQ3YjhhZjM2YTBjM2I5MDQzMDlkIiwidXNlcl9pZCI6IjYwMmZjNWJmLTM3N2QtNDI5NS04YzI2LWU3YzU3YTMwYzQ1NCJ9.lb_Po0nWLvnusNk_PO21cLDMQYbZbwoT2yjdbsltebo';

      const decodedJwt = decodeJwt(jwt);
      expect(isDecodedJwtWeb(decodedJwt)).toBeTruthy();
      expect((decodedJwt as DecodedJwtWeb).token_type).toEqual('123456');
    });
  });
});
