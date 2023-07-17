import { screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { LiveModeType, liveState, videoMockFactory } from 'lib-components';
import { render } from 'lib-tests';

import * as pollForLiveModule from '@lib-video/api/pollForLive';
import { LiveFeedbackProvider } from '@lib-video/hooks/useLiveFeedback';
import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { TeacherLiveControlBar } from '.';

const spyedPollForLive = jest.spyOn(pollForLiveModule, 'pollForLive');

describe('<TeacherLiveControlBar />', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
    jest.useRealTimers();
  });

  it('polls for live when live is running and show live feedback button', async () => {
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

    expect(
      screen.queryByRole('button', { name: 'Show live feedback' }),
    ).not.toBeInTheDocument();

    await waitFor(() => expect(spyedPollForLive).toHaveBeenCalled());

    expect(
      screen.queryByRole('button', { name: 'Show live feedback' }),
    ).not.toBeInTheDocument();

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
        'button',
        { name: 'Show live feedback' },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
  });
});
