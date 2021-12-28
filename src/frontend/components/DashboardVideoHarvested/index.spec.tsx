import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';

import { FULL_SCREEN_ERROR_ROUTE } from '../ErrorComponents/route';
import { useVideo } from '../../data/stores/useVideo';
import { uploadState } from '../../types/tracks';
import { report } from '../../utils/errors/report';
import { videoMockFactory } from '../../utils/tests/factories';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { wrapInRouter } from '../../utils/tests/router';

import { DashboardVideoHarvested } from './';

jest.mock('../../data/appData', () => ({
  appData: {
    video: {},
  },
}));

jest.mock('../../utils/errors/report', () => ({
  report: jest.fn(),
}));

describe('DashboardVideoHarvested', () => {
  beforeEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  it('displays the button to watch and publish a video', () => {
    const video = videoMockFactory({
      upload_state: uploadState.HARVESTED,
    });

    render(
      wrapInIntlProvider(
        wrapInRouter(<DashboardVideoHarvested video={video} />),
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
        body: updatedVideo,
        method: 'put',
      },
      {
        status: 200,
        body: updatedVideo,
      },
    );
    render(
      wrapInIntlProvider(
        wrapInRouter(<DashboardVideoHarvested video={video} />),
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

    const updatedVideo = {
      ...video,
      upload_state: uploadState.READY,
    };

    fetchMock.mock(
      {
        url: '/api/videos/bd1ab4c9-a051-423b-a71c-e7ddae9d404b/',
        body: updatedVideo,
        method: 'put',
      },
      {
        status: 400,
      },
    );

    render(
      wrapInIntlProvider(
        wrapInRouter(<DashboardVideoHarvested video={video} />, [
          {
            path: FULL_SCREEN_ERROR_ROUTE("liveToVod"),
            element: <span>{`Error Component: liveToVod`}</span>,
          },
        ]),
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
