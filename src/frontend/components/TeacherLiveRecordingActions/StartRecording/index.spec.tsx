import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import MatchMediaMock from 'jest-matchmedia-mock';
import React from 'react';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider, setLogger } from 'react-query';

import { useVideo } from 'data/stores/useVideo';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';

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

let matchMedia: MatchMediaMock;

describe('<StartRecording />', () => {
  beforeAll(() => {
    matchMedia = new MatchMediaMock();
  });
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
    matchMedia.clear();
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

    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <StartRecording video={video} />
        </QueryClientProvider>,
      ),
    );

    userEvent.click(
      screen.getByRole('button', { name: 'REC 0 0 : 0 0 : 0 0' }),
    );

    await waitFor(() => expect(mockAddResource).toHaveBeenCalled());
    expect(mockAddResource).toHaveBeenCalledWith(video);
  });

  it('renders a toast on error', async () => {
    const video = videoMockFactory();
    fetchMock.patch(`/api/videos/${video.id}/start-recording/`, 400);

    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <StartRecording video={video} />
        </QueryClientProvider>,
      ),
    );

    userEvent.click(
      screen.getByRole('button', { name: 'REC 0 0 : 0 0 : 0 0' }),
    );

    await screen.findByText('An error occured. Please try again later.');
  });
});
