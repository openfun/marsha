import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import React, { Suspense, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

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
import { wrapInIntlProvider } from 'utils/tests/intl';
import { wrapInRouter } from 'utils/tests/router';
import { converse } from 'utils/window';

import { DashboardVideoLive } from '.';

jest.mock('jwt-decode', () => jest.fn());
jest.mock('data/appData', () => ({
  appData: {
    jwt: 'cool_token_m8',
    static: {
      img: {
        liveBackground: 'path/to/image.png',
      },
    },
  },
  getDecodedJwt: () => ({
    permissions: {
      can_access_dashboard: false,
      can_update: false,
    },
  }),
}));
jest.mock(
  'components/DashboardVideoLiveRaw',
  () => (props: { video: Video }) =>
    <span title={props.video.id}>live raw</span>,
);

let mockCanShowStartButton = false;
const mockDashboardVideoLiveJitsi = (props: {
  liveJitsi: LiveJitsi;
  setCanShowStartButton: (canShowStartButton: boolean) => void;
}) => {
  useEffect(() => {
    props.setCanShowStartButton(mockCanShowStartButton);
  }, []);

  return <span title={props.liveJitsi.id}>jitsi</span>;
};
jest.mock(
  'components/DashboardVideoLiveJitsi',
  () => mockDashboardVideoLiveJitsi,
);

jest.mock('utils/window', () => ({
  converse: {
    acceptParticipantToJoin: jest.fn(),
  },
}));

let queryClient: QueryClient;

window.HTMLElement.prototype.scrollTo = jest.fn();

jest.setTimeout(10000);

describe('components/DashboardVideoLive', () => {
  beforeEach(() => {
    queryClient = new QueryClient({
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
      wrapInIntlProvider(
        wrapInRouter(
          <LiveModaleConfigurationProvider value={null}>
            <PictureInPictureProvider value={{ reversed: false }}>
              <JitsiApiProvider value={undefined}>
                <QueryClientProvider client={queryClient}>
                  <Suspense fallback="loading...">
                    <DashboardVideoLive
                      video={{ ...video, live_state: liveState.IDLE }}
                    />
                  </Suspense>
                </QueryClientProvider>
              </JitsiApiProvider>
            </PictureInPictureProvider>
          </LiveModaleConfigurationProvider>,
        ),
      ),
    );

    await screen.findByRole('button', { name: /start streaming/i });

    expect(screen.queryByTestId('start-recording')).not.toBeInTheDocument();
    expect(screen.queryByTestId('stop-recording')).not.toBeInTheDocument();
  });

  it('shows alert to join the room', async () => {
    const { rerender } = render(
      wrapInIntlProvider(
        wrapInRouter(
          <LiveModaleConfigurationProvider value={null}>
            <PictureInPictureProvider value={{ reversed: false }}>
              <JitsiApiProvider value={undefined}>
                <QueryClientProvider client={queryClient}>
                  <Suspense fallback="loading...">
                    <DashboardVideoLive
                      video={{
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
                      }}
                    />
                  </Suspense>
                </QueryClientProvider>
              </JitsiApiProvider>
            </PictureInPictureProvider>
          </LiveModaleConfigurationProvider>,
        ),
      ),
    );

    await screen.findByText('Join the room before start streaming');

    mockCanShowStartButton = true;
    rerender(
      wrapInIntlProvider(
        wrapInRouter(
          <LiveModaleConfigurationProvider value={null}>
            <PictureInPictureProvider value={{ reversed: false }}>
              <JitsiApiProvider value={undefined}>
                <QueryClientProvider client={queryClient}>
                  <Suspense fallback="loading...">
                    <DashboardVideoLive
                      video={{
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
                      }}
                    />
                  </Suspense>
                </QueryClientProvider>
              </JitsiApiProvider>
            </PictureInPictureProvider>
          </LiveModaleConfigurationProvider>,
        ),
      ),
    );

    await screen.findByText('Only a jitsi moderator can administrate the live');
  });

  it('shows the stop button when the status is RUNNING', () => {
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <LiveModaleConfigurationProvider value={null}>
            <PictureInPictureProvider value={{ reversed: false }}>
              <JitsiApiProvider value={undefined}>
                <QueryClientProvider client={queryClient}>
                  <Suspense fallback="loading...">
                    <DashboardVideoLive
                      video={{ ...video, live_state: liveState.RUNNING }}
                    />
                  </Suspense>
                </QueryClientProvider>
              </JitsiApiProvider>
            </PictureInPictureProvider>
          </LiveModaleConfigurationProvider>,
        ),
      ),
    );

    screen.getByRole('button', { name: /end live/i });
    screen.getByTestId('start-recording');
  });

  it('shows confirmation modal when clicking the stop button', async () => {
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <LiveModaleConfigurationProvider value={null}>
            <PictureInPictureProvider value={{ reversed: false }}>
              <JitsiApiProvider value={undefined}>
                <QueryClientProvider client={queryClient}>
                  <Suspense fallback="loading...">
                    <DashboardVideoLive
                      video={{ ...video, live_state: liveState.RUNNING }}
                    />
                  </Suspense>
                </QueryClientProvider>
              </JitsiApiProvider>
            </PictureInPictureProvider>
          </LiveModaleConfigurationProvider>,
        ),
      ),
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
      wrapInIntlProvider(
        wrapInRouter(
          <LiveModaleConfigurationProvider value={null}>
            <PictureInPictureProvider value={{ reversed: false }}>
              <JitsiApiProvider value={undefined}>
                <QueryClientProvider client={queryClient}>
                  <Suspense fallback="loading...">
                    <DashboardVideoLive
                      video={{
                        ...video,
                        description: 'Wonderful class!',
                        live_state: liveState.IDLE,
                        starting_at: dateScheduled.toISOString(),
                        title: 'Maths',
                      }}
                    />
                  </Suspense>
                </QueryClientProvider>
              </JitsiApiProvider>
            </PictureInPictureProvider>
          </LiveModaleConfigurationProvider>,
        ),
      ),
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
      wrapInIntlProvider(
        wrapInRouter(
          <LiveModaleConfigurationProvider value={null}>
            <PictureInPictureProvider value={{ reversed: false }}>
              <JitsiApiProvider value={undefined}>
                <QueryClientProvider client={queryClient}>
                  <Suspense fallback="loading...">
                    <DashboardVideoLive
                      video={{
                        ...video,
                        live_state: liveState.RUNNING,
                        xmpp: {
                          bosh_url: null,
                          converse_persistent_store:
                            PersistentStore.LOCALSTORAGE,
                          conference_url: 'conference-url',
                          jid: 'jid',
                          prebind_url: 'prebind_url',
                          websocket_url: null,
                        },
                      }}
                    />
                  </Suspense>
                </QueryClientProvider>
              </JitsiApiProvider>
            </PictureInPictureProvider>
          </LiveModaleConfigurationProvider>,
        ),
      ),
    );

    userEvent.click(screen.getByRole('button', { name: 'Show chat' }));

    const joindChatButton = await screen.findByRole('button', {
      name: 'Join the chat',
    });
    userEvent.click(joindChatButton);

    await screen.findByText('Display name');
  });

  it('configures live state without chat when chat is disabled', () => {
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <LiveModaleConfigurationProvider value={null}>
            <PictureInPictureProvider value={{ reversed: false }}>
              <JitsiApiProvider value={undefined}>
                <QueryClientProvider client={queryClient}>
                  <Suspense fallback="loading...">
                    <DashboardVideoLive
                      video={{
                        ...video,
                        has_chat: false,
                        live_state: liveState.STARTING,
                        xmpp: {
                          bosh_url: null,
                          converse_persistent_store:
                            PersistentStore.LOCALSTORAGE,
                          conference_url: 'conference-url',
                          jid: 'jid',
                          prebind_url: 'prebind_url',
                          websocket_url: null,
                        },
                      }}
                    />
                  </Suspense>
                </QueryClientProvider>
              </JitsiApiProvider>
            </PictureInPictureProvider>
          </LiveModaleConfigurationProvider>,
        ),
      ),
    );

    // Force panel to display, because on instructor view it's hidden by default
    act(() => useLivePanelState.setState({ isPanelVisible: true }));

    expect(screen.queryByText('Join the chat')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Show chat' }),
    ).not.toBeInTheDocument();

    screen.getByText('No viewers are currently connected to your stream.');

    expect(useLivePanelState.getState().availableItems).toEqual([
      LivePanelItem.VIEWERS_LIST,
    ]);
    expect(useLivePanelState.getState().currentItem).toEqual(
      LivePanelItem.VIEWERS_LIST,
    );
    expect(useLivePanelState.getState().isPanelVisible).toEqual(true);
  });

  it('accepts participants asking to join if join mode is forced', () => {
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <LiveModaleConfigurationProvider value={null}>
            <PictureInPictureProvider value={{ reversed: false }}>
              <JitsiApiProvider value={undefined}>
                <QueryClientProvider client={queryClient}>
                  <Suspense fallback="loading...">
                    <DashboardVideoLive
                      video={{
                        ...video,
                        join_mode: JoinMode.FORCED,
                        live_state: liveState.STARTING,
                        participants_asking_to_join: [
                          participantMockFactory(),
                          participantMockFactory(),
                          participantMockFactory(),
                        ],
                      }}
                    />
                  </Suspense>
                </QueryClientProvider>
              </JitsiApiProvider>
            </PictureInPictureProvider>
          </LiveModaleConfigurationProvider>,
        ),
      ),
    );

    expect(converse.acceptParticipantToJoin).toHaveBeenCalledTimes(3);
  });

  it('does not accept participants asking to join if join mode is approval', () => {
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <LiveModaleConfigurationProvider value={null}>
            <PictureInPictureProvider value={{ reversed: false }}>
              <JitsiApiProvider value={undefined}>
                <QueryClientProvider client={queryClient}>
                  <Suspense fallback="loading...">
                    <DashboardVideoLive
                      video={{
                        ...video,
                        join_mode: JoinMode.APPROVAL,
                        live_state: liveState.STARTING,
                        participants_asking_to_join: [
                          participantMockFactory(),
                          participantMockFactory(),
                          participantMockFactory(),
                        ],
                      }}
                    />
                  </Suspense>
                </QueryClientProvider>
              </JitsiApiProvider>
            </PictureInPictureProvider>
          </LiveModaleConfigurationProvider>,
        ),
      ),
    );

    expect(converse.acceptParticipantToJoin).not.toHaveBeenCalled();
  });

  it('accepts participants asking to join if join mode is forced', () => {
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <LiveModaleConfigurationProvider value={null}>
            <PictureInPictureProvider value={{ reversed: false }}>
              <JitsiApiProvider value={undefined}>
                <QueryClientProvider client={queryClient}>
                  <Suspense fallback="loading...">
                    <DashboardVideoLive
                      video={{
                        ...video,
                        join_mode: JoinMode.FORCED,
                        live_state: liveState.STARTING,
                        participants_asking_to_join: [
                          participantMockFactory(),
                          participantMockFactory(),
                          participantMockFactory(),
                        ],
                      }}
                    />
                  </Suspense>
                </QueryClientProvider>
              </JitsiApiProvider>
            </PictureInPictureProvider>
          </LiveModaleConfigurationProvider>,
        ),
      ),
    );

    expect(converse.acceptParticipantToJoin).toHaveBeenCalledTimes(3);
  });

  it('starts picture in picture mode when a file is shared', async () => {
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <LiveModaleConfigurationProvider value={null}>
            <PictureInPictureProvider value={{ reversed: false }}>
              <JitsiApiProvider value={undefined}>
                <QueryClientProvider client={queryClient}>
                  <Suspense fallback="loading...">
                    <DashboardVideoLive
                      video={{
                        ...video,
                        live_type: LiveModeType.JITSI,
                        has_chat: false,
                        live_state: liveState.STARTING,
                        xmpp: {
                          bosh_url: null,
                          converse_persistent_store:
                            PersistentStore.LOCALSTORAGE,
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
                      }}
                    />
                  </Suspense>
                </QueryClientProvider>
              </JitsiApiProvider>
            </PictureInPictureProvider>
          </LiveModaleConfigurationProvider>,
        ),
      ),
    );

    await screen.findByTestId('picture-in-picture-slave');
  });
});
