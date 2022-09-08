import { getDefaultNormalizer, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import React, { Suspense, useEffect } from 'react';
import { QueryClient } from '@tanstack/react-query';

import { useJwt } from 'data/stores/useJwt';
import { useChatItemState } from 'data/stores/useChatItemsStore';
import { JitsiApiProvider } from 'data/stores/useJitsiApi';
import { LiveModaleConfigurationProvider } from 'data/stores/useLiveModale';
import {
  LivePanelItem,
  useLivePanelState,
} from 'data/stores/useLivePanelState';
import { PictureInPictureProvider } from 'data/stores/usePictureInPicture';
import {
  JoinMode,
  LiveJitsi,
  LiveModeType,
  liveState,
  uploadState,
  Video,
} from 'types/tracks';
import { PersistentStore } from 'types/XMPP';
import {
  participantMockFactory,
  videoMockFactory,
} from 'utils/tests/factories';
import render from 'utils/tests/render';
import { wrapInVideo } from 'utils/tests/wrapInVideo';
import { converse } from 'utils/window';

import { DashboardLive } from '.';

jest.mock('jwt-decode', () => jest.fn());

jest.mock('data/stores/useAppConfig', () => ({
  useAppConfig: () => ({
    static: {
      img: {
        liveBackground: 'path/to/image.png',
      },
    },
  }),
}));
jest.mock('components/DashboardLiveRaw', () => (props: { video: Video }) => (
  <span title={props.video.id}>live raw</span>
));

let mockCanShowStartButton = false;
const mockDashboardLiveJitsi = (props: {
  liveJitsi: LiveJitsi;
  setCanShowStartButton: (canShowStartButton: boolean) => void;
}) => {
  useEffect(() => {
    props.setCanShowStartButton(mockCanShowStartButton);
  }, []);

  return <span title={props.liveJitsi.id}>jitsi</span>;
};
jest.mock('components/DashboardLiveJitsi', () => mockDashboardLiveJitsi);

jest.mock('utils/window', () => ({
  converse: {
    acceptParticipantToJoin: jest.fn(),
  },
}));
const mockAcceptParticipantToJoin =
  converse.acceptParticipantToJoin as jest.MockedFunction<
    typeof converse.acceptParticipantToJoin
  >;

let queryClient: QueryClient;

jest.setTimeout(10000);

describe('components/DashboardLive', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'cool_token_m8',
      getDecodedJwt: () =>
        ({
          permissions: {
            can_access_dashboard: false,
            can_update: false,
          },
        } as any),
    });

    queryClient = new QueryClient({
      // tslint:disable-next-line:no-console
      logger: { log: console.log, warn: console.warn, error: () => {} },
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.useFakeTimers();
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
    mockCanShowStartButton = false;
  });

  const video = videoMockFactory({
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
                <DashboardLive />
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
                <DashboardLive />
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

    await screen.findByText('Join the room before start streaming');

    mockCanShowStartButton = true;
    rerender(
      wrapInVideo(
        <LiveModaleConfigurationProvider value={null}>
          <PictureInPictureProvider value={{ reversed: false }}>
            <JitsiApiProvider value={undefined}>
              <Suspense fallback="loading...">
                <DashboardLive />
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

    await screen.findByText('Only a jitsi moderator can administrate the live');
  });

  it('shows the stop button when the status is RUNNING', async () => {
    render(
      wrapInVideo(
        <LiveModaleConfigurationProvider value={null}>
          <PictureInPictureProvider value={{ reversed: false }}>
            <JitsiApiProvider value={undefined}>
              <Suspense fallback="loading...">
                <DashboardLive />
              </Suspense>
            </JitsiApiProvider>
          </PictureInPictureProvider>
        </LiveModaleConfigurationProvider>,
        { ...video, live_state: liveState.RUNNING },
      ),
      { queryOptions: { client: queryClient } },
    );

    await screen.findByRole('button', { name: /end live/i });
    screen.getByTestId('start-recording');
  });

  it('shows confirmation modal when clicking the stop button', async () => {
    render(
      wrapInVideo(
        <LiveModaleConfigurationProvider value={null}>
          <PictureInPictureProvider value={{ reversed: false }}>
            <JitsiApiProvider value={undefined}>
              <Suspense fallback="loading...">
                <DashboardLive />
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

    userEvent.click(stopButton);

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
                <DashboardLive />
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

    await screen.findByRole('textbox', {
      name: 'Enter title of your live here',
    });
    screen.getByDisplayValue(/maths/i);
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
                <DashboardLive />
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
    userEvent.click(joindChatButton);

    await screen.findByText('Display name');
  });

  it('configures live state without chat when chat is disabled', () => {
    render(
      wrapInVideo(
        <LiveModaleConfigurationProvider value={null}>
          <PictureInPictureProvider value={{ reversed: false }}>
            <JitsiApiProvider value={undefined}>
              <Suspense fallback="loading...">
                <DashboardLive />
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
                <DashboardLive />
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
                <DashboardLive />
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

  it('accepts participants asking to join if join mode is forced', async () => {
    render(
      wrapInVideo(
        <LiveModaleConfigurationProvider value={null}>
          <PictureInPictureProvider value={{ reversed: false }}>
            <JitsiApiProvider value={undefined}>
              <Suspense fallback="loading...">
                <DashboardLive />
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

  it('check display title and starting date on the title bar ', async () => {
    render(
      wrapInVideo(
        <LiveModaleConfigurationProvider value={null}>
          <PictureInPictureProvider value={{ reversed: false }}>
            <JitsiApiProvider value={undefined}>
              <Suspense fallback="loading...">
                <DashboardLive />
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

    screen.getByText("Hello world, it's me");
    screen.getByText('10/1/2020  ·  8:00:00 AM', {
      normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
    });
  });

  it('starts picture in picture mode when a file is shared', async () => {
    render(
      wrapInVideo(
        <LiveModaleConfigurationProvider value={null}>
          <PictureInPictureProvider value={{ reversed: false }}>
            <JitsiApiProvider value={undefined}>
              <Suspense fallback="loading...">
                <DashboardLive />
              </Suspense>
            </JitsiApiProvider>
          </PictureInPictureProvider>
        </LiveModaleConfigurationProvider>,
        {
          ...video,
          live_type: LiveModeType.JITSI,
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

    await screen.findByTestId('picture-in-picture-slave');
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
                <DashboardLive />
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
                <DashboardLive />
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
    userEvent.click(btnManageRequest);

    expect(
      await screen.queryByRole('button', {
        name: 'Join the chat',
      }),
    ).toBe(null);
  });
});
