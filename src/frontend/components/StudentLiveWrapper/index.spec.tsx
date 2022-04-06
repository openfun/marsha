import React from 'react';
import fetchMock from 'fetch-mock';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  LivePanelItem,
  useLivePanelState,
} from 'data/stores/useLivePanelState';
import { useLiveStateStarted } from 'data/stores/useLiveStateStarted';
import { LiveModeType, liveState } from 'types/tracks';
import { PersistentStore } from 'types/XMPP';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { createPlayer } from 'Player/createPlayer';

import { LiveVideoWrapper } from '.';
import { useParticipantWorkflow } from 'data/stores/useParticipantWorkflow/index';

const mockVideo = videoMockFactory();
jest.mock('data/appData', () => ({
  appData: {
    video: mockVideo,
    static: {
      img: {
        liveBackground: 'some_url',
      },
    },
  },
  getDecodedJwt: () => ({
    permissions: {
      can_update: false,
    },
  }),
}));

jest.mock('Player/createPlayer', () => ({
  createPlayer: jest.fn(),
}));
jest.mock('data/sideEffects/getResource', () => ({
  getResource: jest.fn().mockResolvedValue(null),
}));
jest.mock('utils/resumeLive', () => ({
  resumeLive: jest.fn().mockResolvedValue(null),
}));
jest.mock('video.js', () => ({
  __esModule: true,
  default: {
    getPlayers: () => ({
      r2d2: {
        currentSource: () => 'https://live.m3u8',
        src: jest.fn(),
      },
    }),
  },
}));

jest.mock('components/ConverseInitializer', () => ({
  ConverseInitializer: ({ children }: { children: React.ReactNode }) => {
    return children;
  },
}));

const mockCreatePlayer = createPlayer as jest.MockedFunction<
  typeof createPlayer
>;

window.HTMLElement.prototype.scrollTo = jest.fn();

