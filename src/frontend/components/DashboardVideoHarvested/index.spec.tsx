import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { ImportMock } from 'ts-mock-imports';

import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import * as useVideoModule from '../../data/stores/useVideo';
import { UploadState } from '../../types/tracks';
import { report } from '../../utils/errors/report';
import { videoMockFactory } from '../../utils/tests/factories';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { wrapInRouter } from '../../utils/tests/router';

import { DashboardVideoHarvested } from '.';

jest.mock('../../data/appData', () => ({
  appData: {
    video: {
      id: 'dd44',
      thumbnail: null,
      timed_text_tracks: [],
      upload_state: 'harvested',
      live_state: null,
    },
  },
}));

const mockUpdateVideo = jest.fn();

const useVideoStub = ImportMock.mockFunction(useVideoModule, 'useVideo');

jest.mock('../../utils/errors/report', () => ({
  report: jest.fn(),
}));

describe('DashboardVideoHarvested', () => {
  beforeEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
    useVideoStub.reset();
  });

  afterAll(useVideoStub.restore);

  it('displays the button to watch and publish a video', () => {
    useVideoStub.returns({
      updateVideo: mockUpdateVideo,
    });

    const video = videoMockFactory({
      upload_state: UploadState.HARVESTED,
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
    useVideoStub.returns({
      updateVideo: mockUpdateVideo,
    });

    const video = videoMockFactory({
      id: 'bd1ab4c9-a051-423b-a71c-e7ddae9d404b',
      upload_state: UploadState.HARVESTED,
    });

    const updatedVideo = {
      ...video,
      upload_state: UploadState.READY,
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

    const publishButton = screen.getByRole('button', {
      name: 'publish the video',
    });
    fireEvent.click(publishButton);

    await waitFor(() => expect(fetchMock.called()).toBe(true));

    expect(mockUpdateVideo).toHaveBeenCalledWith(updatedVideo);
  });

  it('Redirects to the error component when the update fails', async () => {
    useVideoStub.returns({
      updateVideo: mockUpdateVideo,
    });

    const video = videoMockFactory({
      id: 'bd1ab4c9-a051-423b-a71c-e7ddae9d404b',
      upload_state: UploadState.HARVESTED,
    });

    const updatedVideo = {
      ...video,
      upload_state: UploadState.READY,
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
            path: ERROR_COMPONENT_ROUTE(),
            render: ({ match }) => (
              <span>{`Error Component: ${match.params.code}`}</span>
            ),
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
