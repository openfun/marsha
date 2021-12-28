import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { Grommet } from 'grommet';
import React from 'react';

import { useVideo } from '../../data/stores/useVideo';
import { liveState } from '../../types/tracks';
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

describe('components/DashboardVideoLiveStopButton', () => {
  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  beforeEach(() => {
    /*
      make sure to remove all body children, grommet layer gets rendered twice, known issue
      https://github.com/grommet/grommet/issues/5200
    */
    document.body.innerHTML = '';
    document.body.appendChild(document.createElement('div'));
  });

  const video = videoMockFactory();

  it('renders the stop button', () => {
    render(
      wrapInIntlProvider(
        wrapInRouter(<DashboardVideoLiveStopButton video={video} />),
      ),
    );

    screen.getByRole('button', { name: /pause ⏸/i });
  });

  it('clicks on stop live button and fails.', async () => {
    fetchMock.mock(`/api/videos/${video.id}/stop-live/`, 400, {
      method: 'POST',
    });

    render(
      wrapInIntlProvider(
        wrapInRouter(
          <Grommet>
            <DashboardVideoLiveStopButton video={video} />
          </Grommet>,
          [
            {
              path: FULL_SCREEN_ERROR_ROUTE('liveInit'),
              element: <span>error</span>,
            },
          ],
        ),
      ),
    );

    // Loader should not be rendered yet
    expect(screen.queryByText('Loader')).not.toBeInTheDocument();

    const stopButton = screen.getByRole('button', {
      name: /pause ⏸/i,
    });
    fireEvent.click(stopButton);

    // Confirmation layer should show up
    const confirmButton = screen.getByRole('button', { name: /ok/i });
    screen.getByRole('button', { name: /cancel/i });

    // Clicks on start button, confirmation layer should show up
    fireEvent.click(confirmButton);

    // the state changes to pending, the loader is rendered
    screen.getByText('Loader');

    await waitFor(() => expect(fetchMock.called()).toBe(true));

    screen.getByText('error');
  });

  it('clicks on stop live and it updates the video state', async () => {
    fetchMock.mock(
      `/api/videos/${video.id}/stop-live/`,
      {
        ...video,
        live_state: liveState.PAUSED,
      },
      { method: 'POST' },
    );

    render(
      wrapInIntlProvider(
        wrapInRouter(
          <Grommet>
            <DashboardVideoLiveStopButton video={video} />
          </Grommet>,
        ),
      ),
    );

    // Loader should not be rendered yet
    expect(screen.queryByText('Loader')).not.toBeInTheDocument();

    const stopButton = screen.getByRole('button', {
      name: /pause ⏸/i,
    });
    fireEvent.click(stopButton);

    // Confirmation layer should show up
    const confirmButton = screen.getByRole('button', { name: /ok/i });
    screen.getByRole('button', { name: /cancel/i });

    // Clicks on start button, confirmation layer should show up
    fireEvent.click(confirmButton);

    // the state changes to pending, the loader is rendered
    screen.getByText('Loader');

    await waitFor(() => expect(fetchMock.called()).toBe(true));

    expect(useVideo.getState().videos[video.id]).toEqual({
      ...video,
      live_state: liveState.PAUSED,
    });
  });
});
