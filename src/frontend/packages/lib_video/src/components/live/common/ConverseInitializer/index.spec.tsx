import { act, screen } from '@testing-library/react';
import {
  PersistentStore,
  liveSessionFactory,
  liveState,
  useCurrentResourceContext,
  videoMockFactory,
} from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { useLiveSession } from '@lib-video/hooks/useLiveSession';
import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { ConverseInitializer } from '.';

let mockConverse: any;
jest.mock('utils/window', () => ({
  get converse() {
    return mockConverse;
  },
}));

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({
    video: mockVideo,
  }),
  useCurrentResourceContext: jest.fn(),
}));

const mockInitConverse = jest.fn();
jest.mock('utils/conversejs/converse', () => ({
  converseMounter: () => mockInitConverse,
}));

const mockedUseCurrentResourceContext =
  useCurrentResourceContext as jest.MockedFunction<
    typeof useCurrentResourceContext
  >;

const mockVideo = videoMockFactory();

describe('<ConverseInitializer />', () => {
  beforeEach(() => {
    mockConverse = undefined;
    jest.resetAllMocks();
  });

  it('does not initialize converse without liveRegistration if user can not access dashboard', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_access_dashboard: false,
          can_update: false,
        },
      },
    ] as any);
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

    render(wrapInVideo(<ConverseInitializer />, video));
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
      video,
      null,
    );
  });

  it('does not initialize converse for a video without xmpp', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_access_dashboard: false,
          can_update: false,
        },
      },
    ] as any);
    const video = {
      ...mockVideo,
      live_state: liveState.RUNNING,
    };
    mockConverse = {};

    render(wrapInVideo(<ConverseInitializer />, video));
    // mockConverseMounter returns itself a mock. We want to inspect this mock to be sure that
    // is was called with the container name and the xmpp object
    expect(mockInitConverse).not.toHaveBeenCalled();
  });

  it('does not initialize converse for a video without live state', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_access_dashboard: false,
          can_update: false,
        },
      },
    ] as any);
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

    render(wrapInVideo(<ConverseInitializer />, video));
    // mockConverseMounter returns itself a mock. We want to inspect this mock to be sure that
    // is was called with the container name and the xmpp object
    expect(mockInitConverse).not.toHaveBeenCalled();
  });

  it('does not initialize converse for a video with a live state idle', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_access_dashboard: false,
          can_update: false,
        },
      },
    ] as any);
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

    render(wrapInVideo(<ConverseInitializer />, video));
    // mockConverseMounter returns itself a mock. We want to inspect this mock to be sure that
    // is was called with the container name and the xmpp object
    expect(mockInitConverse).not.toHaveBeenCalled();
  });

  it('initializes converse with the displayname', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_access_dashboard: false,
          can_update: false,
        },
      },
    ] as any);
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

    render(wrapInVideo(<ConverseInitializer />, video));
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
      video,
      'john',
    );
  });

  it('renders children if converse is initialized in the window', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_access_dashboard: false,
          can_update: false,
        },
      },
    ] as any);
    mockConverse = {};

    render(
      wrapInVideo(
        <ConverseInitializer>
          <span>loaded</span>
        </ConverseInitializer>,
        mockVideo,
      ),
    );

    screen.getByText('loaded');
    expect(screen.queryByTestId('loader-id')).not.toBeInTheDocument();
  });

  it('initializes converse in the window if not define yet', async () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_access_dashboard: false,
          can_update: false,
        },
      },
    ] as any);
    const liveSession = liveSessionFactory();
    useLiveSession.getState().setLiveSession(liveSession);

    render(
      wrapInVideo(
        <ConverseInitializer>
          <span>loaded</span>
        </ConverseInitializer>,
        mockVideo,
      ),
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
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_access_dashboard: false,
          can_update: false,
        },
      },
    ] as any);
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
      wrapInVideo(
        <ConverseInitializer>
          <span>loaded</span>
        </ConverseInitializer>,
        video,
      ),
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
      video,
      null,
    );
  });
});
