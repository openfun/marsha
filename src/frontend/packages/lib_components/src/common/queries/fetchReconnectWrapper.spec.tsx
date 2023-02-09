import { waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { Deferred } from 'lib-tests';

import { refreshToken } from 'data/sideEffects/refreshToken';
import { useJwt } from 'hooks/stores/useJwt';
import { TokenResponse } from 'types/jwt';

import { fetchReconnectWrapper } from './fetchReconnectWrapper';

jest.mock('data/sideEffects/refreshToken', () => ({
  refreshToken: jest.fn(),
}));
const mockedRefreshToken = refreshToken as jest.MockedFunction<
  typeof refreshToken
>;

describe('fetchReconnectWrapper()', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();

    useJwt.setState({
      jwt: 'jwt initial',
      refreshJwt: 'refreshJwt initial',
    });
  });

  describe('check options', () => {
    it('checks options.routesInclude', async () => {
      const route = '/my/routesInclude';
      useJwt.setState({
        refreshJwt: undefined, // It should called logout()
      });
      fetchMock.mock(route, 401);

      await fetchReconnectWrapper(
        route,
        {
          method: 'GET',
        },
        { routesInclude: [route] },
      );

      expect(useJwt.getState().jwt).toBeUndefined();
    });

    it('checks options.routesExclude', async () => {
      const route = '/api/routesExclude';
      useJwt.setState({
        refreshJwt: undefined, // It should called logout()
      });
      fetchMock.mock(route, 401);

      await fetchReconnectWrapper(
        route,
        {
          method: 'GET',
        },
        { routesExclude: [route] },
      );

      expect(useJwt.getState().jwt).toEqual('jwt initial');
    });

    it('checks options.isRetry', async () => {
      const route = '/api/isRetry';
      useJwt.setState({
        refreshJwt: undefined, // It should called logout()
      });
      fetchMock.mock(route, 401);

      await fetchReconnectWrapper(
        route,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        { isRetry: false },
      );

      expect(useJwt.getState().jwt).toEqual('jwt initial');
    });

    it('checks options.verbose', async () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => jest.fn());
      const route = '/api/verbose';
      fetchMock.mock(route, 401);
      fetchMock.mock('/account/api/token/refresh/', 500);

      await fetchReconnectWrapper(
        route,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ my: 'body' }),
        },
        { verbose: true },
      );

      expect(consoleError).toHaveBeenCalled();

      consoleError.mockClear();
    });
  });

  describe('401 reconnection', () => {
    it('checks when refreshJwt is undefined', async () => {
      const route = '/api/refreshJwt';
      useJwt.setState({
        refreshJwt: undefined, // It should called logout()
      });
      fetchMock.mock(route, 401);

      await fetchReconnectWrapper(route);

      expect(useJwt.getState().jwt).toBeUndefined();
    });

    it('checks when token recovery is a success with body request', async () => {
      fetchMock.mock('/api/', {
        status: 401,
        body: { result: 'my result' },
      });

      mockedRefreshToken.mockResolvedValue({
        access: 'new access token',
        refresh: 'new refresh token',
      });

      const response = await fetchReconnectWrapper('/api/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ my: 'body' }),
      });

      expect(fetchMock.calls().length).toEqual(2);
      expect(fetchMock.calls()[0][0]).toEqual('/api/');
      expect(fetchMock.calls()[0][1]?.body).toEqual('{"my":"body"}');

      expect(mockedRefreshToken).toHaveBeenCalledWith('refreshJwt initial');

      expect(useJwt.getState().jwt).toEqual('new access token');
      expect(useJwt.getState().refreshJwt).toEqual('new refresh token');

      expect(fetchMock.calls()[1][0]).toEqual('/api/');
      expect(fetchMock.calls()[1][1]).toEqual({
        body: '{"my":"body"}',
        headers: {
          Authorization: 'Bearer new access token',
          'Content-Type': 'application/json',
        },
        method: 'PUT',
      });
      expect(await response.json()).toEqual({ result: 'my result' });
    });

    it('checks when token recovery is a success with input Request and body request', async () => {
      fetchMock.mock('/api/', {
        status: 401,
        body: { result: 'my result' },
      });

      mockedRefreshToken.mockResolvedValue({
        access: 'new access token',
        refresh: 'new refresh token',
      });

      const response = await fetchReconnectWrapper(
        new Request('/api/', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ my: 'body' }),
        }),
      );

      expect(fetchMock.calls().length).toEqual(2);
      expect(fetchMock.calls()[0][0]).toEqual('/api/');
      expect(fetchMock.calls()[0][1]?.body).toEqual(new Promise(() => {}));

      expect(mockedRefreshToken).toHaveBeenCalledWith('refreshJwt initial');

      expect(useJwt.getState().jwt).toEqual('new access token');
      expect(useJwt.getState().refreshJwt).toEqual('new refresh token');

      expect(fetchMock.calls()[1][0]).toEqual('/api/');
      expect(fetchMock.calls()[1][1]).toEqual({
        body: new Promise(() => {}),
        headers: {
          Authorization: ['Bearer new access token'],
          'Content-Type': ['application/json'],
        },
        method: 'PUT',
      });
      expect(await response.json()).toEqual({ result: 'my result' });
    });

    it('checks when token recovery is a success without body Request', async () => {
      fetchMock.mock('/api/', {
        status: 401,
        body: { result: 'my result' },
      });

      mockedRefreshToken.mockResolvedValue({
        access: 'new access token',
        refresh: 'new refresh token',
      });

      const response = await fetchReconnectWrapper('/api/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(fetchMock.calls().length).toEqual(2);
      expect(fetchMock.calls()[0][0]).toEqual('/api/');

      expect(mockedRefreshToken).toHaveBeenCalledWith('refreshJwt initial');

      expect(useJwt.getState().jwt).toEqual('new access token');
      expect(useJwt.getState().refreshJwt).toEqual('new refresh token');

      expect(fetchMock.calls()[1][0]).toEqual('/api/');
      expect(fetchMock.calls()[1][1]).toEqual({
        headers: {
          Authorization: 'Bearer new access token',
          'Content-Type': 'application/json',
        },
        method: 'GET',
      });
      expect(await response.json()).toEqual({ result: 'my result' });
    });

    it('checks when token recovery is a success with input Request and without body Request', async () => {
      fetchMock.mock('/api/', {
        status: 401,
        body: { result: 'my result' },
      });

      mockedRefreshToken.mockResolvedValue({
        access: 'new access token',
        refresh: 'new refresh token',
      });

      const response = await fetchReconnectWrapper(
        new Request('/api/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );

      expect(fetchMock.calls().length).toEqual(2);
      expect(fetchMock.calls()[0][0]).toEqual('/api/');

      expect(mockedRefreshToken).toHaveBeenCalledWith('refreshJwt initial');

      expect(useJwt.getState().jwt).toEqual('new access token');
      expect(useJwt.getState().refreshJwt).toEqual('new refresh token');

      expect(fetchMock.calls()[1][0]).toEqual('/api/');
      expect(fetchMock.calls()[1][1]).toEqual({
        body: new Promise(() => {}),
        headers: {
          Authorization: ['Bearer new access token'],
          'Content-Type': ['application/json'],
        },
        method: 'GET',
      });
      expect(await response.json()).toEqual({ result: 'my result' });
    });

    it('checks when the refresh token failed then the recovery succeed', async () => {
      fetchMock.mock('/api/', {
        status: 401,
        body: { result: 'my result' },
      });
      const deferred = new Deferred<TokenResponse>();
      mockedRefreshToken.mockReturnValue(deferred.promise);

      const result = fetchReconnectWrapper('/api/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'some body',
      });

      await waitFor(() => expect(fetchMock.calls().length).toEqual(1));
      expect(fetchMock.calls()[0][0]).toEqual('/api/');
      expect(fetchMock.calls()[0][1]).toEqual({
        body: 'some body',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      expect(mockedRefreshToken).toHaveBeenCalledWith('refreshJwt initial');

      useJwt.setState({
        jwt: 'new jwt',
        refreshJwt: 'new refresh',
      });
      fetchMock.mock(
        '/api/',
        { someData: 'blabla' },
        { overwriteRoutes: true },
      );
      deferred.reject('failed to refresh');

      await waitFor(() => expect(fetchMock.calls().length).toEqual(2));
      expect(fetchMock.calls()[1][0]).toEqual('/api/');
      expect(fetchMock.calls()[1][1]).toEqual({
        body: 'some body',
        headers: {
          Authorization: 'Bearer new jwt',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      expect(useJwt.getState().jwt).toEqual('new jwt');
      expect(useJwt.getState().refreshJwt).toEqual('new refresh');

      expect(await (await result).json()).toEqual({ someData: 'blabla' });
    });

    it('checks when the refresh token failed then the recovery is a failed again', async () => {
      fetchMock.mock('/api/', {
        status: 401,
        body: { result: 'my result' },
      });
      const deferred = new Deferred<TokenResponse>();
      mockedRefreshToken.mockReturnValue(deferred.promise);

      const result = fetchReconnectWrapper('/api/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'some body',
      });

      await waitFor(() => expect(fetchMock.calls().length).toEqual(1));
      expect(fetchMock.calls()[0][0]).toEqual('/api/');
      expect(fetchMock.calls()[0][1]).toEqual({
        body: 'some body',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      expect(mockedRefreshToken).toHaveBeenCalledWith('refreshJwt initial');

      useJwt.setState({
        jwt: 'new jwt',
        refreshJwt: 'new refresh',
      });
      fetchMock.mock(
        '/api/',
        {
          status: 401,
          body: { result: 'my result' },
        },
        { overwriteRoutes: true },
      );

      deferred.reject('failed to refresh');

      await waitFor(() => expect(fetchMock.calls().length).toEqual(2));
      expect(fetchMock.calls()[1][0]).toEqual('/api/');
      expect(fetchMock.calls()[1][1]).toEqual({
        body: 'some body',
        headers: {
          Authorization: 'Bearer new jwt',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      expect(useJwt.getState().jwt).toBeUndefined();
      expect(useJwt.getState().refreshJwt).toBeUndefined();

      const reconnect = await result;
      expect(reconnect.status).toEqual(401);
      expect(await reconnect.json()).toEqual({ result: 'my result' });
    });
  });
});
