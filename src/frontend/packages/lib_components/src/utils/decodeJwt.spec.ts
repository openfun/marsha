import { decodeJwt } from './decodeJwt';

describe('lib_components/src/utils/decodeJwt.ts', () => {
  it('throws an error when no JWT is provided', () => {
    const jwt = '';

    expect(() => {
      decodeJwt(jwt);
    }).toThrow('Impossible to decode JWT token, there is no jwt to decode.');
  });

  it('throws an error when JWT has no required attributes: missing resource_id', () => {
    //   "sub": "1234567890",
    //   "name": "John Doe",
    //   "iat": 1516239022
    const jwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

    expect(() => {
      decodeJwt(jwt);
    }).toThrow('JWT token is invalid');
  });

  it('throws an error when JWT has no required attributes: empty resource_id', () => {
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

  it('returns the payload object when resource is provided', () => {
    //   "sub": "1234567890",
    //   "name": "John Doe",
    //   "iat": 1516239022,
    //   "resource_id": "2c85dc9e-4ee0-11ed-b9c1-635afde8841a"
    const jwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJyZXNvdXJjZV9pZCI6IjJjODVkYzllLTRlZTAtMTFlZC1iOWMxLTYzNWFmZGU4ODQxYSJ9.fQuKBTccQyt9fJGctJsLK5KL5lRisAGDZGFrBRdVPg8';

    const decodedJwt = decodeJwt(jwt);
    expect(decodedJwt.resource_id).toEqual(
      '2c85dc9e-4ee0-11ed-b9c1-635afde8841a',
    );
  });

  it('returns the payload object when resource is provided with a user', () => {
    //   "sub": "1234567890",
    //   "name": "John Doe",
    //   "iat": 1516239022,
    //   "resource_id": "",
    //   "playlist_id": "8cb4b9fa-4ee0-11ed-a972-87a03ecac56f",
    //   "user": {"id": "8d6d0ec4-4ee0-11ed-8d9b-97f53b688cde"}
    const jwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJyZXNvdXJjZV9pZCI6IiIsInBsYXlsaXN0X2lkIjoiOGNiNGI5ZmEtNGVlMC0xMWVkLWE5NzItODdhMDNlY2FjNTZmIiwidXNlciI6eyJpZCI6IjhkNmQwZWM0LTRlZTAtMTFlZC04ZDliLTk3ZjUzYjY4OGNkZSJ9fQ._ha6x03gxBMYXPpofIAVDB3HBJXg0JRnmPUr2YPdG-A';

    const decodedJwt = decodeJwt(jwt);
    expect(decodedJwt.resource_id).toEqual('');
    expect(decodedJwt.playlist_id).toEqual(
      '8cb4b9fa-4ee0-11ed-a972-87a03ecac56f',
    );
    expect(decodedJwt.user!.id).toEqual('8d6d0ec4-4ee0-11ed-8d9b-97f53b688cde');
  });
});
