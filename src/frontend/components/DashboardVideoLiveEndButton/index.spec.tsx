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
import { DashboardVideoLiveEndButton } from '.';

jest.mock('jwt-decode', () => jest.fn());
jest.mock('../../data/appData', () => ({
  appData: { jwt: 'cool_token_m8' },
}));

jest.mock('../Loader', () => ({
  Loader: () => <span>Loader</span>,
}));

describe('DashboardVideoLiveEndButton', () => {
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

  it('renders the end button', () => {
    const video = videoMockFactory({
      live_state: liveState.PAUSED,
    });

    render(
      wrapInIntlProvider(
        wrapInRouter(<DashboardVideoLiveEndButton video={video} />),
      ),
    );

    screen.getByRole('button', { name: /end live/i });
  });

  it('clicks on end live button and fails.', async () => {
    const video = videoMockFactory({
      live_state: liveState.PAUSED,
    });

    fetchMock.mock(`/api/videos/${video.id}/end-live/`, 400, {
      method: 'POST',
    });

    render(
      wrapInIntlProvider(
        wrapInRouter(
          <Grommet>
            <DashboardVideoLiveEndButton video={video} />
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

    const endButton = screen.getByRole('button', {
      name: /end live/i,
    });
    fireEvent.click(endButton);

    // Confirmation layer should show up
    const confirmButton = screen.getByRole('button', { name: /ok/i });
    screen.getByRole('button', { name: /cancel/i });

    // Clicks on ok button, confirmation layer should show up
    fireEvent.click(confirmButton);

    // the state changes to pending, the loader is rendered
    screen.getByText('Loader');

    await waitFor(() => expect(fetchMock.called()).toBe(true));

    screen.getByText('error');
  });

  it('clicks on end live and it updates the video state', async () => {
    const video = videoMockFactory({
      live_state: liveState.PAUSED,
    });
    fetchMock.mock(
      `/api/videos/${video.id}/end-live/`,
      {
        ...video,
        live_state: liveState.STOPPED,
      },
      { method: 'POST' },
    );

    render(
      wrapInIntlProvider(
        wrapInRouter(
          <Grommet>
            <DashboardVideoLiveEndButton video={video} />
          </Grommet>,
        ),
      ),
    );

    // Loader should not be rendered yet
    expect(screen.queryByText('Loader')).not.toBeInTheDocument();

    const endButton = screen.getByRole('button', {
      name: /end live/i,
    });
    fireEvent.click(endButton);

    // Confirmation layer should show up
    const confirmButton = screen.getByRole('button', { name: /ok/i });
    screen.getByRole('button', { name: /cancel/i });

    // Clicks on ok button, confirmation layer should show up
    fireEvent.click(confirmButton);

    // the state changes to pending, the loader is rendered
    screen.getByText('Loader');

    await waitFor(() => expect(fetchMock.called()).toBe(true));

    expect(useVideo.getState().videos[video.id]).toEqual({
      ...video,
      live_state: liveState.STOPPED,
    });
  });
});
