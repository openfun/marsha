import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import React, { Suspense, useEffect } from 'react';

import { LiveModeType, liveState, uploadState, Video } from 'types/tracks';
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

describe('components/DashboardVideoLive', () => {
  beforeEach(() => jest.useFakeTimers());

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
          <Suspense fallback="loading...">
            <DashboardVideoLive
              video={{ ...video, live_state: liveState.IDLE }}
            />
          </Suspense>,
        ),
      ),
    );

    await screen.findByRole('button', { name: /start streaming/i });
  });

  it('shows alert to join the room', async () => {
    const { rerender } = render(
      wrapInIntlProvider(
        wrapInRouter(
          <Suspense fallback="loading...">
            <DashboardVideoLive
              video={{
                ...video,
                live_state: liveState.IDLE,
                live_type: LiveModeType.JITSI,
              }}
            />
          </Suspense>,
        ),
      ),
    );

    await screen.findByText('Join the room before start streaming');

    mockCanShowStartButton = true;
    rerender(
      wrapInIntlProvider(
        wrapInRouter(
          <Suspense fallback="loading...">
            <DashboardVideoLive
              video={{
                ...video,
                live_state: liveState.IDLE,
                live_type: LiveModeType.JITSI,
              }}
            />
          </Suspense>,
        ),
      ),
    );

    await screen.findByText('Only a jitsi moderator can administrate the live');
  });

  it('shows the pause button when the status is RUNNING', () => {
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <Suspense fallback="loading...">
            <DashboardVideoLive
              video={{ ...video, live_state: liveState.RUNNING }}
            />
          </Suspense>,
        ),
      ),
    );

    screen.getByRole('button', { name: 'Pause live' });
  });

  it('shows the scheduling form when the status is IDLE', () => {
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <Suspense fallback="loading...">
            <DashboardVideoLive
              video={{ ...video, live_state: liveState.IDLE }}
            />
          </Suspense>,
        ),
      ),
    );
    screen.getByRole('heading', { name: /schedule a webinar/i });
    screen.getByRole('textbox', { name: /title/i });
    screen.getByRole('textbox', { name: /description/i });
    screen.getByText(/starting date and time/i);
    screen.getByRole('button', { name: /submit/i });
  });

  it('shows confirmation modal when clicking the stop button', async () => {
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <Suspense fallback="loading...">
            <DashboardVideoLive
              video={{ ...video, live_state: liveState.PAUSED }}
            />
          </Suspense>,
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
  });

  it("doesn't show the scheduling form when the status is not IDLE", () => {
    for (const state of Object.values(liveState)) {
      if (state !== liveState.IDLE) {
        render(
          wrapInIntlProvider(
            wrapInRouter(
              <Suspense fallback="loading...">
                <DashboardVideoLive video={{ ...video, live_state: state }} />
              </Suspense>,
            ),
          ),
        );
        expect(screen.queryByRole('textbox')).toEqual(null);
        expect(
          screen.queryByRole('heading', { name: /schedule a webinar/i }),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByRole('textbox', { name: /title/i }),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByRole('textbox', {
            name: /description/i,
          }),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByRole(/starting date and time/i),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByRole('button', { name: /submit/i }),
        ).not.toBeInTheDocument();
        cleanup();
      }
    }
  });

  it("doesn't show the scheduling form when the status is IDLE and starting_at date is past", () => {
    const startingAtPast = new Date();
    startingAtPast.setFullYear(startingAtPast.getFullYear() - 10);
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <Suspense fallback="loading...">
            <DashboardVideoLive
              video={{
                ...video,
                live_state: liveState.IDLE,
                starting_at: startingAtPast.toISOString(),
              }}
            />
          </Suspense>,
        ),
      ),
    );
    screen.getByRole('heading', {
      name: `Webinar was scheduled at ${startingAtPast.toLocaleString('en')}.`,
    });
    screen.getByText(
      /date is past, please, create a new webinar or start this one/i,
    );
    expect(screen.queryByRole('textbox')).toEqual(null);
    expect(
      screen.queryByRole('heading', { name: /schedule a webinar/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: /title/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', {
        name: /description/i,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole(/starting date and time/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /submit/i }),
    ).not.toBeInTheDocument();
  });

  it('displays data when the video is scheduled and the status is IDLE', async () => {
    const dateScheduled = new Date(new Date().getTime() + 10 * 86400000);
    render(
      wrapInIntlProvider(
        wrapInRouter(
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
          </Suspense>,
        ),
      ),
    );
    screen.getByRole('textbox', { name: 'Title' });
    screen.getByRole('heading', {
      name: `Webinar is scheduled at ${dateScheduled.toLocaleString('en')}.`,
    });
    screen.getByDisplayValue(/maths/i);
    screen.getByText(/wonderful class!/i);
    screen.getByRole('textbox', { name: /description/i });
  });

  it('shows the pairing button when the status is not STOPPED', () => {
    for (const state of Object.values(liveState)) {
      const { getByTitle, queryByTitle } = render(
        wrapInIntlProvider(
          wrapInRouter(
            <Suspense fallback="loading...">
              <DashboardVideoLive video={{ ...video, live_state: state }} />
            </Suspense>,
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
});
