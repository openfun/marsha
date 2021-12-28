import { fireEvent, render, waitFor, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';

import { DASHBOARD_ROUTE } from 'components/Dashboard/route';
import { FULL_SCREEN_ERROR_ROUTE } from 'components/ErrorComponents/route';
import { modelName } from 'types/models';
import { LiveModeType, liveState } from 'types/tracks';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { wrapInRouter } from 'utils/tests/router';
import { DashboardVideoLiveConfigureButton } from '.';

jest.mock('../../data/appData', () => ({
  appData: {},
}));

describe('components/DashboardVideoLiveConfigureButton', () => {
  afterEach(() => fetchMock.restore());

  it('displays the configure live button', () => {
    const video = videoMockFactory();
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardVideoLiveConfigureButton
            video={video}
            type={LiveModeType.JITSI}
          />,
        ),
      ),
    );

    screen.getByRole('button', { name: 'Create a webinar' });
  });

  it('initiates a live video on click and redirect to the dashboard', async () => {
    const video = videoMockFactory();
    fetchMock.mock(
      `/api/videos/${video.id}/initiate-live/`,
      JSON.stringify({
        ...video,
        live_state: liveState.IDLE,
        live_type: LiveModeType.JITSI,
      }),
      { method: 'POST' },
    );

    render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardVideoLiveConfigureButton
            video={video}
            type={LiveModeType.JITSI}
          />,
          [
            {
              path: DASHBOARD_ROUTE(modelName.VIDEOS),
              element: <span>dashboard</span>,
            },
          ],
        ),
      ),
    );

    const button = screen.getByRole('button', {
      name: 'Create a webinar',
    });
    fireEvent.click(button);

    await waitFor(() =>
      expect(
        fetchMock.called(`/api/videos/${video.id}/initiate-live/`, {
          method: 'POST',
        }),
      ).toBe(true),
    );

    expect(screen.getByText('dashboard')).toBeInTheDocument();
  });

  it('fails to initiate a live video and redirects to error component', async () => {
    const video = videoMockFactory();
    fetchMock.mock(`/api/videos/${video.id}/initiate-live/`, 400, {
      method: 'POST',
    });

    render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardVideoLiveConfigureButton
            video={video}
            type={LiveModeType.JITSI}
          />,
          [
            {
              path: FULL_SCREEN_ERROR_ROUTE('liveInit'),
              element: <span>error</span>,
            },
          ],
        ),
      ),
    );

    const button = screen.getByRole('button', {
      name: 'Create a webinar',
    });
    fireEvent.click(button);

    await waitFor(() =>
      expect(
        fetchMock.called(`/api/videos/${video.id}/initiate-live/`, {
          method: 'POST',
        }),
      ).toBe(true),
    );

    expect(screen.getByText('error')).toBeInTheDocument();
  });
});
