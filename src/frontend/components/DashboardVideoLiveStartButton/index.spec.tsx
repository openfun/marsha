import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { ImportMock } from 'ts-mock-imports';

import * as useVideoModule from '../../data/stores/useVideo';
import { uploadState, liveState } from '../../types/tracks';
import { videoMockFactory } from '../../utils/tests/factories';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { wrapInRouter } from '../../utils/tests/router';
import { FULL_SCREEN_ERROR_ROUTE } from '../ErrorComponents/route';
import { DashboardVideoLiveStartButton } from '.';

jest.mock('jwt-decode', () => jest.fn());
jest.mock('../../data/appData', () => ({
  appData: { jwt: 'cool_token_m8' },
}));

jest.mock('../Loader', () => ({
  Loader: () => <span>Loader</span>,
}));

const mockUpdateVideo = jest.fn();

const useVideoStub = ImportMock.mockFunction(useVideoModule, 'useVideo');

describe('components/DashboardVideoLiveStartButton', () => {
  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
    useVideoStub.reset();
  });

  afterAll(useVideoStub.restore);

  const video = videoMockFactory({
    description: '',
    has_transcript: false,
    id: '94da33b7-a38b-4efc-a8d5-99566056e8c6',
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
    playlist: {
      title: 'foo',
      lti_id: 'foo+context_id',
    },
    live_state: liveState.IDLE,
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
  });

  it('renders the start button', () => {
    useVideoStub.returns({
      updateVideo: mockUpdateVideo,
    });

    render(
      wrapInIntlProvider(
        wrapInRouter(<DashboardVideoLiveStartButton video={video} />),
      ),
    );

    screen.getByRole('button', { name: /start streaming/i });
  });

  it('clicks on start live button and fails.', async () => {
    useVideoStub.returns({
      updateVideo: mockUpdateVideo,
    });

    fetchMock.mock(
      '/api/videos/94da33b7-a38b-4efc-a8d5-99566056e8c6/start-live/',
      400,
      { method: 'POST' },
    );

    render(
      wrapInIntlProvider(
        wrapInRouter(<DashboardVideoLiveStartButton video={video} />, [
          {
            path: FULL_SCREEN_ERROR_ROUTE('liveInit'),
            render: () => <span>error</span>,
          },
        ]),
      ),
    );

    // Loader should not be rendered yet
    expect(screen.queryByText('Loader')).not.toBeInTheDocument();

    const startButton = screen.getByRole('button', {
      name: /start streaming/i,
    });
    fireEvent.click(startButton);

    // the state changes to pending, the loader is rendered
    screen.getByText('Loader');

    await waitFor(() => expect(fetchMock.called()).toBe(true));

    screen.getByText('error');
  });

  it('clicks on start live and it updates the video state', async () => {
    useVideoStub.returns({
      updateVideo: mockUpdateVideo,
    });
    fetchMock.mock(
      '/api/videos/94da33b7-a38b-4efc-a8d5-99566056e8c6/start-live/',
      {
        ...video,
        live_state: liveState.STARTING,
      },
      { method: 'POST' },
    );

    render(
      wrapInIntlProvider(
        wrapInRouter(<DashboardVideoLiveStartButton video={video} />),
      ),
    );

    // Loader should not be rendered yet
    expect(screen.queryByText('Loader')).not.toBeInTheDocument();

    const startButton = screen.getByRole('button', {
      name: /start streaming/i,
    });
    fireEvent.click(startButton);

    // the state changes to pending, the loader is rendered
    screen.getByText('Loader');

    await waitFor(() => expect(fetchMock.called()).toBe(true));

    expect(mockUpdateVideo).toHaveBeenLastCalledWith({
      ...video,
      live_state: liveState.STARTING,
    });
  });
});
