import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import React from 'react';
import { QueryClient, setLogger } from 'react-query';

import { useVideo } from 'data/stores/useVideo';
import { videoMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';

import { StartRecording } from '.';

jest.mock('data/appData', () => ({
  appData: {},
}));

setLogger({
  // tslint:disable-next-line:no-console
  log: console.log,
  warn: console.warn,
  // no more errors on the console
  error: () => {},
});

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

    render(<StartRecording video={video} />, {
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

    render(<StartRecording video={video} />, {
      queryOptions: { client: queryClient },
    });

    userEvent.click(
      screen.getByRole('button', { name: 'REC 0 0 : 0 0 : 0 0' }),
    );

    await screen.findByText('An error occured. Please try again later.');
  });
});
