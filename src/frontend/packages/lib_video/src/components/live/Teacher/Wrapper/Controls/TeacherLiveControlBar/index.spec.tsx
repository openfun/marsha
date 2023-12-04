import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { LiveModeType, liveState } from 'lib-components';
import { videoMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';

import * as pollForLiveModule from '@lib-video/api/pollForLive';
import { LiveFeedbackProvider } from '@lib-video/hooks/useLiveFeedback';
import { useLiveStateStarted } from '@lib-video/hooks/useLiveStateStarted';
import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { TeacherLiveControlBar } from '.';

const spyedPollForLive = jest.spyOn(pollForLiveModule, 'pollForLive');

describe('<TeacherLiveControlBar />', () => {
  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('polls for live when live is running and show live feedback button', async () => {
    jest.useFakeTimers();
    fetchMock.get('https://testing.m3u8', 404);

    const mockedVideo = videoMockFactory({
      urls: {
        manifests: { hls: 'https://testing.m3u8' },
        mp4: {},
        thumbnails: {},
      },
      live_state: liveState.RUNNING,
      live_type: LiveModeType.RAW,
    });

    render(
      wrapInVideo(
        <LiveFeedbackProvider value={false}>
          <TeacherLiveControlBar />
        </LiveFeedbackProvider>,
        mockedVideo,
      ),
    );

    await waitFor(() => expect(spyedPollForLive).toHaveBeenCalled());

    fetchMock.get(
      'https://testing.m3u8',
      `
      #EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-INDEPENDENT-SEGMENTS
      #EXT-X-STREAM-INF:BANDWIDTH=1404480,AVERAGE-BANDWIDTH=1205600,RESOLUTION=854x480,FRAME-RATE=24.000,CODECS="avc1.640029,mp4a.40.2"
      dev-manu_030aaea4-bb0b-4915-88a4-521fc8b59366_1637050264_hls_1.m3u8
      #EXT-X-STREAM-INF:BANDWIDTH=4440449,AVERAGE-BANDWIDTH=3735564,RESOLUTION=1280x720,FRAME-RATE=24.000,CODECS="avc1.640029,mp4a.40.2"
      dev-manu_030aaea4-bb0b-4915-88a4-521fc8b59366_1637050264_hls_2.m3u8
      #EXT-X-STREAM-INF:BANDWIDTH=518276,AVERAGE-BANDWIDTH=455345,RESOLUTION=426x240,FRAME-RATE=24.000,CODECS="avc1.4D401E,mp4a.40.2"
      dev-manu_030aaea4-bb0b-4915-88a4-521fc8b59366_1637050264_hls_3.m3u8
      `,
      { overwriteRoutes: true },
    );
    fetchMock.mock(
      'https://dev-manu_030aaea4-bb0b-4915-88a4-521fc8b59366_1637050264_hls_1.m3u8/',
      `
      #EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:4
      #EXT-X-MEDIA-SEQUENCE:848
      #EXT-X-DISCONTINUITY-SEQUENCE:21
      #EXTINF:1.500,
      dev-manu_030aaea4-bb0b-4915-88a4-521fc8b59366_1637050264_hls_1_848.ts?m=1637050263
      `,
    );
    jest.advanceTimersToNextTimer();

    expect(
      await screen.findByRole(
        'checkbox',
        { name: 'Live feedback', checked: false },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('renders actions and switch on click', async () => {
    const mockedVideo = videoMockFactory({
      live_type: LiveModeType.RAW,
    });

    useLiveStateStarted.setState({ isStarted: true });

    render(
      wrapInVideo(
        <LiveFeedbackProvider value={false}>
          <TeacherLiveControlBar />
        </LiveFeedbackProvider>,
        mockedVideo,
      ),
    );

    const checkbox = await screen.findByRole('checkbox', {
      name: 'Live feedback',
    });

    await userEvent.click(checkbox);

    expect(checkbox).toBeChecked();

    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Live feedback', checked: true }),
    );

    expect(checkbox).not.toBeChecked();
  });
});
