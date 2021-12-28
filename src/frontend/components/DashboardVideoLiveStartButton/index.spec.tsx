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
import { DashboardVideoLiveStartButton } from '.';

jest.mock('jwt-decode', () => jest.fn());
jest.mock('../../data/appData', () => ({
  appData: { jwt: 'cool_token_m8' },
}));

jest.mock('../Loader', () => ({
  Loader: () => <span>Loader</span>,
}));

describe('components/DashboardVideoLiveStartButton', () => {
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

  it('renders the start button', () => {
    const video = videoMockFactory({
      live_state: liveState.IDLE,
    });

    render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardVideoLiveStartButton video={video} canStartLive={true} />,
        ),
      ),
    );

    const button = screen.getByRole('button', {
      name: /start streaming/i,
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it('clicks on start live button and fails.', async () => {
    const video = videoMockFactory({
      live_state: liveState.IDLE,
    });

    fetchMock.mock(`/api/videos/${video.id}/start-live/`, 400, {
      method: 'POST',
    });

    render(
      wrapInIntlProvider(
        wrapInRouter(
          <Grommet>
            <DashboardVideoLiveStartButton video={video} canStartLive={true} />
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

    const startButton = screen.getByRole('button', {
      name: /start streaming/i,
    });
    fireEvent.click(startButton);

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

  it('clicks on start live and it updates the video state', async () => {
    const video = videoMockFactory({
      live_state: liveState.IDLE,
    });

    fetchMock.mock(
      `/api/videos/${video.id}/start-live/`,
      {
        ...video,
        live_state: liveState.STARTING,
      },
      { method: 'POST' },
    );
    // wrap the component in a grommet provider to have a valid theme for the Layer component.
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <Grommet>
            <DashboardVideoLiveStartButton video={video} canStartLive={true} />
          </Grommet>,
        ),
      ),
    );

    // Loader should not be rendered yet
    expect(screen.queryByText('Loader')).not.toBeInTheDocument();

    const startButton = screen.getByRole('button', {
      name: /start streaming/i,
    });
    fireEvent.click(startButton);

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
      live_state: liveState.STARTING,
    });
  });

  it('disables the start button when canStartLive is false', () => {
    const video = videoMockFactory({
      live_state: liveState.IDLE,
    });

    render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardVideoLiveStartButton video={video} canStartLive={false} />,
        ),
      ),
    );

    const button = screen.getByRole('button', {
      name: /Only moderators can start a live/i,
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('renders the resume button when live is paused', () => {
    const video = videoMockFactory({
      live_state: liveState.PAUSED,
    });

    render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardVideoLiveStartButton video={video} canStartLive={true} />,
        ),
      ),
    );

    const button = screen.getByRole('button', {
      name: /resume streaming/i,
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);

    fireEvent.click(button);

    // Confirmation layer should show up
    screen.getByRole('button', { name: /ok/i });
    screen.getByRole('button', { name: /cancel/i });

    screen.getByText('Are you sure you want to resume a video streaming ?');
  });
});
