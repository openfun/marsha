import { getDefaultNormalizer, screen, waitFor } from '@testing-library/react';
import userEventInit from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import {
  JoinMode,
  LiveJitsi,
  LiveModeType,
  PersistentStore,
  Video,
  liveMockFactory,
  liveState,
  participantMockFactory,
  uploadState,
  useCurrentResourceContext,
  useJwt,
} from 'lib-components';
import { render } from 'lib-tests';
import { Suspense, useEffect } from 'react';
import { QueryClient } from 'react-query';

import DashboardLiveJitsi from '@lib-video/components/live/common/DashboardLiveJitsi';
import { useChatItemState } from '@lib-video/hooks/useChatItemsStore';
import { JitsiApiProvider } from '@lib-video/hooks/useJitsiApi';
import { LiveModaleConfigurationProvider } from '@lib-video/hooks/useLiveModale';
import {
  LivePanelItem,
  useLivePanelState,
} from '@lib-video/hooks/useLivePanelState';
import { PictureInPictureProvider } from '@lib-video/hooks/usePictureInPicture';
import { converse } from '@lib-video/utils/window';
import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { TeacherLiveWrapper } from '.';

jest.mock('jwt-decode', () => jest.fn());

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({
    static: {
      img: {
        liveBackground: 'path/to/image.png',
      },
    },
  }),
  useCurrentResourceContext: jest.fn(),
}));

jest.mock(
  './MainContent/TeacherLiveContent/TeacherLiveRawWrapper',
  () => (props: { video: Video }) => (
    <span title={props.video.id}>live raw</span>
  ),
);

let mockCanShowStartButton = false;
const MockDashboardLiveJitsi = ({
  liveJitsi,
  setCanShowStartButton,
}: {
  liveJitsi: LiveJitsi;
  setCanShowStartButton: (canShowStartButton: boolean) => void;
}) => {
  useEffect(() => {
    setCanShowStartButton(mockCanShowStartButton);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setCanShowStartButton, mockCanShowStartButton]);

  return <span title={liveJitsi.id}>jitsi</span>;
};
jest.mock('@lib-video/components/live/common/DashboardLiveJitsi', () => ({
  __esModule: true,
  default: jest.fn(),
}));
const mockedDashboardLiveJitsi = DashboardLiveJitsi as jest.MockedFunction<
  typeof DashboardLiveJitsi
>;

jest.mock('utils/window', () => ({
  converse: {
    acceptParticipantToJoin: jest.fn(),
  },
}));
const mockAcceptParticipantToJoin =
  converse.acceptParticipantToJoin as jest.MockedFunction<
    typeof converse.acceptParticipantToJoin
  >;

const mockedUseCurrentResourceContext =
  useCurrentResourceContext as jest.MockedFunction<
    typeof useCurrentResourceContext
  >;

let queryClient: QueryClient;

jest.setTimeout(10000);

const userEvent = userEventInit.setup({
  advanceTimers: jest.advanceTimersByTime,
});

