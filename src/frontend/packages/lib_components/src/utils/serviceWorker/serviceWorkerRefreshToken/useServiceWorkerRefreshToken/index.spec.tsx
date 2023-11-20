import { waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { render } from 'lib-tests';
import React, { Fragment } from 'react';

import { useCurrentUser } from '@lib-components/hooks/stores/useCurrentUser';
import { JWT_KEY, useJwt } from '@lib-components/hooks/stores/useJwt';
import { EServiceworkerAuthAction } from '@lib-components/types/serviceWorker';

import { useServiceWorkerRefreshToken } from './index';

const replace = jest.fn();
Object.defineProperty(window, 'location', {
  value: {
    replace,
  },
});

const mockSWAddEventListener = jest.fn();
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    addEventListener: mockSWAddEventListener,
    removeEventListener: jest.fn(),
  },
});

const TestComponent = () => {
  useServiceWorkerRefreshToken();

  return <Fragment />;
};

describe('<useServiceWorkerRefreshToken />', () => {
  beforeEach(() => {
    localStorage.removeItem(JWT_KEY);

    useJwt.getState().resetJwt();
    fetchMock.restore();
    jest.resetAllMocks();
  });

  it('checks the service workers actions: GET_REFRESH_TOKEN', () => {
    useJwt.setState({
      jwt: 'my jwt',
      refreshJwt: 'my refresh Jwt',
    });
    useCurrentUser.setState({
      currentUser: {
        username: 'my user',
      } as any,
    });

    const mockPostMessage = jest.fn();
    mockPostMessage.mockImplementation((response) => {
      expect(response).toStrictEqual({
        action: EServiceworkerAuthAction.REFRESH_TOKEN_RESPONSE,
        valueClient: 'my refresh Jwt',
        requestId: 'my request id',
      });
    });

    mockSWAddEventListener.mockImplementation((event, cb) => {
      // Verify that the correct event and callback were passed to the function
      expect(event).toBe('message');
      expect(cb).toBeDefined();

      // Trigger listener with `GET_REFRESH_TOKEN` action
      cb({
        data: {
          action: EServiceworkerAuthAction.GET_REFRESH_TOKEN,
          requestId: 'my request id',
        },
        source: {
          postMessage: mockPostMessage,
        },
      });
    });

    render(<TestComponent />);

    expect(mockSWAddEventListener).toHaveBeenCalled();
    expect(mockPostMessage).toHaveBeenCalled();
  });

  it('checks the service workers actions: GET_ACCESS_TOKEN', () => {
    useJwt.setState({
      jwt: 'my jwt',
      refreshJwt: 'my refresh Jwt',
    });
    useCurrentUser.setState({
      currentUser: {
        username: 'my user',
      } as any,
    });

    const mockPostMessage = jest.fn();
    mockPostMessage.mockImplementation((response) => {
      expect(response).toStrictEqual({
        action: EServiceworkerAuthAction.ACCESS_TOKEN_RESPONSE,
        valueClient: 'my jwt',
        requestId: 'my request id',
      });
    });

    mockSWAddEventListener.mockImplementation((event, cb) => {
      // Verify that the correct event and callback were passed to the function
      expect(event).toBe('message');
      expect(cb).toBeDefined();

      // Trigger listener with `GET_REFRESH_TOKEN` action
      cb({
        data: {
          action: EServiceworkerAuthAction.GET_ACCESS_TOKEN,
          requestId: 'my request id',
        },
        source: {
          postMessage: mockPostMessage,
        },
      });
    });

    render(<TestComponent />);

    expect(mockSWAddEventListener).toHaveBeenCalled();
    expect(mockPostMessage).toHaveBeenCalled();
  });

  it('checks the service workers actions: SET_TOKEN', async () => {
    useJwt.setState({
      jwt: 'my jwt',
      refreshJwt: 'my refresh Jwt',
    });
    useCurrentUser.setState({
      currentUser: {
        username: 'my user',
      } as any,
    });

    mockSWAddEventListener.mockImplementation((event, cb) => {
      cb({
        data: {
          action: EServiceworkerAuthAction.SET_TOKEN,
          valueSW: {
            access: 'my new access',
            refresh: 'my new refresh',
          },
          requestId: 'my request id',
        },
      });
    });

    render(<TestComponent />);

    await waitFor(() =>
      expect(useJwt.getState().getJwt()).toBe('my new access'),
    );
    expect(useJwt.getState().getRefreshJwt()).toBe('my new refresh');
  });

  it('checks the service workers actions: LOGOUT', () => {
    useJwt.setState({
      jwt: 'my jwt',
      refreshJwt: 'my refresh Jwt',
    });
    useCurrentUser.setState({
      currentUser: {
        username: 'my user',
      } as any,
    });

    mockSWAddEventListener.mockImplementation((event, cb) => {
      cb({
        data: {
          action: EServiceworkerAuthAction.LOGOUT,
          requestId: 'my request id',
        },
      });
    });

    render(<TestComponent />);

    expect(useJwt.getState().getJwt()).toBeUndefined();
    expect(useJwt.getState().getRefreshJwt()).toBeUndefined();
  });
});
