import { cleanup, render, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React, { Suspense } from 'react';

import { LiveModeType, liveState, uploadState, Video } from 'types/tracks';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { wrapInRouter } from 'utils/tests/router';
import { DashboardVideoLive } from '.';

jest.mock('jwt-decode', () => jest.fn());
jest.mock('data/appData', () => ({
  appData: { jwt: 'cool_token_m8' },
}));
jest.mock('index', () => ({
  intl: {
    locale: 'en',
  },
}));
jest.mock(
  'components/DashboardVideoLiveRaw',
  () => (props: { video: Video }) => <span title={props.video.id} />,
);

let mockCanShowStartButton = false;
jest.mock(
  'components/DashboardVideoLiveJitsi',
  () =>
    (props: {
      video: Video;
      setCanShowStartButton: (canShowStartButton: boolean) => void;
    }) => {
      if (mockCanShowStartButton) {
        props.setCanShowStartButton(true);
      }

      return <span title={props.video.id}>jitsi</span>;
    },
);

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

  it('shows the start and jitsi button when the status is IDLE', async () => {
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
    screen.getByRole('button', { name: /end live/i });
    screen.getByRole('button', { name: /Create a webinar/i });
  });

  it('hides the start button when status is IDLE and live type is JITSI but user not in conference', async () => {
    render(
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

    expect(
      screen.queryByRole('button', {
        name: /Only moderators can start a live/i,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Launch Jitsi LiveStream/i }),
    ).not.toBeInTheDocument();
  });

  it('shows the start button when status is IDLE, live_type is JITSI and user in the conference', async () => {
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

    expect(
      screen.queryByRole('button', {
        name: /Only moderators can start a live/i,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Launch Jitsi LiveStream/i }),
    ).not.toBeInTheDocument();

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

    await screen.findByRole('button', {
      name: /Only moderators can start a live/i,
    });
  });

  it('shows the live and stop button when the status is RUNNING', () => {
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

    screen.getByRole('button', { name: /show chat only/i });
    screen.getByRole('button', { name: /show live/i });
    screen.getByRole('button', { name: /pause ⏸/i });
  });

  it('polls the video when live state is STARTING', async () => {
    fetchMock.mock(
      `/api/videos/${video.id}/`,
      JSON.stringify({ ...video, live_state: liveState.STARTING }),
    );

    const { rerender } = render(
      wrapInIntlProvider(
        wrapInRouter(
          <Suspense fallback="loading...">
            <DashboardVideoLive
              video={{ ...video, live_state: liveState.STARTING }}
            />
          </Suspense>,
        ),
      ),
    );

    screen.getByText(
      'Live streaming is starting. This can take a few minutes.',
    );
    expect(fetchMock.called()).not.toBeTruthy();

    // First backend call: the live is still starting
    jest.advanceTimersByTime(1000 * 15 + 200);
    await waitFor(() => expect(fetchMock.called()).toBe(true));

    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${video.id}/`);
    expect(fetchMock.lastCall()![1]!.headers).toEqual({
      Authorization: 'Bearer cool_token_m8',
    });
    screen.getByText(
      'Live streaming is starting. This can take a few minutes.',
    );

    // The live will be running in further response
    fetchMock.restore();
    fetchMock.mock(
      `/api/videos/${video.id}/`,
      JSON.stringify({ ...video, live_state: liveState.RUNNING }),
    );

    // Second backend call
    expect(fetchMock.called()).not.toBeTruthy();
    jest.advanceTimersByTime(1000 * 15 + 200);
    await waitFor(() => expect(fetchMock.called()).toBe(true));

    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${video.id}/`);
    expect(fetchMock.lastCall()![1]!.headers).toEqual({
      Authorization: 'Bearer cool_token_m8',
    });

    rerender(
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

    screen.getByRole('button', { name: /show live/i });
    screen.getByRole('button', { name: /pause ⏸/i });
  });

  it('polls the video when live state is STOPPING', async () => {
    fetchMock.mock(
      `/api/videos/${video.id}/`,
      JSON.stringify({ ...video, live_state: liveState.STOPPING }),
    );

    const { rerender } = render(
      wrapInIntlProvider(
        wrapInRouter(
          <Suspense fallback="loading...">
            <DashboardVideoLive
              video={{ ...video, live_state: liveState.STOPPING }}
            />
          </Suspense>,
        ),
      ),
    );

    screen.getByText(
      'Pause live streaming, please wait a few moments to be able to resume it.',
    );
    expect(fetchMock.called()).not.toBeTruthy();

    // First backend call: the live is still stopping
    jest.advanceTimersByTime(1000 * 15 + 200);
    await waitFor(() => expect(fetchMock.called()).toBe(true));

    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${video.id}/`);
    expect(fetchMock.lastCall()![1]!.headers).toEqual({
      Authorization: 'Bearer cool_token_m8',
    });
    screen.getByText(
      'Pause live streaming, please wait a few moments to be able to resume it.',
    );

    // The live will be paused in further response
    fetchMock.restore();
    fetchMock.mock(
      `/api/videos/${video.id}/`,
      JSON.stringify({ ...video, live_state: liveState.PAUSED }),
    );

    // Second backend call
    expect(fetchMock.called()).not.toBeTruthy();
    jest.advanceTimersByTime(1000 * 15 + 200);
    await waitFor(() => expect(fetchMock.called()).toBe(true));

    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${video.id}/`);
    expect(fetchMock.lastCall()![1]!.headers).toEqual({
      Authorization: 'Bearer cool_token_m8',
    });

    rerender(
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

    screen.getByRole('button', { name: /resume streaming/i });
    screen.getByRole('button', { name: /end live/i });
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

  it("doesn't show the scheduling form when the status is null", () => {
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <Suspense fallback="loading...">
            <DashboardVideoLive video={{ ...video, live_state: null }} />
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
});
