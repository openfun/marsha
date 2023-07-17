import { fireEvent, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { LiveModeType, liveState, videoMockFactory } from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { ConfigureLiveButton } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({}),
}));

describe('<ConfigureLiveButton />', () => {
  afterEach(() => fetchMock.restore());

  it('displays the configure live button', () => {
    const video = videoMockFactory();
    render(
      <ConfigureLiveButton
        video={video}
        RenderOnSuccess={<div>success</div>}
        RenderOnError={<div>error</div>}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Start a live' }),
    ).toBeInTheDocument();
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
      <ConfigureLiveButton
        video={video}
        RenderOnSuccess={<div>success</div>}
        RenderOnError={<div>error</div>}
      />,
    );

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

    expect(screen.getByText('success')).toBeInTheDocument();
  });

  it('fails to initiate a live video and redirects to error component', async () => {
    const video = videoMockFactory();
    fetchMock.mock(`/api/videos/${video.id}/initiate-live/`, 400, {
      method: 'POST',
    });

    render(
      <ConfigureLiveButton
        video={video}
        RenderOnSuccess={<div>success</div>}
        RenderOnError={<div>error</div>}
      />,
    );

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
