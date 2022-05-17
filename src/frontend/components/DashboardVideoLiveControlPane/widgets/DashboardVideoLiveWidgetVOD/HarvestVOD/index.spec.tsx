import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import MatchMediaMock from 'jest-matchmedia-mock';
import React, { Fragment } from 'react';
import { Toaster } from 'react-hot-toast';

import { useVideo } from 'data/stores/useVideo';
import { Deferred } from 'utils/tests/Deferred';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';

import { HarvestVOD } from '.';

let matchMedia: MatchMediaMock;

jest.mock('data/appData', () => ({
  appData: {
    jwt: 'json web token',
  },
}));

describe('HarvestVOD', () => {
  beforeAll(() => {
    matchMedia = new MatchMediaMock();
  });
  afterEach(() => {
    matchMedia.clear();
    fetchMock.restore();
  });

  it('raises an error on harvest button clicks if request failed', async () => {
    const video = videoMockFactory();

    render(
      wrapInIntlProvider(
        <Fragment>
          <Toaster />
          <HarvestVOD video={video} />
        </Fragment>,
      ),
    );

    fetchMock.postOnce(`/api/videos/${video.id}/harvest-live/`, 400);

    userEvent.click(screen.getByRole('button', { name: 'Generate file' }));
    await screen.findByText('An error occurred, please try again later.');
  });

  it('updates the video on harvest success', async () => {
    const video = videoMockFactory({
      urls: {
        manifests: { hls: 'some url' },
        thumbnails: {},
        mp4: { 480: 'my-video-url-480p', 720: 'my-video-url-720p' },
      },
    });

    useVideo.setState({
      addResource: jest.fn(),
    });

    render(
      wrapInIntlProvider(
        <Fragment>
          <Toaster />
          <HarvestVOD video={video} />
        </Fragment>,
      ),
    );

    const videoDeferred = new Deferred();
    fetchMock.postOnce(
      `/api/videos/${video.id}/harvest-live/`,
      videoDeferred.promise,
      { overwriteRoutes: false },
    );

    userEvent.click(screen.getByRole('button', { name: 'Generate file' }));

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Generate file' }),
      ).toBeDisabled(),
    );
    expect(useVideo.getState().addResource).not.toHaveBeenCalled();

    await act(async () => videoDeferred.resolve(video));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Generate file' }),
      ).not.toBeDisabled(),
    );
    expect(useVideo.getState().addResource).toHaveBeenCalledWith(video);
  });
});
