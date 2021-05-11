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

  const video = videoMockFactory();

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

    fetchMock.mock(`/api/videos/${video.id}/start-live/`, 400, {
      method: 'POST',
    });

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
      `/api/videos/${video.id}/start-live/`,
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
