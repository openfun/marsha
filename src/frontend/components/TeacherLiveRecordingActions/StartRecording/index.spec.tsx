import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import React from 'react';
import { QueryClient } from 'react-query';

import { useVideo } from 'data/stores/useVideo';
import { videoMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';
import { wrapInVideo } from 'utils/tests/wrapInVideo';

import { StartRecording } from '.';

jest.mock('data/stores/useAppConfig', () => ({
  useAppConfig: () => ({}),
}));

let queryClient: QueryClient;

describe('<StartRecording />', () => {
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
    fetchMock.patch(`/api/videos/${video.id}/start-recording/`, video);

    render(wrapInVideo(<StartRecording />, video), {
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
    fetchMock.patch(`/api/videos/${video.id}/start-recording/`, 400);

    render(wrapInVideo(<StartRecording />, video), {
      queryOptions: { client: queryClient },
    });

    userEvent.click(
      screen.getByRole('button', { name: 'REC 0 0 : 0 0 : 0 0' }),
    );

    await screen.findByText('An error occured. Please try again later.');
  });
});