describe('<StudentLiveWrapper /> as a viewer', () => {
  beforeEach(() => {
    jest.useFakeTimers();

    fetchMock.mock(
      '/api/timedtexttracks/',
      {
        actions: {
          POST: {
            language: {
              choices: [
                { display_name: 'English', value: 'en' },
                { display_name: 'French', value: 'fr' },
              ],
            },
          },
        },
      },
      { method: 'OPTIONS' },
    );
    mockCreatePlayer.mockReturnValue({
      destroy: jest.fn(),
      getSource: jest.fn(),
      setSource: jest.fn(),
    });

    useLiveStateStarted.setState({
      isStarted: true,
    });
  });

  afterEach(() => {
    fetchMock.restore();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('configures live state with panel closed', async () => {
    useLivePanelState.setState({
      isPanelVisible: false,
      currentItem: undefined,
      availableItems: [],
    });
    useLiveStateStarted.getState().setIsStarted(true);
    const video = videoMockFactory({
      title: 'live title',
      live_state: liveState.RUNNING,
      urls: {
        manifests: {
          hls: 'https://example.com/hls.m3u8',
        },
        mp4: {},
        thumbnails: {},
      },
      xmpp: {
        bosh_url: 'https://xmpp-server.com/http-bind',
        converse_persistent_store: PersistentStore.LOCALSTORAGE,
        websocket_url: null,
        conference_url:
          '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
        prebind_url: 'https://xmpp-server.com/http-pre-bind',
        jid: 'xmpp-server.com',
      },
    });

    render(
      wrapInIntlProvider(
        <LiveVideoWrapper video={video} playerType={'player_type'} />,
      ),
    );

    await waitFor(() =>
      // The player is created
      expect(mockCreatePlayer).toHaveBeenCalledWith(
        'player_type',
        expect.any(Element),
        expect.anything(),
        video,
        'en',
        expect.any(Function),
      ),
    );

    act(() => useLivePanelState.getState().setPanelVisibility(false));

    expect(screen.queryByText('Live is starting')).not.toBeInTheDocument();
    expect(screen.queryByText('Join the chat')).not.toBeInTheDocument();
    expect(screen.queryByText('Other participants')).not.toBeInTheDocument();
    screen.getByText('live title');
    screen.getByRole('button', { name: 'Show chat' });

    expect(useLivePanelState.getState().availableItems).toEqual([
      LivePanelItem.CHAT,
      LivePanelItem.VIEWERS_LIST,
    ]);
    expect(useLivePanelState.getState().currentItem).toEqual(
      LivePanelItem.CHAT,
    );
    expect(useLivePanelState.getState().isPanelVisible).toEqual(false);
  });

  it('configures live state with panel opened on chat', async () => {
    useLivePanelState.setState({
      isPanelVisible: true,
      currentItem: LivePanelItem.CHAT,
      availableItems: [LivePanelItem.CHAT],
    });
    const video = videoMockFactory({
      title: 'live title',
      live_state: liveState.RUNNING,
      urls: {
        manifests: {
          hls: 'https://example.com/hls.m3u8',
        },
        mp4: {},
        thumbnails: {},
      },
      xmpp: {
        bosh_url: 'https://xmpp-server.com/http-bind',
        converse_persistent_store: PersistentStore.LOCALSTORAGE,
        websocket_url: null,
        conference_url:
          '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
        prebind_url: 'https://xmpp-server.com/http-pre-bind',
        jid: 'xmpp-server.com',
      },
    });

    render(
      wrapInIntlProvider(
        <LiveVideoWrapper video={video} playerType={'player_type'} />,
      ),
    );

    await waitFor(() =>
      // The player is created
      expect(mockCreatePlayer).toHaveBeenCalledWith(
        'player_type',
        expect.any(Element),
        expect.anything(),
        video,
        'en',
        expect.any(Function),
      ),
    );

    expect(screen.queryByText('Live is starting')).not.toBeInTheDocument();
    screen.getByText('Join the chat');
    expect(screen.queryByText('Other participants')).not.toBeInTheDocument();
    screen.getByText('live title');
    screen.getByRole('button', { name: 'Hide chat' });

    expect(useLivePanelState.getState().availableItems).toEqual([
      LivePanelItem.CHAT,
      LivePanelItem.VIEWERS_LIST,
    ]);
    expect(useLivePanelState.getState().currentItem).toEqual(
      LivePanelItem.CHAT,
    );
    expect(useLivePanelState.getState().isPanelVisible).toEqual(true);
  });

  it('configures live state with panel opened on viewers list', async () => {
    useLivePanelState.setState({
      isPanelVisible: true,
      currentItem: LivePanelItem.CHAT,
      availableItems: [LivePanelItem.CHAT],
    });
    const video = videoMockFactory({
      title: 'live title',
      live_state: liveState.RUNNING,
      urls: {
        manifests: {
          hls: 'https://example.com/hls.m3u8',
        },
        mp4: {},
        thumbnails: {},
      },
      xmpp: {
        bosh_url: 'https://xmpp-server.com/http-bind',
        converse_persistent_store: PersistentStore.LOCALSTORAGE,
        websocket_url: null,
        conference_url:
          '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
        prebind_url: 'https://xmpp-server.com/http-pre-bind',
        jid: 'xmpp-server.com',
      },
    });

    render(
      wrapInIntlProvider(
        <LiveVideoWrapper video={video} playerType={'player_type'} />,
      ),
    );

    await waitFor(() =>
      // The player is created
      expect(mockCreatePlayer).toHaveBeenCalledWith(
        'player_type',
        expect.any(Element),
        expect.anything(),
        video,
        'en',
        expect.any(Function),
      ),
    );

    expect(screen.queryByText('Live will begin soon')).not.toBeInTheDocument();
    screen.getByText('live title');

    const viewersTabButton = screen.getByRole('tab', { name: 'viewers' });
    userEvent.click(viewersTabButton);
    expect(screen.queryByText('On stage')).toBeNull();
    expect(screen.queryByText('Other participants')).toBeNull();

    expect(useLivePanelState.getState().availableItems).toEqual([
      LivePanelItem.CHAT,
      LivePanelItem.VIEWERS_LIST,
    ]);
    expect(useLivePanelState.getState().currentItem).toEqual(
      LivePanelItem.VIEWERS_LIST,
    );
    expect(useLivePanelState.getState().isPanelVisible).toEqual(true);
  });

  it('configures live state without chat when XMPP is disabled', async () => {
    useLivePanelState.setState({
      isPanelVisible: false,
      currentItem: undefined,
      availableItems: [],
    });
    const video = videoMockFactory({
      title: 'live title',
      live_state: liveState.RUNNING,
      urls: {
        manifests: {
          hls: 'https://example.com/hls.m3u8',
        },
        mp4: {},
        thumbnails: {},
      },
    });

    render(
      wrapInIntlProvider(
        <LiveVideoWrapper video={video} playerType={'player_type'} />,
      ),
    );

    await waitFor(() =>
      // The player is created
      expect(mockCreatePlayer).toHaveBeenCalledWith(
        'player_type',
        expect.any(Element),
        expect.anything(),
        video,
        'en',
        expect.any(Function),
      ),
    );

    expect(screen.queryByText('Live is starting')).not.toBeInTheDocument();
    expect(screen.queryByText('Join the chat')).not.toBeInTheDocument();
    screen.getByText('live title');
    expect(
      screen.queryByRole('button', { name: 'Show chat' }),
    ).not.toBeInTheDocument();

    expect(useLivePanelState.getState().availableItems).toEqual([]);
    expect(useLivePanelState.getState().currentItem).toEqual(undefined);
    expect(useLivePanelState.getState().isPanelVisible).toEqual(false);
  });

  it('configures live state without action elements while the live is not really started', async () => {
    fetchMock.mock('https://marsha.education/live.m3u8', 404);
    useLivePanelState.setState({
      isPanelVisible: false,
      currentItem: undefined,
      availableItems: [],
    });
    useLiveStateStarted.setState({
      isStarted: false,
    });
    const video = videoMockFactory({
      title: 'live title',
      live_state: liveState.RUNNING,
      urls: {
        manifests: {
          hls: 'https://marsha.education/live.m3u8',
        },
        mp4: {},
        thumbnails: {},
      },
    });

    render(
      wrapInIntlProvider(
        <LiveVideoWrapper video={video} playerType={'player_type'} />,
      ),
    );

    await waitFor(() => {
      expect(
        fetchMock.calls('https://marsha.education/live.m3u8', {
          method: 'GET',
        }),
      ).toHaveLength(1);
    });

    expect(mockCreatePlayer).not.toHaveBeenCalled();

    screen.getByText('Live is starting');
    expect(screen.queryByText('Join the chat')).not.toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'live title' })).toHaveLength(
      2,
    );
    expect(
      screen.queryByRole('button', { name: 'Show chat' }),
    ).not.toBeInTheDocument();

    expect(useLivePanelState.getState().availableItems).toEqual([]);
    expect(useLivePanelState.getState().currentItem).toBeUndefined();
    expect(useLivePanelState.getState().isPanelVisible).toEqual(false);

    fetchMock.mock('https://marsha.education/live.m3u8', 200, {
      overwriteRoutes: true,
    });
    jest.advanceTimersToNextTimer();

    await waitFor(() => {
      expect(
        fetchMock.calls('https://marsha.education/live.m3u8', {
          method: 'GET',
        }),
      ).toHaveLength(2);
    });

    await waitFor(() =>
      // The player is created
      expect(mockCreatePlayer).toHaveBeenCalledWith(
        'player_type',
        expect.any(Element),
        expect.anything(),
        video,
        'en',
        expect.any(Function),
      ),
    );
  });
});

