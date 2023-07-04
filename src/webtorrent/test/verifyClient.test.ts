/* eslint import/first: 0 */

import { sign } from 'jsonwebtoken';
import { createRequest } from 'node-mocks-http';

process.env.JWT_SIGNING_KEY = 'secret-key';

import { verifyClient } from '../src/verifyClient';

describe('verifyClient', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it('rejects the client when no url is provided in the request', () => {
    const callback = jest.fn();
    verifyClient({
      origin: 'http://localhost',
      secure: false,
      req: createRequest()
    }, callback);

    expect(callback).toHaveBeenCalledWith(false, 401, 'Unauthorized');
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('rejects the client when no token is provided in the url', () => {
    const callback = jest.fn();

    verifyClient({
      origin: 'http://localhost',
      secure: false,
      req: createRequest({
        url: '/'
      })
    }, callback);

    expect(callback).toHaveBeenCalledWith(false, 401, 'Unauthorized');
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('rejects the client when the provided token is invalid', () => {
    const callback = jest.fn();
    const token = sign(
      { foo: 'bar' },
      'wrong-key',
      {
        expiresIn: 60 * 60
      }
    );

    verifyClient({
      origin: 'http://localhost',
      secure: false,
      req: createRequest({
        url: `/?token=${token}`
      })
    }, callback);

    expect(callback).toHaveBeenCalledWith(false, 401, 'Unauthorized');
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('accepts the client when the provided token is valid', () => {
    const callback = jest.fn();
    const token = sign(
      { foo: 'bar' },
      'secret-key',
      {
        expiresIn: 60 * 60
      }
    );

    verifyClient({
      origin: 'http://localhost',
      secure: false,
      req: createRequest({
        url: `/?token=${token}`
      })
    }, callback);

    expect(callback).toHaveBeenCalledWith(true);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
