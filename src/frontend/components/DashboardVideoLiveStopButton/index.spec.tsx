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
import { DashboardVideoLiveStopButton } from '.';

jest.mock('jwt-decode', () => jest.fn());
jest.mock('../../data/appData', () => ({
  appData: { jwt: 'cool_token_m8' },
}));

jest.mock('../Loader', () => ({
  Loader: () => <span>Loader</span>,
}));

const mockUpdateVideo = jest.fn();

const useVideoStub = ImportMock.mockFunction(useVideoModule, 'useVideo');

describe('components/DashboardVideoLiveStopButton', () => {
  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
    useVideoStub.reset();
  });

  afterAll(useVideoStub.restore);

  const video = videoMockFactory();

  it('renders the stop button', () => {
    useVideoStub.returns({
      updateVideo: mockUpdateVideo,
    });

    render(
      wrapInIntlProvider(
        wrapInRouter(<DashboardVideoLiveStopButton video={video} />),
      ),
    );

    screen.getByRole('button', { name: /stop streaming/i });
  });

  it('clicks on stop live button and fails.', async () => {
    useVideoStub.returns({
      updateVideo: mockUpdateVideo,
    });

    fetchMock.mock(`/api/videos/${video.id}/stop-live/`, 400, {
      method: 'POST',
    });

    render(
      wrapInIntlProvider(
        wrapInRouter(<DashboardVideoLiveStopButton video={video} />, [
          {
            path: FULL_SCREEN_ERROR_ROUTE('liveInit'),
            render: () => <span>error</span>,
          },
        ]),
      ),
    );

    // Loader should not be rendered yet
    expect(screen.queryByText('Loader')).not.toBeInTheDocument();

    const stopButton = screen.getByRole('button', {
      name: /stop streaming/i,
    });
    fireEvent.click(stopButton);

    // the state changes to pending, the loader is rendered
    screen.getByText('Loader');

    await waitFor(() => expect(fetchMock.called()).toBe(true));

    screen.getByText('error');
  });

  it('clicks on stop live and it updates the video state', async () => {
    useVideoStub.returns({
      updateVideo: mockUpdateVideo,
    });
    fetchMock.mock(
      `/api/videos/${video.id}/stop-live/`,
      {
        ...video,
        live_state: liveState.STOPPED,
      },
      { method: 'POST' },
    );

    render(
      wrapInIntlProvider(
        wrapInRouter(<DashboardVideoLiveStopButton video={video} />),
      ),
    );

    // Loader should not be rendered yet
    expect(screen.queryByText('Loader')).not.toBeInTheDocument();

    const stopButton = screen.getByRole('button', {
      name: /stop streaming/i,
    });
    fireEvent.click(stopButton);

    // the state changes to pending, the loader is rendered
    screen.getByText('Loader');

    await waitFor(() => expect(fetchMock.called()).toBe(true));

    expect(mockUpdateVideo).toHaveBeenLastCalledWith({
      ...video,
      live_state: liveState.STOPPED,
    });
  });
});
