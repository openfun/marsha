import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import React from 'react';
import { QueryClient } from 'react-query';

import { useVideo } from 'data/stores/useVideo';
import { videoMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';
import { wrapInVideo } from 'utils/tests/wrapInVideo';

import { StopRecording } from '.';

jest.mock('data/appData', () => ({
  appData: {},
}));

let queryClient: QueryClient;

describe('<StopRecording />', () => {
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  it('updates the video on success', async () => {
    const mockAddResource = jest.fn();
    useVideo.setState({
      addResource: mockAddResource,
    });
    const video = videoMockFactory();
    fetchMock.patch(`/api/videos/${video.id}/stop-recording/`, video);

    render(wrapInVideo(<StopRecording />, video), {
      queryOptions: { client: queryClient },
    });

    userEvent.click(
      screen.getByRole('button', { name: 'REC 0 0 : 0 0 : 0 0' }),
    );

    await waitFor(() => expect(mockAddResource).toHaveBeenCalled());
    expect(mockAddResource).toHaveBeenCalledWith(video);
  });

  it('renders a toast on error', async () => {
    const video = videoMockFactory();
    fetchMock.patch(`/api/videos/${video.id}/stop-recording/`, 400);

    render(wrapInVideo(<StopRecording />, video), {
      queryOptions: { client: queryClient },
    });

    userEvent.click(
      screen.getByRole('button', { name: 'REC 0 0 : 0 0 : 0 0' }),
    );

    await screen.findByText('An error occured. Please try again later.');
  });

  it('renders current recorded time', () => {
    const video = videoMockFactory({ recording_time: 3722 });

    render(wrapInVideo(<StopRecording />, video), {
      queryOptions: { client: queryClient },
    });

    screen.getByRole('button', { name: 'REC 0 1 : 0 2 : 0 2' });
  });
});
