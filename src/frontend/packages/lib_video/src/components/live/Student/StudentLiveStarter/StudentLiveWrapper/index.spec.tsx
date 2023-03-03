/* eslint-disable testing-library/no-node-access */
import {
  act,
  getDefaultNormalizer,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import faker from 'faker';
import fetchMock from 'fetch-mock';
import {
  decodeJwt,
  useCurrentResourceContext,
  LiveModeType,
  liveState,
  PersistentStore,
  sharedLiveMediaMockFactory,
  videoMockFactory,
  useVideo,
} from 'lib-components';
import { render, Deferred } from 'lib-tests';
import React from 'react';

import { pushAttendance } from 'api/pushAttendance';
import { createPlayer } from 'components/common/Player/createPlayer';
import { useChatItemState } from 'hooks/useChatItemsStore';
import { LivePanelItem, useLivePanelState } from 'hooks/useLivePanelState';
import { useLiveStateStarted } from 'hooks/useLiveStateStarted';
import { useParticipantWorkflow } from 'hooks/useParticipantWorkflow';
import { PictureInPictureProvider } from 'hooks/usePictureInPicture/index';
import { getOrInitAnonymousId } from 'utils/getOrInitAnonymousId';
import { wrapInVideo } from 'utils/wrapInVideo';

import { StudentLiveWrapper } from '.';

const mockVideo = videoMockFactory();

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  getResource: jest.fn().mockResolvedValue(null),
  useAppConfig: () => ({
    attendanceDelay: 10000,
    video: mockVideo,
    static: {
      img: {
        liveBackground: 'some_url',
      },
    },
  }),
  useCurrentResourceContext: jest.fn(),
  decodeJwt: jest.fn(),
}));