describe('<StudentLiveWrapper /> as a streamer', () => {
  const mockExecuteCommand = jest.fn();
  const mockJitsi = jest.fn().mockImplementation(() => ({
    executeCommand: mockExecuteCommand,
    addListener: jest.fn(),
  }));

  beforeEach(() => {
    useLiveStateStarted.setState({
      isStarted: true,
    });
    useParticipantWorkflow.getState().setAccepted();
  });

  beforeAll(() => {
    global.JitsiMeetExternalAPI = mockJitsi;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('configures live state with panel closed', () => {
    useLivePanelState.setState({
      isPanelVisible: false,
      currentItem: undefined,
      availableItems: [],
    });
    useLiveStateStarted.getState().setIsStarted(true);
    const video = videoMockFactory({
      title: 'live title',
      live_info: {
        jitsi: {
          domain: 'meet.jit.si',
          external_api_url: 'https://meet.jit.si/external_api.js',
          config_overwrite: {},
          interface_config_overwrite: {},
        },
      },
      live_state: liveState.IDLE,
      live_type: LiveModeType.JITSI,
      xmpp: {
        bosh_url: 'https://xmpp-server.com/http-bind',
        converse_persistent_store: PersistentStore.LOCALSTORAGE,
        websocket_url: null,
        conference_url:
          '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
        prebind_url: 'https://xmpp-server.com/http-pre-bind',
        jid: 'xmpp-server.com',
      },
    });

    render(
      wrapInIntlProvider(
        <LiveVideoWrapper video={video} playerType={'player_type'} />,
      ),
    );
    act(() => useLivePanelState.getState().setPanelVisibility(false));
    expect(mockJitsi).toHaveBeenCalled();

    expect(screen.queryByText('Join the chat')).not.toBeInTheDocument();
    expect(screen.queryByText('Other participants')).not.toBeInTheDocument();
    screen.getByText('live title');
    screen.getByRole('button', { name: 'Show chat' });

    expect(useLivePanelState.getState().availableItems).toEqual([
      LivePanelItem.CHAT,
      LivePanelItem.VIEWERS_LIST,
    ]);
    expect(useLivePanelState.getState().currentItem).toEqual(
      LivePanelItem.CHAT,
    );
    expect(useLivePanelState.getState().isPanelVisible).toEqual(false);
  });

  it('configures live state with panel opened on chat', () => {
    useLivePanelState.setState({
      isPanelVisible: true,
      currentItem: LivePanelItem.CHAT,
      availableItems: [LivePanelItem.CHAT],
    });
    const video = videoMockFactory({
      title: 'live title',
      live_info: {
        jitsi: {
          domain: 'meet.jit.si',
          external_api_url: 'https://meet.jit.si/external_api.js',
          config_overwrite: {},
          interface_config_overwrite: {},
        },
      },
      live_state: liveState.IDLE,
      live_type: LiveModeType.JITSI,
      xmpp: {
        bosh_url: 'https://xmpp-server.com/http-bind',
        converse_persistent_store: PersistentStore.LOCALSTORAGE,
        websocket_url: null,
        conference_url:
          '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
        prebind_url: 'https://xmpp-server.com/http-pre-bind',
        jid: 'xmpp-server.com',
      },
    });

    render(
      wrapInIntlProvider(
        <LiveVideoWrapper video={video} playerType={'player_type'} />,
      ),
    );

    expect(mockJitsi).toHaveBeenCalled();

    screen.getByText('Join the chat');
    screen.getByText('live title');
    screen.getByRole('button', { name: 'Hide chat' });

    expect(useLivePanelState.getState().availableItems).toEqual([
      LivePanelItem.CHAT,
      LivePanelItem.VIEWERS_LIST,
    ]);
    expect(useLivePanelState.getState().currentItem).toEqual(
      LivePanelItem.CHAT,
    );
    expect(useLivePanelState.getState().isPanelVisible).toEqual(true);
  });

  it('configures live state with panel opened on viewers list', () => {
    useLivePanelState.setState({
      isPanelVisible: true,
      currentItem: LivePanelItem.CHAT,
      availableItems: [LivePanelItem.CHAT],
    });
    const video = videoMockFactory({
      title: 'live title',
      live_info: {
        jitsi: {
          domain: 'meet.jit.si',
          external_api_url: 'https://meet.jit.si/external_api.js',
          config_overwrite: {},
          interface_config_overwrite: {},
        },
      },
      live_state: liveState.IDLE,
      live_type: LiveModeType.JITSI,
      xmpp: {
        bosh_url: 'https://xmpp-server.com/http-bind',
        converse_persistent_store: PersistentStore.LOCALSTORAGE,
        websocket_url: null,
        conference_url:
          '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
        prebind_url: 'https://xmpp-server.com/http-pre-bind',
        jid: 'xmpp-server.com',
      },
    });

    render(
      wrapInIntlProvider(
        <LiveVideoWrapper video={video} playerType={'player_type'} />,
      ),
    );

    expect(mockJitsi).toHaveBeenCalled();

    expect(screen.queryByText('Live will begin soon')).not.toBeInTheDocument();
    screen.getByText('live title');

    const viewersTabButton = screen.getByRole('tab', { name: 'viewers' });
    userEvent.click(viewersTabButton);
    expect(screen.queryByText('On stage')).toBeNull();
    expect(screen.queryByText('Other participants')).toBeNull();

    expect(useLivePanelState.getState().availableItems).toEqual([
      LivePanelItem.CHAT,
      LivePanelItem.VIEWERS_LIST,
    ]);
    expect(useLivePanelState.getState().currentItem).toEqual(
      LivePanelItem.VIEWERS_LIST,
    );
    expect(useLivePanelState.getState().isPanelVisible).toEqual(true);
  });

  it('configures live state without chat when XMPP is disabled', () => {
    useLivePanelState.setState({
      isPanelVisible: true,
      currentItem: LivePanelItem.CHAT,
      availableItems: [LivePanelItem.CHAT],
    });
    const video = videoMockFactory({
      title: 'live title',
      live_info: {
        jitsi: {
          domain: 'meet.jit.si',
          external_api_url: 'https://meet.jit.si/external_api.js',
          config_overwrite: {},
          interface_config_overwrite: {},
        },
      },
      live_state: liveState.IDLE,
      live_type: LiveModeType.JITSI,
    });

    render(
      wrapInIntlProvider(
        <LiveVideoWrapper video={video} playerType={'player_type'} />,
      ),
    );

    expect(mockJitsi).toHaveBeenCalled();

    expect(screen.queryByText('Join the chat')).not.toBeInTheDocument();
    screen.getByText('live title');
    expect(
      screen.queryByRole('button', { name: 'Show chat' }),
    ).not.toBeInTheDocument();

    expect(useLivePanelState.getState().availableItems).toEqual([]);
    expect(useLivePanelState.getState().currentItem).toEqual(
      LivePanelItem.CHAT,
    );
    expect(useLivePanelState.getState().isPanelVisible).toEqual(false);
  });

  it('configures live state with action elements even if the live is not really started', async () => {
    useLivePanelState.setState({
      isPanelVisible: false,
      currentItem: undefined,
      availableItems: [],
    });
    useLiveStateStarted.getState().setIsStarted(false);
    const video = videoMockFactory({
      title: 'live title',
      live_info: {
        jitsi: {
          domain: 'meet.jit.si',
          external_api_url: 'https://meet.jit.si/external_api.js',
          config_overwrite: {},
          interface_config_overwrite: {},
        },
      },
      live_state: liveState.IDLE,
      live_type: LiveModeType.JITSI,
      xmpp: {
        bosh_url: 'https://xmpp-server.com/http-bind',
        converse_persistent_store: PersistentStore.LOCALSTORAGE,
        websocket_url: null,
        conference_url:
          '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
        prebind_url: 'https://xmpp-server.com/http-pre-bind',
        jid: 'xmpp-server.com',
      },
    });

    render(
      wrapInIntlProvider(
        <LiveVideoWrapper video={video} playerType={'player_type'} />,
      ),
    );
    act(() => useParticipantWorkflow.getState().setAccepted());
    expect(mockJitsi).toHaveBeenCalled();

    expect(screen.queryByText('Join the chat')).not.toBeInTheDocument();
    screen.getByText('live title');
    screen.getByRole('button', { name: 'Show chat' });

    expect(useLivePanelState.getState().availableItems).toEqual([
      LivePanelItem.CHAT,
      LivePanelItem.VIEWERS_LIST,
    ]);
    expect(useLivePanelState.getState().currentItem).toEqual(
      LivePanelItem.CHAT,
    );
    expect(useLivePanelState.getState().isPanelVisible).toEqual(false);
  });
});
