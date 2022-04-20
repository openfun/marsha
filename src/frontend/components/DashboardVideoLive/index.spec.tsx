import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import React, { Suspense, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

import { useChatItemState } from 'data/stores/useChatItemsStore';
import { LiveModeType, liveState, uploadState, Video } from 'types/tracks';
import { PersistentStore } from 'types/XMPP';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { wrapInRouter } from 'utils/tests/router';

import { DashboardVideoLive } from '.';

jest.mock('jwt-decode', () => jest.fn());
jest.mock('data/appData', () => ({
  appData: { jwt: 'cool_token_m8' },
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
  video: Video;
  setCanShowStartButton: (canShowStartButton: boolean) => void;
}) => {
  useEffect(() => {
    if (mockCanShowStartButton) {
      props.setCanShowStartButton(true);
    }
  }, [mockCanShowStartButton]);

  return <span title={props.video.id}>jitsi</span>;
};
jest.mock(
  'components/DashboardVideoLiveJitsi',
  () => mockDashboardVideoLiveJitsi,
);

jest.mock('components/DashboardVideoLivePairing', () => ({
  DashboardVideoLivePairing: (props: { video: Video }) => (
    <span title={`Pairing button for ${props.video.id}`} />
  ),
}));

let queryClient: QueryClient;

window.HTMLElement.prototype.scrollTo = jest.fn();

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
          <QueryClientProvider client={queryClient}>
            <Suspense fallback="loading...">
              <DashboardVideoLive
                video={{ ...video, live_state: liveState.IDLE }}
              />
            </Suspense>
          </QueryClientProvider>,
        ),
      ),
    );

    await screen.findByRole('button', { name: /start streaming/i });

    expect(
      screen.queryByRole('button', { name: 'Start recording' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Stop recording/i }),
    ).not.toBeInTheDocument();
  });

  it('shows alert to join the room', async () => {
    const { rerender } = render(
      wrapInIntlProvider(
        wrapInRouter(
          <QueryClientProvider client={queryClient}>
            <Suspense fallback="loading...">
              <DashboardVideoLive
                video={{
                  ...video,
                  live_state: liveState.IDLE,
                  live_type: LiveModeType.JITSI,
                }}
              />
            </Suspense>
          </QueryClientProvider>,
        ),
      ),
    );

    await screen.findByText('Join the room before start streaming');

    mockCanShowStartButton = true;
    rerender(
      wrapInIntlProvider(
        wrapInRouter(
          <QueryClientProvider client={queryClient}>
            <Suspense fallback="loading...">
              <DashboardVideoLive
                video={{
                  ...video,
                  live_state: liveState.IDLE,
                  live_type: LiveModeType.JITSI,
                }}
              />
            </Suspense>
          </QueryClientProvider>,
        ),
      ),
    );

    await screen.findByText('Only a jitsi moderator can administrate the live');
  });

  it('shows the pause button when the status is RUNNING', () => {
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <QueryClientProvider client={queryClient}>
            <Suspense fallback="loading...">
              <DashboardVideoLive
                video={{ ...video, live_state: liveState.RUNNING }}
              />
            </Suspense>
          </QueryClientProvider>,
        ),
      ),
    );

    screen.getByRole('button', { name: 'Pause live' });
    screen.getByRole('button', { name: 'Start recording' });
  });

  it('shows confirmation modal when clicking the stop button', async () => {
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <QueryClientProvider client={queryClient}>
            <Suspense fallback="loading...">
              <DashboardVideoLive
                video={{ ...video, live_state: liveState.PAUSED }}
              />
            </Suspense>
          </QueryClientProvider>,
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
    await screen.findByRole('button', { name: 'Cancel' });
    screen.getByRole('button', { name: 'Stop the live' });
    expect(stopButton).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Resume streaming' }),
    ).toBeDisabled();

    //  record buttons are not in the document
    expect(
      screen.queryByRole('button', { name: 'Start recording' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Stop recording/i }),
    ).not.toBeInTheDocument();
  });

  it('displays data when the video is scheduled and the status is IDLE', async () => {
    const dateScheduled = new Date(new Date().getTime() + 10 * 86400000);
    render(
      wrapInIntlProvider(
        wrapInRouter(
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
          </QueryClientProvider>,
        ),
      ),
    );
    screen.getByRole('textbox', { name: 'Enter title of your live here' });
    screen.getByDisplayValue(/maths/i);
  });

  it('shows the pairing button when the status is not STOPPED', () => {
    for (const state of Object.values(liveState)) {
      const { getByTitle, queryByTitle } = render(
        wrapInIntlProvider(
          wrapInRouter(
            <QueryClientProvider client={queryClient}>
              <Suspense fallback="loading...">
                <DashboardVideoLive video={{ ...video, live_state: state }} />
              </Suspense>
            </QueryClientProvider>,
          ),
        ),
      );
      if (state !== liveState.STOPPED) {
        getByTitle(`Pairing button for ${video.id}`);
      } else {
        expect(
          queryByTitle(`Pairing button for ${video.id}`),
        ).not.toBeInTheDocument();
      }
      cleanup();
    }
  });

  it('prompts display name form when trying to join the chat', async () => {
    useChatItemState.setState({
      hasReceivedMessageHistory: true,
    });

    render(
      wrapInIntlProvider(
        wrapInRouter(
          <QueryClientProvider client={queryClient}>
            <Suspense fallback="loading...">
              <DashboardVideoLive
                video={{
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
                }}
              />
            </Suspense>
          </QueryClientProvider>,
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
});
