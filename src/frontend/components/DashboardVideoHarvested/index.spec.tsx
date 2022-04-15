import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { QueryClient, QueryClientProvider, setLogger } from 'react-query';

import { FULL_SCREEN_ERROR_ROUTE } from 'components/ErrorComponents/route';
import { useVideo } from 'data/stores/useVideo';
import { uploadState } from 'types/tracks';
import { report } from 'utils/errors/report';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { wrapInRouter } from 'utils/tests/router';

import { DashboardVideoHarvested } from './';

jest.mock('data/appData', () => ({
  appData: {
    video: {},
  },
}));

jest.mock('utils/errors/report', () => ({
  report: jest.fn(),
}));

setLogger({
  // tslint:disable-next-line:no-console
  log: console.log,
  warn: console.warn,
  // no more errors on the console
  error: () => {},
});

describe('DashboardVideoHarvested', () => {
  beforeEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  it('displays the button to watch and publish a video', () => {
    const video = videoMockFactory({
      upload_state: uploadState.HARVESTED,
    });
    const queryClient = new QueryClient();

    render(
      wrapInIntlProvider(
        wrapInRouter(
          <QueryClientProvider client={queryClient}>
            <DashboardVideoHarvested video={video} />
          </QueryClientProvider>,
        ),
      ),
    );
    screen.getByRole('button', { name: 'watch' });
    screen.getByRole('button', { name: 'publish the video' });
  });

  it('updates the video', async () => {
    const video = videoMockFactory({
      id: 'bd1ab4c9-a051-423b-a71c-e7ddae9d404b',
      upload_state: uploadState.HARVESTED,
    });

    const updatedVideo = {
      ...video,
      upload_state: uploadState.READY,
    };

    fetchMock.mock(
      {
        url: '/api/videos/bd1ab4c9-a051-423b-a71c-e7ddae9d404b/',
        body: { upload_state: uploadState.READY },
        method: 'patch',
      },
      {
        status: 200,
        body: updatedVideo,
      },
    );
    const queryClient = new QueryClient();
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <QueryClientProvider client={queryClient}>
            <DashboardVideoHarvested video={video} />
          </QueryClientProvider>,
        ),
      ),
    );

    expect(useVideo.getState().videos[video.id]).not.toBeDefined();
    const publishButton = screen.getByRole('button', {
      name: 'publish the video',
    });
    fireEvent.click(publishButton);

    await waitFor(() => expect(fetchMock.called()).toBe(true));
    expect(useVideo.getState().videos[video.id]).toEqual(updatedVideo);
  });

  it('Redirects to the error component when the update fails', async () => {
    const video = videoMockFactory({
      id: 'bd1ab4c9-a051-423b-a71c-e7ddae9d404b',
      upload_state: uploadState.HARVESTED,
    });

    fetchMock.mock(
      {
        url: '/api/videos/bd1ab4c9-a051-423b-a71c-e7ddae9d404b/',
        body: { upload_state: uploadState.READY },
        method: 'patch',
      },
      {
        status: 400,
        body: { error: 'impossible to publish video' },
      },
    );
    const queryClient = new QueryClient();
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <QueryClientProvider client={queryClient}>
            <DashboardVideoHarvested video={video} />
          </QueryClientProvider>,
          [
            {
              path: FULL_SCREEN_ERROR_ROUTE(),
              render: ({ match }) => (
                <span>{`Error Component: ${match.params.code}`}</span>
              ),
            },
          ],
        ),
      ),
    );

    const publishButton = screen.getByRole('button', {
      name: 'publish the video',
    });
    fireEvent.click(publishButton);

    await waitFor(() => expect(fetchMock.called()).toBe(true));

    await screen.findByText('Error Component: liveToVod');
    expect(report).toHaveBeenCalled();
  });
});