jest.mock('components/common/Player/createPlayer', () => ({
  createPlayer: jest.fn(),
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

const mockCreatePlayer = createPlayer as jest.MockedFunction<
  typeof createPlayer
>;
jest.mock('api/pushAttendance', () => ({
  pushAttendance: jest.fn(),
}));
const mockPushAttendance = pushAttendance as jest.MockedFunction<
  typeof pushAttendance
>;

let mockJitsiValue: any;
const mockSetJitsi = jest.fn().mockImplementation((newValue: any) => {
  mockJitsiValue = newValue;
});
jest.mock('hooks/useJitsiApi', () => ({
  useJitsiApi: () => [mockJitsiValue, mockSetJitsi],
}));

const mockedUseCurrentResourceContext =
  useCurrentResourceContext as jest.MockedFunction<
    typeof useCurrentResourceContext
  >;
const mockedDecodeJwt = decodeJwt as jest.MockedFunction<typeof decodeJwt>;

describe('<StudentLiveWrapper /> as a viewer', () => {
  beforeEach(() => {
    jest.useFakeTimers();

    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: { can_update: false },
      },
    ] as any);
    mockedDecodeJwt.mockReturnValue({} as any);

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
      addTrack: jest.fn(),
      removeTrack: jest.fn(),
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
      live_type: LiveModeType.JITSI,
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
      wrapInVideo(
        <PictureInPictureProvider value={{ reversed: true }}>
          <StudentLiveWrapper playerType="player_type" />
        </PictureInPictureProvider>,
        video,
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
    screen.getByRole('heading', { name: 'live title' });

    expect(useLivePanelState.getState().availableItems).toEqual([
      LivePanelItem.CHAT,
      LivePanelItem.VIEWERS_LIST,
    ]);
    expect(useLivePanelState.getState().currentItem).toEqual(
      LivePanelItem.CHAT,
    );
    expect(useLivePanelState.getState().isPanelVisible).toEqual(false);
  });

  it('configures live state with recording on', async () => {
    useLivePanelState.setState({
      isPanelVisible: false,
      currentItem: undefined,
      availableItems: [],
    });
    useLiveStateStarted.getState().setIsStarted(true);
    const video = videoMockFactory({
      title: 'live title',
      live_state: liveState.RUNNING,
      live_type: LiveModeType.JITSI,
      is_recording: true,
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
      wrapInVideo(
        <PictureInPictureProvider value={{ reversed: true }}>
          <StudentLiveWrapper playerType="player_type" />
        </PictureInPictureProvider>,
        video,
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

    screen.getByRole('heading', { name: 'live title' });
    screen.getByText('Recording');
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
      live_type: LiveModeType.JITSI,
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
      wrapInVideo(
        <PictureInPictureProvider value={{ reversed: true }}>
          <StudentLiveWrapper playerType="player_type" />
        </PictureInPictureProvider>,
        video,
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
    screen.getByRole('heading', { name: 'live title' });

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
      live_type: LiveModeType.JITSI,
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
      wrapInVideo(
        <PictureInPictureProvider value={{ reversed: true }}>
          <StudentLiveWrapper playerType="player_type" />
        </PictureInPictureProvider>,
        video,
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
    screen.getByRole('heading', { name: 'live title' });

    const viewersTabButton = screen.getByRole('tab', { name: 'viewers' });
    userEvent.click(viewersTabButton);
    screen.getByText('On stage (0)');
    screen.getByText(
      'Oops, nobody is on stage. Wait for your teacher to ask joining the stage.',
    );
    screen.getByText('Other participants (0)');
    screen.getByText('No viewers are currently connected to your stream.');

    expect(useLivePanelState.getState().availableItems).toEqual([
      LivePanelItem.CHAT,
      LivePanelItem.VIEWERS_LIST,
    ]);
    expect(useLivePanelState.getState().currentItem).toEqual(
      LivePanelItem.VIEWERS_LIST,
    );
    expect(useLivePanelState.getState().isPanelVisible).toEqual(true);

    jest.runOnlyPendingTimers();
    expect(mockPushAttendance).not.toHaveBeenCalled();
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
      live_type: LiveModeType.JITSI,
      urls: {
        manifests: {
          hls: 'https://example.com/hls.m3u8',
        },
        mp4: {},
        thumbnails: {},
      },
    });

    render(
      wrapInVideo(
        <PictureInPictureProvider value={{ reversed: true }}>
          <StudentLiveWrapper playerType="player_type" />
        </PictureInPictureProvider>,
        video,
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
    screen.getByRole('heading', { name: 'live title' });

    expect(useLivePanelState.getState().availableItems).toEqual([]);
    expect(useLivePanelState.getState().currentItem).toEqual(undefined);
    expect(useLivePanelState.getState().isPanelVisible).toEqual(false);
  });

  it('prompts for display name when trying to join the chat', async () => {
    const video = videoMockFactory({
      title: 'live title',
      live_state: liveState.RUNNING,
      live_type: LiveModeType.JITSI,
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
    useChatItemState.setState({
      hasReceivedMessageHistory: true,
    });

    render(
      wrapInVideo(
        <PictureInPictureProvider value={{ reversed: true }}>
          <StudentLiveWrapper playerType="player_type" />
        </PictureInPictureProvider>,
        video,
      ),
    );

    const joindChatButton = await screen.findByRole('button', {
      name: 'Join the chat',
    });
    userEvent.click(joindChatButton);

    expect(await screen.findByText('Display name')).toBeInTheDocument();
  });

  it('displays no title in the info bar when no one is set in the video', async () => {
    const video = videoMockFactory({
      title: null,
      live_state: liveState.RUNNING,
      live_type: LiveModeType.JITSI,
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
      wrapInVideo(
        <PictureInPictureProvider value={{ reversed: true }}>
          <StudentLiveWrapper playerType="player_type" />
        </PictureInPictureProvider>,
        video,
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

    screen.getByRole('heading', { name: 'No title' });
  });

  it('displays the video in the picture and shared media in background when a media is shared', async () => {
    const videoId = faker.datatype.uuid();
    const sharedLiveMedia = sharedLiveMediaMockFactory({ video: videoId });
    const video = videoMockFactory({
      id: videoId,
      active_shared_live_media: sharedLiveMedia,
      active_shared_live_media_page: 1,
      title: 'live title',
      live_info: {},
      live_state: liveState.RUNNING,
      live_type: LiveModeType.RAW,
      shared_live_medias: [sharedLiveMedia],
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
    useChatItemState.setState({
      hasReceivedMessageHistory: true,
    });

    const { elementContainer: container } = render(
      wrapInVideo(
        <PictureInPictureProvider value={{ reversed: true }}>
          <StudentLiveWrapper playerType="player_type" />
        </PictureInPictureProvider>,
        video,
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

    const pipMaster = container!.querySelector('#picture-in-picture-master');
    const pipSlave = container!.querySelector('#picture-in-picture-slave');
    expect(pipMaster!.getElementsByTagName('source')[0]).toHaveAttribute(
      'src',
      `https://example.com/mp4/1080`,
    );
    expect(pipSlave?.getElementsByTagName('img')[0]).toHaveAttribute(
      'src',
      `https://example.com/sharedLiveMedia/${sharedLiveMedia.id}/1`,
    );
  });
});

describe('<StudentLiveWrapper /> as a streamer', () => {
  const deferredAudio = new Deferred();
  const deferredVideo = new Deferred();

  const mockExecuteCommand = jest.fn();
  const mockJitsi = jest.fn().mockImplementation(() => ({
    executeCommand: mockExecuteCommand,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    isAudioMuted: jest.fn().mockReturnValue(deferredAudio.promise),
    isVideoMuted: jest.fn().mockReturnValue(deferredVideo.promise),
    dispose: jest.fn(),
  }));

  beforeEach(() => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: { can_update: true },
      },
    ] as any);
    mockedDecodeJwt.mockReturnValue({} as any);

    useLiveStateStarted.setState({
      isStarted: true,
    });
    useParticipantWorkflow.getState().setAccepted();
    jest.useFakeTimers();
    mockJitsiValue = undefined;
  });

  beforeAll(() => {
    global.JitsiMeetExternalAPI = mockJitsi;
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
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
      live_info: {
        jitsi: {
          domain: 'meet.jit.si',
          external_api_url: 'https://meet.jit.si/external_api.js',
          config_overwrite: {},
          interface_config_overwrite: {},
          room_name: 'jitsi_conference',
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
      wrapInVideo(
        <PictureInPictureProvider value={{ reversed: true }}>
          <StudentLiveWrapper playerType="player_type" />
        </PictureInPictureProvider>,
        video,
      ),
    );

    await waitFor(() => expect(mockSetJitsi).toHaveBeenCalled());
    act(() => useLivePanelState.getState().setPanelVisibility(false));

    expect(screen.queryByText('Join the chat')).not.toBeInTheDocument();
    expect(screen.queryByText('Other participants')).not.toBeInTheDocument();
    screen.getByRole('heading', { name: 'live title' });

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
      live_info: {
        jitsi: {
          domain: 'meet.jit.si',
          external_api_url: 'https://meet.jit.si/external_api.js',
          config_overwrite: {},
          interface_config_overwrite: {},
          room_name: 'jitsi_conference',
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
      wrapInVideo(
        <PictureInPictureProvider value={{ reversed: true }}>
          <StudentLiveWrapper playerType="player_type" />
        </PictureInPictureProvider>,
        video,
      ),
    );

    await waitFor(() => expect(mockSetJitsi).toHaveBeenCalled());

    screen.getByText('Join the chat');
    screen.getByRole('heading', { name: 'live title' });

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
      live_info: {
        jitsi: {
          domain: 'meet.jit.si',
          external_api_url: 'https://meet.jit.si/external_api.js',
          config_overwrite: {},
          interface_config_overwrite: {},
          room_name: 'jitsi_conference',
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
      wrapInVideo(
        <PictureInPictureProvider value={{ reversed: true }}>
          <StudentLiveWrapper playerType="player_type" />
        </PictureInPictureProvider>,
        video,
      ),
    );

    await waitFor(() => expect(mockSetJitsi).toHaveBeenCalled());

    expect(screen.queryByText('Live will begin soon')).not.toBeInTheDocument();
    screen.getByRole('heading', { name: 'live title' });

    const viewersTabButton = screen.getByRole('tab', { name: 'viewers' });
    userEvent.click(viewersTabButton);
    screen.getByText('On stage (0)');
    screen.getByText(
      'Oops, nobody is on stage. Wait for your teacher to ask joining the stage.',
    );
    screen.getByText('Other participants (0)');
    screen.getByText('No viewers are currently connected to your stream.');

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
          room_name: 'jitsi_conference',
        },
      },
      live_state: liveState.IDLE,
      live_type: LiveModeType.JITSI,
    });

    render(
      wrapInVideo(
        <PictureInPictureProvider value={{ reversed: true }}>
          <StudentLiveWrapper playerType="player_type" />
        </PictureInPictureProvider>,
        video,
      ),
    );

    await waitFor(() => expect(mockSetJitsi).toHaveBeenCalled());

    expect(screen.queryByText('Join the chat')).not.toBeInTheDocument();
    screen.getByRole('heading', { name: 'live title' });

    expect(useLivePanelState.getState().availableItems).toEqual([]);
    expect(useLivePanelState.getState().currentItem).toEqual(
      LivePanelItem.CHAT,
    );
    expect(useLivePanelState.getState().isPanelVisible).toEqual(false);
  });

  it('configures live state without chat when chat is disabled', async () => {
    const video = videoMockFactory({
      title: 'live title',
      has_chat: false,
      live_info: {
        jitsi: {
          domain: 'meet.jit.si',
          external_api_url: 'https://meet.jit.si/external_api.js',
          config_overwrite: {},
          interface_config_overwrite: {},
          room_name: 'jitsi_conference',
        },
      },
      live_state: liveState.IDLE,
      live_type: LiveModeType.JITSI,
      xmpp: {
        bosh_url: null,
        converse_persistent_store: PersistentStore.LOCALSTORAGE,
        conference_url: 'conference-url',
        jid: 'jid',
        prebind_url: 'prebind_url',
        websocket_url: null,
      },
    });

    render(
      wrapInVideo(
        <PictureInPictureProvider value={{ reversed: true }}>
          <StudentLiveWrapper playerType="player_type" />
        </PictureInPictureProvider>,
        video,
      ),
    );

    await waitFor(() => expect(mockSetJitsi).toHaveBeenCalled());

    expect(screen.queryByText('Join the chat')).not.toBeInTheDocument();
    screen.getByRole('heading', { name: 'live title' });

    expect(useLivePanelState.getState().availableItems).toEqual([
      LivePanelItem.VIEWERS_LIST,
    ]);
    expect(useLivePanelState.getState().currentItem).toEqual(
      LivePanelItem.VIEWERS_LIST,
    );
    expect(useLivePanelState.getState().isPanelVisible).toEqual(true);
  });

  it('prompts for display name when trying to join the chat', async () => {
    const video = videoMockFactory({
      title: 'live title',
      live_info: {
        jitsi: {
          room_name: 'room',
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
    useChatItemState.setState({
      hasReceivedMessageHistory: true,
    });

    render(
      wrapInVideo(
        <PictureInPictureProvider value={{ reversed: true }}>
          <StudentLiveWrapper playerType="player_type" />
        </PictureInPictureProvider>,
        video,
      ),
    );

    await waitFor(() => expect(mockSetJitsi).toHaveBeenCalled());

    const joindChatButton = await screen.findByRole('button', {
      name: 'Join the chat',
    });
    userEvent.click(joindChatButton);

    await screen.findByText('Display name');
  });

  it('inits the live title bar with the default title', async () => {
    const video = videoMockFactory({
      title: null,
      live_info: {
        jitsi: {
          room_name: 'room',
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
      wrapInVideo(
        <PictureInPictureProvider value={{ reversed: true }}>
          <StudentLiveWrapper playerType="player_type" />
        </PictureInPictureProvider>,
        video,
      ),
    );

    await waitFor(() => expect(mockSetJitsi).toHaveBeenCalled());

    screen.getByRole('heading', { name: 'No title' });
  });

  it('inits the live title bar with title and starting date', async () => {
    const video = videoMockFactory({
      title: "Hello world, it's me",
      starting_at: '2020-10-01T08:00:00Z',
      live_info: {
        jitsi: {
          room_name: 'room',
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
      wrapInVideo(
        <PictureInPictureProvider value={{ reversed: true }}>
          <StudentLiveWrapper playerType="player_type" />
        </PictureInPictureProvider>,
        video,
      ),
    );

    await waitFor(() => expect(mockSetJitsi).toHaveBeenCalled());

    screen.getByRole('heading', { name: "Hello world, it's me" });
    screen.getByText('10/1/2020  ·  8:00:00 AM', {
      normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
    });
  });

  it('pushes attendance when student is on stage', async () => {
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
      addTrack: jest.fn(),
      removeTrack: jest.fn(),
      destroy: jest.fn(),
      getSource: jest.fn(),
      setSource: jest.fn(),
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
          room_name: 'jitsi_conference',
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
      wrapInVideo(
        <PictureInPictureProvider value={{ reversed: true }}>
          <StudentLiveWrapper playerType="player_type" />
        </PictureInPictureProvider>,
        video,
      ),
    );

    await waitFor(() => expect(mockSetJitsi).toHaveBeenCalled());

    // when component is loaded, a first attendance is registered
    expect(mockPushAttendance).toHaveBeenCalledTimes(1);
    Date.now = jest.fn(() => 1651732370000);
    jest.runOnlyPendingTimers();
    expect(mockPushAttendance).toHaveBeenCalledWith(
      video.id,
      {
        1651732370: {
          onStage: true,
        },
      },
      'en',
      getOrInitAnonymousId(),
    );

    expect(mockPushAttendance).toHaveBeenCalledTimes(2);

    act(() => useParticipantWorkflow.getState().setKicked());
    jest.runOnlyPendingTimers();
    // it didn't get called a new time
    expect(mockPushAttendance).toHaveBeenCalledTimes(2);

    // student is not on stage, player is created
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

  it('displays the jitsi player in the picture and shared media in background when a media is shared', () => {
    const videoId = faker.datatype.uuid();
    const sharedLiveMedia = sharedLiveMediaMockFactory({ video: videoId });
    const video = videoMockFactory({
      id: videoId,
      active_shared_live_media: sharedLiveMedia,
      active_shared_live_media_page: 1,
      title: 'live title',
      live_info: {
        jitsi: {
          domain: 'meet.jit.si',
          external_api_url: 'https://meet.jit.si/external_api.js',
          config_overwrite: {},
          interface_config_overwrite: {},
          room_name: 'jitsi_conference',
        },
      },
      live_state: liveState.IDLE,
      live_type: LiveModeType.JITSI,
      shared_live_medias: [sharedLiveMedia],
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
    useChatItemState.setState({
      hasReceivedMessageHistory: true,
    });

    const { elementContainer: container } = render(
      wrapInVideo(
        <PictureInPictureProvider value={{ reversed: true }}>
          <StudentLiveWrapper playerType="player_type" />
        </PictureInPictureProvider>,
        video,
      ),
    );

    expect(mockJitsi).toHaveBeenCalled();

    container!.querySelector('#picture-in-picture-master');
    const pipSlave = container!.querySelector('#picture-in-picture-slave');
    expect(pipSlave!.getElementsByTagName('img')[0]).toHaveAttribute(
      'src',
      `https://example.com/sharedLiveMedia/${sharedLiveMedia.id}/1`,
    );
  });

  it('use id3 tags for shared documents instead of video when possible', () => {
    const videoId = faker.datatype.uuid();
    const sharedLiveMedia = sharedLiveMediaMockFactory({ video: videoId });
    useVideo.getState().setId3Video({
      active_shared_live_media: { id: sharedLiveMedia.id },
      active_shared_live_media_page: 2,
      live_state: liveState.RUNNING,
    });
    useVideo.getState().setIsWatchingVideo(true);
    const video = videoMockFactory({
      id: videoId,
      active_shared_live_media: sharedLiveMedia,
      active_shared_live_media_page: 1,
      title: 'live title',
      live_info: {
        jitsi: {
          domain: 'meet.jit.si',
          external_api_url: 'https://meet.jit.si/external_api.js',
          config_overwrite: {},
          interface_config_overwrite: {},
          room_name: 'jitsi_conference',
        },
      },
      live_state: liveState.RUNNING,
      live_type: LiveModeType.JITSI,
      shared_live_medias: [sharedLiveMedia],
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
    useChatItemState.setState({
      hasReceivedMessageHistory: true,
    });

    const { elementContainer: container } = render(
      wrapInVideo(
        <PictureInPictureProvider value={{ reversed: true }}>
          <StudentLiveWrapper playerType="player_type" />
        </PictureInPictureProvider>,
        video,
      ),
    );

    expect(mockJitsi).toHaveBeenCalled();

    container!.querySelector('#picture-in-picture-master');
    const pipSlave = container!.querySelector('#picture-in-picture-slave');
    expect(pipSlave!.getElementsByTagName('img')[0]).toHaveAttribute(
      'src',
      `https://example.com/sharedLiveMedia/${sharedLiveMedia.id}/2`,
    );
  });

  it('configures live state with chat and viewers button when in mobile view', async () => {
    useLivePanelState.setState({
      isPanelVisible: true,
      currentItem: LivePanelItem.CHAT,
      availableItems: [LivePanelItem.CHAT, LivePanelItem.VIEWERS_LIST],
    });
    const video = videoMockFactory({
      title: null,
      live_info: {
        jitsi: {
          room_name: 'room',
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
      wrapInVideo(
        <PictureInPictureProvider value={{ reversed: true }}>
          <StudentLiveWrapper playerType="player_type" />
        </PictureInPictureProvider>,
        video,
      ),
      { grommetOptions: { responsiveSize: 'small' } },
    );

    await waitFor(() => expect(mockSetJitsi).toHaveBeenCalled());
    screen.getByRole('button', { name: 'Show viewers' });
    screen.getByRole('button', { name: 'Hide chat' });
  });
});