describe('components/DashboardLive', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'cool_token_m8',
    });
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_access_dashboard: false,
          can_update: false,
        },
      },
    ] as any);

    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.useFakeTimers();

    mockedDashboardLiveJitsi.mockImplementation(MockDashboardLiveJitsi as any);
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
    mockCanShowStartButton = false;
    jest.useRealTimers();
  });

  const video = liveMockFactory({
    is_ready_to_show: true,
    show_download: true,
    thumbnail: null,
    timed_text_tracks: [],
    title: '',
    upload_state: uploadState.PENDING,
    urls: {
      manifests: {
        hls: 'https://example.com/hls',
      },
      mp4: {},
      thumbnails: {},
    },
    should_use_subtitle_as_transcript: false,
    live_info: {
      medialive: {
        input: {
          endpoints: [
            'rtmp://1.2.3.4:1935/stream-key-primary',
            'rtmp://4.3.2.1:1935/stream-key-secondary',
          ],
        },
      },
    },
    live_type: LiveModeType.RAW,
  });

  it('shows the start and raw button when the status is IDLE', async () => {
    render(
      wrapInVideo(
        <LiveModaleConfigurationProvider value={null}>
          <PictureInPictureProvider value={{ reversed: false }}>
            <JitsiApiProvider value={undefined}>
              <Suspense fallback="loading...">
                <TeacherLiveWrapper />
              </Suspense>
            </JitsiApiProvider>
          </PictureInPictureProvider>
        </LiveModaleConfigurationProvider>,
        { ...video, live_state: liveState.IDLE },
      ),
      { queryOptions: { client: queryClient } },
    );

    await screen.findByRole('button', { name: /start streaming/i });

    expect(screen.queryByTestId('start-recording')).not.toBeInTheDocument();
    expect(screen.queryByTestId('stop-recording')).not.toBeInTheDocument();
  });

  it('shows alert to join the room', async () => {
    const { rerender } = render(
      wrapInVideo(
        <LiveModaleConfigurationProvider value={null}>
          <PictureInPictureProvider value={{ reversed: false }}>
            <JitsiApiProvider value={undefined}>
              <Suspense fallback="loading...">
                <TeacherLiveWrapper />
              </Suspense>
            </JitsiApiProvider>
          </PictureInPictureProvider>
        </LiveModaleConfigurationProvider>,
        {
          ...video,
          live_state: liveState.IDLE,
          live_type: LiveModeType.JITSI,
          live_info: {
            jitsi: {
              external_api_url: 'some_external_api_url',
              domain: 'some_domain',
              config_overwrite: {},
              interface_config_overwrite: {},
              room_name: 'some_room_name',
            },
          },
        },
      ),
      { queryOptions: { client: queryClient } },
    );

    expect(
      await screen.findByText('Join the room before start streaming'),
    ).toBeInTheDocument();

    mockCanShowStartButton = true;
    rerender(
      wrapInVideo(
        <LiveModaleConfigurationProvider value={null}>
          <PictureInPictureProvider value={{ reversed: false }}>
            <JitsiApiProvider value={undefined}>
              <Suspense fallback="loading...">
                <TeacherLiveWrapper />
              </Suspense>
            </JitsiApiProvider>
          </PictureInPictureProvider>
        </LiveModaleConfigurationProvider>,
        {
          ...video,
          live_state: liveState.IDLE,
          live_type: LiveModeType.JITSI,
          live_info: {
            jitsi: {
              external_api_url: 'some_external_api_url',
              domain: 'some_domain',
              config_overwrite: {},
              interface_config_overwrite: {},
              room_name: 'some_room_name',
            },
          },
        },
      ),
      { queryOptions: { client: queryClient } },
    );

    expect(
      await screen.findByText(
        'Only a jitsi moderator can administrate the live',
      ),
    ).toBeInTheDocument();
  });

  it('shows the stop button when the status is RUNNING', async () => {
    render(
      wrapInVideo(
        <LiveModaleConfigurationProvider value={null}>
          <PictureInPictureProvider value={{ reversed: false }}>
            <JitsiApiProvider value={undefined}>
              <Suspense fallback="loading...">
                <TeacherLiveWrapper />
              </Suspense>
            </JitsiApiProvider>
          </PictureInPictureProvider>
        </LiveModaleConfigurationProvider>,
        { ...video, live_state: liveState.RUNNING },
      ),
      { queryOptions: { client: queryClient } },
    );

    expect(
      await screen.findByRole('button', { name: /end live/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('start-recording')).toBeInTheDocument();
  });

  it('shows confirmation modal when clicking the stop button', async () => {
    render(
      wrapInVideo(
        <LiveModaleConfigurationProvider value={null}>
          <PictureInPictureProvider value={{ reversed: false }}>
            <JitsiApiProvider value={undefined}>
              <Suspense fallback="loading...">
                <TeacherLiveWrapper />
              </Suspense>
            </JitsiApiProvider>
          </PictureInPictureProvider>
        </LiveModaleConfigurationProvider>,
        { ...video, live_state: liveState.RUNNING },
      ),
      { queryOptions: { client: queryClient } },
    );

    //  initial state
    const stopButton = await screen.findByRole('button', {
      name: 'End live',
    });
    expect(stopButton).not.toBeDisabled();

    await userEvent.click(stopButton);

    //  modal is open
    await screen.findByRole('button', { name: /Cancel/i });
    screen.getByRole('button', { name: 'Stop the live' });
    expect(stopButton).toBeDisabled();

    // start recording button should be in the document, the live is running
    screen.getByTestId('start-recording');
    expect(screen.queryByTestId('stop-recording')).not.toBeInTheDocument();
  });

  it('displays data when the video is scheduled and the status is IDLE', async () => {
    const dateScheduled = new Date(new Date().getTime() + 10 * 86400000);
    render(
      wrapInVideo(
        <LiveModaleConfigurationProvider value={null}>
          <PictureInPictureProvider value={{ reversed: false }}>
            <JitsiApiProvider value={undefined}>
              <Suspense fallback="loading...">
                <TeacherLiveWrapper />
              </Suspense>
            </JitsiApiProvider>
          </PictureInPictureProvider>
        </LiveModaleConfigurationProvider>,
        {
          ...video,
          description: 'Wonderful class!',
          live_state: liveState.IDLE,
          starting_at: dateScheduled.toISOString(),
          title: 'Maths',
        },
      ),
      { queryOptions: { client: queryClient } },
    );

    expect(
      await screen.findByRole('textbox', {
        name: 'Enter title of your live here',
      }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue(/maths/i)).toBeInTheDocument();
  });

  it('prompts display name form when trying to join the chat', async () => {
    useChatItemState.setState({
      hasReceivedMessageHistory: true,
    });

    render(
      wrapInVideo(
        <LiveModaleConfigurationProvider value={null}>
          <PictureInPictureProvider value={{ reversed: false }}>
            <JitsiApiProvider value={undefined}>
              <Suspense fallback="loading...">
                <TeacherLiveWrapper />
              </Suspense>
            </JitsiApiProvider>
          </PictureInPictureProvider>
        </LiveModaleConfigurationProvider>,
        {
          ...video,
          live_state: liveState.RUNNING,
          xmpp: {
            bosh_url: null,
            converse_persistent_store: PersistentStore.LOCALSTORAGE,
            conference_url: 'conference-url',
            jid: 'jid',
            prebind_url: 'prebind_url',
            websocket_url: null,
          },
        },
      ),
      { queryOptions: { client: queryClient } },
    );

    const joindChatButton = await screen.findByRole('button', {
      name: 'Join the chat',
    });
    await userEvent.click(joindChatButton);

    expect(await screen.findByText('Display name')).toBeInTheDocument();
  });

  it('configures live state without chat when chat is disabled', () => {
    render(
      wrapInVideo(
        <LiveModaleConfigurationProvider value={null}>
          <PictureInPictureProvider value={{ reversed: false }}>
            <JitsiApiProvider value={undefined}>
              <Suspense fallback="loading...">
                <TeacherLiveWrapper />
              </Suspense>
            </JitsiApiProvider>
          </PictureInPictureProvider>
        </LiveModaleConfigurationProvider>,
        {
          ...video,
          has_chat: false,
          live_state: liveState.STARTING,
          xmpp: {
            bosh_url: null,
            converse_persistent_store: PersistentStore.LOCALSTORAGE,
            conference_url: 'conference-url',
            jid: 'jid',
            prebind_url: 'prebind_url',
            websocket_url: null,
          },
        },
      ),
      { queryOptions: { client: queryClient } },
    );

    expect(screen.queryByText('Join the chat')).not.toBeInTheDocument();

    screen.getByText('No viewers are currently connected to your stream.');

    expect(useLivePanelState.getState().availableItems).toEqual([
      LivePanelItem.VIEWERS_LIST,
    ]);
    expect(useLivePanelState.getState().currentItem).toEqual(
      LivePanelItem.VIEWERS_LIST,
    );
    expect(useLivePanelState.getState().isPanelVisible).toEqual(true);
  });

  it('accepts participants asking to join if join mode is forced', async () => {
    render(
      wrapInVideo(
        <LiveModaleConfigurationProvider value={null}>
          <PictureInPictureProvider value={{ reversed: false }}>
            <JitsiApiProvider value={undefined}>
              <Suspense fallback="loading...">
                <TeacherLiveWrapper />
              </Suspense>
            </JitsiApiProvider>
          </PictureInPictureProvider>
        </LiveModaleConfigurationProvider>,
        {
          ...video,
          join_mode: JoinMode.FORCED,
          live_state: liveState.STARTING,
          participants_asking_to_join: [
            participantMockFactory(),
            participantMockFactory(),
            participantMockFactory(),
          ],
        },
      ),
      { queryOptions: { client: queryClient } },
    );

    await waitFor(() =>
      expect(mockAcceptParticipantToJoin).toHaveBeenCalledTimes(3),
    );
  });

  it('does not accept participants asking to join if join mode is approval', () => {
    render(
      wrapInVideo(
        <LiveModaleConfigurationProvider value={null}>
          <PictureInPictureProvider value={{ reversed: false }}>
            <JitsiApiProvider value={undefined}>
              <Suspense fallback="loading...">
                <TeacherLiveWrapper />
              </Suspense>
            </JitsiApiProvider>
          </PictureInPictureProvider>
        </LiveModaleConfigurationProvider>,
        {
          ...video,
          join_mode: JoinMode.APPROVAL,
          live_state: liveState.STARTING,
          participants_asking_to_join: [
            participantMockFactory(),
            participantMockFactory(),
            participantMockFactory(),
          ],
        },
      ),
      { queryOptions: { client: queryClient } },
    );

    expect(mockAcceptParticipantToJoin).not.toHaveBeenCalled();
  });

  it('check display title and starting date on the title bar', () => {
    render(
      wrapInVideo(
        <LiveModaleConfigurationProvider value={null}>
          <PictureInPictureProvider value={{ reversed: false }}>
            <JitsiApiProvider value={undefined}>
              <Suspense fallback="loading...">
                <TeacherLiveWrapper />
              </Suspense>
            </JitsiApiProvider>
          </PictureInPictureProvider>
        </LiveModaleConfigurationProvider>,
        {
          ...video,
          join_mode: JoinMode.FORCED,
          live_state: liveState.STARTING,
          starting_at: '2020-10-01T08:00:00Z',
          title: "Hello world, it's me",
        },
      ),
      { queryOptions: { client: queryClient } },
    );

    expect(
      screen.getByDisplayValue("Hello world, it's me"),
    ).toBeInTheDocument();
    expect(
      screen.getByText('10/1/2020  ·  8:00:00 AM', {
        normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
      }),
    ).toBeInTheDocument();
  });

  it('starts picture in picture mode when a file is shared', async () => {
    render(
      wrapInVideo(
        <LiveModaleConfigurationProvider value={null}>
          <PictureInPictureProvider value={{ reversed: false }}>
            <JitsiApiProvider value={undefined}>
              <Suspense fallback="loading...">
                <TeacherLiveWrapper />
              </Suspense>
            </JitsiApiProvider>
          </PictureInPictureProvider>
        </LiveModaleConfigurationProvider>,
        {
          ...video,
          live_type: LiveModeType.JITSI,
          live_info: {
            jitsi: {
              external_api_url: 'api_url',
              domain: 'domain',
              config_overwrite: {},
              interface_config_overwrite: {},
              room_name: 'room',
            },
          },
          has_chat: false,
          live_state: liveState.STARTING,
          xmpp: {
            bosh_url: null,
            converse_persistent_store: PersistentStore.LOCALSTORAGE,
            conference_url: 'conference-url',
            jid: 'jid',
            prebind_url: 'prebind_url',
            websocket_url: null,
          },
          active_shared_live_media: {
            active_stamp: null,
            filename: 'file name',
            is_ready_to_show: true,
            show_download: false,
            title: 'title',
            upload_state: uploadState.READY,
            video: video.id,
            id: 'some id',
            nb_pages: 10,
            urls: {
              pages: {},
            },
          },
        },
      ),
      { queryOptions: { client: queryClient } },
    );

    expect(
      await screen.findByTestId('picture-in-picture-slave'),
    ).toBeInTheDocument();
  });

  it('displays a notification when join mode is not forced and a student wants to go on stage, and then clicks on it.', async () => {
    const participants = [participantMockFactory(), participantMockFactory()];
    useChatItemState.setState({
      hasReceivedMessageHistory: true,
    });

    const { rerender } = render(
      wrapInVideo(
        <LiveModaleConfigurationProvider value={null}>
          <PictureInPictureProvider value={{ reversed: false }}>
            <JitsiApiProvider value={undefined}>
              <Suspense fallback="loading...">
                <TeacherLiveWrapper />
              </Suspense>
            </JitsiApiProvider>
          </PictureInPictureProvider>
        </LiveModaleConfigurationProvider>,
        {
          ...video,
          join_mode: JoinMode.APPROVAL,
          live_state: liveState.RUNNING,
          participants_asking_to_join: [participants[0]],
          xmpp: {
            bosh_url: null,
            converse_persistent_store: PersistentStore.LOCALSTORAGE,
            conference_url: 'conference-url',
            jid: 'jid',
            prebind_url: 'prebind_url',
            websocket_url: null,
          },
        },
      ),
    );

    await screen.findByRole('button', {
      name: 'Join the chat',
    });
    expect(screen.queryByText('Demands')).toBe(null);

    rerender(
      wrapInVideo(
        <LiveModaleConfigurationProvider value={null}>
          <PictureInPictureProvider value={{ reversed: false }}>
            <JitsiApiProvider value={undefined}>
              <Suspense fallback="loading...">
                <TeacherLiveWrapper />
              </Suspense>
            </JitsiApiProvider>
          </PictureInPictureProvider>
        </LiveModaleConfigurationProvider>,
        {
          ...video,
          join_mode: JoinMode.APPROVAL,
          live_state: liveState.RUNNING,
          participants_asking_to_join: participants,
          xmpp: {
            bosh_url: null,
            converse_persistent_store: PersistentStore.LOCALSTORAGE,
            conference_url: 'conference-url',
            jid: 'jid',
            prebind_url: 'prebind_url',
            websocket_url: null,
          },
        },
      ),
    );

    screen.getByText(
      `${participants[1].name} and ${participants[0].name} want to go on stage.`,
    );

    const btnManageRequest = screen.getByRole('button', {
      name: 'Manage requests',
    });
    await userEvent.click(btnManageRequest);

    expect(
      screen.queryByRole('button', {
        name: 'Join the chat',
      }),
    ).toBe(null);
  });
});
