import { fireEvent, waitFor, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { videoMockFactory } from 'lib-components';
import React from 'react';

import { DASHBOARD_ROUTE } from 'components/Dashboard/route';
import { FULL_SCREEN_ERROR_ROUTE } from 'components/ErrorComponents/route';
import { LiveModeType, liveState } from 'types/tracks';
import render from 'utils/tests/render';

import { ConfigureLiveButton } from '.';

jest.mock('data/stores/useAppConfig', () => ({
  useAppConfig: () => ({}),
}));

describe('<ConfigureLiveButton />', () => {
  afterEach(() => fetchMock.restore());

  it('displays the configure live button', () => {
    const video = videoMockFactory();
    render(<ConfigureLiveButton video={video} />);

    screen.getByRole('button', { name: 'Start a live' });
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

    render(<ConfigureLiveButton video={video} />, {
      routerOptions: {
        routes: [
          {
            path: DASHBOARD_ROUTE(),
            render: () => <span>dashboard</span>,
          },
        ],
      },
    });

    const button = screen.getByRole('button', {
      name: 'Start a live',
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

    render(<ConfigureLiveButton video={video} />, {
      routerOptions: {
        routes: [
          {
            path: FULL_SCREEN_ERROR_ROUTE('liveInit'),
            render: () => <span>error</span>,
          },
        ],
      },
    });

    const button = screen.getByRole('button', {
      name: 'Start a live',
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
