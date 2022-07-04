import { act, screen } from '@testing-library/react';
import React from 'react';

import { getDecodedJwt } from 'data/appData';
import { useLiveSession } from 'data/stores/useLiveSession';
import { DecodedJwt } from 'types/jwt';
import { liveState } from 'types/tracks';
import { PersistentStore } from 'types/XMPP';
import { liveSessionFactory, videoMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';

import { ConverseInitializer } from '.';

let mockConverse: any;
jest.mock('utils/window', () => ({
  get converse() {
    return mockConverse;
  },
}));

jest.mock('data/appData', () => ({
  appData: {
    video: mockVideo,
  },
  getDecodedJwt: jest.fn(),
}));
const mockGetDecodedJwt = getDecodedJwt as jest.MockedFunction<
  typeof getDecodedJwt
>;

const mockInitConverse = jest.fn();
jest.mock('utils/conversejs/converse', () => ({
  converseMounter: () => mockInitConverse,
}));

const mockVideo = videoMockFactory();

describe('<ConverseInitializer />', () => {
  beforeEach(() => {
    mockConverse = undefined;
    jest.resetAllMocks();
  });

  it('does not initialize converse without liveRegistration if user can not access dashboard', async () => {
    mockGetDecodedJwt.mockReturnValue({
      permissions: {
        can_access_dashboard: false,
        can_update: false,
      },
    } as DecodedJwt);
    const video = {
      ...mockVideo,
      live_state: liveState.RUNNING,
      xmpp: {
        bosh_url: 'https://xmpp-server.com/http-bind',
        converse_persistent_store: PersistentStore.LOCALSTORAGE,
        websocket_url: null,
        conference_url:
          '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
        prebind_url: 'https://xmpp-server.com/http-pre-bind',
        jid: 'xmpp-server.com',
      },
    };
    mockConverse = {};

    render(<ConverseInitializer video={video} />);
    // mockConverseMounter returns itself a mock. We want to inspect this mock to be sure that
    // is was called with the container name and the xmpp object
    expect(mockInitConverse).not.toHaveBeenCalled();

    const liveSession = liveSessionFactory();
    act(() => {
      useLiveSession.getState().setLiveSession(liveSession);
    });

    expect(mockInitConverse).toHaveBeenCalled();
    expect(mockInitConverse).toHaveBeenCalledWith(
      {
        bosh_url: 'https://xmpp-server.com/http-bind',
        converse_persistent_store: PersistentStore.LOCALSTORAGE,
        websocket_url: null,
        conference_url:
          '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
        prebind_url: 'https://xmpp-server.com/http-pre-bind',
        jid: 'xmpp-server.com',
      },
      null,
    );
  });

  it('does not initialize converse for a video without xmpp', () => {
    mockGetDecodedJwt.mockReturnValue({
      permissions: {
        can_access_dashboard: false,
        can_update: false,
      },
    } as DecodedJwt);
    const video = {
      ...mockVideo,
      live_state: liveState.RUNNING,
    };
    mockConverse = {};

    render(<ConverseInitializer video={video} />);
    // mockConverseMounter returns itself a mock. We want to inspect this mock to be sure that
    // is was called with the container name and the xmpp object
    expect(mockInitConverse).not.toHaveBeenCalled();
  });

  it('does not initialize converse for a video without live state', () => {
    mockGetDecodedJwt.mockReturnValue({
      permissions: {
        can_access_dashboard: false,
        can_update: false,
      },
    } as DecodedJwt);
    const video = {
      ...mockVideo,
      xmpp: {
        bosh_url: 'https://xmpp-server.com/http-bind',
        converse_persistent_store: PersistentStore.LOCALSTORAGE,
        websocket_url: null,
        conference_url:
          '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
        prebind_url: 'https://xmpp-server.com/http-pre-bind',
        jid: 'xmpp-server.com',
      },
    };
    mockConverse = {};

    render(<ConverseInitializer video={video} />);
    // mockConverseMounter returns itself a mock. We want to inspect this mock to be sure that
    // is was called with the container name and the xmpp object
    expect(mockInitConverse).not.toHaveBeenCalled();
  });

  it('does not initialize converse for a video with a live state idle', () => {
    mockGetDecodedJwt.mockReturnValue({
      permissions: {
        can_access_dashboard: false,
        can_update: false,
      },
    } as DecodedJwt);
    const video = {
      ...mockVideo,
      live_state: liveState.IDLE,
      xmpp: {
        bosh_url: 'https://xmpp-server.com/http-bind',
        converse_persistent_store: PersistentStore.LOCALSTORAGE,
        websocket_url: null,
        conference_url:
          '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
        prebind_url: 'https://xmpp-server.com/http-pre-bind',
        jid: 'xmpp-server.com',
      },
    };
    mockConverse = {};

    render(<ConverseInitializer video={video} />);
    // mockConverseMounter returns itself a mock. We want to inspect this mock to be sure that
    // is was called with the container name and the xmpp object
    expect(mockInitConverse).not.toHaveBeenCalled();
  });

  it('initializes converse with the displayname', () => {
    mockGetDecodedJwt.mockReturnValue({
      permissions: {
        can_access_dashboard: false,
        can_update: false,
      },
    } as DecodedJwt);
    const video = {
      ...mockVideo,
      live_state: liveState.RUNNING,
      xmpp: {
        bosh_url: 'https://xmpp-server.com/http-bind',
        converse_persistent_store: PersistentStore.LOCALSTORAGE,
        websocket_url: null,
        conference_url:
          '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
        prebind_url: 'https://xmpp-server.com/http-pre-bind',
        jid: 'xmpp-server.com',
      },
    };
    mockConverse = {};

    render(<ConverseInitializer video={video} />);
    // mockConverseMounter returns itself a mock. We want to inspect this mock to be sure that
    // is was called with the container name and the xmpp object
    expect(mockInitConverse).not.toHaveBeenCalled();

    const liveRegistration = liveSessionFactory({ display_name: 'john' });
    act(() => {
      useLiveSession.getState().setLiveSession(liveRegistration);
    });

    expect(mockInitConverse).toHaveBeenCalled();
    expect(mockInitConverse).toHaveBeenCalledWith(
      {
        bosh_url: 'https://xmpp-server.com/http-bind',
        converse_persistent_store: PersistentStore.LOCALSTORAGE,
        websocket_url: null,
        conference_url:
          '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
        prebind_url: 'https://xmpp-server.com/http-pre-bind',
        jid: 'xmpp-server.com',
      },
      'john',
    );
  });

  it('renders children if converse is initialized in the window', () => {
    mockGetDecodedJwt.mockReturnValue({
      permissions: {
        can_access_dashboard: false,
        can_update: false,
      },
    } as DecodedJwt);
    mockConverse = {};

    render(
      <ConverseInitializer video={mockVideo}>
        <span>loaded</span>
      </ConverseInitializer>,
    );

    screen.getByText('loaded');
    expect(screen.queryByTestId('loader-id')).not.toBeInTheDocument();
  });

  it('initializes converse in the window if not define yet', async () => {
    mockGetDecodedJwt.mockReturnValue({
      permissions: {
        can_access_dashboard: false,
        can_update: false,
      },
    } as DecodedJwt);
    const liveSession = liveSessionFactory();
    useLiveSession.getState().setLiveSession(liveSession);

    render(
      <ConverseInitializer video={mockVideo}>
        <span>loaded</span>
      </ConverseInitializer>,
    );

    screen.getByTestId('loader-id');
    expect(screen.queryByText('loaded')).not.toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('converse-loaded'));
    });

    await screen.findByText('loaded');
    expect(screen.queryByTestId('loader-id')).not.toBeInTheDocument();

    expect(mockInitConverse).not.toHaveBeenCalled();
  });

  it('initializes converse plugins if video has xmpp and live_state not idle', async () => {
    mockGetDecodedJwt.mockReturnValue({
      permissions: {
        can_access_dashboard: false,
        can_update: false,
      },
    } as DecodedJwt);
    const video = {
      ...mockVideo,
      live_state: liveState.RUNNING,
      xmpp: {
        bosh_url: 'https://xmpp-server.com/http-bind',
        converse_persistent_store: PersistentStore.LOCALSTORAGE,
        websocket_url: null,
        conference_url:
          '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
        prebind_url: 'https://xmpp-server.com/http-pre-bind',
        jid: 'xmpp-server.com',
      },
    };
    const liveSession = liveSessionFactory();
    useLiveSession.getState().setLiveSession(liveSession);

    render(
      <ConverseInitializer video={video}>
        <span>loaded</span>
      </ConverseInitializer>,
    );

    screen.getByTestId('loader-id');
    expect(screen.queryByText('loaded')).not.toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('converse-loaded'));
    });

    await screen.findByText('loaded');
    expect(screen.queryByTestId('loader-id')).not.toBeInTheDocument();

    expect(mockInitConverse).toHaveBeenCalledTimes(1);
    expect(mockInitConverse).toHaveBeenCalledWith(
      {
        bosh_url: 'https://xmpp-server.com/http-bind',
        converse_persistent_store: PersistentStore.LOCALSTORAGE,
        websocket_url: null,
        conference_url:
          '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
        prebind_url: 'https://xmpp-server.com/http-pre-bind',
        jid: 'xmpp-server.com',
      },
      null,
    );
  });
});
